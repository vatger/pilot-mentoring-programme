"use client";

import { useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

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
    return <div className="container"><p>Lade...</p></div>;
  }

  if (!session) {
    return (
      <div className="container">
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
      </div>
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
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="header-container">
        <div className="header">
          <h1>Trainings</h1>
        </div>
      </div>

      <div className="card">
        <h3>Willkommen</h3>
        <p>Angemeldet als {session.user?.name} (CID: {(session.user as any)?.cid})</p>
        <p>Rating: {(session.user as any)?.rating} {(session.user as any)?.fir ? `— FIR ${(session.user as any)?.fir}` : ""}</p>
        <p>Teams: {teams.length ? teams.join(", ") : "keine Teams im Token"}</p>
        <button className="button" onClick={() => signOut({ callbackUrl: "/" })}>
          Logout
        </button>
      </div>

      <div className="card">
        <h3>Berechtigungen</h3>
        <ul>
          <li>Mentor (pmp-mentor): neue Sessions erstellen, Dateien hochladen (sobald CDN angebunden)</li>
          <li>Leitung (pmp-leitung): alles wie Mentor + Dateien löschen (sobald API angebunden)</li>
        </ul>
        <p>Dein Status: {isLead ? "Leitung" : isMentor ? "Mentor" : "Kein Mentor/Leitung"}</p>
      </div>

      <div className="card">
        <h3>Neue Session</h3>
        <p>Erzeuge einen Link und teile ihn mit dem Trainee.</p>
        <button className="button" onClick={createSession} disabled={!isMentor}>
          Session-Link erstellen
        </button>
        {newSessionLink && (
          <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <Link href={newSessionLink}>{newSessionLink}</Link>
            <button className="button" onClick={() => copyLink(newSessionLink)}>Link kopieren</button>
          </div>
        )}
        {!isMentor && <p style={{ color: "#b91c1c", marginTop: "8px" }}>Nur Mentoren können Sessions erstellen.</p>}
      </div>

      <div className="card">
        <h3>Datei-Upload (Stub)</h3>
        <p>CDN-Anbindung folgt. Aktuell nur lokale Prüfung:</p>
        <ul>
          <li>PDF bis 25 MB</li>
          <li>JPG/PNG/SVG bis 5 MB</li>
        </ul>
        <input
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          accept="application/pdf,image/jpeg,image/jpg,image/png,image/svg+xml"
          disabled={!isMentor}
          style={{ marginTop: "8px" }}
        />
        {!isMentor && <p style={{ color: "#b91c1c", marginTop: "8px" }}>Nur Mentoren dürfen hochladen (sobald aktiv).</p>}
      </div>

      {lastError && (
        <div className="card">
          <h3>Status</h3>
          <p>{lastError}</p>
        </div>
      )}
    </div>
  );
}
