"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PageLayout from "@/components/PageLayout";

// Training topics extracted from the draft
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

interface SessionLog {
  id: string;
  topic: string;
  checked: boolean;
  comment?: string;
  order: number;
}

interface TopicComment {
  [key: string]: string;
}

function SessionLoggingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");
  const whiteboardSessionId = searchParams.get("whiteboardSessionId");

  const [lessonType, setLessonType] = useState("THEORIE_TRAINING");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [comments, setComments] = useState("");
  const [whiteboardId, setWhiteboardId] = useState(whiteboardSessionId || "");
  const [checkedTopics, setCheckedTopics] = useState<Record<string, boolean>>({});
  const [topicComments, setTopicComments] = useState<TopicComment>({});
  const [previousSessions, setPreviousSessions] = useState<SessionLog[][]>([]);
  const [traineeId, setTraineeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }

    if (!trainingId) {
      setError("No training ID provided");
      return;
    }

    fetchTrainingDetails();
    fetchPreviousSessions();
  }, [status, isMentor, trainingId, router]);

  const fetchTrainingDetails = async () => {
    try {
      const res = await fetch(`/api/trainings/${trainingId}`);
      if (!res.ok) throw new Error("Failed to fetch training details");
      const data = await res.json();
      setTraineeId(data.trainee?.cid || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const fetchPreviousSessions = async () => {
    try {
      const res = await fetch(`/api/sessions?trainingId=${trainingId}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setPreviousSessions(data.map((s: any) => s.topics || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setCheckedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  const updateTopicComment = (topic: string, comment: string) => {
    setTopicComments((prev) => ({
      ...prev,
      [topic]: comment,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const topicData = TRAINING_TOPICS.map((t, idx) => ({
        topic: t.key,
        checked: checkedTopics[t.key] || false,
        comment: topicComments[t.key] || null,
        order: idx,
      }));

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId,
          lessonType,
          sessionDate,
          comments,
          whiteboardSessionId: whiteboardId || null,
          checkedTopics: topicData,
        }),
      });

      if (!res.ok) throw new Error("Failed to log session");
      
      // Redirect to trainee page to activate the session
      if (traineeId) {
        router.push(`/mentor/trainee/${traineeId}?trainingId=${trainingId}`);
      } else {
        setSuccess(true);
        // Refresh previous sessions if redirect fails
        setTimeout(() => {
          fetchPreviousSessions();
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  // Check which topics have been covered in previous sessions
  const getCoverageStatus = (topic: string) => {
    return previousSessions.some((session) =>
      session.some((t: SessionLog) => t.topic === topic && t.checked)
    );
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    );
  }

  if (!isMentor) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Zugriff verweigert. Nur Mentoren können Sessions loggen.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="header-container">
        <div className="header">
          <h1>Trainingssession loggen</h1>
        </div>
      </div>

      {error && <div className="info-danger"><p>{error}</p></div>}
      {success && <div className="info-success"><p>Session erfolgreich gelogged!</p></div>}

      <form onSubmit={handleSubmit} className="form-card" style={{ maxWidth: "720px" }}>
        {/* Lesson Type */}
        <label className="form-label">
          Art des Trainings
          <select
            value={lessonType}
            onChange={(e) => setLessonType(e.target.value)}
            className="form-input"
            required
          >
            <option value="THEORIE_TRAINING">Theorie Training</option>
            <option value="OFFLINE_FLUG">Offline Flug</option>
            <option value="ONLINE_FLUG">Online Flug</option>
          </select>
          <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-muted)" }}>
            Pre-Check Ride ist eine Form von Online Flug.
          </small>
        </label>

        {/* Session Date */}
        <label className="form-label">
          Datum des Trainings
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="form-input"
            required
          />
        </label>

        {/* Whiteboard Session (Optional) */}
        <label className="form-label">
          Link zur Whiteboard-Session (Optional)
          <input
            type="text"
            value={whiteboardId}
            onChange={(e) => setWhiteboardId(e.target.value)}
            className="form-input"
            placeholder="z.B., abc123def456 (von /trainings/session/[id])"
          />
          <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-muted)" }}>
            Falls du das Whiteboard während des Trainings genutzt hast, füge hier die Session ID ein. Es wird eine Woche lang gespeichert, damit dein Trainee es sich noch einmal ansehen kann.
          </small>
        </label>

        {/* Topics */}
        <div>
          <h2 style={{ marginBottom: "12px" }}>Abgedeckte Themen</h2>
          <p style={{ fontSize: "0.95em", marginBottom: "16px", color: "var(--text-color)" }}>
            Markiere die Themen, die du in dieser Session besprochen hast und füge optional Kommentare hinzu.{" "}
            <span style={{ color: "#66bb6a", fontWeight: 600 }}>
              Grüne Themen
            </span>{" "}
            wurden in vorherigen Sessions behandelt.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {TRAINING_TOPICS.map((topic) => {
              const isPreviouslyCovered = getCoverageStatus(topic.key);
              const isChecked = checkedTopics[topic.key] || false;
              return (
                <div
                  key={topic.key}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: `1.5px solid ${isPreviouslyCovered ? "#66bb6a" : "var(--footer-border)"}`,
                    background: isPreviouslyCovered ? "rgba(0, 95, 163, 0.06)" : "var(--container-bg)",
                    transition: "all 0.2s",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      marginBottom: isChecked ? "10px" : "0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTopic(topic.key)}
                    />
                    <span
                      style={{
                        marginLeft: "10px",
                        fontWeight: 500,
                        color: isPreviouslyCovered ? "var(--accent-color)" : "var(--text-color)",
                        flex: 1,
                      }}
                    >
                      {topic.label}
                    </span>
                    {isPreviouslyCovered && (
                      <span style={{ fontSize: "0.8em", background: "var(--accent-color)", color: "white", padding: "3px 8px", borderRadius: "4px" }}>
                        Bereits behandelt
                      </span>
                    )}
                  </label>
                  {isChecked && (
                    <textarea
                      value={topicComments[topic.key] || ""}
                      onChange={(e) => updateTopicComment(topic.key, e.target.value)}
                      placeholder="Optionale Notiz zu diesem Thema..."
                      className="form-textarea"
                      style={{ marginTop: "8px", minHeight: "60px" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        <label className="form-label">
          Notizen zur Session
          <p style={{ fontSize: "0.9em", color: "var(--text-color)", margin: "4px 0 0 0" }}>
            Füge Erinnerungen oder Notizen für den Trainee hinzu. Z.B. was gut lief oder woran noch gearbeitet werden muss. Du kannst diese später noch ändern.
          </p>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Z.B., Gute Fortschritte beim Anflug, du musst aber noch an der Geschwindigkeitskontrolle arbeiten..."
            className="form-textarea"
          />
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="button"
          style={{ alignSelf: "flex-start", minWidth: "160px" }}
        >
          {submitting ? "Session wird gespeichert..." : "Session speichern"}
        </button>
      </form>

      {/* Previous Sessions Summary */}
      {previousSessions.length > 0 && (
        <div className="card" style={{ marginTop: "28px" }}>
          <h3>Session Verlauf</h3>
          <p style={{ margin: "8px 0" }}>
            Insgesamt erfasste Sessions: {previousSessions.length}
          </p>
          <p style={{ margin: "8px 0" }}>
            Insgesamt behandelte Themen:{" "}
            <span style={{ fontWeight: 600 }}>
              {
                new Set(
                  previousSessions
                    .flat()
                    .filter((t: SessionLog) => t.checked)
                    .map((t: SessionLog) => t.topic)
                ).size
              }
              /{TRAINING_TOPICS.length}
            </span>
          </p>
        </div>
      )}
    </PageLayout>
  );
}

export default function SessionLoggingPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    }>
      <SessionLoggingContent />
    </Suspense>
  );
}
