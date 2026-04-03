"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

type CheckrideEntry = {
  id: string;
  scheduledDate: string;
  result: string;
  isDraft: boolean;
  trainee: { id: string; cid: string | null; name: string | null };
  availability: {
    examiner?: { id: string; cid: string | null; name: string | null };
  };
};

type ReadyRequest = {
  id: string;
  readyForCheckride: boolean;
  checkrideRequestText?: string | null;
  checkrideRequestedAt?: string | null;
  trainee: { id: string; cid: string | null; name: string | null };
  mentors: { mentor: { id: string; cid: string | null; name: string | null } }[];
};

export default function ExaminerAvailabilityPage() {
  const [checkrides, setCheckrides] = useState<CheckrideEntry[]>([]);
  const [readyRequests, setReadyRequests] = useState<ReadyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/examiner", { cache: "no-store" });
      if (!res.ok) throw new Error(`Load failed: ${res.status}`);
      const data = await res.json();
      setCheckrides(data.checkrides || []);
      setReadyRequests(data.readyRequests || []);
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCheckride = async (trainingId: string) => {
    setStarting(trainingId);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || `Fehler: ${res.status}`);
      }
      const checkrideId = payload.checkrideId;
      if (!checkrideId) {
        throw new Error("Kein Checkride konnte erstellt werden");
      }
      window.location.href = `/examiner/assessment/${checkrideId}`;
    } catch (e: any) {
      setError(e.message || "Fehler beim Starten des Checkrides");
    } finally {
      setStarting(null);
    }
  };

  const cancelCheckride = async (checkrideId: string) => {
    if (!confirm("Möchtest du diese Prüfung wirklich absagen?")) return;
    setCancelling(checkrideId);
    setError(null);
    try {
      const res = await fetch(`/api/checkrides/${checkrideId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler: ${res.status}`);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Fehler beim Absagen");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Checkride Queue</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Bereite Assessments direkt aus den offenen Checkride-Anfragen vor.
        </p>
      </div>

      {error && <div className="info-danger" style={{ marginBottom: "1.5rem" }}><p>{error}</p></div>}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>lädt…</p></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0 }}>Trainees bereit für Checkride</h3>
            {readyRequests.length === 0 ? (
              <p style={{ color: "var(--text-color)", margin: 0 }}>Keine offenen Anfragen</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {readyRequests.map((req) => {
                  const mentorNames = req.mentors
                    .map((m) => `${m.mentor.name || "Unbekannt"} (${m.mentor.cid || "N/A"})`)
                    .join(", ");
                  const isStarting = starting === req.id;
                  return (
                    <div
                      key={req.id}
                      className="card"
                      style={{
                        marginBottom: 0,
                        padding: "12px 14px",
                        background: "var(--container-bg)",
                        borderLeft: "3px solid var(--accent-color)",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                        {req.trainee.name || "Trainee"} ({req.trainee.cid || "N/A"})
                      </div>
                      <div style={{ fontSize: "0.9em", color: "var(--text-color)", marginBottom: "4px" }}>
                        Mentor: {mentorNames || "N/A"}
                      </div>
                      <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "6px" }}>
                        Anfrage erstellt: {req.checkrideRequestedAt ? new Date(req.checkrideRequestedAt).toLocaleString("de-DE") : "unbekannt"}
                      </div>
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.9em",
                          background: "var(--background-color)",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          marginBottom: "10px",
                        }}
                      >
                        {req.checkrideRequestText || "Kein Availability-Text hinterlegt"}
                      </div>
                      <button
                        type="button"
                        className="button"
                        onClick={() => startCheckride(req.id)}
                        disabled={isStarting}
                      >
                        {isStarting ? "Startet..." : "Assessment starten"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Aktive und offene Checkrides</h3>
            {checkrides.length === 0 ? (
              <p style={{ color: "var(--text-color)", margin: 0 }}>Noch keine Checkrides vorhanden</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {checkrides.map((c) => (
                  <div
                    key={c.id}
                    className="card"
                    style={{
                      marginBottom: 0,
                      padding: "12px 14px",
                      background: "var(--container-bg)",
                      borderLeft: "3px solid var(--accent-color)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                      {c.trainee.name || "Trainee"} ({c.trainee.cid || "N/A"})
                    </div>
                    <div style={{ fontSize: "0.9em", marginBottom: "4px" }}>
                      {new Date(c.scheduledDate).toLocaleString("de-DE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "4px" }}>
                      Prüfer: {c.availability.examiner?.name || "Unbekannt"} ({c.availability.examiner?.cid || "N/A"})
                    </div>
                    <div
                      style={{
                        fontSize: "0.85em",
                        color: c.isDraft ? "var(--accent-color)" : "var(--text-color)",
                        marginBottom: "8px",
                      }}
                    >
                      {c.isDraft ? "Bewertung ausstehend" : `Ergebnis: ${c.result}`}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a
                        href={`/examiner/assessment/${c.id}`}
                        className="button"
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.85em",
                          margin: 0,
                          display: "inline-block",
                        }}
                      >
                        Bewertung öffnen
                      </a>
                      {c.result === "INCOMPLETE" && (
                        <button
                          onClick={() => cancelCheckride(c.id)}
                          disabled={cancelling === c.id}
                          className="button"
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.85em",
                            margin: 0,
                            backgroundColor: "var(--danger-color, #d32f2f)",
                            color: "white",
                            border: "none",
                            cursor: cancelling === c.id ? "wait" : "pointer",
                          }}
                        >
                          {cancelling === c.id ? "Absagen..." : "Absagen"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}
