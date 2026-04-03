"use client";

import { useEffect, useMemo, useState } from "react";
import PageLayout from "@/components/PageLayout";
import {
  CHECKRIDE_RUBRIC,
  CHECKRIDE_RUBRIC_INTRO,
  createInitialBlockNotes,
  formatRubricRating,
  parseRubricNotes,
  RUBRIC_CODE_COLORS,
  RUBRIC_ROW_TINTS,
} from "@/lib/checkrideRubric";

type AvailableSlot = {
  id: string;
  examinerId: string;
  startTime: string;
  endTime: string;
  status: string;
  examiner?: { id: string; name: string | null; cid: string | null };
};

type Assessment = Record<string, any> & {
  overallResult?: string;
  examinernotes?: string;
};

type CheckrideBooking = {
  id: string;
  scheduledDate: string;
  result: string;
  isDraft: boolean;
  availability: AvailableSlot;
  assessment?: Assessment;
};

type TrainingSummary = {
  id: string;
  readyForCheckride: boolean;
};

export default function TraineeCheckridePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [training, setTraining] = useState<TrainingSummary | null>(null);
  const [booking, setBooking] = useState<CheckrideBooking | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [generalNote, setGeneralNote] = useState<string>("");
  const [blockNotes, setBlockNotes] = useState<Record<string, string>>(createInitialBlockNotes());

  const hasReady = training?.readyForCheckride;

  const bookedInfo = useMemo(() => {
    if (!booking) return null;
    return {
      date: new Date(booking.scheduledDate).toLocaleString(),
      examiner:
        booking.availability.examiner?.name
          ? `${booking.availability.examiner.name} (${booking.availability.examiner.cid || ""})`
          : booking.availability.examinerId,
    };
  }, [booking]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/me", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = await res.json();
      setTraining(data.training);
      setBooking(data.booking);
      setAssessment(data.assessment);
      const parsedNotes = parseRubricNotes(data?.assessment?.examinernotes);
      setGeneralNote(parsedNotes.generalNote);
      setBlockNotes(parsedNotes.blockNotes);
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusText = assessment
    ? "Bewertung freigegeben"
    : booking
    ? "Checkride gebucht (Warten auf Bewertung)"
    : hasReady
    ? "Checkride angefragt (Termin folgt ueber Mentor)"
    : "Noch nicht bereit fuer Checkride";

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Checkride Center</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Sieh den Status deiner Bewertung und nach Freigabe dein Ergebnis ein
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Loading...</p></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Status</h3>
            <div className="stepper-progress" style={{ margin: 0, marginBottom: "8px" }}>
              {statusText}
            </div>
            <p style={{ margin: 0, fontSize: "0.95em" }}>
              {hasReady
                ? "Dein Mentor koordiniert den Termin mit dir und bestaetigt anschliessend einen Pruefer-Slot."
                : "Dein Mentor muss dich als bereit fuer deine Pruefung markieren."}
            </p>
          </div>

          {booking && (
            <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--accent-color)" }}>
              <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Gebuchter Slot</h3>
              <div style={{ display: "grid", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>Datum & Uhrzeit</div>
                  <div style={{ fontSize: "1em", fontWeight: 500 }}>{bookedInfo?.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>Pruefer</div>
                  <div style={{ fontSize: "1em", fontWeight: 500 }}>{bookedInfo?.examiner}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>Status</div>
                  <div style={{ fontSize: "1em", fontWeight: 500 }}>
                    {booking.isDraft ? "Bewertung ausstehend" : booking.result}
                  </div>
                </div>
              </div>
            </div>
          )}

          {assessment && (
            <div className="card info-success" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Bewertungsergebnis</h3>
              <div style={{ display: "grid", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>Gesamtergebnis</div>
                  <div style={{ fontSize: "1.1em", fontWeight: 600 }}>{assessment.overallResult}</div>
                </div>
                {generalNote && (
                  <div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "4px" }}>
                      Anmerkungen des Pruefers
                    </div>
                    <div
                      style={{
                        fontSize: "0.95em",
                        whiteSpace: "pre-wrap",
                        backgroundColor: "var(--container-bg)",
                        padding: "10px 12px",
                        borderRadius: "6px",
                      }}
                    >
                      {generalNote || "-"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {assessment && (
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: "12px" }}>{CHECKRIDE_RUBRIC_INTRO.title}</h3>
              <div style={{ background: "var(--container-bg)", border: "1px solid var(--footer-border)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>Notizen</div>
                {generalNote.trim().length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "4px" }}>Allgemeine Notiz</div>
                    <div style={{ whiteSpace: "pre-wrap", backgroundColor: "var(--card-bg)", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--footer-border)" }}>
                      {generalNote}
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gap: "8px" }}>
                  {Object.entries(blockNotes)
                    .filter(([, value]) => value.trim().length > 0)
                    .map(([id, value]) => (
                      <div key={id} style={{ border: "1px solid var(--footer-border)", borderRadius: "6px", padding: "10px 12px", backgroundColor: "var(--card-bg)" }}>
                        <div style={{ fontSize: "0.85em", fontWeight: 600, marginBottom: "4px" }}>{id}</div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: "0.92em" }}>{value}</div>
                      </div>
                    ))}
                  {Object.values(blockNotes).every((value) => value.trim().length === 0) && !generalNote.trim() && (
                    <div style={{ fontSize: "0.9em", color: "var(--text-muted)" }}>Noch keine Notizen vorhanden.</div>
                  )}
                </div>
              </div>

              <h4 style={{ marginTop: 0, marginBottom: "12px" }}>10 P Rubrik</h4>

              <div style={{ display: "grid", gap: "12px" }}>
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
                          <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid var(--footer-border)", width: "120px" }}>Wertung</th>
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
                            <td style={{ padding: "8px", borderBottom: "1px solid var(--footer-border)", fontWeight: 600 }}>
                              {formatRubricRating(assessment[row.fieldKey])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(blockNotes[procedure.id] || "").trim().length > 0 && (
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
                          {blockNotes[procedure.id]}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
