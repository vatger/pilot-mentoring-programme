"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";
import { trainingTopicLabelMap } from "@/lib/trainingTopics";

type SessionDetails = {
  id: string;
  sessionDate: string;
  lessonType: string;
  comments: string | null;
  isDraft: boolean;
  releasedAt: string | null;
  whiteboardSessionId: string | null;
  topics: {
    id: string;
    topic: string;
    checked: boolean;
    comment: string | null;
  }[];
  training: {
    id: string;
    trainee: {
      id: string;
      cid: string | null;
      name: string | null;
      email: string | null;
    };
  };
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  THEORIE_TRAINING: "Theorie Training",
  OFFLINE_FLUG: "Offline Flug",
  ONLINE_FLUG: "Online Flug",
};

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = searchParams.get("trainingId");

  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = (session?.user as any)?.role;
  const isMentor =
    userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isMentor) {
      router.push("/");
      return;
    }

    fetchSessionDetails();
  }, [status, isMentor, router]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const resolvedParams = await params;
      const res = await fetch(`/api/sessions/${resolvedParams.id}`);
      if (!res.ok) throw new Error("Failed to fetch session details");
      const data = await res.json();
      setSessionDetails(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <PageLayout>
        <div className="container">
          <p>Lädt...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container">
          <p style={{ color: "var(--error-color)" }}>Fehler: {error}</p>
          {trainingId && (
            <Link href={`/mentor/trainee?trainingId=${trainingId}`} className="button">
              Zurück zum Trainee
            </Link>
          )}
        </div>
      </PageLayout>
    );
  }

  if (!sessionDetails) {
    return (
      <PageLayout>
        <div className="container">
          <p>Session nicht gefunden</p>
          {trainingId && (
            <Link href={`/mentor/trainee?trainingId=${trainingId}`} className="button">
              Zurück zum Trainee
            </Link>
          )}
        </div>
      </PageLayout>
    );
  }

  const backUrl = trainingId 
    ? `/mentor/trainee/${sessionDetails.training.trainee.id}?trainingId=${trainingId}`
    : "/mentor/trainee";

  return (
    <PageLayout>
      <div className="container">
        <Link href={backUrl} className="button" style={{ marginBottom: "1rem" }}>
          ← Zurück zum Trainee
        </Link>

        <div className="card" style={{ marginBottom: "2rem" }}>
          <h1>Session Details</h1>
          
          <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
            <p>
              <strong>Trainee:</strong> {sessionDetails.training.trainee.name || "Unbekannt"} (CID: {sessionDetails.training.trainee.cid || "N/A"})
            </p>
            <p>
              <strong>Datum:</strong> {new Date(sessionDetails.sessionDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Typ:</strong> {LESSON_TYPE_LABELS[sessionDetails.lessonType] || sessionDetails.lessonType}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {sessionDetails.isDraft ? (
                <span style={{ color: "var(--warning-color)" }}>🔧 Entwurf</span>
              ) : (
                <span style={{ color: "var(--success-color)" }}>
                  ✓ Freigegeben{sessionDetails.releasedAt ? ` am ${new Date(sessionDetails.releasedAt).toLocaleDateString()}` : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Topics */}
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3>Abgedeckte Themen ({sessionDetails.topics.filter(t => t.checked).length} / {sessionDetails.topics.length})</h3>
          {sessionDetails.topics.filter(t => t.checked).length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Keine Themen abgedeckt</p>
          ) : (
            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
              {sessionDetails.topics
                .filter(t => t.checked)
                .map((topic) => (
                  <div
                    key={topic.id}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--accent-color)",
                      background: "rgba(0, 95, 163, 0.05)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                      {trainingTopicLabelMap[topic.topic] || topic.topic}
                    </div>
                    {topic.comment && (
                      <div style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--text-muted)" }}>
                        "{topic.comment}"
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* General Comments */}
        {sessionDetails.comments && (
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3>Allgemeine Kommentare</h3>
            <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
              {sessionDetails.comments}
            </p>
          </div>
        )}

        {/* Whiteboard Link */}
        {sessionDetails.whiteboardSessionId && (
          <div className="card">
            <h3>Whiteboard</h3>
            <Link 
              href={`/trainings/session/${sessionDetails.whiteboardSessionId}?trainingId=${sessionDetails.training.id}`}
              className="button"
              style={{ marginTop: "0.5rem" }}
            >
              Whiteboard ansehen
            </Link>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
