export const trainingTopics = [
  { key: "NMOC_BASICS", label: "Wiederholung New Member Orientation Course", category: "THEORY" },
  { key: "IFR_PHASES", label: "Phasen eines IFR-Flugs", category: "THEORY" },
  { key: "FLIGHT_PLANNING", label: "Flugplanung und Charts", category: "THEORY" },
  { key: "PRE_FLIGHT", label: "Flugvorbereitung", category: "THEORY" },
  { key: "FLIGHT_PLANNING_PRACTICE", label: "Flugplanung und -vorbereitung", category: "PRACTICE" },
  { key: "SELF_BRIEFING", label: "Self Briefing", category: "PRACTICE" },
  { key: "ENROUTE_CLEARANCE", label: "Enroute Clearance", category: "PRACTICE" },
  { key: "STARTUP_PUSHBACK", label: "Startup and Pushback", category: "PRACTICE" },
  { key: "TAXI_RUNWAY", label: "Taxi to Runway", category: "PRACTICE" },
  { key: "TAKEOFF", label: "Take Off", category: "PRACTICE" },
  { key: "DEPARTURE", label: "Departure", category: "PRACTICE" },
  { key: "ENROUTE", label: "Enroute", category: "PRACTICE" },
  { key: "ARRIVAL_TRANSITION", label: "Arrival / Transition", category: "PRACTICE" },
  { key: "LANDING", label: "Landing", category: "PRACTICE" },
  { key: "TAXI_PARKING", label: "Taxi to Gate", category: "PRACTICE" },
  { key: "GO_AROUND", label: "Go Around", category: "PRACTICE" },
  { key: "HOLDING", label: "Holding", category: "PRACTICE" },
] as const;

export type TrainingTopicKey = (typeof trainingTopics)[number]["key"];

export const trainingTopicKeys: TrainingTopicKey[] = trainingTopics.map((t) => t.key);

export const trainingTopicLabelMap: Record<string, string> = trainingTopics.reduce(
  (acc, topic) => {
    acc[topic.key] = topic.label;
    return acc;
  },
  {} as Record<string, string>
);
