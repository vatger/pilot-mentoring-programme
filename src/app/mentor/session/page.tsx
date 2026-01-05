"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

// Training topics extracted from the draft
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

interface SessionLog {
  id: string;
  topic: string;
  checked: boolean;
  order: number;
}

export default function SessionLoggingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [comments, setComments] = useState("");
  const [checkedTopics, setCheckedTopics] = useState<Record<string, boolean>>({});
  const [previousSessions, setPreviousSessions] = useState<SessionLog[][]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }

    if (!trainingId) {
      setError("No training ID provided");
      return;
    }

    fetchPreviousSessions();
  }, [status, isMentor, trainingId, router]);

  const fetchPreviousSessions = async () => {
    try {
      const res = await fetch(`/api/sessions?trainingId=${trainingId}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setPreviousSessions(data.map((s: any) => s.topics || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setCheckedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const topicData = TRAINING_TOPICS.map((t, idx) => ({
        topic: t.key,
        checked: checkedTopics[t.key] || false,
        order: idx,
      }));

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId,
          sessionDate,
          comments,
          checkedTopics: topicData,
        }),
      });

      if (!res.ok) throw new Error("Failed to log session");
      setSuccess(true);
      setCheckedTopics({});
      setComments("");
      setSessionDate(new Date().toISOString().split("T")[0]);

      // Refresh previous sessions
      setTimeout(() => {
        fetchPreviousSessions();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  // Check which topics have been covered in previous sessions
  const getCoverageStatus = (topic: string) => {
    return previousSessions.some((session) =>
      session.some((t: SessionLog) => t.topic === topic && t.checked)
    );
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    );
  }

  if (!isMentor) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Access denied. Only mentors can log sessions.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-2">Log Training Session</h1>
        <p className="text-gray-600 mb-8">
          Record which topics were covered in today's training.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded">
            Session logged successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Session Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border rounded"
              required
            />
          </div>

          {/* Topics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Topics Covered</h2>
            <p className="text-sm text-gray-600 mb-4">
              Check the topics you discussed in this session.{" "}
              <span className="text-green-600 font-semibold">
                Green topics
              </span>{" "}
              were covered in previous sessions.
            </p>

            <div className="space-y-3">
              {TRAINING_TOPICS.map((topic) => {
                const isPreviouslyCovered = getCoverageStatus(topic.key);
                return (
                  <label
                    key={topic.key}
                    className={`flex items-center p-3 rounded border cursor-pointer transition ${
                      isPreviouslyCovered
                        ? "bg-green-50 border-green-300"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkedTopics[topic.key] || false}
                      onChange={() => toggleTopic(topic.key)}
                      className="w-5 h-5"
                    />
                    <span
                      className={`ml-3 font-medium ${
                        isPreviouslyCovered
                          ? "text-green-700"
                          : "text-gray-700"
                      }`}
                    >
                      {topic.label}
                    </span>
                    {isPreviouslyCovered && (
                      <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Previously covered
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Session Comments
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Add reminders or notes for the trainee.
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="E.g., Good progress on approach, needs to work on speed management..."
              className="w-full px-4 py-3 border rounded h-32 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Logging Session..." : "Log Session"}
          </button>
        </form>

        {/* Previous Sessions Summary */}
        {previousSessions.length > 0 && (
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Session History</h3>
            <p className="text-sm text-gray-600">
              Total sessions logged: {previousSessions.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Topics covered overall:{" "}
              <span className="font-semibold">
                {
                  new Set(
                    previousSessions
                      .flat()
                      .filter((t: SessionLog) => t.checked)
                      .map((t: SessionLog) => t.topic)
                  ).size
                }
                /{TRAINING_TOPICS.length}
              </span>
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
