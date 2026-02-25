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
  checkrideRequestText?: string | null;
  checkrideRequestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  trainee: {
    id: string;
    cid: string | null;
    name: string | null;
    registration?: {
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
    } | null;
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
  scheduledDate: string;
  result: string;
  isDraft: boolean;
  availability: {
    examiner?: {
      name: string | null;
      cid: string | null;
    };
  };
  assessment?: {
    id: string;
    overallResult: string | null;
  } | null;
};

type Assessment = Record<string, any> & {
  overallResult?: string;
  examinernotes?: string;
};

type CheckrideLog = {
  id: string;
  scheduledDate: string;
  result: string;
  isDraft: boolean;
  availability: {
    examiner?: {
      name: string | null;
      cid: string | null;
    };
  };
  assessment?: Assessment | null;
};

type Slot = {
  id: string;
  startTime: string;
  status: string;
  examiner?: {
    name: string | null;
    cid: string | null;
  };
};

const CHECKRIDE_SECTIONS: { key: string; title: string; fields: { key: string; label: string }[] }[] = [
  {
    key: "flightplan",
    title: "1 - Flugplan",
    fields: [
      { key: "flightplanCallsign", label: "Callsign / AC Type" },
      { key: "flightplanAircraft", label: "Equipment" },
      { key: "flightplanRouting", label: "Routing" },
      { key: "flightplanTimes", label: "Zeiten" },
      { key: "flightplanRemarks", label: "Remarks" },
    ],
  },
  {
    key: "charts",
    title: "2 - Charts",
    fields: [
      { key: "chartsParkingDep", label: "Parking DEP" },
      { key: "chartsTaxiDep", label: "Taxi DEP" },
      { key: "chartsDeparture", label: "Departure" },
      { key: "chartsEnroute", label: "Enroute" },
      { key: "chartsArrivalTransition", label: "Arrival / Transition" },
      { key: "chartsApproach", label: "Approach (alle RWYs)" },
      { key: "chartsTaxiDest", label: "Taxi DEST" },
      { key: "chartsParkingDest", label: "Parking DEST" },
    ],
  },
  {
    key: "briefing",
    title: "3 - Self Briefing",
    fields: [
      { key: "briefingFrequencies", label: "Frequenzen" },
      { key: "briefingPushback", label: "Pushback" },
      { key: "briefingTaxiRunway", label: "Taxi to Runway" },
      { key: "briefingATCTakeoff", label: "ATC after Takeoff" },
      { key: "briefingDeparture", label: "Departure / Restrictions" },
      { key: "briefingArrival", label: "Arrival / Transition" },
      { key: "briefingApproach", label: "Approach" },
      { key: "briefingRunwayExits", label: "Runway Exits" },
      { key: "briefingTaxiParking", label: "Taxi to Parking" },
    ],
  },
  {
    key: "clearance",
    title: "4 - Enroute Clearance",
    fields: [
      { key: "clearanceInitialCall", label: "Initial Call" },
      { key: "clearanceRequest", label: "Clearance Request" },
      { key: "clearanceClearedTo", label: "Cleared to" },
      { key: "clearanceDeparture", label: "Departure" },
      { key: "clearanceRoute", label: "Flight Planned Route" },
      { key: "clearanceClimb", label: "Climb / Climb via SID" },
      { key: "clearanceSquawk", label: "Squawk" },
      { key: "clearanceCallsign", label: "Callsign" },
    ],
  },
  {
    key: "startup",
    title: "5 - Startup / Pushback",
    fields: [
      { key: "startupStation", label: "Station / CS" },
      { key: "startupGate", label: "Gate / Request" },
      { key: "startupReadback", label: "Readback / CS" },
      { key: "startupExecution", label: "Ausfuehrung" },
    ],
  },
  {
    key: "taxi",
    title: "6 - Taxi to Runway",
    fields: [
      { key: "taxiStation", label: "Station / CS" },
      { key: "taxiRequest", label: "Request" },
      { key: "taxiReadback", label: "Readback / CS" },
      { key: "taxiExecution", label: "Ausfuehrung" },
    ],
  },
  {
    key: "takeoff",
    title: "7 - Takeoff",
    fields: [
      { key: "takeoffStation", label: "Station / CS" },
      { key: "takeoffReadback", label: "Readback / CS" },
      { key: "takeoffExecution", label: "Ausfuehrung" },
    ],
  },
  {
    key: "departure",
    title: "8 - Departure",
    fields: [
      { key: "departureStatement", label: "Meldung" },
      { key: "departureStation", label: "Station / CS / Altitude" },
      { key: "departureReadback", label: "Readback / CS" },
      { key: "departureExecution", label: "Ausfuehrung" },
    ],
  },
  {
    key: "enroute",
    title: "9 - Enroute",
    fields: [
      { key: "enrouteStation", label: "Station / CS / FL" },
      { key: "enrouteReadbacks", label: "Readbacks" },
      { key: "enrouteExecution", label: "Ausfuehrung" },
    ],
  },
  {
    key: "arrival",
    title: "10 - Arrival / Transition",
    fields: [
      { key: "arrivalStation", label: "Station / CS / FL" },
      { key: "arrivalClearances", label: "Freigaben / Anweisungen" },
      { key: "arrivalExecution", label: "Ausfuehrung" },
    ],
  },
  {
    key: "landing",
    title: "11 - Landung",
    fields: [
      { key: "landingStation", label: "Station / CS / APP" },
      { key: "landingClearance", label: "Landing Clearance" },
      { key: "landingExecution", label: "Ausfuehrung" },
    ],
  },
  {
    key: "parking",
    title: "12 - Taxi to Parking",
    fields: [
      { key: "parkingStation", label: "Station / CS / TWY" },
      { key: "parkingReadback", label: "Readback" },
      { key: "parkingExecution", label: "Ausfuehrung" },
    ],
  },
];

