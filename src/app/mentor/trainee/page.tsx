"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";

type Trainee = {
  id: string;
  cid: string | null;
  name: string | null;
  email: string | null;
};

type Training = {
  id: string;
  status: string;
  readyForCheckride: boolean;
  createdAt: string;
  trainee: Trainee;
  sessions: { id: string }[];
};

export default function MentorTraineePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }

    fetchTrainings();
  }, [status, isMentor, router]);

  const fetchTrainings = async () => {
    try {
      const res = await fetch("/api/trainings/mentor");
      if (!res.ok) throw new Error("Failed to fetch trainings");
      const data = await res.json();
      setTrainings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="card"><p>lädt…</p></div>
      </PageLayout>
    );
  }

  if (!isMentor) {
    return (
      <PageLayout>
        <div className="info-danger">
          <p>Access denied. Only mentors can view this page.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="header-container">
        <div className="header">
          <h1>My Trainees</h1>
        </div>
      </div>

      {error && (
        <div className="info-danger">
          <p>{error}</p>
        </div>
      )}

      {trainings.length === 0 && !loading && (
        <div className="card">
          <h3>No Trainees</h3>
          <p>You don't have any assigned trainees yet.</p>
        </div>
      )}

      {trainings.length > 0 && (
        <div className="grid">
          {trainings.map((training) => (
            <div key={training.id} className="card">
              <h3 style={{ marginBottom: "8px" }}>
                {training.trainee.name || "Trainee"}
              </h3>
              <p style={{ margin: "4px 0", fontSize: "0.95em" }}>
                CID: {training.trainee.cid || "N/A"}
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.95em" }}>
                Status:{" "}
                <span
                  className="stepper-progress"
                  style={{
                    display: "inline-block",
                    margin: "0 0 0 4px",
                    padding: "2px 8px",
                  }}
                >
                  {training.status}
                </span>
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.95em" }}>
                Sessions: {training.sessions.length}
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.95em" }}>
                Ready for Checkride:{" "}
                {training.readyForCheckride ? (
                  <span style={{ color: "var(--accent-color)", fontWeight: 600 }}>
                    Yes
                  </span>
                ) : (
                  "No"
                )}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={`/mentor/session?trainingId=${training.id}`}
                  className="button"
                  style={{ margin: 0 }}
                >
                  Log Session
                </Link>
                <Link
                  href={`/trainee/progress?trainingId=${training.id}`}
                  className="button"
                  style={{ margin: 0 }}
                >
                  View Progress
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
