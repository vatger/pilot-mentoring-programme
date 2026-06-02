"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";
import {
  CHECKRIDE_RUBRIC,
  formatRubricRating,
  parseRubricNotes,
  RUBRIC_CODE_COLORS,
  RUBRIC_ROW_TINTS,
} from "@/lib/checkrideRubric";
import { trainingTopics } from "@/lib/trainingTopics";
import { getTrainingTypeLabel, isCoachingTraining } from "@/lib/trainingMode";

type Training = {
  id: string;
  status: string;
  trainingType: string;
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
    createdByMentorId?: string | null;
    createdByMentor?: {
      id: string;
      name: string | null;
      cid: string | null;
    } | null;
    topics: {
      topic: string;
      checked: boolean;
      theoryCovered?: boolean;
      practiceCovered?: boolean;
      coverageMode?: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingCheckride, setUpdatingCheckride] = useState(false);
  const [finishingWithoutCheckride, setFinishingWithoutCheckride] = useState(false);
  const [checkrideRequestText, setCheckrideRequestText] = useState("");
  const [showCheckrideRequestInput, setShowCheckrideRequestInput] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [editableAnmeldetext, setEditableAnmeldetext] = useState("");
  const [savingAnmeldetext, setSavingAnmeldetext] = useState(false);
  const [anmeldetextError, setAnmeldetextError] = useState("");
  const [expandedCheckrideIds, setExpandedCheckrideIds] = useState<Record<string, boolean>>({});

  const getTopicCoverage = () => {
    const coverageMap = new Map<string, { theorie: boolean; praxis: boolean }>();
    const sessions = training?.sessions ?? [];

    sessions
      .filter((session) => !session.isDraft)
      .forEach((session) => {
        session.topics.forEach((topic) => {
          if (!topic.checked) return;

          const current = coverageMap.get(topic.topic) || { theorie: false, praxis: false };
          current.theorie =
            current.theorie ||
            !!topic.theoryCovered ||
            (!topic.theoryCovered && !topic.practiceCovered && (topic.coverageMode || "THEORIE") === "THEORIE");
          current.praxis =
            current.praxis ||
            !!topic.practiceCovered ||
            (!topic.theoryCovered && !topic.practiceCovered && topic.coverageMode === "PRAXIS");
          coverageMap.set(topic.topic, current);
        });
      });

    return coverageMap;
  };

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN";
  const isLeadership = userRole === "PMP_LEITUNG" || userRole === "ADMIN";

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

  const finishWithoutCheckride = async () => {
    if (!training || finishingWithoutCheckride) return;
    if (!confirm("Training ohne Checkride abschliessen? Diese Aktion ist fuer den regulären Flow nicht rueckgaengig.")) {
      return;
    }

    setFinishingWithoutCheckride(true);
    setError("");
    try {
      const res = await fetch(`/api/trainings/${training.id}/finish-without-checkride`, {
        method: "POST",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Training konnte nicht abgeschlossen werden");
      }
      await fetchTrainingDetails();
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setFinishingWithoutCheckride(false);
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
  const coachingTraining = isCoachingTraining(training.trainingType);
  const topicCoverage = coachingTraining ? new Map() : getTopicCoverage();
  const progressPoints = coachingTraining
    ? 0
    : trainingTopics.reduce((points, topicDef) => {
        const coverage = topicCoverage.get(topicDef.key) || { theorie: false, praxis: false };

        if (topicDef.category === "THEORY") {
          return points + (coverage.theorie ? 1 : 0);
        }

        if (coverage.theorie) points += 0.5;
        if (coverage.praxis) points += 0.5;
        return points;
      }, 0);
  const formatPoints = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
  const progressPercent = coachingTraining ? 0 : Math.round((progressPoints / trainingTopics.length) * 100);
  const timelineEntries = [
    ...training.sessions.map((sess) => ({
      type: "session" as const,
      key: `session-${sess.id}`,
      date: sess.sessionDate,
      session: sess,
    })),
    ...checkrideLogs.map((log) => ({
      type: "checkride" as const,
      key: `checkride-${log.id}`,
      date: log.scheduledDate,
      log,
      released: !log.isDraft && !!log.assessment,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleCheckrideDetails = (id: string) => {
    setExpandedCheckrideIds((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

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
          <p style={{ marginTop: "0.5rem" }}>
            <strong>Trainingstyp:</strong>{" "}
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "999px",
                background: coachingTraining ? "rgba(76, 175, 80, 0.15)" : "rgba(77, 142, 219, 0.15)",
                color: coachingTraining ? "#4caf50" : "#4d8edb",
                fontWeight: 700,
              }}
            >
              {getTrainingTypeLabel(training.trainingType)}
            </span>
          </p>
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

        {!coachingTraining && (
          <>
            <div className="card" style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Gesamtfortschritt</h3>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "2.2em", fontWeight: 700, color: "var(--accent-color)" }}>
                    {progressPercent}%
                  </div>
                  <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>
                    {formatPoints(progressPoints)} / {trainingTopics.length} Themen
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

            <div className="card" style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Trainingsthemen</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
                {trainingTopics.map((topic) => {
                  const coverage = topicCoverage.get(topic.key) || {
                    theorie: false,
                    praxis: false,
                  };
                  const isCovered = coverage.theorie || coverage.praxis;

                  return (
                    <div
                      key={topic.key}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: `1.5px solid ${isCovered ? "var(--accent-color)" : "var(--footer-border)"}`,
                        backgroundColor: isCovered ? "rgba(0, 95, 163, 0.06)" : "transparent",
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
                          backgroundColor: isCovered ? "var(--accent-color)" : "var(--footer-border)",
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
                          flex: 1,
                        }}
                      >
                        {topic.label}
                      </span>
                      {coverage.theorie && (
                        <span
                          style={{
                            backgroundColor: "#005fa3",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.72em",
                            fontWeight: 600,
                          }}
                        >
                          Theorie
                        </span>
                      )}
                      {coverage.praxis && (
                        <span
                          style={{
                            backgroundColor: "#2e7d32",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.72em",
                            fontWeight: 600,
                          }}
                        >
                          Praxis
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {isLeadership && training.status !== "COMPLETED" && checkrideLogs.length === 0 && (
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3>Leitung/Admin Aktion</h3>
            <p style={{ marginTop: 0 }}>
              Falls ein Trainee ausserhalb des regulären Checkride-Prozesses abgeschlossen werden muss, kann hier manuell beendet werden.
            </p>
            <button
              type="button"
              className="button"
              onClick={finishWithoutCheckride}
              disabled={finishingWithoutCheckride}
              style={{
                backgroundColor: "#f59e0b",
                color: "#1a1200",
                border: "1px solid #7c4a03",
                fontWeight: 700,
              }}
            >
              {finishingWithoutCheckride ? "Schliesst ab..." : "Finish without checkride"}
            </button>
          </div>
        )}

        {/* Training Sessions */}
        <div className="card">
          <h3>Trainingssessions ({completedSessions} / {totalSessions} abgeschlossen)</h3>
          {timelineEntries.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Keine Sitzungen erfasst</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {timelineEntries.map((entry) => {
                if (entry.type === "session") {
                  const sess = entry.session;
                  const sessionTopicCount = coachingTraining ? 0 : sess.topics.filter((t) => t.checked).length;
                  const isOtherMentorSession = Boolean(sess.createdByMentorId && sess.createdByMentorId !== userId);
                  return (
                    <div
                      key={entry.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--footer-border)",
                        borderLeft: `4px solid ${
                          sess.isDraft
                            ? "var(--warning-color)"
                            : isOtherMentorSession
                            ? "#8b5cf6"
                            : "var(--success-color)"
                        }`,
                        backgroundColor: isOtherMentorSession ? "rgba(139, 92, 246, 0.05)" : "transparent",
                        opacity: sess.isDraft ? 0.7 : 1,
                        gap: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                        <span style={{ fontWeight: 600, minWidth: "100px" }}>
                          {new Date(sess.sessionDate).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                          {coachingTraining ? "Kommentar-Session" : `${sessionTopicCount} Themen`}
                        </span>
                        {sess.isDraft ? (
                          <span style={{ color: "var(--warning-color)", fontSize: "0.875rem" }}>
                            🔧 Entwurf
                          </span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ color: isOtherMentorSession ? "#8b5cf6" : "var(--success-color)", fontSize: "0.875rem" }}>
                              ✓ Freigegeben
                            </span>
                            {isOtherMentorSession && (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  color: "#5b21b6",
                                  backgroundColor: "rgba(139, 92, 246, 0.14)",
                                  borderRadius: "999px",
                                  padding: "2px 8px",
                                }}
                              >
                                anderer Mentor
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {sess.comments && (
                        <div style={{ margin: "-0.15rem 0 0.25rem 0", fontSize: "0.9rem", color: "var(--text-color)", fontStyle: "italic" }}>
                          {sess.comments}
                        </div>
                      )}
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
                            href={`/mentor/session?trainingId=${training.id}&sessionId=${sess.id}`}
                            className="button"
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          >
                            Bearbeiten
                          </Link>
                        )}
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
                  );
                }

                const log = entry.log;
                const assessment = log.assessment || {};
                const parsedNotes = parseRubricNotes(assessment.examinernotes);
                const isExpanded = Boolean(expandedCheckrideIds[log.id]);
                return (
                  <div
                    key={entry.key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "6px",
                      border: "1px solid var(--footer-border)",
                      borderLeft: `4px solid ${entry.released ? "var(--success-color)" : "var(--warning-color)"}`,
                      backgroundColor: "var(--container-bg)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                      <span style={{ fontWeight: 600, minWidth: "100px" }}>
                        {new Date(log.scheduledDate).toLocaleDateString()}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                        <button
                          type="button"
                          className="button"
                          onClick={() => toggleCheckrideDetails(log.id)}
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          {isExpanded ? "Einklappen" : "Expand"}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <details open style={{ marginTop: "0.25rem" }}>
                        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Vollständiges Checkride-Log</summary>
                        <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}>
                          {CHECKRIDE_RUBRIC.map((procedure) => (
                            <div
                              key={procedure.id}
                              style={{
                                border: "1px solid var(--footer-border)",
                                borderRadius: "8px",
                                padding: "0.75rem",
                                backgroundColor: "var(--card-bg)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                                <strong>{procedure.title}</strong>
                              </div>
                              <div style={{ marginTop: "0.5rem", display: "grid", gap: "8px" }}>
                                {procedure.rows.map((row) => (
                                  <div key={row.fieldKey} style={{ display: "grid", gap: "4px" }}>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          minWidth: "28px",
                                          justifyContent: "center",
                                          padding: "2px 8px",
                                          borderRadius: "999px",
                                          backgroundColor: RUBRIC_CODE_COLORS[row.code].bg,
                                          color: RUBRIC_CODE_COLORS[row.code].fg,
                                          fontWeight: 700,
                                          fontSize: "0.8em",
                                        }}
                                      >
                                        {row.code}
                                      </span>
                                      <span style={{ fontSize: "0.9em", fontWeight: 600 }}>{row.criterion}</span>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "start" }}>
                                      <div
                                        style={{
                                          fontSize: "0.9em",
                                          whiteSpace: "pre-wrap",
                                          backgroundColor: "var(--container-bg)",
                                          padding: "6px 8px",
                                          borderRadius: "6px",
                                          minHeight: "38px",
                                          border: "1px solid var(--footer-border)",
                                        }}
                                      >
                                        {formatRubricRating(assessment?.[row.fieldKey])}
                                      </div>
                                      {row.hint && (
                                        <div style={{ fontSize: "0.82em", color: "var(--text-muted)", maxWidth: "220px" }}>
                                          {row.hint}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {(parsedNotes.blockNotes[procedure.id] || "").trim().length > 0 && (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    padding: "10px 12px",
                                    border: "1px solid var(--footer-border)",
                                    borderRadius: "6px",
                                    backgroundColor: "var(--container-bg)",
                                  }}
                                >
                                  <div style={{ fontSize: "0.85em", fontWeight: 600, marginBottom: "4px" }}>
                                    Notiz zu {procedure.id}
                                  </div>
                                  <div style={{ whiteSpace: "pre-wrap", fontSize: "0.92em" }}>
                                    {parsedNotes.blockNotes[procedure.id]}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {parsedNotes.generalNote.trim().length > 0 && (
                            <div
                              style={{
                                border: "1px solid var(--footer-border)",
                                borderRadius: "8px",
                                padding: "0.75rem",
                                backgroundColor: "var(--container-bg)",
                              }}
                            >
                              <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Allgemeine Notiz</div>
                              <div style={{ whiteSpace: "pre-wrap" }}>{parsedNotes.generalNote}</div>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
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
