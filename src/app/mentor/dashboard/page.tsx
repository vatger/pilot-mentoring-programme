"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

interface TraineeInfo {
  id: string;
  cid: string;
  name: string;
  email: string | null;
  role: string;
}

interface Mentor {
  id: string;
  name: string | null;
  cid: string | null;
}

interface Training {
  id: string;
  traineeId: string;
  trainee: TraineeInfo;
  status: string;
  createdAt: string;
  mentors: Array<{
    mentorId: string;
    mentor: Mentor;
  }>;
}

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingTrainees, setPendingTrainees] = useState<TraineeInfo[]>([]);
  const [currentTrainings, setCurrentTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }
    fetchData();
  }, [status, isMentor, router]);

  const fetchData = async () => {
    try {
      // Fetch pending trainees
      const traineesRes = await fetch("/api/mentor/pending-trainees");
      if (!traineesRes.ok) throw new Error("Failed to fetch trainees");
      const traineesData = await traineesRes.json();
      setPendingTrainees(traineesData);

      // Fetch current trainings for this mentor
      const trainingsRes = await fetch("/api/mentor/my-trainings");
      if (!trainingsRes.ok) throw new Error("Failed to fetch trainings");
      const trainingsData = await trainingsRes.json();
      setCurrentTrainings(trainingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const assignTrainee = async (traineeId: string) => {
    setAssigning(traineeId);
    try {
      const res = await fetch("/api/training/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeId }),
      });
      if (!res.ok) throw new Error("Failed to assign trainee");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAssigning(null);
    }
  };

  const cancelTraining = async (trainingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this training?")) {
      return;
    }

    try {
      const res = await fetch("/api/training/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId }),
      });
      if (!res.ok) throw new Error("Failed to cancel training");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const logSession = (trainingId: string) => {
    router.push(`/mentor/session?trainingId=${trainingId}`);
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
          Access denied. Only mentors can access this page.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">Mentor Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Current Trainings */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">My Current Trainees</h2>
          {currentTrainings.length === 0 ? (
            <p className="text-gray-600">You don't have any active trainees yet.</p>
          ) : (
            <div className="space-y-4">
              {currentTrainings.map((training) => (
                <div
                  key={training.id}
                  className="border rounded-lg p-6 bg-blue-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {training.trainee.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        CID: {training.trainee.cid}
                      </p>
                      <p className="text-sm text-gray-600">
                        Role: {training.trainee.role}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Co-mentors: {training.mentors.length}/{training.mentors.length === 1 ? '1 (add up to 2 more)' : '3 max'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => logSession(training.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Log Session
                      </button>
                      <button
                        onClick={() => router.push(`/mentor/trainee/${training.trainee.id}?trainingId=${training.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Progress
                      </button>
                      <button
                        onClick={() => cancelTraining(training.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Trainees */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Available Trainees</h2>
          {pendingTrainees.length === 0 ? (
            <p className="text-gray-600">No pending trainees available.</p>
          ) : (
            <div className="grid gap-4">
              {pendingTrainees.map((trainee) => (
                <div
                  key={trainee.id}
                  className="border rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{trainee.name}</h3>
                      <p className="text-sm text-gray-600">
                        CID: {trainee.cid}
                      </p>
                      <p className="text-sm text-gray-600">
                        Email: {trainee.email || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => assignTrainee(trainee.id)}
                      disabled={assigning === trainee.id}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {assigning === trainee.id ? "Assigning..." : "Assign to Me"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