export default function TraineeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");

  const [training, setTraining] = useState<Training | null>(null);
  const [checkride, setCheckride] = useState<Checkride | null>(null);
  const [checkrideLogs, setCheckrideLogs] = useState<CheckrideLog[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingSlot, setBookingSlot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingCheckride, setUpdatingCheckride] = useState(false);
  const [checkrideRequestText, setCheckrideRequestText] = useState("");
  const [showCheckrideRequestInput, setShowCheckrideRequestInput] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [editableAnmeldetext, setEditableAnmeldetext] = useState("");
  const [savingAnmeldetext, setSavingAnmeldetext] = useState(false);
  const [anmeldetextError, setAnmeldetextError] = useState("");

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN";

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
      setCheckrideRequestText(data.checkrideRequestText || "");
      setShowCheckrideRequestInput(Boolean(data.readyForCheckride));
      setEditableAnmeldetext(data.trainee?.registration?.experience || "");
      setAnmeldetextError("");

      // Fetch checkride if exists
      const checkrideRes = await fetch(`/api/checkrides?trainingId=${trainingId}`);
      if (checkrideRes.ok) {
        const checkrideData = await checkrideRes.json();
        const logs = checkrideData.checkrides || [];
        const activeCheckride = logs.find((entry: CheckrideLog) => entry.result === "INCOMPLETE") || null;
        setCheckride(activeCheckride);
        setCheckrideLogs(logs);
      } else {
        setCheckride(null);
        setCheckrideLogs([]);
      }

      const examinerRes = await fetch("/api/checkrides/examiner", { cache: "no-store" });
      if (examinerRes.ok) {
        const examinerData = await examinerRes.json();
        const freeSlots = (examinerData.slots || []).filter((slot: Slot) => slot.status === "AVAILABLE");
        setAvailableSlots(freeSlots);
      } else {
        setAvailableSlots([]);
      }

      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateReadyForCheckride = async (nextReady: boolean) => {
    if (!training || updatingCheckride) return;
    const requestText = checkrideRequestText.trim();

    if (nextReady && requestText.length === 0) {
      setError("Bitte trage die regulären Verfügbarkeiten für den Checkride ein.");
      return;
    }

    setUpdatingCheckride(true);
    try {
      const res = await fetch(`/api/trainings/${training.id}/ready`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readyForCheckride: nextReady,
          checkrideRequestText: requestText,
        }),
      });
      if (!res.ok) throw new Error("Failed to update checkride status");
      if (!nextReady) {
        setShowCheckrideRequestInput(false);
      }
      await fetchTrainingDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingCheckride(false);
    }
  };

  const toggleReadyForCheckride = async () => {
    if (!training || updatingCheckride) return;
    const nextReady = !training.readyForCheckride;

    if (nextReady && checkrideRequestText.trim().length === 0) {
      setShowCheckrideRequestInput(true);
      setError("");
      return;
    }

    await updateReadyForCheckride(nextReady);
  };

  const submitReadyForCheckride = async () => {
    await updateReadyForCheckride(true);
  };

  const confirmCheckrideSlot = async () => {
    if (!training || !selectedSlot || bookingSlot) return;
    setBookingSlot(true);
    setError("");
    try {
      const res = await fetch("/api/checkrides/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: training.id,
          availabilityId: selectedSlot,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to book slot");
      }
      setSelectedSlot("");
      await fetchTrainingDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBookingSlot(false);
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

  const saveAnmeldetext = async () => {
    if (!training || savingAnmeldetext) return;

    const value = editableAnmeldetext.trim();
    if (!value) {
      setAnmeldetextError("Bitte einen Anmeldetext eingeben");
      return;
    }

    setSavingAnmeldetext(true);
    setAnmeldetextError("");
    try {
      const res = await fetch(`/api/training/${training.id}/anmeldetext`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anmeldetext: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Speichern des Anmeldetextes");
      }

      setTraining((prev) =>
        prev
          ? {
              ...prev,
              trainee: {
                ...prev.trainee,
                registration: prev.trainee.registration
                  ? {
                      ...prev.trainee.registration,
                      experience: value,
                      other: `Anmeldetext (Mentor-Link):\n${value}`,
                    }
                  : prev.trainee.registration,
              },
            }
          : prev
      );
    } catch (err: any) {
      setAnmeldetextError(err.message || "Unknown error");
    } finally {
      setSavingAnmeldetext(false);
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
              <strong>Bereit für den Check Ride</strong>
            </label>
          </p>
          {(training.readyForCheckride || showCheckrideRequestInput) && (
            <div style={{ marginTop: "1rem" }}>
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                Normale Verfügbarkeiten (für Checkride-Mentoren)
              </label>
              <textarea
                value={checkrideRequestText}
                onChange={(e) => setCheckrideRequestText(e.target.value)}
                rows={4}
                className="form-input"
                placeholder="z.B. meistens Mo/Mi/Fr ab 19:30z, Wochenende nach Absprache"
                style={{ width: "100%", resize: "vertical" }}
              />
              <p style={{ marginTop: "0.5rem", marginBottom: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Dieser Text wird den Prüfern angezeigt um passende Termine bereitstellen zu können.
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="button"
                  onClick={training.readyForCheckride ? () => updateReadyForCheckride(true) : submitReadyForCheckride}
                  disabled={updatingCheckride || checkrideRequestText.trim().length === 0}
                >
                  {updatingCheckride
                    ? "Speichern..."
                    : training.readyForCheckride
                    ? "Request-Text speichern"
                    : "Bereit markieren"}
                </button>
              </div>
            </div>
          )}

          {training.trainee.registration?.category === "Direkte Mentor-Anmeldung" && (
            <div style={{ marginTop: "1rem" }}>
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                Anmeldetext (Direkteinladung)
              </label>
              <textarea
                className="form-textarea"
                value={editableAnmeldetext}
                onChange={(e) => setEditableAnmeldetext(e.target.value)}
                style={{ width: "100%", minHeight: "120px", resize: "vertical" }}
              />
              {anmeldetextError && (
                <p style={{ margin: "0.5rem 0 0 0", color: "var(--error-color)" }}>{anmeldetextError}</p>
              )}
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="button"
                  onClick={saveAnmeldetext}
                  disabled={savingAnmeldetext}
                >
                  {savingAnmeldetext ? "Speichert..." : "Anmeldetext speichern"}
                </button>
              </div>
            </div>
          )}
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
            <h3>Check Ride</h3>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className="status-pill"
                style={{
                  backgroundColor:
                    checkride.result === "PASSED"
                      ? "var(--success-color)"
                      : checkride.result === "FAILED"
                      ? "var(--error-color)"
                      : "var(--warning-color)",
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                {checkride.result}
              </span>
            </p>
            <p>
              <strong>Geplant:</strong>{" "}
              {new Date(checkride.scheduledDate).toLocaleString()}
            </p>
            <p>
              <strong>Prüfer:</strong> {checkride.availability.examiner?.name || "Unbekannt"} (CID:{" "}
              {checkride.availability.examiner?.cid || "N/A"})
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

        {checkrideLogs.length > 0 && (
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3>Checkride Logs</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {checkrideLogs.map((log) => {
                const assessment = log.assessment || {};
                const showDetails = !log.isDraft && !!log.assessment;
                return (
                  <div
                    key={log.id}
                    style={{
                      border: "1px solid var(--footer-border)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      backgroundColor: "var(--container-bg)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>
                      {new Date(log.scheduledDate).toLocaleString()} – {log.result}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                      Prüfer: {log.availability.examiner?.name || "Unbekannt"} ({log.availability.examiner?.cid || "N/A"})
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                      Assessment: {log.isDraft ? "Entwurf" : (log.assessment?.overallResult || log.result)}
                    </div>
                    {showDetails && (
                      <details style={{ marginTop: "0.75rem" }}>
                        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                          Vollstaendiges Log anzeigen
                        </summary>
                        <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}>
                          {CHECKRIDE_SECTIONS.map((section) => (
                            <div
                              key={section.key}
                              style={{
                                border: "1px solid var(--footer-border)",
                                borderRadius: "8px",
                                padding: "0.75rem",
                                backgroundColor: "var(--card-bg)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                                <strong>{section.title}</strong>
                                <span
                                  style={{
                                    fontSize: "0.85em",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    background: assessment[`${section.key}Passed`] ? "#e6f4ea" : "#fce8e6",
                                    color: assessment[`${section.key}Passed`] ? "#1e8e3e" : "#b3261e",
                                  }}
                                >
                                  {assessment[`${section.key}Passed`] ? "Bestanden" : "Nicht bestanden"}
                                </span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "0.5rem" }}>
                                {section.fields.map((field) => (
                                  <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>{field.label}</div>
                                    <div
                                      style={{
                                        fontSize: "0.9em",
                                        whiteSpace: "pre-wrap",
                                        backgroundColor: "var(--container-bg)",
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        minHeight: "38px",
                                      }}
                                    >
                                      {assessment?.[field.key] || "-"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {assessment.examinernotes && (
                            <div
                              style={{
                                border: "1px solid var(--footer-border)",
                                borderRadius: "8px",
                                padding: "0.75rem",
                                backgroundColor: "var(--container-bg)",
                              }}
                            >
                              <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Examiner Kommentar</div>
                              <div style={{ whiteSpace: "pre-wrap" }}>{assessment.examinernotes}</div>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {training.readyForCheckride && !checkride && (
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3>Checkride-Termin bestätigen</h3>
            <p style={{ marginTop: 0 }}>
              Der Mentor stimmt den Termin mit dem Trainee ab und bestätigt anschließend den passenden Prüfer-Slot.
            </p>
            {availableSlots.length === 0 ? (
              <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
                Aktuell sind keine verfügbaren Prüfer-Slots vorhanden.
              </p>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="form-select"
                  style={{ minWidth: "360px" }}
                >
                  <option value="">-- Slot auswählen --</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {new Date(slot.startTime).toLocaleString()} – {slot.examiner?.name || "Unbekannt"} ({slot.examiner?.cid || "N/A"})
                    </option>
                  ))}
                </select>
                <button
                  onClick={confirmCheckrideSlot}
                  disabled={!selectedSlot || bookingSlot}
                  className="button"
                >
                  {bookingSlot ? "Bestätigt..." : "Termin bestätigen"}
                </button>
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
