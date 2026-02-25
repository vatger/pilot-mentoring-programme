"use client";

import { useEffect, useMemo, useState } from "react";
import PageLayout from "@/components/PageLayout";

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

  const hasReady = training?.readyForCheckride;

  const bookedInfo = useMemo(() => {
    if (!booking) return null;
    return {
      date: new Date(booking.scheduledDate).toLocaleString(),
      examiner:
        booking.availability.examiner?.name
          ? `${booking.availability.examiner.name} (${booking.availability.examiner.cid || ""})`
          : booking.availability.examinerId,
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
    ? "Checkride angefragt (Termin folgt über Mentor)"
    : "Noch nicht bereit für Checkride";

  const SECTIONS: { key: string; title: string; fields: { key: string; label: string }[] }[] = [
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
        { key: "startupExecution", label: "Ausführung" },
      ],
    },
    {
      key: "taxi",
      title: "6 - Taxi to Runway",
      fields: [
        { key: "taxiStation", label: "Station / CS" },
        { key: "taxiRequest", label: "Request" },
        { key: "taxiReadback", label: "Readback / CS" },
        { key: "taxiExecution", label: "Ausführung" },
      ],
    },
    {
      key: "takeoff",
      title: "7 - Takeoff",
      fields: [
        { key: "takeoffStation", label: "Station / CS" },
        { key: "takeoffReadback", label: "Readback / CS" },
        { key: "takeoffExecution", label: "Ausführung" },
      ],
    },
    {
      key: "departure",
      title: "8 - Departure",
      fields: [
        { key: "departureStatement", label: "Meldung" },
        { key: "departureStation", label: "Station / CS / Altitude" },
        { key: "departureReadback", label: "Readback / CS" },
        { key: "departureExecution", label: "Ausführung" },
      ],
    },
    {
      key: "enroute",
      title: "9 - Enroute",
      fields: [
        { key: "enrouteStation", label: "Station / CS / FL" },
        { key: "enrouteReadbacks", label: "Readbacks" },
        { key: "enrouteExecution", label: "Ausführung" },
      ],
    },
    {
      key: "arrival",
      title: "10 - Arrival / Transition",
      fields: [
        { key: "arrivalStation", label: "Station / CS / FL" },
        { key: "arrivalClearances", label: "Freigaben / Anweisungen" },
        { key: "arrivalExecution", label: "Ausführung" },
      ],
    },
    {
      key: "landing",
      title: "11 - Landung",
      fields: [
        { key: "landingStation", label: "Station / CS / APP" },
        { key: "landingClearance", label: "Landing Clearance" },
        { key: "landingExecution", label: "Ausführung" },
      ],
    },
    {
      key: "parking",
      title: "12 - Taxi to Parking",
      fields: [
        { key: "parkingStation", label: "Station / CS / TWY" },
        { key: "parkingReadback", label: "Readback" },
        { key: "parkingExecution", label: "Ausführung" },
      ],
    },
  ];

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Checkride Center</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Sieh deinen bestätigten Termin und später dein Ergebnis ein
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Loading…</p></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Status</h3>
            <div className="stepper-progress" style={{ margin: 0, marginBottom: "8px" }}>
              {statusText}
            </div>
            <p style={{ margin: 0, fontSize: "0.95em" }}>
              {hasReady
                ? "Dein Mentor koordiniert den Termin mit dir und bestätigt anschließend einen Prüfer-Slot."
                : "Dein Mentor muss dich als bereit für deine Prüfung markieren."}
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
                  <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>Prüfer</div>
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
                  <div style={{ fontSize: "1.1em", fontWeight: 600 }}>
                    {assessment.overallResult}
                  </div>
                </div>
                {assessment.examinernotes && (
                  <div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "4px" }}>
                      Anmerkungen des Prüfers
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
                      {assessment.examinernotes || "-"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {assessment && (
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Vollständiges Log</h3>
              <div className="grid">
                {SECTIONS.map((section) => (
                  <div key={section.key} className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                      <strong>{section.title}</strong>
                      <span style={{ fontSize: "0.9em", padding: "4px 8px", borderRadius: "6px", background: assessment[`${section.key}Passed`] ? "#e6f4ea" : "#fce8e6", color: assessment[`${section.key}Passed`] ? "#1e8e3e" : "#b3261e" }}>
                        {assessment[`${section.key}Passed`] ? "Bestanden" : "Nicht bestanden"}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                      {section.fields.map((f) => (
                        <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ fontSize: "0.9em", color: "var(--text-color)" }}>{f.label}</div>
                          <div style={{ fontSize: "0.95em", whiteSpace: "pre-wrap", backgroundColor: "var(--container-bg)", padding: "8px 10px", borderRadius: "6px", minHeight: "44px" }}>
                            {assessment[f.key] || "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
