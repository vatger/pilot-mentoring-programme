export type RubricRating =
  | ""
  | "Erfüllt"
  | "Teilweise erfüllt"
  | "Nicht erfüllt"
  | "Nicht anwendbar";

export const RUBRIC_RATING_OPTIONS: Array<{ value: Exclude<RubricRating, "">; label: string }> = [
  { value: "Erfüllt", label: "Erfüllt" },
  { value: "Teilweise erfüllt", label: "Teilweise erfüllt" },
  { value: "Nicht erfüllt", label: "Nicht erfüllt" },
  { value: "Nicht anwendbar", label: "Nicht anwendbar" },
];

const LEGACY_RATING_MAP: Record<string, Exclude<RubricRating, "">> = {
  OK: "Erfüllt",
  NOK: "Nicht erfüllt",
  NA: "Nicht anwendbar",
};

export function normalizeRubricRating(value: string | null | undefined): RubricRating {
  if (!value) return "";
  if (value in LEGACY_RATING_MAP) {
    return LEGACY_RATING_MAP[value];
  }
  if (RUBRIC_RATING_OPTIONS.some((option) => option.value === value)) {
    return value as Exclude<RubricRating, "">;
  }
  return value as RubricRating;
}

export function formatRubricRating(value: string | null | undefined): string {
  const normalized = normalizeRubricRating(value);
  return normalized ? normalized.replace(/erfuellt/g, "erfüllt") : "-";
}

export type RubricRow = {
  code: "A" | "N" | "C";
  criterion: string;
  hint?: string;
  fieldKey: string;
};

export type RubricProcedure = {
  id: string;
  title: string;
  rows: RubricRow[];
};

export type RubricBlockNotes = Record<string, string>;

export const RUBRIC_CODE_COLORS: Record<"A" | "N" | "C", { bg: string; fg: string }> = {
  A: { bg: "#d8f5df", fg: "#0f5132" },
  N: { bg: "#d8e7ff", fg: "#0b3d91" },
  C: { bg: "#ffe5c2", fg: "#7a3f00" },
};

