"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";

function DirektEinladungContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/direkt-einladung";
    return window.location.href;
  }, []);

  useEffect(() => {
    if (!inviteToken) return;
    if (status !== "authenticated") return;
    if (done || submitting) return;

    const submitInvite = async () => {
      setSubmitting(true);
      setError("");

      try {
        const res = await fetch("/api/training/direct-invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteToken }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Einladung konnte nicht verarbeitet werden");
        }

        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setSubmitting(false);
      }
    };

    submitInvite();
  }, [inviteToken, status, done, submitting]);

  return (
    <PageLayout>
      <div className="card">
        <h2>PMP Einladung</h2>

        {!inviteToken && (
          <p>
            Kein Einladungslink gefunden. Bitte den vollständigen Link aus der Nachricht deines Mentors öffnen.
          </p>
        )}

        {inviteToken && status === "loading" && <p>Lädt…</p>}

        {inviteToken && status === "unauthenticated" && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <p>Bitte mit deinem VATSIM Germany Account anmelden, um die Einladung abzuschließen.</p>
            <div>
              <a
                className="button"
                href={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                Anmelden
              </a>
            </div>
          </div>
        )}

        {inviteToken && status === "authenticated" && !done && !error && (
          <p>{submitting ? "Einladung wird verarbeitet…" : "Einladung wird vorbereitet…"}</p>
        )}

        {done && (
          <div className="info-success">
            <p style={{ margin: 0 }}>
              Anmeldung erfolgreich. Deine Trainee-Zuordnung wurde erstellt und dein Mentor ist jetzt hinterlegt.
            </p>
          </div>
        )}

        {error && (
          <div className="info-danger">
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {session?.user && (
          <p style={{ marginTop: "1rem", color: "var(--text-color)" }}>
            Angemeldet als: {(session.user as any).name} ({(session.user as any).cid})
          </p>
        )}
      </div>
    </PageLayout>
  );
}

export default function DirektEinladungPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="card">
            <h2>PMP Einladung</h2>
            <p>Lädt…</p>
          </div>
        </PageLayout>
      }
    >
      <DirektEinladungContent />
    </Suspense>
  );
}
