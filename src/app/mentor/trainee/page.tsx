"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";
import { trainingTopics } from "@/lib/trainingTopics";

type Trainee = {
  id: string;
  cid: string | null;
  name: string | null;
  registration?: RegistrationData | null;
};

type RegistrationData = {
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
};

type Training = {
  id: string;
  status: string;
  readyForCheckride: boolean;
  createdAt: string;
  trainee: Trainee;
  sessions: { id: string; topics: { topic: string; checked: boolean }[] }[];
};

export default function MentorTraineePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [showModal, setShowModal] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN";
  const isLeitung = userRole === "PMP_LEITUNG" || userRole === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }

    fetchTrainings();
  }, [status, isMentor, router]);

  const fetchTrainings = async () => {
    try {
      const endpoint = isLeitung ? "/api/trainings/leitung" : "/api/trainings/mentor";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch trainings");
      const data = await res.json();
      setTrainings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const openRegistrationDetails = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTrainee(null);
  };

  const getDiscordStatus = (other?: string | null) => {
    if (!other) return null;
    const line = other.split("\n").find((entry) => entry.startsWith("VATSIM Germany Discord:"));
    return line ? line.replace("VATSIM Germany Discord:", "").trim() : null;
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="card"><p>lädt…</p></div>
      </PageLayout>
    );
  }

  if (!isMentor) {
    return (
      <PageLayout>
        <div className="info-danger">
          <p>Zugriff verweigert. Nur Mentoren können diese Seite ansehen.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>{isLeitung ? "Alle Trainees" : "Meine Trainees"}</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          {isLeitung
            ? "Übersicht aller aktiven Trainings (Management Ansicht)"
            : "Deine zugewiesenen Trainees"}
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Loading...</p></div>
      ) : trainings.length === 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>No Trainees</h3>
          <p style={{ margin: 0 }}>
            {isLeitung
              ? "Keine aktiven Trainings gefunden."
              : "Du hast noch keine zugewiesenen Trainees."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {trainings.map((training) => {
            const covered = new Set(
              training.sessions
                .flatMap((s) => s.topics)
                .filter((t) => t.checked)
                .map((t) => t.topic)
            );
            const coveragePercent = Math.round(
              (covered.size / trainingTopics.length) * 100
            );

            return (
              <div key={training.id} className="card">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "1.5rem",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.15em" }}>
                      {training.trainee.name || "Trainee"}
                    </h3>

                    <div style={{ display: "grid", gap: "8px", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                          CID
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: "0.95em" }}>
                          {training.trainee.cid || "N/A"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                          Status
                        </div>
                        <div
                          className="stepper-progress"
                          style={{
                            display: "inline-block",
                            margin: "0.25rem 0 0 0",
                            padding: "4px 10px",
                            fontSize: "0.85em",
                          }}
                        >
                          {training.status}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                          Progress
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
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
                          <div style={{ fontSize: "0.8em", fontWeight: 600, minWidth: "35px" }}>
                            {covered.size}/{trainingTopics.length}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                          Sessions
                        </div>
                        <div style={{ fontSize: "0.95em" }}>
                          {training.sessions.length} gelogged
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                          Bereit für Check Ride
                        </div>
                        <div
                          style={{
                            fontSize: "0.95em",
                            fontWeight: 600,
                            color: training.readyForCheckride
                              ? "var(--accent-color)"
                              : "var(--text-color)",
                          }}
                        >
                          {training.readyForCheckride ? "✓ Yes" : "Not yet"}
                        </div>
                      </div>

                      {isLeitung && (training as any).mentors && (
                        <div>
                          <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                            Mentoren
                          </div>
                          <div style={{ fontSize: "0.9em" }}>
                            {(training as any).mentors
                              .map(
                                (m: any) =>
                                  m.mentor?.name || m.mentor?.cid || "Unbekannt"
                              )
                              .join(", ") || "-"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      minWidth: "180px",
                    }}
                  >
                    <Link
                      href={`/mentor/session?trainingId=${training.id}`}
                      className="button"
                      style={{ margin: 0, padding: "8px 12px", fontSize: "0.9em" }}
                    >
                      Log Session
                    </Link>
                    <Link
                      href={`/trainee/progress?trainingId=${training.id}`}
                      className="button"
                      style={{ margin: 0, padding: "8px 12px", fontSize: "0.9em" }}
                    >
                      Fortschritt ansehen
                    </Link>
                    <button
                      onClick={() => openRegistrationDetails(training.trainee)}
                      className="button"
                      style={{ margin: 0, padding: "8px 12px", fontSize: "0.9em" }}
                    >
                      Anmeldung ansehen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
    
    {showModal && selectedTrainee && (
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
        onClick={closeModal}
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
            onClick={closeModal}
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
            Anmeldungsinformationen: {selectedTrainee.name}
          </h2>

          {selectedTrainee.registration ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <strong style={{ color: "var(--text-color)" }}>CID:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.cid}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Name:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.name}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Rating:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.rating}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>FIR:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.fir}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Simulator:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.simulator}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Flugzeug:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.aircraft}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Pilot Client:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.client}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Flugsimulator-Erfahrung:</strong>
                <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                  {selectedTrainee.registration.experience}
                </p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Charts / Navigationsmaterial:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.charts}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>AIRAC Daten:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.airac}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Kategorie:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.category}</p>
              </div>

              {selectedTrainee.registration.topics && (
                <div>
                  <strong style={{ color: "var(--text-color)" }}>Interessengebiete:</strong>
                  <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                    {selectedTrainee.registration.topics}
                  </p>
                </div>
              )}

              <div>
                <strong style={{ color: "var(--text-color)" }}>Verfügbarkeit:</strong>
                <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                  {selectedTrainee.registration.schedule}
                </p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Hardware:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.communication}</p>
              </div>

              <div>
                <strong style={{ color: "var(--text-color)" }}>Kommunikation (Discord):</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{getDiscordStatus(selectedTrainee.registration.other) || "—"}</p>
              </div>

              {selectedTrainee.registration.personal && (
                <div>
                  <strong style={{ color: "var(--text-color)" }}>Persönliche Infos:</strong>
                  <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                    {selectedTrainee.registration.personal}
                  </p>
                </div>
              )}

              {selectedTrainee.registration.other && (
                <div>
                  <strong style={{ color: "var(--text-color)" }}>Sonstiges:</strong>
                  <p style={{ margin: "0.25rem 0 0 0", whiteSpace: "pre-wrap" }}>
                    {selectedTrainee.registration.other}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--text-color)" }}>Keine Anmeldungsdaten vorhanden.</p>
          )}

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={closeModal} className="button">
              Schließen
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
