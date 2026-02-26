export const trainingTopics = [
  { key: "NMOC_BASICS", label: "Vatsim Basics", category: "THEORY" },
  { key: "IFR_PHASES", label: "IFR Basics", category: "THEORY" },
  { key: "ENROUTE_CLEARANCE", label: "Enroute Clearance", category: "PRACTICE" },
  { key: "STARTUP_PUSHBACK", label: "Startup and Pushback", category: "PRACTICE" },
  { key: "TAXI_RUNWAY", label: "Taxi Out", category: "PRACTICE" },
  { key: "TAKEOFF", label: "Take Off", category: "PRACTICE" },
  { key: "DEPARTURE", label: "Departure", category: "PRACTICE" },
  { key: "ENROUTE", label: "Enroute", category: "PRACTICE" },
  { key: "ARRIVAL_TRANSITION", label: "Arrival / Transition to Final", category: "PRACTICE" },
  { key: "LANDING", label: "Approach", category: "PRACTICE" },
  { key: "TAXI_PARKING", label: "Taxi In", category: "PRACTICE" },
  { key: "GO_AROUND", label: "Missed Approach / Go Around", category: "PRACTICE" },
  { key: "HOLDING", label: "Holding", category: "PRACTICE" },
  { key: "FLIGHT_PLANNING_PRACTICE", label: "IFR Praxis", category: "PRACTICE" },
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
