"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";

type Training = {
  id: string;
  status: string;
  readyForCheckride: boolean;
  createdAt: string;
  updatedAt: string;
  trainee: {
    id: string;
    cid: string | null;
    name: string | null;
    email: string | null;
  };
  mentors: {
    mentor: {
      id: string;
      name: string | null;
      cid: string | null;
    };
  }[];
  sessions: {
    id: string;
    sessionDate: string;
    comments: string | null;
    isDraft: boolean;
    releasedAt: string | null;
    topics: {
      topic: string;
      checked: boolean;
    }[];
  }[];
};

type Checkride = {
  id: string;
  status: string;
  scheduledAt: string;
  examiner: {
    name: string | null;
    cid: string | null;
  };
  assessment: {
    id: string;
    overallResult: string | null;
  } | null;
};

export default function TraineeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");

  const [training, setTraining] = useState<Training | null>(null);
  const [checkride, setCheckride] = useState<Checkride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingCheckride, setUpdatingCheckride] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingComments, setEditingComments] = useState("");
  const [savingSession, setSavingSession] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }

    if (trainingId) {
      fetchTrainingDetails();
    }
  }, [status, isMentor, router, trainingId]);

  const fetchTrainingDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trainings/${trainingId}`);
      if (!res.ok) throw new Error("Failed to fetch training details");
      const data = await res.json();
      setTraining(data);

      // Fetch checkride if exists
      const checkrideRes = await fetch(`/api/checkrides?trainingId=${trainingId}`);
      if (checkrideRes.ok) {
        const checkrideData = await checkrideRes.json();
        setCheckride(checkrideData);
      }

      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleReadyForCheckride = async () => {
    if (!training || updatingCheckride) return;
    setUpdatingCheckride(true);
    try {
      const res = await fetch(`/api/trainings/${training.id}/ready`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readyForCheckride: !training.readyForCheckride }),
      });
      if (!res.ok) throw new Error("Failed to update checkride status");
      setTraining({ ...training, readyForCheckride: !training.readyForCheckride });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingCheckride(false);
    }
  };

  const startEditSession = (sessionId: string, currentComments: string | null) => {
    setEditingSessionId(sessionId);
    setEditingComments(currentComments || "");
  };

  const saveSessionEdit = async (sessionId: string) => {
    setSavingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: editingComments }),
      });
      if (!res.ok) throw new Error("Failed to save session");
      
      // Update training data
      if (training) {
        const updatedSessions = training.sessions.map(s =>
          s.id === sessionId ? { ...s, comments: editingComments } : s
        );
        setTraining({ ...training, sessions: updatedSessions });
      }
      setEditingSessionId(null);
      setEditingComments("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSession(false);
    }
  };

  const releaseSession = async (sessionId: string) => {
    setSavingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/release`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to release session");
      await fetchTrainingDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSession(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="container">
          <p>Lädt...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container">
          <p style={{ color: "var(--error-color)" }}>Fehler: {error}</p>
          <Link href="/mentor/trainee" className="button">
            Zurück zu Trainees
          </Link>
        </div>
      </PageLayout>
    );
  }

  if (!training) {
    return (
      <PageLayout>
        <div className="container">
          <p>Training nicht gefunden</p>
          <Link href="/mentor/trainee" className="button">
            Zurück zu Trainees
          </Link>
        </div>
      </PageLayout>
    );
  }

  const completedSessions = training.sessions.filter(s => !s.isDraft).length;
  const totalSessions = training.sessions.length;

  return (
    <PageLayout>
      <div className="container">
        <Link href="/mentor/trainee" className="button" style={{ marginBottom: "1rem" }}>
          ← Zurück zu Trainees
        </Link>

        <h1>Fortschritt des Trainees</h1>

        {/* Trainee Info Card */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2>{training.trainee.name || "Unknown Trainee"}</h2>
          <p><strong>CID:</strong> {training.trainee.cid || "N/A"}</p>
          <p><strong>Email:</strong> {training.trainee.email || "N/A"}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className="status-pill"
              style={{
                backgroundColor:
                  training.status === "ACTIVE"
                    ? "var(--success-color)"
                    : training.status === "COMPLETED"
                    ? "var(--primary-color)"
                    : "var(--text-muted)",
                color: "white",
                padding: "0.25rem 0.75rem",
                borderRadius: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {training.status}
            </span>
          </p>
          <p style={{ marginTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={training.readyForCheckride}
                onChange={toggleReadyForCheckride}
                disabled={updatingCheckride}
                style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }}
              />
              <strong>Bereit für den Prüfungsflug</strong>
            </label>
          </p>
        </div>

        {/* Mentors */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3>Zugewiesene Mentoren</h3>
          {training.mentors.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Keine Mentoren zugewiesen</p>
          ) : (
            <ul>
              {training.mentors.map((tm) => (
                <li key={tm.mentor.id}>
                  {tm.mentor.name || "Unbekannt"} (CID: {tm.mentor.cid || "N/A"})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Checkride Info */}
        {checkride && (
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3>Prüfungsflug</h3>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className="status-pill"
                style={{
                  backgroundColor:
                    checkride.status === "PASSED"
                      ? "var(--success-color)"
                      : checkride.status === "FAILED"
                      ? "var(--error-color)"
                      : "var(--warning-color)",
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                {checkride.status}
              </span>
            </p>
            <p>
              <strong>Geplant:</strong>{" "}
              {new Date(checkride.scheduledAt).toLocaleString()}
            </p>
            <p>
              <strong>Prüfer:</strong> {checkride.examiner.name || "Unbekannt"} (CID:{" "}
              {checkride.examiner.cid || "N/A"})
            </p>
            {checkride.assessment && (
              <div style={{ marginTop: "1rem" }}>
                {checkride.assessment.overallResult && (
                  <p>
                    <strong>Ergebnis:</strong> {checkride.assessment.overallResult}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Training Sessions */}
        <div className="card">
          <h3>Trainingssessions ({completedSessions} / {totalSessions} abgeschlossen)</h3>
          {training.sessions.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Keine Sitzungen erfasst</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {training.sessions
                .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
                .map((sess) => (
                  <div
                    key={sess.id}
                    className="form-card"
                    style={{
                      opacity: sess.isDraft ? 0.7 : 1,
                      borderLeft: `4px solid ${sess.isDraft ? "var(--warning-color)" : "var(--success-color)"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <p>
                          <strong>Datum:</strong> {new Date(sess.sessionDate).toLocaleDateString()}
                        </p>
                        {sess.isDraft ? (
                          <span style={{ color: "var(--warning-color)", fontSize: "0.875rem" }}>
                            🔧 Entwurf
                          </span>
                        ) : (
                          <span style={{ color: "var(--success-color)", fontSize: "0.875rem" }}>
                            ✓ Freigegeben: {sess.releasedAt ? new Date(sess.releasedAt).toLocaleDateString() : "N/A"}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {editingSessionId === sess.id ? (
                          <>
                            <button
                              onClick={() => saveSessionEdit(sess.id)}
                              disabled={savingSession}
                              className="button"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {savingSession ? "Speichern..." : "Speichern"}
                            </button>
                            <button
                              onClick={() => setEditingSessionId(null)}
                              className="button"
                              style={{ fontSize: "0.75rem", opacity: 0.7 }}
                            >
                              Abbrechen
                            </button>
                          </>
                        ) : (
                          <>
                            {sess.isDraft && (
                              <>
                                <button
                                  onClick={() => startEditSession(sess.id, sess.comments)}
                                  className="button"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Notizen Bearbeiten
                                </button>
                                <button
                                  onClick={() => releaseSession(sess.id)}
                                  disabled={savingSession}
                                  className="button"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {savingSession ? "Freigeben..." : "Freigeben"}
                                </button>
                              </>
                            )}
                            <Link
                              href={`/trainings/session/${sess.id}?trainingId=${training.id}`}
                              className="button"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {sess.isDraft ? "Whiteboard hinzufügen" : "Ansehen"}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {editingSessionId === sess.id ? (
                      <div style={{ marginBottom: "1rem" }}>
                        <label>
                          <strong>Kommentare:</strong>
                          <textarea
                            value={editingComments}
                            onChange={(e) => setEditingComments(e.target.value)}
                            style={{
                              width: "100%",
                              minHeight: "100px",
                              padding: "0.5rem",
                              marginTop: "0.5rem",
                              border: "1px solid var(--border-color)",
                              borderRadius: "4px",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <>
                        {sess.topics.length > 0 && (
                          <div style={{ marginBottom: "0.5rem" }}>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                              Abgedeckte Themen: {sess.topics.filter(t => t.checked).length} / {sess.topics.length}
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                              {sess.topics.filter(t => t.checked).map((topic, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    backgroundColor: "var(--accent-color)",
                                    color: "white",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "0.5rem",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {topic.topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {sess.comments && (
                          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", fontStyle: "italic", color: "var(--text-color)" }}>
                            "{sess.comments}"
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}

          <div style={{ marginTop: "2rem" }}>
            <Link href={`/mentor/session?trainingId=${training.id}`} className="button">
              Neue Session protokollieren
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
