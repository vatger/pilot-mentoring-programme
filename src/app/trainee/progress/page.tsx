"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

const TRAINING_TOPICS = [
  { key: "NMOC_BASICS", label: "Wiederholung Elemente New Member Orientation Course & Grundlagen" },
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
  { key: "FLIGHT_PLANNING", label: "Flugplanung & Charts" },
  { key: "PRE_FLIGHT", label: "Pre-flight Preparation" },
  { key: "ATC_PHRASEOLOGY", label: "ATC Phraseologie" },
  { key: "OFFLINE_TRAINING", label: "Offline Training (Simulator)" },
  { key: "ONLINE_FLIGHT", label: "Online Flug" },
  { key: "SELF_BRIEFING", label: "Self Briefing" },
  { key: "PRE_CHECK_RIDE", label: "Pre Check Ride" },
];

interface Mentor {
  mentorId: string;
  mentor: {
    id: string;
    name: string | null;
    cid: string | null;
  };
}

interface SessionTopic {
  topic: string;
  checked: boolean;
  order: number;
}

interface TrainingSession {
  id: string;
  sessionDate: string;
  comments: string | null;
  topics: SessionTopic[];
  createdAt: string;
}

interface Training {
  id: string;
  traineeId: string;
  status: string;
  createdAt: string;
  mentors: Mentor[];
}

