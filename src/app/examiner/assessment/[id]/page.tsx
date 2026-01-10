"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";

type Assessment = Record<string, any> & {
  overallResult?: string;
  examinernotes?: string;
};

type Checkride = {
  id: string;
  isDraft: boolean;
  result: string;
  assessment?: Assessment;
};

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

function buildInitial(): Assessment {
  const base: Assessment = {};
  SECTIONS.forEach((section) => {
    section.fields.forEach((f) => {
      base[f.key] = "";
    });
    base[`${section.key}Passed`] = false;
  });
  base.examinernotes = "";
  return base;
}

export default function AssessmentPage() {
  const params = useParams<{ id: string }>();
  const checkrideId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<Assessment>(buildInitial());
  const [overallResult, setOverallResult] = useState<string>("INCOMPLETE");
  const [isDraft, setIsDraft] = useState<boolean>(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    if (!checkrideId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/checkrides/assessment?checkrideId=${checkrideId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Load failed: ${res.status}`);
      const data = await res.json();
      const existing = data?.assessment || buildInitial();
      const { overallResult: existingResult, ...rest } = existing;
      setAssessment(rest as Assessment);
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkrideId]);

  const save = async (opts?: { release?: boolean; silent?: boolean }) => {
    setSaving(!opts?.silent);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/checkrides/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkrideId, release: opts?.release, ...assessment, overallResult }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Fehler: ${res.status}`);
      }
      const payload = await res.json().catch(() => null);
      const savedAssessment = payload?.assessment;
      const savedCheckride = payload?.checkride as Checkride | undefined;
      if (savedAssessment) {
        const { overallResult: savedResult, ...rest } = savedAssessment;
        setAssessment(rest as Assessment);
        setOverallResult(savedResult || overallResult);
      }
      if (savedCheckride && typeof savedCheckride.isDraft === "boolean") {
        setIsDraft(savedCheckride.isDraft);
      }
      if (!opts?.silent) setSuccess(opts?.release ? "Assessment veröffentlicht" : "Gespeichert");
    } catch (e: any) {
      if (!opts?.silent) setError(e.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  // Autosave every 20s
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      save({ silent: true });
    }, 20000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessment, overallResult]);

  const updateField = (key: string, value: string | boolean) => {
    setAssessment((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageLayout>
      <div className="header-container">
        <div className="header">
          <h1>Checkride Assessment</h1>
        </div>
      </div>

      {loading && <div className="card"><p>lädt…</p></div>}
      {error && <div className="info-danger"><p>{error}</p></div>}
      {success && <div className="info-success"><p>{success}</p></div>}

      {!loading && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px", background: "#f6f6f6", borderRadius: "8px" }}>
            <strong>Status:</strong>
            <span>{isDraft ? "Entwurf (nicht freigegeben)" : "Freigegeben für Trainee"}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <label className="form-label" style={{ marginBottom: 0, minWidth: "220px" }}>
              Gesamtergebnis
              <select
                value={overallResult}
                onChange={(e) => setOverallResult(e.target.value)}
                className="form-select"
              >
                <option value="INCOMPLETE">INCOMPLETE</option>
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => save()}
                disabled={saving}
                className="button"
              >
                {saving ? "Speichere…" : "Zwischenspeichern"}
              </button>
              {isDraft && (
                <button
                  onClick={() => save({ release: true })}
                  disabled={saving}
                  className="button"
                >
                  {saving ? "Veröffentliche…" : "Veröffentlichen"}
                </button>
              )}
            </div>
          </div>

          <div className="grid">
            {SECTIONS.map((section) => (
              <div key={section.key} className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>{section.title}</h3>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.95em" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(assessment[`${section.key}Passed`])}
                      onChange={(e) => updateField(`${section.key}Passed`, e.target.checked)}
                    />
                    Bestanden
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                  {section.fields.map((f) => (
                    <label key={f.key} className="form-label" style={{ marginBottom: 0 }}>
                      {f.label}
                      <textarea
                        className="form-textarea"
                        value={assessment[f.key] ?? ""}
                        onChange={(e) => updateField(f.key, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-card" style={{ maxWidth: "100%", margin: 0 }}>
            <label className="form-label">
              Examiner Notizen
              <textarea
                className="form-textarea"
                value={assessment.examinernotes ?? ""}
                onChange={(e) => updateField("examinernotes", e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
