"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { trainingTopics } from "@/lib/trainingTopics";

interface TrainingCoverageRow {
  trainingId: string;
  status: string;
  trainee: { id: string; name: string | null; cid: string | null };
  mentors: { id: string; name: string | null; cid: string | null }[];
  sessionsCount: number;
  topicsCoveredCount: number;
  topicsCoverage: {
    topic: string;
    covered: boolean;
    category?: "THEORY" | "PRACTICE";
    theorie?: boolean;
    praxis?: boolean;
  }[];
  lastSessionDate: string | null;
}

function PmpTrackingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trainings, setTrainings] = useState<TrainingCoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const isAdminOrLeitung = userRole === "ADMIN" || userRole === "PMP_LEITUNG";

  const statusFilter = searchParams.get("status") || "ACTIVE";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isAdminOrLeitung) {
      router.push("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAdminOrLeitung, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`/api/admin/tracking${query}`);
      if (!res.ok) throw new Error("Failed to fetch tracking data");
      const data = await res.json();
      setTrainings(data.trainings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const totalTopics = trainingTopics.length;
  const formatPoints = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    );
  }

  if (!isAdminOrLeitung) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-red-600">
          Zugriff verweigert. Nur Admins und PMP-Leitung haben Zugriff.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h1>PMP-Tracking</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Übersicht der Trainingsabdeckung nach Thema für jeden Trainee
        </p>
      </div>

      {error && (
        <div className="info-danger" style={{ marginBottom: "1rem" }}>
          <p>{error}</p>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>Filter:</span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["ACTIVE", "COMPLETED", "ABGEBROCHEN"].map((value) => {
              const isActive = value === statusFilter;
              return (
                <Link
                  key={value}
                  href={`?status=${value}`}
                  replace
                  className="button"
                  style={{
                    margin: 0,
                    padding: "6px 14px",
                    fontSize: "0.9em",
                    background: isActive ? "var(--accent-color)" : "var(--container-bg)",
                    color: isActive ? "white" : "var(--text-color)",
                    border: isActive ? "none" : "1px solid var(--footer-border)",
                  }}
                >
                  {value}
                </Link>
              );
            })}
            <Link
              href="?status="
              replace
              className="button"
              style={{
                margin: 0,
                padding: "6px 14px",
                fontSize: "0.9em",
                background: statusFilter === "" ? "var(--accent-color)" : "var(--container-bg)",
                color: statusFilter === "" ? "white" : "var(--text-color)",
                border: statusFilter === "" ? "none" : "1px solid var(--footer-border)",
              }}
            >
              Alle
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card"><p style={{ margin: 0 }}>Lädt...</p></div>
      ) : trainings.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-color)", margin: 0 }}>Keine Trainings gefunden.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {trainings.map((row) => {
            const coveragePercent = Math.round(
              (row.topicsCoveredCount / totalTopics) * 100
            );
            return (
              <div
                key={row.trainingId}
                className="card"
                style={{ padding: "0.65rem 0.85rem", display: "grid", gap: "0.5rem" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1fr auto",
                    gap: "0.65rem",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "1.05em", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {row.trainee.name || "Unbekannt"}
                    </h3>
                    <span style={{ color: "var(--text-color)", fontFamily: "monospace", fontSize: "0.9em" }}>
                      ({row.trainee.cid || "N/A"})
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%" }}>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatPoints(row.topicsCoveredCount)} / {totalTopics}
                    </span>
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
                    <span style={{ fontSize: "0.9em", color: "var(--text-color)", whiteSpace: "nowrap" }}>
                      {coveragePercent}%
                    </span>
                  </div>

                  <Link
                    href={`/trainee/progress?trainingId=${row.trainingId}`}
                    className="button"
                    style={{ padding: "6px 12px", fontSize: "0.9em", margin: 0, justifySelf: "end" }}
                  >
                    Details
                  </Link>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    flexWrap: "wrap",
                    color: "var(--text-color)",
                    fontSize: "0.95em",
                  }}
                >
                  <span style={{ whiteSpace: "nowrap" }}>
                    Fortschritt: {formatPoints(row.topicsCoveredCount)} Themen
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>
                    Mentor: {row.mentors.length > 0 ? row.mentors.map((m) => m.name || m.cid).join(", ") : "—"}
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>Sessions: {row.sessionsCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}

export default function PmpTrackingPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="text-center py-12">Loading...</div>
      </PageLayout>
    }>
      <PmpTrackingContent />
    </Suspense>
  );
}
