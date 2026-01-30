"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
};

type CheckrideEntry = {
  id: string;
  scheduledDate: string;
  result: string;
  isDraft: boolean;
  trainee: { id: string; cid: string | null; name: string | null };
  availability: Slot;
  assessment?: any;
};

export default function ExaminerAvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [checkrides, setCheckrides] = useState<CheckrideEntry[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/examiner", { cache: "no-store" });
      if (!res.ok) throw new Error(`Load failed: ${res.status}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setCheckrides(data.checkrides || []);
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSlot = async () => {
    if (!startTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler: ${res.status}`);
      }
      setStartTime("");
      await load();
    } catch (e: any) {
      setError(e.message || "Fehler beim Anlegen");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    if (!confirm("Möchtest du diesen Slot wirklich löschen?")) return;
    setError(null);
    try {
      const res = await fetch("/api/checkrides/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityId: slotId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler: ${res.status}`);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Fehler beim Löschen");
    }
  };

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Prüfungsslots</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Verwalte deine Verfügbarkeiten für Prüfungsflüge
        </p>
      </div>

      {error && <div className="info-danger" style={{ marginBottom: "1.5rem" }}><p>{error}</p></div>}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>lädt…</p></div>
      ) : (
        <>
          <div className="form-card" style={{ maxWidth: "720px", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ marginBottom: "6px", marginTop: 0 }}>Neuen Slot erstellen (2h)</h3>
              <p style={{ margin: 0, fontSize: "0.95em" }}>
                Wähle die Startzeit in UTC; die Endzeit wird automatisch 2 Stunden später gesetzt.
              </p>
            </div>
            <label className="form-label">
              Startzeit
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
              />
            </label>
            <button
              onClick={createSlot}
              disabled={!startTime || submitting}
              className="button form-submit"
              style={{ alignSelf: "flex-start" }}
            >
              {submitting ? "Speichert…" : "Slot speichern"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem" }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Meine verfügbaren Slots</h3>
              {slots.length === 0 ? (
                <p style={{ color: "var(--text-color)", margin: 0 }}>Noch keine Slots</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {slots.map((s) => (
                    <div
                      key={s.id}
                      className="card"
                      style={{
                        marginBottom: 0,
                        padding: "12px 14px",
                        background: "var(--container-bg)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.95em", fontWeight: 500 }}>
                          {new Date(s.startTime).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginTop: "2px" }}>
                          {s.status}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div
                          className="stepper-progress"
                          style={{
                            margin: 0,
                            padding: "4px 10px",
                            fontSize: "0.8em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.status}
                        </div>
                        {s.status === "AVAILABLE" && (
                          <button
                            onClick={() => deleteSlot(s.id)}
                            className="button"
                            style={{
                              padding: "4px 10px",
                              fontSize: "0.8em",
                              margin: 0,
                              backgroundColor: "var(--danger-color, #d32f2f)",
                              color: "white",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Löschen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Geplante Prüfungen</h3>
              {checkrides.length === 0 ? (
                <p style={{ color: "var(--text-color)", margin: 0 }}>Noch keine Buchungen</p>
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
                        {new Date(c.scheduledDate).toLocaleString()}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}
