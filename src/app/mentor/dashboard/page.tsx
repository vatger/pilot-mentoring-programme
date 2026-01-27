"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

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

interface TraineeInfo {
  id: string;
  cid: string;
  name: string;
  email: string | null;
  role: string;
  registration?: RegistrationData | null;
}

interface Mentor {
  id: string;
  name: string | null;
  cid: string | null;
}

interface Training {
  id: string;
  traineeId: string;
  trainee: TraineeInfo;
  status: string;
  createdAt: string;
  mentors: Array<{
    mentorId: string;
    mentor: Mentor;
  }>;
}

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingTrainees, setPendingTrainees] = useState<TraineeInfo[]>([]);
  const [currentTrainings, setCurrentTrainings] = useState<Training[]>([]);
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [addingMentor, setAddingMentor] = useState<string | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeInfo | null>(null);
  const [showModal, setShowModal] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }
    fetchData();
  }, [status, isMentor, router]);

  const fetchData = async () => {
    try {
      // Fetch pending trainees
      const traineesRes = await fetch("/api/mentor/pending-trainees");
      if (!traineesRes.ok) throw new Error("Failed to fetch trainees");
      const traineesData = await traineesRes.json();
      setPendingTrainees(traineesData);

      // Fetch current trainings for this mentor
      const trainingsRes = await fetch("/api/mentor/my-trainings");
      if (!trainingsRes.ok) throw new Error("Failed to fetch trainings");
      const trainingsData = await trainingsRes.json();
      setCurrentTrainings(trainingsData);

      // Fetch all available mentors (users with MENTOR, PMP_LEITUNG, or ADMIN role)
      const mentorsRes = await fetch("/api/admin/users");
      if (mentorsRes.ok) {
        const usersData = await mentorsRes.json();
        const mentors = usersData
          .filter((u: any) => ["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(u.role))
          .map((u: any) => ({ id: u.id, name: u.name, cid: u.cid }))
          .sort((a: Mentor, b: Mentor) => (a.name || "").localeCompare(b.name || ""));
        setAvailableMentors(mentors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const assignTrainee = async (traineeId: string) => {
    setAssigning(traineeId);
    try {
      const res = await fetch("/api/training/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeId }),
      });
      if (!res.ok) throw new Error("Fehler beim Zuweisen des Trainees");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAssigning(null);
    }
  };

  const [cancelDialogFor, setCancelDialogFor] = useState<string | null>(null);

  const handleDropTraining = async (trainingId: string) => {
    try {
      const res = await fetch("/api/training/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId }),
      });
      if (!res.ok) throw new Error("Fehler beim Löschen des Trainings");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCancelDialogFor(null);
    }
  };

  const handleRemoveSelfAsMentor = async (trainingId: string) => {
    try {
      const res = await fetch("/api/training/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId, mentorId: (session?.user as any)?.id }),
      });
      if (!res.ok) throw new Error("Fehler beim Entfernen als Mentor");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCancelDialogFor(null);
    }
  };

  const addCoMentor = async (trainingId: string, newMentorId: string) => {
    if (!newMentorId) return;
    
    setAddingMentor(trainingId);
    try {
      const res = await fetch("/api/training/add-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId, newMentorId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Hinzufügen des Co-Mentors");
      }
      await fetchData();
      alert("Co-Mentor erfolgreich hinzugefügt!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAddingMentor(null);
    }
  };

  const logSession = (trainingId: string) => {
    router.push(`/mentor/session?trainingId=${trainingId}`);
  };

  const openTraineeDetails = (trainee: TraineeInfo) => {
    setSelectedTrainee(trainee);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTrainee(null);
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Lädt...</div>
      </PageLayout>
    );
  }

  if (!isMentor) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Zugriff verweigert. Nur Mentoren können diese Seite ansehen.
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout>
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h1>Mentoren Dashboard</h1>
          <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
            Verwalte deine Trainings und Trainees
          </p>
        </div>

        {error && (
          <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="card"><p style={{ margin: 0 }}>Lädt...</p></div>
        ) : !isMentor ? (
          <div className="info-danger">
            <p>Zugriff verweigert. Nur Mentoren können diese Seite ansehen.</p>
          </div>
        ) : (
          <>
            {/* Current Trainings */}
            <section style={{ marginBottom: "2.5rem" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.3em", fontWeight: 600 }}>
                Meine aktuellen Trainees
              </h2>
              {currentTrainings.length === 0 ? (
                <div className="card">
                  <p style={{ margin: 0 }}>Noch keine aktiven Trainees.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {currentTrainings.map((training) => (
                    <div key={training.id} className="card">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.5rem", alignItems: "start" }}>
                        <div>
                          <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.15em" }}>
                            {training.trainee.name}
                          </h3>
                          <div style={{ display: "grid", gap: "4px", fontSize: "0.95em" }}>
                            <div>
                              <span style={{ color: "var(--text-color)" }}>CID:</span>{" "}
                              <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
                                {training.trainee.cid}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: "var(--text-color)" }}>Rolle:</span> {training.trainee.role}
                            </div>
                            <div>
                              <span style={{ color: "var(--text-color)" }}>Co-Mentoren:</span>{" "}
                              {training.mentors.length} / 3
                            </div>
                            {training.mentors.length > 0 && (
                              <div style={{ fontSize: "0.85em", marginTop: "4px", paddingLeft: "8px" }}>
                                {training.mentors.map((tm) => (
                                  <div key={tm.mentorId} style={{ color: "var(--text-color)" }}>
                                    • {tm.mentor.name} ({tm.mentor.cid})
                                  </div>
                                ))}
                              </div>
                            )}
                            {training.mentors.length < 3 && availableMentors.length > 0 && (
                              <div style={{ marginTop: "8px" }}>
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      addCoMentor(training.id, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  disabled={addingMentor === training.id}
                                  className="form-select"
                                  style={{ fontSize: "0.85em", padding: "6px 8px", maxWidth: "250px" }}
                                >
                                  <option value="">+ Co-Mentor hinzufügen</option>
                                  {availableMentors
                                    .filter((m) => !training.mentors.some((tm) => tm.mentorId === m.id))
                                    .map((mentor) => (
                                      <option key={mentor.id} value={mentor.id}>
                                        {mentor.name} ({mentor.cid})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexDirection: "column",
                            minWidth: "180px",
                          }}
                        >
                          <button
                            onClick={() => logSession(training.id)}
                            className="button"
                            style={{ margin: 0 }}
                          >
                            Log Session
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/mentor/trainee/${training.trainee.id}?trainingId=${training.id}`
                              )
                            }
                            className="button"
                            style={{ margin: 0 }}
                          >
                            Fortschritt ansehen
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTraineeDetails(training.trainee);
                            }}
                            className="button"
                            style={{ margin: 0 }}
                          >
                            Details ansehen
                          </button>
                          <button
                            onClick={() => setCancelDialogFor(training.id)}
                            className="button button--danger"
                            style={{ margin: 0 }}
                          >
                            Abbrechen
                          </button>
                          {cancelDialogFor === training.id && (
                            <div className="card" style={{ margin: 0, padding: "10px 12px", background: "var(--container-bg)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ fontWeight: 600, color: "var(--text-color)" }}>Training verwalten</div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                  <button className="button button--danger" onClick={() => handleDropTraining(training.id)}>
                                    Training Abbrechen (löscht alle Daten)
                                  </button>
                                  <button className="button" onClick={() => handleRemoveSelfAsMentor(training.id)}>
                                    Entferne mich als Mentor
                                  </button>
                                  <button className="button" onClick={() => setCancelDialogFor(null)}>
                                    Abbrechen
                                  </button>
                                </div>
                                <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>
                                  Hinweis: Wenn kein Mentor übrig bleibt, bleibt das Training erhalten und der Trainee wird wieder auf PENDING_TRAINEE gesetzt.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pending Trainees */}
            <section>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.3em", fontWeight: 600 }}>
                Nicht zugewiesene Trainees
              </h2>
              {pendingTrainees.length === 0 ? (
                <div className="card">
                  <p style={{ margin: 0 }}>Keine nicht zugewiesenen Trainees verfügbar.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {pendingTrainees.map((trainee) => (
                    <div 
                      key={trainee.id} 
                      className="card"
                      style={{ cursor: "pointer" }}
                      onClick={() => openTraineeDetails(trainee)}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "1.5rem",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.15em" }}>
                            {trainee.name}
                          </h3>
                          <div style={{ display: "grid", gap: "4px", fontSize: "0.95em" }}>
                            <div>
                              <span style={{ color: "var(--text-color)" }}>CID:</span>{" "}
                              <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
                                {trainee.cid}
                              </span>
                            </div>
                            {trainee.registration && (
                              <div>
                                <span style={{ color: "var(--text-color)" }}>SIM/ACFT:</span>{" "}
                                {trainee.registration.simulator} / {trainee.registration.aircraft}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            assignTrainee(trainee.id);
                          }}
                          disabled={assigning === trainee.id}
                          className="button"
                          style={{ margin: 0, minWidth: "140px" }}
                        >
                          {assigning === trainee.id ? "Zuweisen…" : "Mir zuweisen"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </PageLayout>

      {/* Registration Details Modal - Outside PageLayout */}
      {showModal && selectedTrainee && selectedTrainee.registration && (
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
                <strong style={{ color: "var(--text-color)" }}>Kommunikation:</strong>
                <p style={{ margin: "0.25rem 0 0 0" }}>{selectedTrainee.registration.communication}</p>
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

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              {selectedTrainee.role === "PENDING_TRAINEE" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeModal();
                    assignTrainee(selectedTrainee.id);
                  }}
                  className="button"
                  disabled={assigning === selectedTrainee.id}
                >
                  {assigning === selectedTrainee.id ? "Zuweisen…" : "Mir zuweisen"}
                </button>
              )}
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
