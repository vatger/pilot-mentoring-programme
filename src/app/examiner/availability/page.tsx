"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { trainingTopics } from "@/lib/trainingTopics";

type SessionHistory = {
  id: string;
  sessionDate: string;
  sessionType: string;
  comments: string | null;
  topics: {
    topic: string;
    checked: boolean;
    theoryCovered?: boolean;
    practiceCovered?: boolean;
    comment?: string;
  }[];
};

type CheckrideEntry = {
  id: string;
  scheduledDate: string;
  result: string;
  isDraft: boolean;
  trainee: { id: string; cid: string | null; name: string | null };
  availability: {
    examiner?: { id: string; cid: string | null; name: string | null };
  };
};

type ReadyRequest = {
  id: string;
  readyForCheckride: boolean;
  checkrideRequestText?: string | null;
  checkrideRequestedAt?: string | null;
  trainee: { id: string; cid: string | null; name: string | null };
  mentors: { mentor: { id: string; cid: string | null; name: string | null } }[];
};

export default function ExaminerAvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkrides, setCheckrides] = useState<CheckrideEntry[]>([]);
  const [readyRequests, setReadyRequests] = useState<ReadyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<{ id: string; name: string | null; cid: string | null } | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const userRole = (session?.user as any)?.role;
  const canViewHistory = ["PMP_PRÜFER", "PMP_LEITUNG", "ADMIN"].includes(userRole);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/examiner", { cache: "no-store" });
      if (!res.ok) throw new Error(`Load failed: ${res.status}`);
      const data = await res.json();
      setCheckrides(data.checkrides || []);
      setReadyRequests(data.readyRequests || []);
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (!["PMP_PRÜFER", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      router.push("/");
      return;
    }
    // Auth passed, load data
    load();
  }, [status, userRole, router]);

  const openSessionHistory = async (trainee: { id: string; name: string | null; cid: string | null }) => {
    setSelectedTrainee(trainee);
    setLoadingHistory(true);
    setShowSessionHistory(true);

    try {
      // Fetch all trainings for this trainee by CID
      const trainingsRes = await fetch(`/api/trainings/by-cid/${trainee.cid}`);
      if (!trainingsRes.ok) throw new Error("Failed to fetch trainings");
      const trainings = await trainingsRes.json();

      // Collect all sessions from all trainings
      const allSessions: SessionHistory[] = [];
      for (const training of trainings) {
        if (training.sessions && Array.isArray(training.sessions)) {
          allSessions.push(...training.sessions);
        }
      }

      // Sort by date descending (newest first)
      allSessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
      setSessionHistory(allSessions);
    } catch (err) {
      console.error("Error loading session history:", err);
      setSessionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeSessionHistory = () => {
    setShowSessionHistory(false);
    setSelectedTrainee(null);
    setSessionHistory([]);
  };

  const startCheckride = async (trainingId: string) => {
    setStarting(trainingId);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || `Fehler: ${res.status}`);
      }
      if (!payload.checkrideId) {
        throw new Error("Kein Checkride konnte erstellt werden");
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Fehler beim Zuweisen des Checkrides");
    } finally {
      setStarting(null);
    }
  };

  const cancelCheckride = async (checkrideId: string) => {
    if (!confirm("Möchtest du diese Prüfung wirklich absagen?")) return;
    setCancelling(checkrideId);
    setError(null);
    try {
      const res = await fetch(`/api/checkrides/${checkrideId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler: ${res.status}`);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Fehler beim Absagen");
    } finally {
      setCancelling(null);
    }
  };

  if (status === "loading") {
    return (
      <PageLayout>
        <div className="card">
          <p>Lädt...</p>
        </div>
      </PageLayout>
    );
  }

  if (!canViewHistory) {
    return (
      <PageLayout>
        <div className="info-danger">
          <p>Zugriff verweigert. Nur Prüfer und Leadership können diese Seite ansehen.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Checkride Queue</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Bereite Assessments direkt aus den offenen Checkride-Anfragen vor.
        </p>
      </div>

      {error && <div className="info-danger" style={{ marginBottom: "1.5rem" }}><p>{error}</p></div>}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>lädt…</p></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0 }}>Trainees bereit für Checkride</h3>
            {readyRequests.length === 0 ? (
              <p style={{ color: "var(--text-color)", margin: 0 }}>Keine offenen Anfragen</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {readyRequests.map((req) => {
                  const mentorNames = req.mentors
                    .map((m) => `${m.mentor.name || "Unbekannt"} (${m.mentor.cid || "N/A"})`)
                    .join(", ");
                  const isStarting = starting === req.id;
                  return (
                    <div
                      key={req.id}
                      className="card"
                      style={{
                        marginBottom: 0,
                        padding: "12px 14px",
                        background: "var(--container-bg)",
                        borderLeft: "3px solid var(--accent-color)",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                        {canViewHistory ? (
                          <button
                            onClick={() => openSessionHistory(req.trainee)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--accent-color)",
                              cursor: "pointer",
                              fontWeight: 600,
                              textDecoration: "underline",
                            }}
                          >
                            {req.trainee.name || "Trainee"} ({req.trainee.cid || "N/A"})
                          </button>
                        ) : (
                          <>{req.trainee.name || "Trainee"} ({req.trainee.cid || "N/A"})</>
                        )}
                      </div>
                      <div style={{ fontSize: "0.9em", color: "var(--text-color)", marginBottom: "4px" }}>
                        Mentor: {mentorNames || "N/A"}
                      </div>
                      <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "6px" }}>
                        Anfrage erstellt: {req.checkrideRequestedAt ? new Date(req.checkrideRequestedAt).toLocaleString("de-DE") : "unbekannt"}
                      </div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.9em",
                          background: "var(--background-color)",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          marginBottom: "10px",
                        }}
                      >
                        {req.checkrideRequestText || "Kein Availability-Text hinterlegt"}
                      </div>
                      <button
                        type="button"
                        className="button"
                        onClick={() => startCheckride(req.id)}
                        disabled={isStarting}
                      >
                        {isStarting ? "Zuweisung..." : "Mir zuweisen"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Aktive und offene Checkrides</h3>
            {checkrides.length === 0 ? (
              <p style={{ color: "var(--text-color)", margin: 0 }}>Noch keine Checkrides vorhanden</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {checkrides.map((c) => (
                  <div
                    key={c.id}
                    className="card"
                    style={{
                      marginBottom: 0,
                      padding: "12px 14px",
                      background: "var(--container-bg)",
                      borderLeft: "3px solid var(--accent-color)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                      {canViewHistory ? (
                        <button
                          onClick={() => openSessionHistory(c.trainee)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--accent-color)",
                            cursor: "pointer",
                            fontWeight: 600,
                            textDecoration: "underline",
                          }}
                        >
                          {c.trainee.name || "Trainee"} ({c.trainee.cid || "N/A"})
                        </button>
                      ) : (
                        <>{c.trainee.name || "Trainee"} ({c.trainee.cid || "N/A"})</>
                      )}
                    </div>
                    <div style={{ fontSize: "0.9em", marginBottom: "4px" }}>
                      {new Date(c.scheduledDate).toLocaleString("de-DE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "4px" }}>
                      Prüfer: {c.availability.examiner?.name || "Unbekannt"} ({c.availability.examiner?.cid || "N/A"})
                    </div>
                    <div
                      style={{
                        fontSize: "0.85em",
                        color: c.isDraft ? "var(--accent-color)" : "var(--text-color)",
                        marginBottom: "8px",
                      }}
                    >
                      {c.isDraft ? "Bewertung ausstehend" : `Ergebnis: ${c.result}`}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a
                        href={`/examiner/assessment/${c.id}`}
                        className="button"
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.85em",
                          margin: 0,
                          display: "inline-block",
                        }}
                      >
                        Bewertung öffnen
                      </a>
                      {c.result === "INCOMPLETE" && (
                        <button
                          onClick={() => cancelCheckride(c.id)}
                          disabled={cancelling === c.id}
                          className="button"
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.85em",
                            margin: 0,
                            backgroundColor: "var(--danger-color, #d32f2f)",
                            color: "white",
                            border: "none",
                            cursor: cancelling === c.id ? "wait" : "pointer",
                          }}
                        >
                          {cancelling === c.id ? "Absagen..." : "Absagen"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Session History Modal */}
      {showSessionHistory && selectedTrainee && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={closeSessionHistory}
        >
          <div
            className="card"
            style={{
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeSessionHistory}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--text-color)",
                zIndex: 10,
              }}
            >
              ×
            </button>

            <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
              Session-Verlauf: {selectedTrainee.name || "Trainee"} ({selectedTrainee.cid || "N/A"})
            </h2>

            {loadingHistory ? (
              <p style={{ textAlign: "center", color: "var(--text-color)" }}>Wird geladen...</p>
            ) : sessionHistory.length === 0 ? (
              <p style={{ color: "var(--text-color)" }}>Keine Sessions vorhanden</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {sessionHistory.map((session) => {
                  const coveredTopics = session.topics.filter((t) => t.checked);
                  const theoryTopics = coveredTopics.filter((t) => t.theoryCovered);
                  const practiceTopics = coveredTopics.filter((t) => t.practiceCovered);

                  return (
                    <div
                      key={session.id}
                      style={{
                        padding: "1rem",
                        borderRadius: "6px",
                        border: "1px solid var(--footer-border)",
                        background: "var(--container-bg)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                        <div>
                          <div style={{ fontSize: "0.9em", color: "var(--text-color)" }}>
                            {new Date(session.sessionDate).toLocaleDateString("de-DE")} um{" "}
                            {new Date(session.sessionDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8em",
                              color: "var(--text-muted)",
                              marginTop: "0.25rem",
                            }}
                          >
                            Typ:{" "}
                            <span
                              style={{
                                background: session.sessionType === "ONLINE_COACHING" ? "rgba(76, 175, 80, 0.15)" : "rgba(77, 142, 219, 0.15)",
                                color: session.sessionType === "ONLINE_COACHING" ? "#4caf50" : "#4d8edb",
                                padding: "2px 6px",
                                borderRadius: "3px",
                              }}
                            >
                              {session.sessionType === "ONLINE_COACHING" ? "Online Coaching" : "Standard PMP"}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                          {coveredTopics.length} Themen
                        </div>
                      </div>

                      {session.sessionType === "ONLINE_COACHING" ? (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div style={{ fontSize: "0.9em", fontWeight: 500, marginBottom: "0.5rem", color: "var(--text-color)" }}>
                            Notiz:
                          </div>
                          <div
                            style={{
                              fontSize: "0.85em",
                              color: "var(--text-color)",
                              whiteSpace: "pre-wrap",
                              background: "var(--background-color)",
                              padding: "0.75rem",
                              borderRadius: "4px",
                            }}
                          >
                            {session.comments || "Keine Notiz"}
                          </div>
                        </div>
                      ) : (
                        <>
                          {theoryTopics.length > 0 && (
                            <div style={{ marginTop: "0.75rem" }}>
                              <div style={{ fontSize: "0.85em", fontWeight: 500, marginBottom: "0.4rem", color: "#4d8edb" }}>
                                Theorie ({theoryTopics.length}):
                              </div>
                              <div style={{ fontSize: "0.8em", color: "var(--text-color)", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {theoryTopics.map((t) => {
                                  const topicLabel = trainingTopics.find((tr) => tr.key === t.topic)?.label || t.topic;
                                  return (
                                    <span
                                      key={t.topic}
                                      style={{
                                        background: "rgba(77, 142, 219, 0.12)",
                                        color: "#4d8edb",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      {topicLabel}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {practiceTopics.length > 0 && (
                            <div style={{ marginTop: "0.75rem" }}>
                              <div style={{ fontSize: "0.85em", fontWeight: 500, marginBottom: "0.4rem", color: "#4caf50" }}>
                                Praxis ({practiceTopics.length}):
                              </div>
                              <div style={{ fontSize: "0.8em", color: "var(--text-color)", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {practiceTopics.map((t) => {
                                  const topicLabel = trainingTopics.find((tr) => tr.key === t.topic)?.label || t.topic;
                                  return (
                                    <span
                                      key={t.topic}
                                      style={{
                                        background: "rgba(46, 125, 50, 0.12)",
                                        color: "#4caf50",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      {topicLabel}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {session.comments && (
                            <div style={{ marginTop: "0.75rem" }}>
                              <div style={{ fontSize: "0.85em", fontWeight: 500, marginBottom: "0.4rem", color: "var(--text-color)" }}>
                                Notizen:
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8em",
                                  color: "var(--text-color)",
                                  whiteSpace: "pre-wrap",
                                  background: "var(--background-color)",
                                  padding: "0.6rem",
                                  borderRadius: "4px",
                                }}
                              >
                                {session.comments}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
