export type TrainingTypeValue = "STANDARD" | "ONLINE_COACHING";

export const isCoachingTraining = (trainingType?: string | null): trainingType is "ONLINE_COACHING" =>
  trainingType === "ONLINE_COACHING";

export const getTrainingTypeLabel = (trainingType?: string | null) =>
  isCoachingTraining(trainingType) ? "Coaching" : "Airliner-Training";

export const getTrainingTypeColors = (trainingType?: string | null) =>
  isCoachingTraining(trainingType)
    ? {
        background: "rgba(76, 175, 80, 0.15)",
        color: "#4caf50",
      }
    : {
        background: "rgba(77, 142, 219, 0.15)",
        color: "#4d8edb",
      };