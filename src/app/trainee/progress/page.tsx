"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import { trainingTopics } from "@/lib/trainingTopics";
import { Link } from "lucide-react";

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
  comment?: string | null;
  order: number;
}

interface TrainingSession {
  id: string;
  lessonType: string;
  sessionDate: string;
  comments: string | null;
  topics: SessionTopic[];
  createdAt: string;
  isDraft?: boolean;
}

interface RegistrationData {
  cid: string;
  name: string;
  rating: string;
  fir: string;
  simulator: string;
  aircraft: string;
  client: string;
  clientSetup: string;
  experience: string;
  charts: string;
  airac: string;
  category: string;
  topics: string | null;
  schedule: string;
  communication: string;
  personal: string | null;
  other: string | null;
}

interface Training {
  id: string;
  traineeId: string;
  status: string;
  createdAt: string;
  mentors: Mentor[];
  trainee: {
    id: string;
    cid: string | null;
    name: string | null;
    registration?: RegistrationData | null;
  };
}

function TraineeProgressContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");

  const [training, setTraining] = useState<Training | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const isTrainee = userRole === "TRAINEE" || userRole === "PENDING_TRAINEE";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (trainingId) {
      fetchData(trainingId);
    } else {
      // Fetch trainee's active training if no trainingId provided
      fetchTraineeTraining();
    }
  }, [status, trainingId, userId, router]);

  const fetchTraineeTraining = async () => {
    try {
      // Fetch all trainings for the user
      const allTrainingsRes = await fetch("/api/trainings/trainee");
      if (!allTrainingsRes.ok) throw new Error("Failed to fetch training");
      const trainings = await allTrainingsRes.json();
      
      if (!trainings || trainings.length === 0) {
        setError("No active training found");
        setLoading(false);
        return;
      }
      
      // Use the first active training
      const activeTraining = trainings.find((t: any) => t.status === "ACTIVE") || trainings[0];
      await fetchData(activeTraining.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load training");
      setLoading(false);
    }
  };

  const fetchData = async (id: string) => {
    try {
      // Fetch training details
      const trainingRes = await fetch(
        `/api/training/${id}?userId=${userId}`
      );
      if (!trainingRes.ok) throw new Error("Failed to fetch training");
      const trainingData = await trainingRes.json();
      setTraining(trainingData);

      // Fetch sessions
      const sessionsRes = await fetch(
        `/api/sessions?trainingId=${id}`
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

  const showPendingForumMessage = userRole === "PENDING_TRAINEE";
  const showNoSessionForumMessage =
    userRole === "TRAINEE" && !loading && training && sessions.length === 0;

  const getDiscordStatus = (other?: string | null) => {
    if (!other) return null;
    const line = other.split("\n").find((entry) => entry.startsWith("VATSIM Germany Discord:"));
    return line ? line.replace("VATSIM Germany Discord:", "").trim() : null;
  };

  // Only trainee, their mentors, or leadership (Leitung/Admin/Examiner) can view this
  const isMentor = training ? training.mentors.some((m) => m.mentorId === userId) : false;
  const isLeadership = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER"].includes(userRole);
  if (training && !isTrainee && !isMentor && !isLeadership) {
    return (
      <PageLayout>
        <div className="info-danger">
          <p>Zugriff verweigert. Nur der Trainees, Mentoren und PMP-Leitung können diese Seite anzeigen.</p>
        </div>
      </PageLayout>
    );
  }

  const progressPercent = training ? Math.round(
    (coveredTopics.size / trainingTopics.length) * 100
  ) : 0;

  return (
    <>
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Trainingsfortschritt</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Verfolge deinen Trainingsfortschritt
        </p>
      </div>

      {(showPendingForumMessage || showNoSessionForumMessage) && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Wichtige Information</h3>
          <p style={{ margin: 0, color: "var(--danger-color)" }}>
            Bitte prüfe regelmäßig das Forum. Dein Mentor wird dich dort kontaktieren und die
            weitere Abstimmung findet über das Forum statt.
          </p>
        </div>
      )}

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Laden...</p></div>
      ) : !training ? (
        <div className="info-danger">
          <p>Training nicht gefunden.</p>
        </div>
      ) : (
        <>
          {/* Training Info Card */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: 0 }}>Trainingsdetails</h3>
              {isLeadership && (
                <button
                  className="button"
                  style={{ margin: 0 }}
                  onClick={() => setShowRegistrationModal(true)}
                >
                  Anmeldung ansehen
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.25rem", fontWeight: 500 }}>Status</div>
                <div style={{ fontSize: "1.05em", fontWeight: 600, textTransform: "capitalize" }}>
                  {training.status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.25rem", fontWeight: 500 }}>Gestartet</div>
                <div style={{ fontSize: "1.05em", fontWeight: 600 }}>
                  {new Date(training.createdAt).toLocaleDateString()}
                </div>
              </div>
              {training.mentors.length > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.5rem", fontWeight: 500 }}>
                    Deine Mentoren
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {training.mentors.map((m) => (
                      <div
                        key={m.mentorId}
                        style={{
                          backgroundColor: "var(--container-bg)",
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          fontSize: "0.9em",
                          border: "1px solid var(--footer-border)",
                        }}
                      >
                        <strong>{m.mentor.name}</strong>{" "}
                        <span style={{ color: "var(--text-color)" }}>
                          ({m.mentor.cid || "N/A"})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Gesamtfortschritt</h3>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "2.2em", fontWeight: 700, color: "var(--accent-color)" }}>
                  {progressPercent}%
                </div>
                <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>
                  {coveredTopics.size} / {trainingTopics.length} Themen
                </div>
              </div>
              <div>
                <div
                  style={{
                    width: "100%",
                    height: "16px",
                    backgroundColor: "var(--footer-border)",
                    borderRadius: "999px",
                    overflow: "hidden",
                    border: "1px solid var(--footer-border)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      backgroundColor: "var(--accent-color)",
                      transition: "width 0.5s ease-in-out",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Trainingsthemen</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
              {trainingTopics.map((topic) => {
                const isCovered = coveredTopics.has(topic.key);
                return (
                  <div
                    key={topic.key}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: `1.5px solid ${
                        isCovered ? "var(--accent-color)" : "var(--footer-border)"
                      }`,
                      backgroundColor: isCovered
                        ? "rgba(0, 95, 163, 0.06)"
                        : "transparent",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: isCovered
                          ? "var(--accent-color)"
                          : "var(--footer-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.9em",
                        flexShrink: 0,
                      }}
                    >
                      {isCovered ? "✓" : ""}
                    </div>
                    <span
                      style={{
                        fontWeight: isCovered ? 600 : 500,
                        color: "var(--text-color)",
                        fontSize: "0.9em",
                      }}
                    >
                      {topic.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session History */}
          {sessions.length > 0 && (
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Trainingssessions</h3>
              <div style={{ display: "grid", gap: "1.5rem" }}>
                {sessions.map((s) => {
                  const lessonTypeLabel =
                    s.lessonType === "THEORIE_TRAINING"
                      ? "Theorie Training"
                      : s.lessonType === "OFFLINE_FLUG"
                      ? "Offline Flug"
                      : s.lessonType === "ONLINE_FLUG"
                      ? "Online Flug"
                      : s.lessonType;

                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: "1rem 1.25rem",
                        backgroundColor: "var(--container-bg)",
                        borderRadius: "8px",
                        border: "1px solid var(--footer-border)",
                        borderLeft: "4px solid var(--accent-color)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "1rem",
                          alignItems: "start",
                          marginBottom: "1rem",
                          paddingBottom: "1rem",
                          borderBottom: "1px solid var(--footer-border)",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.8em", color: "var(--text-color)", marginBottom: "0.25rem" }}>
                            {lessonTypeLabel}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: "1.05em" }}>
                            {new Date(s.sessionDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>
                            {s.topics.filter((t) => t.checked).length} Themen abgedeckt
                          </div>
                        </div>
                      </div>

                      {s.comments && (
                        <div
                          style={{
                            marginBottom: "1rem",
                            padding: "10px 12px",
                            backgroundColor: "var(--card-bg)",
                            borderRadius: "6px",
                            borderLeft: "3px solid var(--accent-color)",
                          }}
                        >
                          <div style={{ fontSize: "0.8em", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-color)" }}>
                            Anmerkungen deines Mentors:
                          </div>
                          <div style={{ fontSize: "0.9em", color: "var(--text-color)", fontStyle: "italic" }}>
                            "{s.comments}"
                          </div>
                        </div>
                      )}

                      {s.topics.filter((t) => t.checked).length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.85em", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-color)" }}>
                            Themen abgedeckt:
                          </div>
                          <div style={{ display: "grid", gap: "6px" }}>
                            {s.topics.map((topic) =>
                              topic.checked ? (
                                <div
                                  key={topic.order}
                                  style={{
                                    backgroundColor: "var(--card-bg)",
                                    padding: "8px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--footer-border)",
                                  }}
                                >
                                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                                    <span
                                      style={{
                                        backgroundColor: "var(--accent-color)",
                                        color: "white",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        fontSize: "0.75em",
                                        fontWeight: 600,
                                        flexShrink: 0,
                                        marginTop: "1px",
                                      }}
                                    >
                                      ✓
                                    </span>
                                    <div style={{ fontSize: "0.9em" }}>
                                      <div style={{ fontWeight: 500, marginBottom: topic.comment ? "0.25rem" : "0" }}>
                                        {
                                          trainingTopics.find(
                                            (t) => t.key === topic.topic
                                          )?.label
                                        }
                                      </div>
                                      {topic.comment && (
                                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontStyle: "italic" }}>
                                          "{topic.comment}"
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
              <div style={{ fontSize: "2.5em", marginBottom: "0.5rem" }}>📋</div>
              <p style={{ fontSize: "1em", color: "var(--text-color)", marginBottom: "0.25rem" }}>
                Noch keine Trainingssessions
              </p>
              <p style={{ fontSize: "0.9em", color: "var(--text-color)", margin: 0 }}>
                Dein Mentor wird hier bald Sessions dokumentieren.
              </p>
            </div>
          )}
        </>
      )}
    </PageLayout>
    
    {showRegistrationModal && training && (
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
        onClick={() => setShowRegistrationModal(false)}
      >
        <div
          className="card"
          style={{
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowRegistrationModal(false)}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-color)",
            }}
          >
            ×
          </button>

          <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
            Anmeldungsinformationen: {training.trainee.name || "Unbekannt"}
          </h2>

          {training.trainee.registration ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <strong style={{ color: "var(--text-color)" }}>CID:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.cid}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Name:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.name}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Rating:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.rating}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>FIR:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.fir}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Simulator:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.simulator}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Flugzeug:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.aircraft}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Pilot Client:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.client}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Flugsimulator-Erfahrung:</strong>
                <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                  {training.trainee.registration.experience}
                </p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Charts / Navigationsmaterial:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.charts}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>AIRAC Daten:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.airac}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Kategorie:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.category}</p>
              </div>

              {training.trainee.registration.topics && (
                <div>
                  <strong style={{ color: "var(--text-color)" }}>Interessengebiete:</strong>
                  <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                    {training.trainee.registration.topics}
                  </p>
                </div>
              )}

              <div>
                <strong style={{ color: "var(--text-color)" }}>Verfügbarkeit:</strong>
                <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                  {training.trainee.registration.schedule}
                </p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Hardware:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{training.trainee.registration.communication}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Kommunikation (Discord):</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{getDiscordStatus(training.trainee.registration.other) || "—"}</p>
              </div>

              {training.trainee.registration.personal && (
                <div>
                  <strong style={{ color: "var(--text-color)" }}>Persönliche Infos:</strong>
                  <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                    {training.trainee.registration.personal}
                  </p>
                </div>
              )}

              {training.trainee.registration.other && (
                <div>
                  <strong style={{ color: "var(--text-color)" }}>Sonstiges:</strong>
                  <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                    {training.trainee.registration.other}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--text-color)" }}>Keine Anmeldungsdaten vorhanden.</p>
          )}

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setShowRegistrationModal(false)} className="button">
              Schließen
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function TraineeProgressPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    }>
      <TraineeProgressContent />
    </Suspense>
  );
}
