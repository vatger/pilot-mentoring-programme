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
  const [deletingRequest, setDeletingRequest] = useState<string | null>(null);
  const [addingMentor, setAddingMentor] = useState<string | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeInfo | null>(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelDialogFor, setCancelDialogFor] = useState<string | null>(null);
  const [showCancellationReasonModal, setShowCancellationReasonModal] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showDirectAddModal, setShowDirectAddModal] = useState(false);
  const [directTraineeCid, setDirectTraineeCid] = useState("");
  const [directAnmeldetext, setDirectAnmeldetext] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [editableAnmeldetext, setEditableAnmeldetext] = useState("");
  const [savingAnmeldetext, setSavingAnmeldetext] = useState(false);
  const [anmeldetextError, setAnmeldetextError] = useState("");
  const [editingAnmeldetext, setEditingAnmeldetext] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";
  const canDeleteRequests = userRole === "PMP_LEITUNG" || userRole === "ADMIN";

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

  const handleCancelTraining = async (trainingId: string) => {
    if (!cancellationReason.trim()) {
      setError("Bitte geben Sie einen Grund für den Abbruch an");
      return;
    }

    setCancelSubmitting(true);
    try {
      const res = await fetch("/api/training/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId, cancellationReason: cancellationReason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Abbrechen des Trainings");
      }
      setCancellationReason("");
      setShowCancellationReasonModal(null);
      setCancelDialogFor(null);
      await fetchData();
      alert("Training erfolgreich zur Genehmigung eingereicht!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCancelSubmitting(false);
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

  const deletePendingRequest = async (traineeId: string) => {
    if (!confirm("Möchten Sie diese Anfrage wirklich löschen?")) return;

    setDeletingRequest(traineeId);
    try {
      const res = await fetch("/api/mentor/pending-trainees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Löschen der Anfrage");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDeletingRequest(null);
    }
  };

  const logSession = (trainingId: string) => {
    router.push(`/mentor/session?trainingId=${trainingId}`);
  };

  const extractMentorLinkText = (registration?: RegistrationData | null) => {
    const marker = "Anmeldetext (Mentor-Link):";
    const other = registration?.other || "";
    const index = other.indexOf(marker);
    if (index === -1) return "";
    return other.slice(index + marker.length).trim();
  };

  const openTraineeDetails = (trainee: TraineeInfo, trainingId?: string) => {
    const mentorLinkText = extractMentorLinkText(trainee.registration);
    setSelectedTrainee(trainee);
    setSelectedTrainingId(trainingId || null);
    setEditableAnmeldetext(mentorLinkText || trainee.registration?.experience || "");
    setAnmeldetextError("");
    setEditingAnmeldetext(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTrainee(null);
    setSelectedTrainingId(null);
    setEditableAnmeldetext("");
    setAnmeldetextError("");
    setEditingAnmeldetext(false);
  };

  const saveAnmeldetext = async () => {
    if (!selectedTrainingId) return;

    const value = editableAnmeldetext.trim();
    if (!value) {
      setAnmeldetextError("Bitte einen Anmeldetext eingeben");
      return;
    }

    setSavingAnmeldetext(true);
    setAnmeldetextError("");
    try {
      const res = await fetch(`/api/training/${selectedTrainingId}/anmeldetext`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anmeldetext: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Speichern des Anmeldetextes");
      }

      await fetchData();
      setSelectedTrainee((prev) =>
        prev?.registration
          ? {
              ...prev,
              registration: {
                ...prev.registration,
                experience: value,
                other: `Anmeldetext (Mentor-Link):\n${value}`,
              },
            }
          : prev
      );
      setEditingAnmeldetext(false);
    } catch (err) {
      setAnmeldetextError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSavingAnmeldetext(false);
    }
  };

  const createDirectInvite = async () => {
    const traineeCid = directTraineeCid.trim();
    const anmeldetext = directAnmeldetext.trim();

    if (!/^\d+$/.test(traineeCid)) {
      setInviteError("Bitte eine gültige numerische CID eingeben");
      return;
    }

    if (!anmeldetext) {
      setInviteError("Bitte einen Anmeldetext eingeben");
      return;
    }

    setInviteError("");
    setCreatingInvite(true);
    setInviteLink("");

    try {
      const res = await fetch("/api/training/direct-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeCid, anmeldetext }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Erstellen des Einladungslinks");
      }

      setInviteLink(data.inviteUrl || "");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreatingInvite(false);
    }
  };

  const closeDirectAddModal = () => {
    setShowDirectAddModal(false);
    setDirectTraineeCid("");
    setDirectAnmeldetext("");
    setInviteLink("");
    setInviteError("");
  };

  const getDiscordStatus = (other?: string | null) => {
    if (!other) return null;
    const line = other.split("\n").find((entry) => entry.startsWith("VATSIM Germany Discord:"));
    return line ? line.replace("VATSIM Germany Discord:", "").trim() : null;
  };

  const selectedTraining = selectedTrainingId
    ? currentTrainings.find((training) => training.id === selectedTrainingId) || null
    : null;
  const canEditSelectedAnmeldetext =
    !!selectedTraining &&
    (selectedTraining.mentors.some((entry) => entry.mentorId === (session?.user as any)?.id) ||
      userRole === "PMP_LEITUNG" ||
      userRole === "ADMIN");
  const selectedMentorLinkText = extractMentorLinkText(selectedTrainee?.registration);
  const hasSelectedMentorLinkText = Boolean(selectedMentorLinkText);

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
          <div style={{ marginTop: "1rem" }}>
            <button
              className="button"
              onClick={() => {
                setInviteError("");
                setInviteLink("");
                setShowDirectAddModal(true);
              }}
              style={{ margin: 0 }}
            >
              Mir einen Trainee hinzufügen
            </button>
          </div>
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
                            onClick={() => setShowCancellationReasonModal(training.id)}
                            className="button button--danger"
                            style={{ margin: 0 }}
                          >
                            Training Abbrechen
                          </button>
                          <button
                            onClick={() => setCancelDialogFor(training.id)}
                            className="button"
                            style={{ margin: 0 }}
                          >
                            Weitere Optionen
                          </button>
                          {cancelDialogFor === training.id && (
                            <div className="card" style={{ margin: 0, padding: "10px 12px", background: "var(--container-bg)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ fontWeight: 600, color: "var(--text-color)" }}>Weitere Optionen</div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                  <button
                                    className="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTraineeDetails(training.trainee, training.id);
                                    }}
                                  >
                                    Anmeldung ansehen
                                  </button>
                                  <button className="button" onClick={() => handleRemoveSelfAsMentor(training.id)}>
                                    Entferne mich als Mentor
                                  </button>
                                  <button className="button" onClick={() => setCancelDialogFor(null)}>
                                    Schließen
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
                        <div style={{ display: "flex", gap: "8px", flexDirection: "column", alignItems: "flex-end" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTraineeDetails(trainee);
                            }}
                            className="button"
                            style={{ margin: 0, minWidth: "140px" }}
                          >
                            Details
                          </button>
                          {canDeleteRequests && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePendingRequest(trainee.id);
                              }}
                              disabled={deletingRequest === trainee.id}
                              className="button button--danger"
                              style={{ margin: 0, minWidth: "140px" }}
                            >
                              {deletingRequest === trainee.id ? "Löscht…" : "Anfrage Löschen"}
                            </button>
                          )}
                        </div>
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
      {showDirectAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: "24px",
          }}
          onClick={closeDirectAddModal}
        >
          <div
            className="card"
            style={{
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              overflowX: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Mir einen Trainee hinzufügen</h2>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              <label className="form-label">
                Trainee CID
                <input
                  className="form-input"
                  value={directTraineeCid}
                  onChange={(e) => setDirectTraineeCid(e.target.value)}
                  placeholder="z.B. 1234567"
                />
              </label>

              <label className="form-label">
                Anmeldetext
                <textarea
                  className="form-textarea"
                  value={directAnmeldetext}
                  onChange={(e) => setDirectAnmeldetext(e.target.value)}
                  placeholder="Freitext zur Anmeldung"
                  style={{ minHeight: "140px" }}
                />
              </label>
            </div>

            {inviteError && (
              <div className="info-danger" style={{ marginTop: "1rem" }}>
                <p>{inviteError}</p>
              </div>
            )}

            {inviteLink && (
              <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
                <strong style={{ color: "var(--text-color)" }}>Einladungslink</strong>
                <textarea
                  className="form-textarea"
                  value={inviteLink}
                  readOnly
                  style={{ minHeight: "100px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteLink);
                        alert("Link in Zwischenablage kopiert");
                      } catch {
                        alert("Kopieren fehlgeschlagen");
                      }
                    }}
                    style={{ margin: 0 }}
                  >
                    Link kopieren
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button className="button" onClick={closeDirectAddModal} disabled={creatingInvite}>
                Schließen
              </button>
              <button className="button" onClick={createDirectInvite} disabled={creatingInvite}>
                {creatingInvite ? "Erstellt…" : "Link erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Details Modal - Outside PageLayout */}
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
                {canEditSelectedAnmeldetext && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                      <strong style={{ color: "var(--text-color)" }}>Anmeldetext:</strong>
                      {canEditSelectedAnmeldetext && !editingAnmeldetext && (
                        <button className="button" onClick={() => setEditingAnmeldetext(true)}>
                          Anmeldetext bearbeiten
                        </button>
                      )}
                    </div>
                    {editingAnmeldetext ? (
                      <>
                        <textarea
                          className="form-textarea"
                          value={editableAnmeldetext}
                          onChange={(e) => setEditableAnmeldetext(e.target.value)}
                          style={{ marginTop: "0.4rem", minHeight: "120px" }}
                        />
                        <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem" }}>
                          <button className="button" onClick={saveAnmeldetext} disabled={savingAnmeldetext}>
                            {savingAnmeldetext ? "Speichert…" : "Anmeldetext speichern"}
                          </button>
                          <button
                            className="button"
                            onClick={() => {
                              setEditingAnmeldetext(false);
                              setEditableAnmeldetext(selectedMentorLinkText || selectedTrainee.registration?.experience || "");
                              setAnmeldetextError("");
                            }}
                            disabled={savingAnmeldetext}
                          >
                            Abbrechen
                          </button>
                        </div>
                      </>
                    ) : (
                      <p style={{ margin: "0.4rem 0 0 0", whiteSpace: "pre-wrap" }}>
                        {selectedMentorLinkText || selectedTrainee.registration.experience || "—"}
                      </p>
                    )}
                    {anmeldetextError && (
                      <p style={{ margin: "0.5rem 0 0 0", color: "var(--error-color)" }}>
                        {anmeldetextError}
                      </p>
                    )}
                  </div>
                )}

                {!hasSelectedMentorLinkText && (
                <>
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
                  <p style={{ margin: "0.25rem 0 0 0"}}>{selectedTrainee.registration.schedule}
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
                </>
                )}
              </div>
            ) : (
              <p style={{ color: "var(--text-color)" }}>Keine Anmeldungsdaten vorhanden.</p>
            )}

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
              {selectedTrainee.role === "PENDING_TRAINEE" && canDeleteRequests && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeModal();
                    deletePendingRequest(selectedTrainee.id);
                  }}
                  className="button button--danger"
                  disabled={deletingRequest === selectedTrainee.id}
                >
                  {deletingRequest === selectedTrainee.id ? "Löscht…" : "Anfrage Löschen"}
                </button>
              )}
              <button onClick={closeModal} className="button">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancellationReasonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "24px",
          }}
          onClick={() => {
            setShowCancellationReasonModal(null);
            setCancellationReason("");
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "500px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Training Abbrechen</h2>
            <p style={{ marginBottom: "1rem", color: "var(--text-color)" }}>
              Bitte geben einen Grund für den Abbruch des Trainings an. Die Leitung wird die Anfrage überprüfen und kann dann entweder:
            </p>
            <ul style={{ marginBottom: "1rem", color: "var(--text-color)" }}>
              <li>Den Traineeeintrag komplett löschen</li>
              <li>Den Traineeeintrag als wartenden Trainee wieder freigeben</li>
            </ul>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ marginBottom: "0.5rem" }}>
                Grund für Abbruch:
              </label>
              <textarea
                className="form-textarea"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="z.B. Keine Zeit für Training, Trainingsziele erreicht, Trainee nicht erreichbar, etc."
                style={{ minHeight: "120px", width: "100%", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: "#ffcccc", color: "#cc0000", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCancellationReasonModal(null);
                  setCancellationReason("");
                  setError("");
                }}
                className="button"
                disabled={cancelSubmitting}
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleCancelTraining(showCancellationReasonModal)}
                className="button button--danger"
                disabled={cancelSubmitting || !cancellationReason.trim()}
              >
                {cancelSubmitting ? "Wird eingereicht..." : "Training Abbrechen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
