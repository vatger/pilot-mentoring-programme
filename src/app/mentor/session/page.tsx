"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PageLayout from "@/components/PageLayout";
import { trainingTopics } from "@/lib/trainingTopics";

interface SessionLog {
  id: string;
  topic: string;
  checked: boolean;
  coverageMode?: "THEORIE" | "PRAXIS" | null;
  theoryCovered?: boolean;
  practiceCovered?: boolean;
  comment?: string;
  order: number;
}

interface TopicComment {
  [key: string]: string;
}

function SessionLoggingContent() {
  const THEORY_BLUE = "#4d8edb";
  const PRACTICE_GREEN = "#4caf50";

  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");
  const whiteboardSessionId = searchParams.get("whiteboardSessionId");

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [comments, setComments] = useState("");
  const [whiteboardId, setWhiteboardId] = useState(whiteboardSessionId || "");
  const [topicSelections, setTopicSelections] = useState<Record<string, { theory: boolean; practice: boolean }>>({});
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

  const toggleTheory = (topic: string) => {
    setTopicSelections((prev) => ({
      ...prev,
      [topic]: {
        theory: !(prev[topic]?.theory || false),
        practice: prev[topic]?.practice || false,
      },
    }));
  };

  const togglePractice = (topic: string) => {
    setTopicSelections((prev) => ({
      ...prev,
      [topic]: {
        theory: prev[topic]?.theory || false,
        practice: !(prev[topic]?.practice || false),
      },
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
      const topicData = trainingTopics.map((t, idx) => ({
        theoryCovered: !!topicSelections[t.key]?.theory,
        practiceCovered: t.category === "THEORY" ? false : !!topicSelections[t.key]?.practice,
        topic: t.key,
        checked:
          !!topicSelections[t.key]?.theory ||
          (t.category !== "THEORY" && !!topicSelections[t.key]?.practice),
        comment: topicComments[t.key] || null,
        order: idx,
      }));

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId,
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

  // Check which topics have been covered in previous sessions and in which mode
  const getCoverageStatus = (topic: string) => {
    const coveredEntries = previousSessions
      .flat()
      .filter((t: SessionLog) => t.topic === topic && t.checked);

    return {
      theorie: coveredEntries.some(
        (t: SessionLog) =>
          !!t.theoryCovered ||
          (!t.theoryCovered && !t.practiceCovered && t.checked && (t.coverageMode || "THEORIE") === "THEORIE")
      ),
      praxis: coveredEntries.some(
        (t: SessionLog) =>
          !!t.practiceCovered ||
          (!t.theoryCovered && !t.practiceCovered && t.checked && (t.coverageMode === "PRAXIS" || !t.coverageMode))
      ),
    };
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
          Link zur Whiteboard-Session (Zukunftsmusik, Optional)
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
            Standard ist keine Auswahl. Setze die Checkboxen pro Thema: Theorie (blau) und Praxis (grün). Bei Theorie-Themen gibt es keine Praxis-Checkbox.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {trainingTopics.map((topic) => {
              const previousCoverage = getCoverageStatus(topic.key);
              const isPreviouslyCovered = previousCoverage.theorie || previousCoverage.praxis;
              const cardColor = previousCoverage.praxis
                ? PRACTICE_GREEN
                : previousCoverage.theorie
                ? THEORY_BLUE
                : "var(--footer-border)";
              const cardBackground = previousCoverage.praxis
                ? "rgba(46, 125, 50, 0.08)"
                : previousCoverage.theorie
                ? "rgba(0, 95, 163, 0.06)"
                : "var(--container-bg)";
              const isTheoryChecked = !!topicSelections[topic.key]?.theory;
              const isPracticeChecked = topic.category === "THEORY" ? false : !!topicSelections[topic.key]?.practice;
              const isChecked = isTheoryChecked || isPracticeChecked;
              return (
                <div
                  key={topic.key}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: `1.5px solid ${cardColor}`,
                    background: cardBackground,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        color: isPreviouslyCovered ? cardColor : "var(--text-color)",
                        flex: 1,
                      }}
                    >
                      {topic.label}
                    </span>
                    {previousCoverage.theorie && (
                      <span style={{ fontSize: "0.75em", background: THEORY_BLUE, color: "white", padding: "3px 8px", borderRadius: "4px" }}>
                        Theorie vorhanden
                      </span>
                    )}
                    {previousCoverage.praxis && (
                      <span style={{ fontSize: "0.75em", background: PRACTICE_GREEN, color: "white", padding: "3px 8px", borderRadius: "4px" }}>
                        Praxis vorhanden
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: isChecked ? "10px" : "0" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.9em",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: `1px solid ${THEORY_BLUE}`,
                        background: isTheoryChecked ? "rgba(0, 95, 163, 0.12)" : "transparent",
                      }}
                    >
                      <input
                        className="topic-checkbox topic-checkbox--theory"
                        type="checkbox"
                        checked={isTheoryChecked}
                        onChange={() => toggleTheory(topic.key)}
                        style={{ width: "16px", height: "16px" }}
                      />
                      <span style={{ color: THEORY_BLUE, fontWeight: 600 }}>Theorie</span>
                    </label>
                    {topic.category !== "THEORY" ? (
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.9em",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: `1px solid ${PRACTICE_GREEN}`,
                          background: isPracticeChecked ? "rgba(46, 125, 50, 0.12)" : "transparent",
                        }}
                      >
                        <input
                          className="topic-checkbox topic-checkbox--practice"
                          type="checkbox"
                          checked={isPracticeChecked}
                          onChange={() => togglePractice(topic.key)}
                          style={{ width: "16px", height: "16px" }}
                        />
                        <span style={{ color: PRACTICE_GREEN, fontWeight: 600 }}>Praxis</span>
                      </label>
                    ) : (
                      <span style={{ fontSize: "0.8em", color: "var(--text-muted)" }}>Nur Theorie</span>
                    )}
                  </div>

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
              /{trainingTopics.length}
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
