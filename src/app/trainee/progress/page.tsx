"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

const TRAINING_TOPICS = [
  { key: "NMOC_BASICS", label: "NMOC & Basics" },
  { key: "ENROUTE_CLEARANCE", label: "Enroute Clearance" },
  { key: "STARTUP_PUSHBACK", label: "Startup & Pushback" },
  { key: "TAXI_RUNWAY", label: "Taxi to Runway" },
  { key: "TAKEOFF", label: "Takeoff" },
  { key: "DEPARTURE", label: "Departure" },
  { key: "ENROUTE", label: "Enroute" },
  { key: "ARRIVAL_TRANSITION", label: "Arrival/Transition" },
  { key: "APPROACH", label: "Approach" },
  { key: "LANDING", label: "Landing" },
  { key: "TAXI_PARKING", label: "Taxi to Parking" },
  { key: "FLIGHT_PLANNING", label: "Flight Planning & Charts" },
  { key: "PRE_FLIGHT", label: "Pre-flight Preparation" },
  { key: "ATC_PHRASEOLOGY", label: "ATC Phraseology" },
  { key: "OFFLINE_TRAINING", label: "Offline Training (Simulator)" },
  { key: "ONLINE_FLIGHT", label: "Online Flight" },
  { key: "CHECK_RIDE", label: "Check Ride" },
  { key: "SELF_BRIEFING", label: "Self Briefing" },
];

interface Mentor {
  mentorId: string;
  mentor: {
    id: string;
    name: string | null;
    cid: string | null;
  };
}

interface SessionTopic {
  topic: string;
  checked: boolean;
  order: number;
}

interface TrainingSession {
  id: string;
  sessionDate: string;
  comments: string | null;
  topics: SessionTopic[];
  createdAt: string;
}

interface Training {
  id: string;
  traineeId: string;
  status: string;
  createdAt: string;
  mentors: Mentor[];
}

export default function TraineeProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");

  const [training, setTraining] = useState<Training | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const isTrainee = userRole === "TRAINEE" || userRole === "PENDING_TRAINEE";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (!trainingId) {
      setError("No training ID provided");
      return;
    }

    fetchData();
  }, [status, trainingId, router]);

  const fetchData = async () => {
    try {
      // Fetch training details
      const trainingRes = await fetch(
        `/api/training/${trainingId}?userId=${userId}`
      );
      if (!trainingRes.ok) throw new Error("Failed to fetch training");
      const trainingData = await trainingRes.json();
      setTraining(trainingData);

      // Fetch sessions
      const sessionsRes = await fetch(
        `/api/sessions?trainingId=${trainingId}`
      );
      if (!sessionsRes.ok) throw new Error("Failed to fetch sessions");
      const sessionsData = await sessionsRes.json();
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getTopicProgress = () => {
    const covered = new Set<string>();
    sessions.forEach((s) => {
      s.topics.forEach((t) => {
        if (t.checked) covered.add(t.topic);
      });
    });
    return covered;
  };

  const coveredTopics = getTopicProgress();

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    );
  }

  if (!training) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          {error || "Training not found"}
        </div>
      </PageLayout>
    );
  }

  // Only trainee or their mentors can view this
  const isMentor = training.mentors.some((m) => m.mentorId === userId);
  if (!isTrainee && !isMentor && userRole !== "ADMIN") {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Access denied. Only the trainee and mentors can view this page.
        </div>
      </PageLayout>
    );
  }

  const progressPercent = Math.round(
    (coveredTopics.size / TRAINING_TOPICS.length) * 100
  );

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-2">Training Progress</h1>

        {/* Training Info */}
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Training Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-lg capitalize">{training.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Started</p>
              <p className="font-semibold">
                {new Date(training.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600 mb-2">Mentors</p>
              <div className="flex gap-2 flex-wrap">
                {training.mentors.map((m) => (
                  <span key={m.mentorId} className="bg-blue-200 text-blue-800 px-3 py-1 rounded">
                    {m.mentor.name} (CID: {m.mentor.cid})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Overall Progress</h2>
            <span className="text-2xl font-bold text-blue-600">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {coveredTopics.size} of {TRAINING_TOPICS.length} topics covered
          </p>
        </div>

        {/* Topics Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRAINING_TOPICS.map((topic) => {
              const isCovered = coveredTopics.has(topic.key);
              return (
                <div
                  key={topic.key}
                  className={`p-4 rounded-lg border-2 transition ${
                    isCovered
                      ? "bg-green-50 border-green-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {topic.label}
                    </span>
                    {isCovered && (
                      <span className="text-green-600 text-xl font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session History */}
        {sessions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Session History</h2>
            <div className="space-y-6">
              {sessions.map((s) => (
                <div key={s.id} className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Session Date</p>
                      <p className="font-semibold text-lg">
                        {new Date(s.sessionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {s.topics.filter((t) => t.checked).length} topics covered
                    </p>
                  </div>

                  {s.comments && (
                    <div className="mb-4 p-3 bg-blue-100 rounded">
                      <p className="text-sm font-semibold text-blue-900">
                        Mentor's Notes:
                      </p>
                      <p className="text-blue-800">{s.comments}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {s.topics.map((topic) => (
                      topic.checked && (
                        <div key={topic.order} className="flex items-center">
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-gray-700">
                            {
                              TRAINING_TOPICS.find((t) => t.key === topic.topic)
                                ?.label
                            }
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="mt-12 text-center p-8 bg-gray-100 rounded-lg">
            <p className="text-gray-600">No session logs yet.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
