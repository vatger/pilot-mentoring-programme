"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

type MentorOption = {
  id: string;
  name: string | null;
  cid: string | null;
};

type PendingAssignment = {
  id: string;
  traineeCid: string;
  createdAt: string;
  mentor: MentorOption;
};

export default function MentorAssignmentManager() {
  const [traineeCid, setTraineeCid] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [assignments, setAssignments] = useState<PendingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationWarning, setNotificationWarning] = useState("");

  const loadAssignments = useCallback(async () => {
    const response = await fetch("/api/admin/mentor-assignments", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Vormerkungen konnten nicht geladen werden");
    }

    setMentors(data.mentors || []);
    setAssignments(data.assignments || []);
  }, []);

  useEffect(() => {
    loadAssignments()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Fehler beim Laden");
      })
      .finally(() => setLoading(false));
  }, [loadAssignments]);

  const createAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");
    setNotificationWarning("");

    try {
      const response = await fetch("/api/admin/mentor-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeCid: traineeCid.trim(), mentorId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Mentor konnte nicht zugewiesen werden");
      }

      setTraineeCid("");
      setMentorId("");
      setSuccess(
        data.status === "assigned"
          ? "Mentor wurde direkt zugewiesen."
          : "CID wurde vorgemerkt. Die Zuordnung erfolgt beim ersten Login des Trainees."
      );
      setNotificationWarning(data.notificationWarning || "");
      await loadAssignments();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (id: string) => {
    setRemovingId(id);
    setError("");
    setSuccess("");
    setNotificationWarning("");

    try {
      const response = await fetch("/api/admin/mentor-assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Vormerkung konnte nicht gelöscht werden");
      }

      await loadAssignments();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Fehler beim Löschen");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="card" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginTop: 0 }}>Trainee und Mentor zuordnen</h2>
      <p style={{ color: "var(--text-color)" }}>
       Bei unbekannten CID wird die
        Mentorenzuordnung bis zum ersten Login des Trainees vorgemerkt.
      </p>

      <form
        onSubmit={createAssignment}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "end" }}
      >
        <label className="form-label">
          Trainee-CID
          <input
            className="form-input"
            inputMode="numeric"
            pattern="[0-9]+"
            required
            value={traineeCid}
            onChange={(event) => setTraineeCid(event.target.value)}
            placeholder="z. B. 1234567"
          />
        </label>

        <label className="form-label">
          Mentor
          <select
            className="form-select"
            required
            value={mentorId}
            onChange={(event) => setMentorId(event.target.value)}
          >
            <option value="">Mentor auswählen</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.name || "Unbekannt"} ({mentor.cid || "keine CID"})
              </option>
            ))}
          </select>
        </label>

        <button className="button" type="submit" disabled={saving || loading || mentors.length === 0}>
          {saving ? "Speichert…" : "Zuordnen"}
        </button>
      </form>

      {error && <div className="info-danger" style={{ marginTop: "1rem" }}><p>{error}</p></div>}
      {success && <div className="info-success" style={{ marginTop: "1rem" }}><p>{success}</p></div>}
      {notificationWarning && (
        <div className="info-danger" style={{ marginTop: "1rem" }}>
          <p>Zuordnung gespeichert, aber die Benachrichtigung wurde nicht versendet: {notificationWarning}</p>
        </div>
      )}

      {loading ? (
        <p style={{ marginBottom: 0 }}>Vormerkungen werden geladen…</p>
      ) : assignments.length > 0 ? (
        <div style={{ marginTop: "1.25rem" }}>
          <h3>Offene Vormerkungen ({assignments.length})</h3>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
              >
                <span>
                  CID {assignment.traineeCid} – {assignment.mentor.name || "Unbekannt"}
                  {assignment.mentor.cid ? ` (${assignment.mentor.cid})` : ""}
                </span>
                <button
                  type="button"
                  className="button button--danger"
                  disabled={removingId === assignment.id}
                  onClick={() => removeAssignment(assignment.id)}
                >
                  {removingId === assignment.id ? "Löscht…" : "Entfernen"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
