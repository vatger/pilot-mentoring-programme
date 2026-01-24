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

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Möchten Sie diese Entwurfssitzung wirklich löschen?")) {
      return;
    }
    setSavingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete session");
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
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {training.sessions
                .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
                .map((sess) => (
                  <div
                    key={sess.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--footer-border)",
                      borderLeft: `4px solid ${sess.isDraft ? "var(--warning-color)" : "var(--success-color)"}`,
                      opacity: sess.isDraft ? 0.7 : 1,
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                      <span style={{ fontWeight: 600, minWidth: "100px" }}>
                        {new Date(sess.sessionDate).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        {sess.topics.filter(t => t.checked).length} Themen
                      </span>
                      {sess.isDraft ? (
                        <span style={{ color: "var(--warning-color)", fontSize: "0.875rem" }}>
                          🔧 Entwurf
                        </span>
                      ) : (
                        <span style={{ color: "var(--success-color)", fontSize: "0.875rem" }}>
                          ✓ Freigegeben
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      {sess.isDraft && (
                        <>
                          <button
                            onClick={() => releaseSession(sess.id)}
                            disabled={savingSession}
                            className="button"
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          >
                            {savingSession ? "..." : "Freigeben"}
                          </button>
                          <button
                            onClick={() => deleteSession(sess.id)}
                            disabled={savingSession}
                            className="button"
                            style={{ fontSize: "0.75rem", padding: "4px 10px", backgroundColor: "var(--danger-bg)", color: "white" }}
                          >
                            {savingSession ? "..." : "Löschen"}
                          </button>
                        </>
                      )}
                      <Link
                        href={`/mentor/session-details/${sess.id}?trainingId=${training.id}`}
                        className="button"
                        style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                      >
                        Details
                      </Link>
                      {sess.isDraft && (
                        <Link
                          href={`/trainings/session/${sess.id}?trainingId=${training.id}`}
                          className="button"
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          Whiteboard
                        </Link>
                      )}
                    </div>
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
