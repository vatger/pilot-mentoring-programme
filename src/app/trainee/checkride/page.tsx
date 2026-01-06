"use client";

import { useEffect, useMemo, useState } from "react";
import PageLayout from "@/components/PageLayout";

type AvailableSlot = {
  id: string;
  examinerId: string;
  startTime: string;
  endTime: string;
  status: string;
};

type CheckrideBooking = {
  id: string;
  scheduledDate: string;
  result: string;
  isDraft: boolean;
  availability: AvailableSlot;
  assessment?: any;
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
  const [assessment, setAssessment] = useState<any>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const hasReady = training?.readyForCheckride;

  const bookedInfo = useMemo(() => {
    if (!booking) return null;
    return {
      date: new Date(booking.scheduledDate).toLocaleString(),
      examiner: booking.availability.examinerId,
      result: booking.result,
      draft: booking.isDraft,
    };
  }, [booking]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/me", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`);
      }
      const data = await res.json();
      setTraining(data.training);
      setBooking(data.booking);
      setAssessment(data.assessment);
      setSlots(data.availableSlots || []);
    } catch (e: any) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const book = async () => {
    if (!selectedSlot || !training) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkrides/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId: training.id, availabilityId: selectedSlot }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler: ${res.status}`);
      }
      await load();
      setSelectedSlot("");
    } catch (e: any) {
      setError(e.message || "Fehler bei Buchung");
    } finally {
      setSubmitting(false);
    }
  };

  const statusText = assessment
    ? "Assessment freigegeben"
    : booking
    ? "Checkride gebucht (Warten auf Assessment)"
    : hasReady
    ? "Bereit für Checkride"
    : "Noch nicht bereit für Checkride";

  return (
    <PageLayout>
      <div className="header-container">
        <div className="header">
          <h1>Checkride Center</h1>
        </div>
      </div>

      {error && (
        <div className="info-danger">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card"><p>lädt…</p></div>
      ) : (
        <>
          <div className="card">
            <div className="stepper-progress" style={{ marginBottom: "8px" }}>{statusText}</div>
            <p style={{ marginBottom: 0 }}>
              {hasReady
                ? "Du kannst jetzt einen Slot buchen, sobald ein Examiner ihn freigibt."
                : "Dein Mentor muss dich zuerst für den Checkride freigeben."}
            </p>
          </div>

          {booking && (
            <div className="card">
              <h3>Gebuchter Slot</h3>
              <p>Zeit: {bookedInfo?.date}</p>
              <p>Examiner: {bookedInfo?.examiner}</p>
              <p>Status: {booking.isDraft ? "Assessment in Bearbeitung" : booking.result}</p>
            </div>
          )}

          {assessment && (
            <div className="card info-success" style={{ marginBottom: 0 }}>
              <h3>Assessment</h3>
              <p>Ergebnis: {assessment.overallResult}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>Notizen: {assessment.examinernotes || "-"}</p>
            </div>
          )}

          {!booking && hasReady && (
            <div className="form-card" style={{ maxWidth: "720px" }}>
              <div>
                <h3 style={{ marginBottom: "6px" }}>Slot buchen</h3>
                <p style={{ margin: 0 }}>Verfügbare Zeitfenster werden von den Prüfern eingestellt.</p>
              </div>
              {slots.length === 0 && <p style={{ margin: 0 }}>Keine verfügbaren Slots.</p>}
              {slots.length > 0 && (
                <>
                  <label className="form-label">
                    Slot auswählen
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Bitte wählen</option>
                      {slots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {new Date(s.startTime).toLocaleString()} (Examiner {s.examinerId})
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={book}
                    disabled={!selectedSlot || submitting}
                    className="button form-submit"
                  >
                    {submitting ? "Buchen…" : "Slot buchen"}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
