"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";

const TRAINING_TOPICS = [
  { key: "NMOC_BASICS", label: "Wiederholung Elemente New Member Orientation Course & Grundlagen" },
  { key: "FLIGHT_PLANNING", label: "Flugplanung & Charts" },
  { key: "ATC_PHRASEOLOGY", label: "ATC Phraseologie" },
  { key: "SELF_BRIEFING", label: "Self Briefing" },
  { key: "PRE_FLIGHT", label: "Flugvorbereitung" },
  { key: "ENROUTE_CLEARANCE", label: "IFR Clearance" },
  { key: "STARTUP_PUSHBACK", label: "Startup & Pushback" },
  { key: "TAXI_RUNWAY", label: "Taxi zur Runway" },
  { key: "TAKEOFF", label: "Takeoff" },
  { key: "DEPARTURE", label: "Departure" },
  { key: "ENROUTE", label: "Enroute" },
  { key: "ARRIVAL_TRANSITION", label: "Standard Arrival STAR / LNAV-Transition" },
  { key: "APPROACH", label: "Approach" },
  { key: "LANDING", label: "Landung" },
  { key: "TAXI_PARKING", label: "Taxi zum Gate" },
  { key: "PRE_CHECK_RIDE", label: "Pre Check Ride" },
];

interface TrainingCoverageRow {
  trainingId: string;
  status: string;
  trainee: { id: string; name: string | null; cid: string | null; email: string | null };
  mentors: { id: string; name: string | null; cid: string | null }[];
  sessionsCount: number;
  topicsCoveredCount: number;
  topicsCoverage: { topic: string; covered: boolean }[];
  lastSessionDate: string | null;
}

export default function PmpTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trainings, setTrainings] = useState<TrainingCoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const topicLabel = useMemo(() => {
    const map: Record<string, string> = {};
    TRAINING_TOPICS.forEach((t) => (map[t.key] = t.label));
    return map;
  }, []);

  const totalTopics = TRAINING_TOPICS.length;

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
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>PMP-Tracking</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Übersicht der Trainingsabdeckung nach Thema für jeden Trainee
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
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
        </div>
      </div>

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Lädt...</p></div>
      ) : trainings.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-color)", margin: 0 }}>Keine Trainings gefunden.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {trainings.map((row) => {
            const coveragePercent = Math.round(
              (row.topicsCoveredCount / totalTopics) * 100
            );
            return (
              <div key={row.trainingId} className="card">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "1.5rem",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.15em" }}>
                      {row.trainee.name || "Unbekannt"}
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gap: "4px",
                        fontSize: "0.9em",
                        color: "var(--text-color)",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>CID:</span>{" "}
                        <span style={{ fontFamily: "monospace" }}>
                          {row.trainee.cid || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 500 }}>Status:</span> {row.status}
                      </div>
                      <div>
                        <span style={{ fontWeight: 500 }}>Sessions:</span>{" "}
                        {row.sessionsCount}
                      </div>
                      {row.lastSessionDate && (
                        <div>
                          <span style={{ fontWeight: 500 }}>Letztes Training:</span>{" "}
                          {new Date(row.lastSessionDate).toLocaleDateString()}
                        </div>
                      )}
                      {row.mentors.length > 0 && (
                        <div>
                          <span style={{ fontWeight: 500 }}>Mentoren:</span>{" "}
                          {row.mentors.map((m) => m.name || m.cid).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", minWidth: "220px" }}>
                    <div
                      style={{
                        fontSize: "1.05em",
                        fontWeight: 600,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {row.topicsCoveredCount} / {totalTopics} Themen
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "var(--footer-border)",
                        borderRadius: "999px",
                        overflow: "hidden",
                        marginBottom: "0.75rem",
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
                    <div
                      style={{
                        fontSize: "0.85em",
                        color: "var(--text-color)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {coveragePercent}% Abgeschlossen
                    </div>
                    <Link
                      href={`/trainee/progress?trainingId=${row.trainingId}`}
                      className="button"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.85em",
                        margin: 0,
                        display: "inline-block",
                      }}
                    >
                      Details ansehen
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "1rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "6px",
                  }}
                >
                  {row.topicsCoverage.map((topic) => {
                    const label = topicLabel[topic.topic] || topic.topic;
                    return (
                      <div
                        key={topic.topic}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: `1px solid ${
                            topic.covered
                              ? "var(--accent-color)"
                              : "var(--footer-border)"
                          }`,
                          background: topic.covered
                            ? "rgba(0, 95, 163, 0.06)"
                            : "transparent",
                          fontSize: "0.85em",
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: topic.covered
                              ? "var(--accent-color)"
                              : "var(--footer-border)",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