export const RUBRIC_ROW_TINTS: Record<"A" | "N" | "C", string> = {
  A: "rgba(15, 81, 50, 0.08)",
  N: "rgba(11, 61, 145, 0.08)",
  C: "rgba(122, 63, 0, 0.08)",
};

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((c) => `${c}${c}`).join("")
    : value;
  const num = parseInt(normalized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getRubricBlockTone(procedure: RubricProcedure): {
  dominantCode: "A" | "N" | "C";
  borderColor: string;
  backgroundColor: string;
} {
  const counts: Record<"A" | "N" | "C", number> = { A: 0, N: 0, C: 0 };
  for (const row of procedure.rows) {
    counts[row.code] += 1;
  }

  const dominantCode = (["A", "N", "C"] as const).reduce((best, code) =>
    counts[code] > counts[best] ? code : best
  , "A");

  return {
    dominantCode,
    borderColor: RUBRIC_CODE_COLORS[dominantCode].fg,
    backgroundColor: hexToRgba(RUBRIC_CODE_COLORS[dominantCode].bg, 0.35),
  };
}

const LEGACY_STORAGE_KEYS = [
  "flightplanCallsign",
  "flightplanAircraft",
  "flightplanRouting",
  "flightplanTimes",
  "flightplanRemarks",
  "chartsParkingDep",
  "chartsTaxiDep",
  "chartsDeparture",
  "chartsEnroute",
  "chartsArrivalTransition",
  "chartsApproach",
  "chartsTaxiDest",
  "chartsParkingDest",
  "briefingFrequencies",
  "briefingPushback",
  "briefingTaxiRunway",
  "briefingATCTakeoff",
  "briefingDeparture",
  "briefingArrival",
  "briefingApproach",
  "briefingRunwayExits",
  "briefingTaxiParking",
  "clearanceInitialCall",
  "clearanceRequest",
  "clearanceClearedTo",
  "clearanceDeparture",
  "clearanceRoute",
  "clearanceClimb",
  "clearanceSquawk",
  "clearanceCallsign",
  "startupStation",
  "startupGate",
  "startupReadback",
  "startupExecution",
  "taxiStation",
  "taxiRequest",
  "taxiReadback",
  "taxiExecution",
  "takeoffStation",
  "takeoffReadback",
  "takeoffExecution",
  "departureStatement",
  "departureStation",
  "departureReadback",
  "departureExecution",
  "enrouteStation",
  "enrouteReadbacks",
  "enrouteExecution",
  "arrivalStation",
  "arrivalClearances",
];

type RowInput = {
  code: "A" | "N" | "C";
  criterion: string;
  hint?: string;
};

type ProcedureInput = {
  id: string;
  title: string;
  rows: RowInput[];
};

const ODT_PROCEDURES: ProcedureInput[] = [
  {
    id: "P1",
    title: "P1 - Enroute Clearance",
    rows: [
      { code: "C", criterion: "Clearance Request" },
      { code: "C", criterion: "ATIS" },
      { code: "C", criterion: "Clearance Readback", hint: "OK wenn \"Readback correct\"" },
    ],
  },
  {
    id: "P2",
    title: "P2 - Pushback",
    rows: [
      { code: "C", criterion: "Pushback Request", hint: "Gate number" },
      { code: "A", criterion: "Beacon Lights" },
      { code: "A", criterion: "Zeit bis PB Start", hint: "2 Min nach Freigabe" },
      { code: "A", criterion: "Ausfuehrung PB" },
      { code: "N", criterion: "Taxi Position" },
      { code: "A", criterion: "Zeit bis ready for taxi", hint: "5 Min nach Freigabe" },
    ],
  },
  {
    id: "P3",
    title: "P3 - Taxi to Runway",
    rows: [
      { code: "C", criterion: "Taxi Request" },
      { code: "A", criterion: "Taxi Lights / Transponder" },
      { code: "A", criterion: "Taxi Speed" },
      { code: "A", criterion: "Hold short / Give Way" },
      { code: "N", criterion: "Taxiways / Holding Point" },
      { code: "C", criterion: "TWR Handoff" },
    ],
  },
  {
    id: "P4",
    title: "P4 - Take Off",
    rows: [
      { code: "C", criterion: "Take Off Clearance" },
      { code: "A", criterion: "Strobes / Landing Lights" },
      { code: "A", criterion: "Line Up / Take Off" },
    ],
  },
  {
    id: "P5",
    title: "P5 - Departure",
    rows: [
      { code: "C", criterion: "Meldung bei DEP" },
      { code: "C", criterion: "Climb Clearance" },
      { code: "A", criterion: "Restrictions" },
      { code: "A", criterion: "Further Climb / Level Off" },
      { code: "A", criterion: "Baro STD" },
      { code: "N", criterion: "Direct" },
    ],
  },
  {
    id: "P6",
    title: "P6 - Enroute",
    rows: [
      { code: "N", criterion: "Route Deviations" },
      { code: "C", criterion: "Readback / Handoff" },
    ],
  },
  {
    id: "P7",
    title: "P7 - Descent",
    rows: [
      { code: "C", criterion: "Descent Clearance / Request" },
      { code: "A", criterion: "Descent Mode / Speed" },
      { code: "N", criterion: "Descent Target" },
      { code: "C", criterion: "Arrival Clearance / Handoff" },
    ],
  },
  {
    id: "P8",
    title: "P8 - Arrival / Transition",
    rows: [
      { code: "A", criterion: "Descent Management" },
      { code: "A", criterion: "Landing Lights" },
      { code: "A", criterion: "QNH at Transition Level" },
      { code: "A", criterion: "Speed Restrictions" },
      { code: "N", criterion: "Lateral / vertical navigation" },
      { code: "C", criterion: "Readback" },
    ],
  },
  {
    id: "P9",
    title: "P9 - Final Approach / Landing",
    rows: [
      { code: "C", criterion: "Approach Clearance" },
      { code: "A", criterion: "Lateral / vertical navigation" },
      { code: "A", criterion: "Speed Management" },
      { code: "N", criterion: "ILS Capture" },
      { code: "C", criterion: "TWR Handoff" },
      { code: "C", criterion: "Landing Clearance" },
      { code: "A", criterion: "Runway Vacation", hint: "Stop clear of HP" },
      { code: "A", criterion: "Lights off" },
      { code: "C", criterion: "GND Handoff" },
    ],
  },
  {
    id: "P10",
    title: "P10 - Taxi to Parking",
    rows: [
      { code: "C", criterion: "Ground Call" },
      { code: "C", criterion: "Taxi Clearance" },
      { code: "A", criterion: "Taxi Speed / Hold Short" },
      { code: "N", criterion: "Taxiways / Gate" },
    ],
  },
];

function buildProcedures(): RubricProcedure[] {
  let keyIndex = 0;
  return ODT_PROCEDURES.map((procedure) => ({
    id: procedure.id,
    title: procedure.title,
    rows: procedure.rows.map((row) => {
      const fieldKey = LEGACY_STORAGE_KEYS[keyIndex++];
      if (!fieldKey) {
        throw new Error("Not enough legacy storage keys to map ODT rubric rows.");
      }
      return {
        code: row.code,
        criterion: row.criterion,
        hint: row.hint,
        fieldKey,
      };
    }),
  }));
}

export const CHECKRIDE_RUBRIC = buildProcedures();

export const CHECKRIDE_BLOCK_IDS = CHECKRIDE_RUBRIC.map((p) => p.id);

const NOTES_PAYLOAD_PREFIX = "__RUBRIC_NOTES_V1__";

export const CHECKRIDE_RUBRIC_INTRO = {
  title: "PMP Check Ride",
  objective:
    "Ziel des PMP (und damit auch der Umfang des Check Ride) ist der selbststaendige Flug zwischen zwei One-Runway-Airports mit ILS unter ATC.",
  legend: [
    "Erfüllt - Kriterium erfüllt",
    "Teilweise erfüllt - Kriterium nur teilweise erfüllt",
    "Nicht erfüllt - Kriterium nicht / nicht ausreichend erfüllt",
    "Nicht anwendbar - Kriterium nicht zutreffend",
  ],
  pillars: [
    "Aviate: Bedienung des Flugzeugs, soweit relevant fuer Online",
    "Navigate: Zustand des Flugzeugs nach Position, Hoehe, Richtung, Geschwindigkeit",
    "Communicate: Interaktion mit ATC und der Umgebung",
  ],
};

export function createInitialRubricAssessment(): Record<string, string> {
  const base: Record<string, string> = {};
  for (const procedure of CHECKRIDE_RUBRIC) {
    for (const row of procedure.rows) {
      base[row.fieldKey] = "";
    }
  }
  return base;
}

export function createInitialBlockNotes(): RubricBlockNotes {
  const notes: RubricBlockNotes = {};
  for (const id of CHECKRIDE_BLOCK_IDS) {
    notes[id] = "";
  }
  return notes;
}

export function serializeRubricNotes(
  generalNote: string,
  blockNotes: RubricBlockNotes
): string {
  return `${NOTES_PAYLOAD_PREFIX}${JSON.stringify({
    generalNote: generalNote || "",
    blockNotes,
  })}`;
}

export function parseRubricNotes(raw: string | null | undefined): {
  generalNote: string;
  blockNotes: RubricBlockNotes;
} {
  const fallback = {
    generalNote: raw || "",
    blockNotes: createInitialBlockNotes(),
  };

  if (!raw || !raw.startsWith(NOTES_PAYLOAD_PREFIX)) {
    return fallback;
  }

  try {
    const payload = JSON.parse(raw.slice(NOTES_PAYLOAD_PREFIX.length));
    const next = createInitialBlockNotes();
    const incoming = (payload?.blockNotes || {}) as Record<string, unknown>;
    for (const id of CHECKRIDE_BLOCK_IDS) {
      const value = incoming[id];
      next[id] = typeof value === "string" ? value : "";
    }
    return {
      generalNote:
        typeof payload?.generalNote === "string" ? payload.generalNote : "",
      blockNotes: next,
    };
  } catch {
    return fallback;
  }
}
