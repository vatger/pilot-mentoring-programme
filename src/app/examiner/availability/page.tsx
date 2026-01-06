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

  return (
    <PageLayout>
      <div className="header-container">
        <div className="header">
          <h1>Examiner Slots</h1>
        </div>
      </div>

      {loading && <div className="card"><p>lädt…</p></div>}
      {error && <div className="info-danger"><p>{error}</p></div>}

      <div className="form-card" style={{ maxWidth: "720px" }}>
        <div>
          <h3 style={{ marginBottom: "6px" }}>Neuen Slot anlegen (2h)</h3>
          <p style={{ margin: 0 }}>Wähle Startzeit in UTC; Endzeit wird automatisch 2 Stunden später gesetzt.</p>
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
        >
          {submitting ? "Speichere…" : "Slot speichern"}
        </button>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Meine Slots</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflow: "auto" }}>
            {slots.length === 0 && <p style={{ margin: 0 }}>Keine Slots</p>}
            {slots.map((s) => (
              <div key={s.id} className="card" style={{ marginBottom: 0, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span>{new Date(s.startTime).toLocaleString()}</span>
                  <span className="stepper-progress" style={{ margin: 0, textTransform: "uppercase" }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Gebuchte Checkrides</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflow: "auto" }}>
            {checkrides.length === 0 && <p style={{ margin: 0 }}>Keine Buchungen</p>}
            {checkrides.map((c) => (
              <div key={c.id} className="card" style={{ marginBottom: 0, padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontWeight: 600 }}>
                  {c.trainee.name || "Trainee"} ({c.trainee.cid || "CID"})
                </div>
                <div>{new Date(c.scheduledDate).toLocaleString()}</div>
                <div>Status: {c.isDraft ? "Assessment in Bearbeitung" : c.result}</div>
                <a href={`/examiner/assessment/${c.id}`} className="link-like">Assessment öffnen</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
