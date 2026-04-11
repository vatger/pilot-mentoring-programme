"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { trainingTopics } from "@/lib/trainingTopics";

interface TrainingCoverageRow {
  trainingId: string;
  status: string;
  trainee: { id: string; name: string | null; cid: string | null };
  mentors: { id: string; name: string | null; cid: string | null }[];
  sessionsCount: number;
  topicsCoveredCount: number;
  topicsCoverage: {
    topic: string;
    covered: boolean;
    category?: "THEORY" | "PRACTICE";
    theorie?: boolean;
    praxis?: boolean;
  }[];
  lastSessionDate: string | null;
}

interface MentorOption {
  id: string;
  name: string | null;
  cid: string | null;
}

function PmpTrackingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trainings, setTrainings] = useState<TrainingCoverageRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableMentors, setAvailableMentors] = useState<MentorOption[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [swapSelection, setSwapSelection] = useState<Record<string, string>>({});

  const userRole = (session?.user as any)?.role;
  const isAdminOrLeitung = userRole === "ADMIN" || userRole === "PMP_LEITUNG";

  const statusFilter = searchParams.get("status") || "ACTIVE";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isAdminOrLeitung) {
      router.push("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAdminOrLeitung, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`/api/admin/tracking${query}`);
      if (!res.ok) throw new Error("Failed to fetch tracking data");
      const data = await res.json();
      setTrainings(data.trainings || []);

      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const mentors = (usersData || [])
          .filter((u: any) => ["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(u.role))
          .map((u: any) => ({ id: u.id, name: u.name, cid: u.cid }))
          .sort((a: MentorOption, b: MentorOption) => (a.name || "").localeCompare(b.name || ""));
        setAvailableMentors(mentors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const cancelTraining = async (trainingId: string, traineeLabel: string) => {
    const reason = prompt(`Grund fuer den Abbruch von ${traineeLabel}:`);
    if (reason === null) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Bitte einen Abbruchgrund eingeben.");
      return;
    }

    setActionLoading(`cancel-${trainingId}`);
    setError("");
    try {
      const res = await fetch("/api/training/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId,
          setVisitorKeepLogs: true,
          cancellationReason: trimmedReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Fehler beim Abbrechen des Trainings");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTraining = async (trainingId: string, traineeLabel: string) => {
    if (!confirm(`Training von ${traineeLabel} wirklich komplett loeschen? Alle Daten werden entfernt.`)) return;

    setActionLoading(`delete-${trainingId}`);
    setError("");
    try {
      const res = await fetch("/api/training/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId, deleteEverything: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Fehler beim Loeschen aller Trainingsdaten");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const removeMentor = async (
    trainingId: string,
    mentorId: string,
    mentorLabel: string,
    traineeLabel: string
  ) => {
    if (!confirm(`Mentor ${mentorLabel} von ${traineeLabel} entfernen?`)) return;

    setActionLoading(`remove-${trainingId}-${mentorId}`);
    setError("");
    try {
      const res = await fetch("/api/training/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId, mentorId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Fehler beim Entfernen des Mentors");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const swapMentor = async (
    trainingId: string,
    oldMentorId: string,
    oldMentorLabel: string,
    traineeLabel: string
  ) => {
    const selected = swapSelection[`${trainingId}:${oldMentorId}`];
    if (!selected) {
      setError("Bitte einen Ersatz-Mentor auswaehlen.");
      return;
    }

    if (!confirm(`Mentor ${oldMentorLabel} bei ${traineeLabel} durch den gewaehlten Mentor ersetzen?`)) return;

    setActionLoading(`swap-${trainingId}-${oldMentorId}`);
    setError("");
    try {
      const res = await fetch("/api/training/swap-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId,
          oldMentorId,
          newMentorId: selected,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Fehler beim Tauschen des Mentors");
      }

      setSwapSelection((prev) => {
        const next = { ...prev };
        delete next[`${trainingId}:${oldMentorId}`];
        return next;
      });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const totalTopics = trainingTopics.length;
  const formatPoints = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredTrainings = trainings.filter((row) => {
    if (!normalizedSearch) return true;

    const traineeName = (row.trainee.name || "").toLowerCase();
    const traineeCid = (row.trainee.cid || "").toLowerCase();
    const mentorMatches = row.mentors.some((mentor) => {
      const mentorName = (mentor.name || "").toLowerCase();
      const mentorCid = (mentor.cid || "").toLowerCase();
      return mentorName.includes(normalizedSearch) || mentorCid.includes(normalizedSearch);
    });

    return (
      traineeName.includes(normalizedSearch) ||
      traineeCid.includes(normalizedSearch) ||
      mentorMatches
    );
  });

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    );
  }

  if (!isAdminOrLeitung) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Zugriff verweigert. Nur Admins und PMP-Leitung haben Zugriff.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h1>PMP-Tracking</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Übersicht der Trainingsabdeckung nach Thema für jeden Trainee
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1rem" }}>
          <p>{error}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>Filter:</span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["ACTIVE", "COMPLETED", "ABGEBROCHEN"].map((value) => {
              const isActive = value === statusFilter;
              return (
                <Link
                  key={value}
                  href={`?status=${value}`}
                  replace
                  className="button"
                  style={{
                    margin: 0,
                    padding: "6px 14px",
                    fontSize: "0.9em",
                    background: isActive ? "var(--accent-color)" : "var(--container-bg)",
                    color: isActive ? "white" : "var(--text-color)",
                    border: isActive ? "none" : "1px solid var(--footer-border)",
                  }}
                >
                  {value}
                </Link>
              );
            })}
            <Link
              href="?status="
              replace
              className="button"
              style={{
                margin: 0,
                padding: "6px 14px",
                fontSize: "0.9em",
                background: statusFilter === "" ? "var(--accent-color)" : "var(--container-bg)",
                color: statusFilter === "" ? "white" : "var(--text-color)",
                border: statusFilter === "" ? "none" : "1px solid var(--footer-border)",
              }}
            >
              Alle
            </Link>
          </div>
          <input
            className="form-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Trainee oder Mentor"
            style={{ minWidth: "260px", maxWidth: "360px", marginLeft: "auto" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Lädt...</p></div>
      ) : filteredTrainings.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-color)", margin: 0 }}>
            {trainings.length === 0 ? "Keine Trainings gefunden." : "Keine Trainings für diese Suche gefunden."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {filteredTrainings.map((row) => {
            const coveragePercent = Math.round(
              (row.topicsCoveredCount / totalTopics) * 100
            );
            const traineeLabel = row.trainee.name || row.trainee.cid || "Unbekannt";
            const isCancelling = actionLoading === `cancel-${row.trainingId}`;
            const isDeleting = actionLoading === `delete-${row.trainingId}`;
            const isActionBusy = isCancelling || isDeleting;
            return (
              <div
                key={row.trainingId}
                className="card"
                style={{ padding: "0.65rem 0.85rem", display: "grid", gap: "0.5rem" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1fr auto",
                    gap: "0.65rem",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "1.05em", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {row.trainee.name || "Unbekannt"}
                    </h3>
                    <span style={{ color: "var(--text-color)", fontFamily: "monospace", fontSize: "0.9em" }}>
                      ({row.trainee.cid || "N/A"})
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%" }}>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatPoints(row.topicsCoveredCount)} / {totalTopics}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "var(--footer-border)",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${coveragePercent}%`,
                          height: "100%",
                          background: "var(--accent-color)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.9em", color: "var(--text-color)", whiteSpace: "nowrap" }}>
                      {coveragePercent}%
                    </span>
                  </div>

                  <Link
                    href={`/trainee/progress?trainingId=${row.trainingId}`}
                    className="button"
                    style={{ padding: "6px 12px", fontSize: "0.9em", margin: 0, justifySelf: "end" }}
                  >
                    Details
                  </Link>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    flexWrap: "wrap",
                    color: "var(--text-color)",
                    fontSize: "0.95em",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap" }}>
                    Fortschritt: {formatPoints(row.topicsCoveredCount)} Themen
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>
                    Mentor: {row.mentors.length > 0 ? row.mentors.map((m) => m.name || m.cid).join(", ") : "—"}
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>Sessions: {row.sessionsCount}</span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {row.status === "ACTIVE" && (
                    <button
                      className="button"
                      type="button"
                      onClick={() => cancelTraining(row.trainingId, traineeLabel)}
                      disabled={isActionBusy}
                      style={{
                        margin: 0,
                        padding: "5px 10px",
                        fontSize: "0.85em",
                        opacity: isActionBusy ? 0.6 : 1,
                      }}
                    >
                      {isCancelling ? "Abbrechen..." : "Training Abbrechen"}
                    </button>
                  )}
                  <button
                    className="button"
                    type="button"
                    onClick={() => deleteTraining(row.trainingId, traineeLabel)}
                    disabled={isActionBusy}
                    style={{
                      margin: 0,
                      padding: "5px 10px",
                      fontSize: "0.85em",
                      background: "#a93131",
                      borderColor: "#a93131",
                      opacity: isActionBusy ? 0.6 : 1,
                    }}
                  >
                    {isDeleting ? "Loeschen..." : "Training Loeschen"}
                  </button>
                </div>

                {row.status === "ACTIVE" && row.mentors.length > 0 && (
                  <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.25rem" }}>
                    {row.mentors.map((mentor) => {
                      const mentorLabel = mentor.name || mentor.cid || "Unbekannt";
                      const removeKey = `remove-${row.trainingId}-${mentor.id}`;
                      const swapKey = `swap-${row.trainingId}-${mentor.id}`;
                      const selectionKey = `${row.trainingId}:${mentor.id}`;
                      const mentorAlternatives = availableMentors.filter((m) =>
                        m.id !== mentor.id && !row.mentors.some((assigned) => assigned.id === m.id)
                      );

                      return (
                        <div
                          key={mentor.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto auto auto",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: "0.9em", color: "var(--text-color)" }}>
                            Mentor: {mentorLabel}
                          </span>
                          <button
                            className="button"
                            type="button"
                            onClick={() => removeMentor(row.trainingId, mentor.id, mentorLabel, traineeLabel)}
                            disabled={actionLoading === removeKey || !!actionLoading}
                            style={{ margin: 0, padding: "5px 10px", fontSize: "0.82em" }}
                          >
                            {actionLoading === removeKey ? "Entferne..." : "Mentor entfernen"}
                          </button>
                          <select
                            className="form-input"
                            value={swapSelection[selectionKey] || ""}
                            onChange={(e) =>
                              setSwapSelection((prev) => ({
                                ...prev,
                                [selectionKey]: e.target.value,
                              }))
                            }
                            disabled={!!actionLoading || mentorAlternatives.length === 0}
                            style={{ minWidth: "180px", margin: 0, fontSize: "0.82em", padding: "5px 8px" }}
                          >
                            <option value="">Ersatz-Mentor...</option>
                            {mentorAlternatives.map((m) => (
                              <option key={m.id} value={m.id}>
                                {(m.name || "Unbekannt") + (m.cid ? ` (${m.cid})` : "")}
                              </option>
                            ))}
                          </select>
                          <button
                            className="button"
                            type="button"
                            onClick={() => swapMentor(row.trainingId, mentor.id, mentorLabel, traineeLabel)}
                            disabled={actionLoading === swapKey || !!actionLoading || mentorAlternatives.length === 0}
                            style={{ margin: 0, padding: "5px 10px", fontSize: "0.82em" }}
                          >
                            {actionLoading === swapKey ? "Tausche..." : "Mentor tauschen"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}

export default function PmpTrackingPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    }>
      <PmpTrackingContent />
    </Suspense>
  );
}
