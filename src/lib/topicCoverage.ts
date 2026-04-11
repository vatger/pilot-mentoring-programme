import { trainingTopics } from "@/lib/trainingTopics";

const topicCategoryByKey = Object.fromEntries(
  trainingTopics.map((topic) => [topic.key, topic.category])
) as Record<string, "THEORY" | "PRACTICE">;

type TopicCoverageInput = {
  topic: string;
  checked?: boolean;
  coverageMode?: "THEORIE" | "PRAXIS" | null;
  theoryCovered?: boolean | null;
  practiceCovered?: boolean | null;
};

export function normalizeTopicCoverage<T extends TopicCoverageInput>(topic: T): T & {
  coverageMode: "THEORIE" | "PRAXIS";
  theoryCovered: boolean;
  practiceCovered: boolean;
} {
  const checked = topic.checked === true;
  if (!checked) {
    return {
      ...topic,
      coverageMode: "THEORIE",
      theoryCovered: false,
      practiceCovered: false,
    };
  }

  const hasTheoryFlag = typeof topic.theoryCovered === "boolean";
  const hasPracticeFlag = typeof topic.practiceCovered === "boolean";
  const theoryCovered = topic.theoryCovered === true;
  const practiceCovered = topic.practiceCovered === true;

  // Keep explicit coverage from newer records unchanged.
  if (theoryCovered || practiceCovered) {
    return {
      ...topic,
      theoryCovered,
      practiceCovered,
      coverageMode: practiceCovered ? "PRAXIS" : "THEORIE",
    };
  }

  const hasAnyCoverageField = hasTheoryFlag || hasPracticeFlag || topic.coverageMode === "THEORIE" || topic.coverageMode === "PRAXIS";
  const isAmbiguousLegacyChecked = hasAnyCoverageField && checked && !theoryCovered && !practiceCovered;

  if (!isAmbiguousLegacyChecked && topic.coverageMode === "PRAXIS") {
    return {
      ...topic,
      coverageMode: "PRAXIS",
      theoryCovered: false,
      practiceCovered: true,
    };
  }

  if (!isAmbiguousLegacyChecked && topic.coverageMode === "THEORIE") {
    return {
      ...topic,
      coverageMode: "THEORIE",
      theoryCovered: true,
      practiceCovered: false,
    };
  }

  const category = topicCategoryByKey[topic.topic] || "THEORY";
  const isPracticeTopic = category === "PRACTICE";

  return {
    ...topic,
    coverageMode: isPracticeTopic ? "PRAXIS" : "THEORIE",
    theoryCovered: !isPracticeTopic,
    practiceCovered: isPracticeTopic,
  };
}
