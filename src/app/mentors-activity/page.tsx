"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";

interface MentorActivity {
  id: string;
  name: string | null;
  cid: string | null;
  role: string;
  traineeCount: number;
  lastSessionDate: string | null;
}

export default function MentorsActivityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mentors, setMentors] = useState<MentorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const isAuthorized = ["PMP_LEITUNG", "ADMIN"].includes(userRole);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isAuthorized) {
      router.push("/");
      return;
    }
    fetchMentors();
  }, [status, isAuthorized, router]);

  const fetchMentors = async () => {
    try {
      const res = await fetch("/api/mentors/activity");
      if (!res.ok) throw new Error("Failed to fetch mentor activity");
      const data = await res.json();
      setMentors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Lädt...</div>
      </PageLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Zugriff verweigert. Nur PMP-Leitung und Admins haben Zugriff.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Mentoren Aktivität</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Übersicht aller Mentoren sortiert nach letzter Aktivität
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1.5rem" }}>
          <p>{error}</p>
        </div>
      )}

      {mentors.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0, color: "var(--text-color)" }}>Keine Mentoren vorhanden.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {mentors.map((mentor) => (
            <div key={mentor.id} className="card" style={{ cursor: "pointer" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center" }}>
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.15em" }}>
                    {mentor.name || "Unbekannt"}
                  </h3>
                  <div style={{ display: "grid", gap: "6px", fontSize: "0.95em", color: "var(--text-color)" }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>CID:</span>{" "}
                      <span style={{ fontFamily: "monospace" }}>
                        {mentor.cid || "—"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Rolle:</span> {mentor.role}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "2em", fontWeight: 700, color: "var(--accent-color)" }}>
                      {mentor.traineeCount}
                    </div>
                    <div style={{ fontSize: "0.85em", color: "var(--text-color)" }}>
                      {mentor.traineeCount === 1 ? "Trainee" : "Trainees"}
                    </div>
                  </div>

                  <div style={{ fontSize: "0.9em" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-color)", marginBottom: "0.25rem" }}>
                      Letzte Session:
                    </div>
                    <div style={{ color: "var(--text-color)" }}>
                      {mentor.lastSessionDate ? (
                        <>
                          {new Date(mentor.lastSessionDate).toLocaleDateString("de-DE", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                          <br />
                          <span style={{ fontSize: "0.85em", opacity: 0.8 }}>
                            {new Date(mentor.lastSessionDate).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      ) : (
                        <span style={{ opacity: 0.6 }}>Keine Sessions</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {mentor.traineeCount === 0 && (
                <div style={{ marginTop: "1rem", padding: "0.5rem", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: "6px", fontSize: "0.85em", color: "var(--text-color)" }}>
                  ⚠️ Dieser Mentor hat derzeit keine aktiven Trainees zugewiesen.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px", fontSize: "0.9em", color: "var(--text-color)" }}>
        <strong>Hinweise:</strong>
        <ul style={{ marginTop: "0.5rem", marginBottom: 0 }}>
          <li>Trainees = Anzahl aktiver Trainings des Mentors</li>
          <li>Letzte Session = Zeitpunkt der letzten eingereichten Trainingssession</li>
          <li>Sortierung nach Aktivität (neueste zuerst)</li>
        </ul>
      </div>
    </PageLayout>
  );
}
