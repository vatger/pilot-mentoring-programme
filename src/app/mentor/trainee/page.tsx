"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";
import { trainingTopics } from "@/lib/trainingTopics";

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
  sessions: { id: string; topics: { topic: string; checked: boolean }[] }[];
};

export default function MentorTraineePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";
  const isLeitung = userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

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
      const endpoint = isLeitung ? "/api/trainings/leitung" : "/api/trainings/mentor";
      const res = await fetch(endpoint);
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
          <p>Zugriff verweigert. Nur Mentoren können diese Seite ansehen.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>{isLeitung ? "Alle Trainees" : "Meine Trainees"}</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          {isLeitung
            ? "Übersicht aller aktiven Trainings (Management Ansicht)"
            : "Deine zugewiesenen Trainees"}
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Loading...</p></div>
      ) : trainings.length === 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>No Trainees</h3>
          <p style={{ margin: 0 }}>
            {isLeitung
              ? "Keine aktiven Trainings gefunden."
              : "Du hast noch keine zugewiesenen Trainees."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {trainings.map((training) => {
            const covered = new Set(
              training.sessions
                .flatMap((s) => s.topics)
                .filter((t) => t.checked)
                .map((t) => t.topic)
            );
            const coveragePercent = Math.round(
              (covered.size / trainingTopics.length) * 100
            );

            return (
              <div key={training.id} className="card">
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.15em" }}>
                  {training.trainee.name || "Trainee"}
                </h3>

                <div style={{ display: "grid", gap: "8px", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                      CID
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.95em" }}>
                      {training.trainee.cid || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                      Status
                    </div>
                    <div
                      className="stepper-progress"
                      style={{
                        display: "inline-block",
                        margin: "0.25rem 0 0 0",
                        padding: "4px 10px",
                        fontSize: "0.85em",
                      }}
                    >
                      {training.status}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                      Progress
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background: "var(--footer-border)",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${coveragePercent}%`,
                            height: "100%",
                            background: "var(--accent-color)",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: "0.8em", fontWeight: 600, minWidth: "35px" }}>
                        {covered.size}/{trainingTopics.length}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                      Sessions
                    </div>
                    <div style={{ fontSize: "0.95em" }}>
                      {training.sessions.length} gelogged
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                      Bereit für Check Ride
                    </div>
                    <div
                      style={{
                        fontSize: "0.95em",
                        fontWeight: 600,
                        color: training.readyForCheckride
                          ? "var(--accent-color)"
                          : "var(--text-color)",
                      }}
                    >
                      {training.readyForCheckride ? "✓ Yes" : "Not yet"}
                    </div>
                  </div>

                  {isLeitung && (training as any).mentors && (
                    <div>
                      <div style={{ fontSize: "0.85em", color: "var(--text-color)", fontWeight: 500 }}>
                        Mentoren
                      </div>
                      <div style={{ fontSize: "0.9em" }}>
                        {(training as any).mentors
                          .map(
                            (m: any) =>
                              m.mentor?.name || m.mentor?.cid || "Unbekannt"
                          )
                          .join(", ") || "-"}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "1fr 1fr" }}>
                  <Link
                    href={`/mentor/session?trainingId=${training.id}`}
                    className="button"
                    style={{ margin: 0, padding: "8px 12px", fontSize: "0.9em" }}
                  >
                    Log Session
                  </Link>
                  <Link
                    href={`/trainee/progress?trainingId=${training.id}`}
                    className="button"
                    style={{ margin: 0, padding: "8px 12px", fontSize: "0.9em" }}
                  >
                    Fortschritt ansehen
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
