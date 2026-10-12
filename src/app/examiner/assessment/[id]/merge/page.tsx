"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PageLayout from "@/components/PageLayout";
import {
  CHECKRIDE_BLOCK_IDS,
  CHECKRIDE_RUBRIC,
  createInitialBlockNotes,
  createInitialRubricAssessment,
  formatRubricRating,
  parseRubricNotes,
  RUBRIC_CODE_COLORS,
  RUBRIC_RATING_OPTIONS,
  RUBRIC_ROW_TINTS,
  normalizeRubricRating,
  RubricRating,
  serializeRubricNotes,
} from "@/lib/checkrideRubric";

type Assessment = Record<string, any> & {
  overallResult?: string;
  examinernotes?: string;
  notes?: string;
};

type CheckrideInfo = {
  id: string;
  scheduledDate: string;
  agreedDateTime?: string | null;
  result: string;
  isDraft: boolean;
  availability: {
    examiner?: {
      name: string | null;
      cid: string | null;
    };
  };
};

type NoteMap = Record<string, string>;

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function createBlankNotes() {
  return createInitialBlockNotes();
}

export default function CheckrideMergePage() {
  const params = useParams<{ id: string }>();
  const checkrideId = params?.id;
  const { data: session, status } = useSession();
  const router = useRouter();

  const userRole = (session?.user as any)?.role;
  const canUsePage = ["PMP_PRÜFER", "PMP_LEITUNG", "ADMIN"].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [examinerAssessment, setExaminerAssessment] = useState<Assessment>({
    ...createInitialRubricAssessment(),
    examinernotes: "",
  });
  const [mentorAssessment, setMentorAssessment] = useState<Assessment | null>(null);
  const [checkride, setCheckride] = useState<CheckrideInfo | null>(null);
  const [generalFinalNote, setGeneralFinalNote] = useState("");
  const [finalBlockNotes, setFinalBlockNotes] = useState<NoteMap>(createBlankNotes());
  const [overallResult, setOverallResult] = useState("INCOMPLETE");
  const [isDraft, setIsDraft] = useState(true);
  const [scheduledDraft, setScheduledDraft] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !canUsePage) {
      router.push("/");
      return;
    }

    const load = async () => {
      if (!checkrideId) return;
      setLoading(true);
      setError(null);
      try {
        const [examinerRes, mentorRes] = await Promise.all([
          fetch(`/api/checkrides/assessment?checkrideId=${checkrideId}`, { cache: "no-store" }),
          fetch(`/api/checkrides/mentor-assessment?checkrideId=${checkrideId}`, { cache: "no-store" }),
        ]);

        if (!examinerRes.ok) {
          const payload = await examinerRes.json().catch(() => ({}));
          throw new Error(payload.error || `Pruefer-Log konnte nicht geladen werden (${examinerRes.status})`);
        }

        const examinerData = await examinerRes.json();
        const examinerExisting = examinerData?.assessment || {};
        const examinerNotes = parseRubricNotes(examinerExisting.examinernotes);
        const { overallResult: examinerResult, examinernotes: examinerNotesRaw, ...examinerRest } = examinerExisting;

        setExaminerAssessment({
          ...createInitialRubricAssessment(),
          ...Object.fromEntries(
            Object.entries(examinerRest).map(([key, value]) => [key, normalizeRubricRating(String(value))])
          ),
          examinernotes: examinerNotesRaw || "",
        } as Assessment);
        setGeneralFinalNote(examinerNotes.generalNote);
        setFinalBlockNotes(examinerNotes.blockNotes);
        setOverallResult(examinerResult || "INCOMPLETE");
        setIsDraft(Boolean(examinerData?.isDraft ?? true));
        setCheckride(examinerData as CheckrideInfo);
        setScheduledDraft(toLocalDateTime(examinerData?.agreedDateTime || examinerData?.scheduledDate));

        if (mentorRes.ok) {
          const mentorData = await mentorRes.json();
          setMentorAssessment(mentorData?.assessment || null);
        } else if (mentorRes.status === 404) {
          setMentorAssessment(null);
        } else {
          const payload = await mentorRes.json().catch(() => ({}));
          throw new Error(payload.error || `Mentor-Log konnte nicht geladen werden (${mentorRes.status})`);
        }
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status, canUsePage, router, checkrideId]);

  const examinerNotes = useMemo(() => parseRubricNotes(examinerAssessment?.examinernotes), [examinerAssessment]);
  const mentorNotes = useMemo(() => parseRubricNotes(mentorAssessment?.notes), [mentorAssessment]);
  const agreedDate = checkride?.agreedDateTime || checkride?.scheduledDate;

  const updateExaminerField = (key: string, value: string) => {
    setExaminerAssessment((prev) => ({ ...prev, [key]: value }));
  };

  const updateFinalBlockNote = (procedureId: string, value: string) => {
    setFinalBlockNotes((prev) => ({ ...prev, [procedureId]: value }));
  };

  const saveFinal = async (release = false) => {
    if (saving || !checkrideId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/checkrides/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkrideId,
          release,
          overallResult,
          examinernotes: serializeRubricNotes(generalFinalNote, finalBlockNotes),
          ...examinerAssessment,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Fehler: ${res.status}`);
      }

      const payload = await res.json().catch(() => null);
      const savedAssessment = payload?.assessment;
      const savedCheckride = payload?.checkride;
      if (savedAssessment) {
        const savedNotes = parseRubricNotes(savedAssessment?.examinernotes);
        const { overallResult: savedResult, examinernotes: savedNotesRaw, ...savedRest } = savedAssessment;
        setExaminerAssessment({
          ...createInitialRubricAssessment(),
          ...Object.fromEntries(
            Object.entries(savedRest).map(([key, value]) => [key, normalizeRubricRating(String(value))])
          ),
          examinernotes: savedNotesRaw || "",
        } as Assessment);
        setGeneralFinalNote(savedNotes.generalNote);
        setFinalBlockNotes(savedNotes.blockNotes);
        setOverallResult(savedResult || overallResult);
      }
      if (savedCheckride && typeof savedCheckride.isDraft === "boolean") {
        setIsDraft(savedCheckride.isDraft);
      }
      setSuccess(release ? "Finales Log abgeschlossen" : "Gespeichert");
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return null;
  }

  if (!checkrideId || !canUsePage) {
    return null;
  }

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Checkride Merge</h1>
        <p style={{ margin: "0.5rem 0 0 0", color: "var(--text-color)" }}>
          Vergleiche Mentor- und Pruefer-Log und arbeite danach das finale Pruefer-Log aus.
        </p>
      </div>

      {loading && (
        <div className="card">
          <p style={{ margin: 0 }}>Lädt...</p>
        </div>
      )}
      {error && <div className="info-danger" style={{ marginBottom: "1.5rem" }}><p>{error}</p></div>}
      {success && <div className="info-success" style={{ marginBottom: "1.5rem" }}><p>{success}</p></div>}

      {!loading && !error && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Checkride Überblick</h3>
            <div style={{ display: "grid", gap: "8px" }}>
              <div>
                <strong>Termin:</strong> {agreedDate ? new Date(agreedDate).toLocaleString() : "Noch nicht eingetragen"}
              </div>
              <div>
                <strong>Prüfer:</strong> {checkride?.availability.examiner?.name || "Unbekannt"}
              </div>
              <div>
                <strong>Status:</strong> {isDraft ? "Entwurf" : "Freigegeben"}
              </div>
              <div>
                <strong>Mentor-Log:</strong> {mentorAssessment ? "vorhanden und fertig" : "nicht vorhanden"}
              </div>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: "6px" }}>Datum / Termin</label>
            <input
              className="form-input"
              type="datetime-local"
              value={scheduledDraft}
              onChange={(e) => setScheduledDraft(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          </div>

          {CHECKRIDE_RUBRIC.map((procedure) => {
            return (
              <div key={procedure.id} style={{ border: "1px solid var(--footer-border)", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "10px 12px", background: "var(--container-bg)", borderBottom: "1px solid var(--footer-border)", fontWeight: 700 }}>
                  {procedure.title}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "64px" }}>Typ</th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)" }}>Kriterium</th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "25%" }}>Bewertung Mentor</th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "25%" }}>Bewertung Prüfer</th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "25%" }}>Finale Bewertung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedure.rows.map((row) => {
                      const mentorValue = mentorAssessment?.[row.fieldKey] || "";
                      const examinerValue = examinerAssessment?.[row.fieldKey] || "";
                      const mentorDiffers = String(mentorValue) !== String(examinerValue);
                      const finalValue = examinerAssessment?.[row.fieldKey] || "";

                      return (
                        <tr
                          key={row.fieldKey}
                          style={{
                            backgroundColor: mentorDiffers ? "var(--compare-row-bg)" : RUBRIC_ROW_TINTS[row.code],
                          }}
                        >
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", verticalAlign: "top" }}>
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
                              }}
                            >
                              {row.code}
                            </span>
                          </td>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 600 }}>{row.criterion}</div>
                            {row.hint && <div style={{ marginTop: "2px", fontSize: "0.85em", color: "var(--text-color)" }}>{row.hint}</div>}
                          </td>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", verticalAlign: "top", backgroundColor: mentorDiffers ? "var(--compare-mentor-bg)" : "transparent", color: "var(--compare-mentor-text)", fontWeight: mentorDiffers ? 700 : 400 }}>
                            {formatRubricRating(mentorValue)}
                          </td>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", verticalAlign: "top", backgroundColor: mentorDiffers ? "var(--compare-examiner-bg)" : "transparent", color: "var(--compare-examiner-text)", fontWeight: mentorDiffers ? 700 : 400 }}>
                            {formatRubricRating(examinerValue)}
                          </td>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", verticalAlign: "top", backgroundColor: mentorDiffers ? "var(--compare-final-bg)" : "rgba(46, 125, 50, 0.08)", borderLeft: mentorDiffers ? "3px solid var(--compare-final-border)" : "3px solid var(--compare-final-border)", color: "var(--compare-final-text)", fontWeight: 700 }}>
                            <select
                              className="form-select"
                              value={(examinerAssessment[row.fieldKey] as RubricRating) || ""}
                              onChange={(e) => updateExaminerField(row.fieldKey, e.target.value)}
                              style={{
                                fontWeight: 700,
                                backgroundColor: mentorDiffers ? "var(--compare-final-bg)" : "transparent",
                                color: "var(--compare-final-text)",
                                borderColor: mentorDiffers ? "var(--compare-final-border)" : "var(--footer-border)",
                              }}
                            >
                              <option value="">-</option>
                              {RUBRIC_RATING_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", padding: "12px" }}>
                  <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>Notiz Prüfer {procedure.id}</div>
                    <div style={{ whiteSpace: "pre-wrap", minHeight: "72px" }}>{examinerNotes.blockNotes[procedure.id] || "-"}</div>
                  </div>
                  <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>Notiz Mentor {procedure.id}</div>
                    <div style={{ whiteSpace: "pre-wrap", minHeight: "72px" }}>{mentorNotes.blockNotes[procedure.id] || "-"}</div>
                  </div>
                  <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>Finale Anmerkung {procedure.id}</div>
                    <textarea
                      className="form-textarea"
                      value={finalBlockNotes[procedure.id] || ""}
                      onChange={(e) => updateFinalBlockNote(procedure.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ border: "1px solid var(--footer-border)", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: "var(--container-bg)", borderBottom: "1px solid var(--footer-border)", fontWeight: 700 }}>
              Finale Anmerkungen
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", padding: "12px" }}>
              <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>Prüfer Notiz gesamt</div>
                <textarea
                  className="form-textarea"
                  value={generalFinalNote}
                  onChange={(e) => setGeneralFinalNote(e.target.value)}
                />
              </div>
              <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>Prüfer Notiz gesamt nochmal</div>
                <textarea
                  className="form-textarea"
                  value={generalFinalNote}
                  onChange={(e) => setGeneralFinalNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <label className="form-label" style={{ margin: 0 }}>
            Gesamtergebnis
            <select
              className="form-select"
              value={overallResult}
              onChange={(e) => setOverallResult(e.target.value)}
            >
              <option value="INCOMPLETE">INCOMPLETE</option>
              <option value="PASSED">PASSED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button onClick={() => saveFinal(false)} disabled={saving} className="button">
              {saving ? "Speichere..." : "Zwischenspeichern"}
            </button>
            <button onClick={() => saveFinal(true)} disabled={saving} className="button">
              {saving ? "Schliesse..." : "Finales Log abschliessen"}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
