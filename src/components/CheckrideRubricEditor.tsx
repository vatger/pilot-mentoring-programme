"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import {
  CHECKRIDE_RUBRIC,
  CHECKRIDE_RUBRIC_INTRO,
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

const RUBRIC_FIELD_KEYS = new Set(Object.keys(createInitialRubricAssessment()));

type CheckrideAssessment = Record<string, any> & {
  overallResult?: string;
  examinernotes?: string;
  notes?: string;
  mentorNotes?: string | null;
};

type CheckrideRubricEditorProps = {
  checkrideId: string;
  apiPath: string;
  title: string;
  introText?: string;
  noteField: "examinernotes" | "notes";
  noteLabel: string;
  saveButtonLabel?: string;
  finalizeButtonLabel?: string;
  wrapPageLayout?: boolean;
};

export default function CheckrideRubricEditor({
  checkrideId,
  apiPath,
  title,
  introText,
  noteField,
  noteLabel,
  saveButtonLabel = "Zwischenspeichern",
  finalizeButtonLabel = "Abschliessen",
  wrapPageLayout = true,
}: CheckrideRubricEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<CheckrideAssessment>({
    ...createInitialRubricAssessment(),
    [noteField]: "",
  });
  const [generalNote, setGeneralNote] = useState<string>("");
  const [blockNotes, setBlockNotes] = useState<Record<string, string>>(createInitialBlockNotes());
  const [overallResult, setOverallResult] = useState<string>("INCOMPLETE");
  const [isDraft, setIsDraft] = useState<boolean>(true);

  const load = async () => {
    if (!checkrideId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiPath}?checkrideId=${checkrideId}`, { cache: "no-store" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Load failed: ${res.status}`);
      }

      const data = await res.json();
      const existing = data?.assessment || {};
      const existingNotes = existing?.[noteField];
      const { overallResult: existingResult, ...rest } = existing;
      const parsedNotes = parseRubricNotes(existingNotes);
      const rubricFields = Object.fromEntries(
        Object.entries(rest).filter(([key]) => RUBRIC_FIELD_KEYS.has(key))
      );

      setAssessment({
        ...createInitialRubricAssessment(),
        ...Object.fromEntries(
          Object.entries(rubricFields).map(([key, value]) => [key, normalizeRubricRating(String(value))])
        ),
      } as CheckrideAssessment);
      setGeneralNote(parsedNotes.generalNote);
      setBlockNotes(parsedNotes.blockNotes);
      setOverallResult(existingResult || "INCOMPLETE");
      setIsDraft(Boolean(data?.isDraft ?? true));
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkrideId, apiPath, noteField]);

  const save = async (opts?: { release?: boolean }) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkrideId,
          release: opts?.release,
          overallResult,
          [noteField]: serializeRubricNotes(generalNote, blockNotes),
          ...assessment,
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
        const savedNotes = savedAssessment?.[noteField];
        const { overallResult: savedResult, ...rest } = savedAssessment;
        const parsedNotes = parseRubricNotes(savedNotes);
        const rubricFields = Object.fromEntries(
          Object.entries(rest).filter(([key]) => RUBRIC_FIELD_KEYS.has(key))
        );

        setAssessment({
          ...createInitialRubricAssessment(),
          ...Object.fromEntries(
            Object.entries(rubricFields).map(([key, value]) => [key, normalizeRubricRating(String(value))])
          ),
        } as CheckrideAssessment);
        setGeneralNote(parsedNotes.generalNote);
        setBlockNotes(parsedNotes.blockNotes);
        setOverallResult(savedResult || overallResult);
      }

      if (savedCheckride && typeof savedCheckride.isDraft === "boolean") {
        setIsDraft(savedCheckride.isDraft);
      }

      setSuccess(opts?.release ? `${finalizeButtonLabel} gespeichert` : "Gespeichert");
    } catch (e: any) {
      setError(e.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setAssessment((prev) => ({ ...prev, [key]: value }));
  };

  const updateBlockNote = (procedureId: string, value: string) => {
    setBlockNotes((prev) => ({ ...prev, [procedureId]: value }));
  };

  const content = (
    <>
      <div className="header-container">
        <div className="header">
          <h1>{title}</h1>
          <p style={{ margin: 0, color: "var(--text-color)" }}>{introText || CHECKRIDE_RUBRIC_INTRO.objective}</p>
        </div>
      </div>

      {loading && (
        <div className="card">
          <p>laedt...</p>
        </div>
      )}
      {error && <div className="info-danger"><p>{error}</p></div>}
      {success && <div className="info-success"><p>{success}</p></div>}

      {!loading && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "12px" }}>
            <h3 style={{ marginTop: 0 }}>{CHECKRIDE_RUBRIC_INTRO.title}</h3>
            <p style={{ marginTop: 0, marginBottom: "10px" }}>{CHECKRIDE_RUBRIC_INTRO.objective}</p>
            <div style={{ display: "grid", gap: "4px", marginBottom: "10px" }}>
              {CHECKRIDE_RUBRIC_INTRO.legend.map((item) => (
                <div key={item} style={{ fontSize: "0.9em" }}>{item}</div>
              ))}
            </div>
            <div style={{ display: "grid", gap: "4px" }}>
              {CHECKRIDE_RUBRIC_INTRO.pillars.map((item) => (
                <div key={item} style={{ fontSize: "0.9em" }}>{item}</div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              padding: "10px",
              background: "var(--container-bg)",
              color: "var(--text-color)",
              borderRadius: "8px",
              border: "1px solid var(--footer-border)",
            }}
          >
            <strong>Status:</strong>
            <span>{isDraft ? "Entwurf (nicht freigegeben)" : "Freigegeben"}</span>
            <span style={{ opacity: 0.7 }}>-</span>
            <span>Ergebnis: {overallResult}</span>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button onClick={() => save()} disabled={saving} className="button">
              {saving ? "Speichere..." : saveButtonLabel}
            </button>
            <button onClick={() => save({ release: true })} disabled={saving} className="button">
              {saving ? "Schliesse..." : finalizeButtonLabel}
            </button>
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

          {CHECKRIDE_RUBRIC.map((procedure) => {
            return (
              <div key={procedure.id} className="card" style={{ marginBottom: 0 }}>
                <h3 style={{ marginTop: 0 }}>{procedure.title}</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "70px" }}>Typ</th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "280px" }}>Kriterium</th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)" }}>Hinweis</th>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "180px" }}>Bewertung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedure.rows.map((row) => (
                      <tr key={row.fieldKey} style={{ backgroundColor: RUBRIC_ROW_TINTS[row.code] }}>
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
                        <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", overflowWrap: "anywhere", verticalAlign: "top" }}>{row.criterion}</td>
                        <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", color: "var(--text-color)", overflowWrap: "anywhere", verticalAlign: "top" }}>{row.hint || "-"}</td>
                        <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)" }}>
                          <select
                            className="form-select"
                            value={(assessment[row.fieldKey] as RubricRating) || ""}
                            onChange={(e) => updateField(row.fieldKey, e.target.value)}
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
                    ))}
                  </tbody>
                </table>

                <label className="form-label" style={{ marginTop: "10px", marginBottom: 0 }}>
                  Notiz zu {procedure.id}
                  <textarea
                    className="form-textarea"
                    value={blockNotes[procedure.id] || ""}
                    onChange={(e) => updateBlockNote(procedure.id, e.target.value)}
                  />
                </label>
              </div>
            );
          })}

          <div className="form-card" style={{ maxWidth: "100%", margin: 0 }}>
            <label className="form-label">
              {noteLabel}
              <textarea
                className="form-textarea"
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </>
  );

  return wrapPageLayout ? <PageLayout>{content}</PageLayout> : content;
}