export default function TraineeProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");

  const [training, setTraining] = useState<Training | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const isTrainee = userRole === "TRAINEE" || userRole === "PENDING_TRAINEE";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (!trainingId) {
      setError("No training ID provided");
      return;
    }

    fetchData();
  }, [status, trainingId, router]);

  const fetchData = async () => {
    try {
      // Fetch training details
      const trainingRes = await fetch(
        `/api/training/${trainingId}?userId=${userId}`
      );
      if (!trainingRes.ok) throw new Error("Failed to fetch training");
      const trainingData = await trainingRes.json();
      setTraining(trainingData);

      // Fetch sessions
      const sessionsRes = await fetch(
        `/api/sessions?trainingId=${trainingId}`
      );
      if (!sessionsRes.ok) throw new Error("Failed to fetch sessions");
      const sessionsData = await sessionsRes.json();
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getTopicProgress = () => {
    const covered = new Set<string>();
    // Only count finalized sessions (not drafts)
    sessions.filter(s => !s.isDraft).forEach((s) => {
      s.topics.forEach((t) => {
        if (t.checked) covered.add(t.topic);
      });
    });
    return covered;
  };

  const coveredTopics = getTopicProgress();

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    );
  }

  if (!training) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          {error || "Training nicht gefunden"}
        </div>
      </PageLayout>
    );
  }

  // Only trainee or their mentors can view this
  const isMentor = training.mentors.some((m) => m.mentorId === userId);
  if (!isTrainee && !isMentor && userRole !== "ADMIN") {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Zugriff verweigert. Nur der Trainee und die Mentoren können diese Seite ansehen.
        </div>
      </PageLayout>
    );
  }

  const progressPercent = Math.round(
    (coveredTopics.size / TRAINING_TOPICS.length) * 100
  );

  return (
    <PageLayout>
      <div className="container">
        <div className="header-container">
          <div className="header">
            <h1>Dein Trainingsfortschritt</h1>
          </div>
        </div>

        {/* Training Info Card */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Trainingsdetails</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <div>
              <p style={{ fontSize: "0.9em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Status</p>
              <p style={{ fontWeight: "600", fontSize: "1.1em", textTransform: "capitalize" }}>{training.status}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.9em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Gestartet</p>
              <p style={{ fontWeight: "600", fontSize: "1.1em" }}>
                {new Date(training.createdAt).toLocaleDateString("de-DE")}
              </p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: "0.9em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Deine Mentoren</p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {training.mentors.map((m) => (
                  <div
                    key={m.mentorId}
                    style={{
                      backgroundColor: "var(--card-bg)",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.95em",
                      border: "1px solid var(--footer-border)",
                    }}
                  >
                    <strong>{m.mentor.name}</strong> <span style={{ color: "var(--text-muted)" }}>({m.mentor.cid})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Gesamtfortschritt</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
            <p style={{ fontSize: "1em" }}>Themen abgedeckt</p>
            <div style={{ fontSize: "2.5em", fontWeight: "bold", color: "var(--accent-color)" }}>
              {progressPercent}%
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: "2rem",
              backgroundColor: "var(--container-bg)",
              borderRadius: "1rem",
              overflow: "hidden",
              border: `1px solid var(--footer-border)`,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                backgroundColor: "var(--accent-color)",
                transition: "width 0.5s ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: "1rem",
                color: "white",
                fontWeight: "600",
                fontSize: "0.9em",
              }}
            >
              {progressPercent > 5 && `${progressPercent}%`}
            </div>
          </div>
          <p style={{ fontSize: "0.9em", color: "var(--text-muted)", marginTop: "0.75rem" }}>
            {coveredTopics.size} von {TRAINING_TOPICS.length} Themen abgedeckt
          </p>
        </div>

        {/* Topics Grid */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>Trainingsinhalte</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {TRAINING_TOPICS.map((topic) => {
              const isCovered = coveredTopics.has(topic.key);
              return (
                <div
                  key={topic.key}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${isCovered ? "var(--accent-color)" : "var(--footer-border)"}`,
                    backgroundColor: isCovered ? "var(--container-bg)" : "transparent",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: "50%",
                      backgroundColor: isCovered ? "var(--accent-color)" : "var(--footer-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {isCovered ? "✓" : ""}
                  </div>
                  <span style={{ fontWeight: isCovered ? "600" : "500", color: "var(--text-color)" }}>
                    {topic.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session History */}
        {sessions.filter(s => !s.isDraft).length > 0 && (
          <div className="card">
            <h2 style={{ marginBottom: "1.5rem" }}>Trainings-Sessions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {sessions.filter(s => !s.isDraft).map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "var(--container-bg)",
                    borderRadius: "0.5rem",
                    border: `1px solid var(--footer-border)`,
                    borderLeft: `4px solid var(--accent-color)`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <p style={{ fontSize: "0.9em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                        Datum der Session
                      </p>
                      <p style={{ fontWeight: "600", fontSize: "1.15em" }}>
                        {new Date(s.sessionDate).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.9em", color: "var(--text-muted)" }}>
                        {s.topics.filter((t) => t.checked).length} Themen
                      </p>
                      <p style={{ fontSize: "0.9em", color: "var(--text-muted)" }}>abgedeckt</p>
                    </div>
                  </div>

                  {s.comments && (
                    <div
                      style={{
                        marginBottom: "1rem",
                        padding: "1rem",
                        backgroundColor: "var(--card-bg)",
                        borderRadius: "0.5rem",
                        borderLeft: `3px solid var(--accent-color)`,
                      }}
                    >
                      <p style={{ fontSize: "0.9em", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-color)" }}>
                        Das möchte dir dein Mentor noch mitgeben:
                      </p>
                      <p style={{ fontSize: "0.95em", color: "var(--text-color)", fontStyle: "italic" }}>
                        "{s.comments}"
                      </p>
                    </div>
                  )}

                  {s.topics.filter((t) => t.checked).length > 0 && (
                    <div style={{ paddingTop: "1rem", borderTop: `1px solid var(--footer-border)` }}>
                      <p style={{ fontSize: "0.9em", fontWeight: "600", marginBottom: "0.75rem", color: "var(--text-muted)" }}>
                        Besprochene Themen:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {s.topics.map((topic) => (
                          topic.checked && (
                            <span
                              key={topic.order}
                              style={{
                                backgroundColor: "var(--accent-color)",
                                color: "white",
                                padding: "0.4rem 0.8rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.85em",
                                fontWeight: "500",
                              }}
                            >
                              ✓ {TRAINING_TOPICS.find((t) => t.key === topic.topic)?.label}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.filter(s => !s.isDraft).length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <p style={{ fontSize: "1.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              📋 Noch keine Trainings-Sessions
            </p>
            <p style={{ fontSize: "0.95em", color: "var(--text-muted)" }}>
              Dein Mentor wird bald die ersten Sitzungen dokumentieren.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
