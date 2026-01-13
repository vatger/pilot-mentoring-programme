"use client";

import { useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";

const FILE_RULES = [
  { accept: ["application/pdf"], maxMB: 25 },
  { accept: ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"], maxMB: 5 },
];

function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${sizes[i]}`;
}

function validateFile(file: File) {
  const rule = FILE_RULES.find(r => r.accept.includes(file.type));
  if (!rule) return `Nicht erlaubter Dateityp: ${file.type || file.name}`;
  const maxBytes = rule.maxMB * 1024 * 1024;
  if (file.size > maxBytes) return `Datei zu groß (${formatBytes(file.size)} > ${rule.maxMB} MB)`;
  return null;
}

export default function TrainingsPage() {
  const { data: session, status } = useSession();
  const [newSessionLink, setNewSessionLink] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const teams = useMemo(() => ((session?.user as any)?.teams ?? []) as string[], [session]);
  const isMentor = teams.includes("pmp-mentor") || teams.includes("pmp-leitung");
  const isLead = teams.includes("pmp-leitung");

  if (status === "loading") {
    return (
      <PageLayout>
        <div className="card">
          <p>Lade...</p>
        </div>
      </PageLayout>
    );
  }

  if (!session) {
    return (
      <PageLayout>
        <div className="header-container">
          <div className="header">
            <h1>Trainings</h1>
          </div>
        </div>
        <div className="card">
          <h3>Zugang erforderlich</h3>
          <p>Bitte melde dich über VATGER an, um die Trainings zu sehen.</p>
          <button className="button" onClick={() => signIn("vatsim", { callbackUrl: "/trainings" })}>
            Mit VATSIM Germany anmelden
          </button>
        </div>
      </PageLayout>
    );
  }

  const createSession = () => {
    const id = generateSessionId();
    const url = `/trainings/session/${id}`;
    setNewSessionLink(url);
    setLastError(null);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const errors: string[] = [];
    Array.from(files).forEach((file) => {
      const err = validateFile(file);
      if (err) errors.push(`${file.name}: ${err}`);
    });
    if (errors.length) {
      setLastError(errors.join(" | "));
      return;
    }
    // Placeholder: here we would upload to CDN once API is available.
    setLastError("Upload-Stub: Dateien wurden lokal validiert. CDN-Upload folgt sobald API verfügbar ist.");
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${link}`);
      setLastError("Link kopiert.");
    } catch {
      setLastError("Konnte Link nicht kopieren.");
    }
  };

  return (
    <PageLayout>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1>Training Sessions</h1>
        <p style={{ color: "var(--text-color)", margin: "0.5rem 0 0 0" }}>
          Create and manage training sessions
        </p>
      </div>

      {lastError && (
        <div className={`card ${lastError.includes("Error") ? "info-danger" : "info-success"}`} style={{ marginBottom: "1.5rem" }}>
          <p style={{ margin: 0 }}>{lastError}</p>
        </div>
      )}

      {/* User Info */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Account Info</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.25rem", fontWeight: 500 }}>
              Name
            </div>
            <div style={{ fontSize: "1em", fontWeight: 500 }}>{session.user?.name}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.25rem", fontWeight: 500 }}>
              CID
            </div>
            <div style={{ fontSize: "1em", fontWeight: 500, fontFamily: "monospace" }}>
              {(session.user as any)?.cid}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.25rem", fontWeight: 500 }}>
              Rating
            </div>
            <div style={{ fontSize: "1em", fontWeight: 500 }}>
              {(session.user as any)?.rating}
              {(session.user as any)?.fir && ` (${(session.user as any)?.fir})`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.25rem", fontWeight: 500 }}>
              Status
            </div>
            <div style={{ fontSize: "1em", fontWeight: 500 }}>
              {isLead ? "Program Lead" : isMentor ? "Mentor" : "Viewer"}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              className="button button--danger"
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{ margin: 0 }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Permissions</h3>
        <ul style={{ margin: "0 0 0 1.5rem", paddingLeft: 0 }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Mentor:</strong> Create sessions, upload files (when CDN available)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Program Lead:</strong> All mentor features + delete files (when API available)
          </li>
          {!isMentor && (
            <li>
              <strong>Viewer:</strong> Read-only access
            </li>
          )}
        </ul>
      </div>

      {/* Session Creation */}
      <div className="form-card" style={{ maxWidth: "720px", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Create New Session</h3>
          <p style={{ margin: 0, fontSize: "0.95em", color: "var(--text-color)" }}>
            Generate a link to share with your trainee.
          </p>
        </div>
        <button
          className="button"
          onClick={createSession}
          disabled={!isMentor}
          style={{ alignSelf: "flex-start", margin: 0 }}
        >
          {isMentor ? "Create Session Link" : "Mentors only"}
        </button>
        {newSessionLink && (
          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "var(--container-bg)", borderRadius: "8px", border: "1px solid var(--footer-border)" }}>
            <div style={{ fontSize: "0.85em", color: "var(--text-color)", marginBottom: "0.5rem", fontWeight: 500 }}>
              Session Link:
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <code
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "8px 10px",
                  background: "var(--card-bg)",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "0.85em",
                  wordBreak: "break-all",
                }}
              >
                {newSessionLink}
              </code>
              <button
                className="button"
                onClick={() => copyLink(newSessionLink)}
                style={{ margin: 0, padding: "6px 12px", fontSize: "0.9em" }}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="form-card" style={{ maxWidth: "720px" }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>File Upload (Stub)</h3>
          <p style={{ margin: 0, fontSize: "0.95em", color: "var(--text-color)" }}>
            CDN integration coming soon. Local validation only:
          </p>
        </div>
        <ul style={{ margin: "1rem 0 1rem 1.5rem", paddingLeft: 0 }}>
          <li>PDF up to 25 MB</li>
          <li>JPG/PNG/SVG up to 5 MB</li>
        </ul>
        <input
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          accept="application/pdf,image/jpeg,image/jpg,image/png,image/svg+xml"
          disabled={!isMentor}
          style={{ marginBottom: "1rem" }}
        />
        {!isMentor && (
          <div className="info-danger" style={{ margin: 0 }}>
            <p style={{ margin: 0 }}>Only mentors can upload files (when available).</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
