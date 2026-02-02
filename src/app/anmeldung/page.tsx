"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AnmeldungPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    simulator: "",
    aircraft: "",
    client: "",
    clientSetup: "",
    experience: "",
    charts: "",
    airac: "",
    category: "",
    topics: "",
    schedule: "",
    communication: "",
    personal: "",
    other: ""
  });
  const [simChoice, setSimChoice] = useState("");
  const [simOther, setSimOther] = useState("");
  const [chartsChoice, setChartsChoice] = useState("");
  const [chartsOther, setChartsOther] = useState("");
  const [discordStatus, setDiscordStatus] = useState("");
  const [trafficStatus, setTrafficStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCancelledTrainee, setIsCancelledTrainee] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
    
    // Check if user is a cancelled trainee
    if (session?.user) {
      const userStatus = (session.user as any).userStatus;
      if (userStatus === "Cancelled Trainee") {
        setIsCancelledTrainee(true);
        setShowResetConfirm(true);
      }
    }
  }, [status, router, session]);

  const handleResetOldData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/training/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetCancelledTrainee: true }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset old data");
      }
      
      setShowResetConfirm(false);
      setIsCancelledTrainee(false);
      alert("Deine alten Trainingsdaten wurden zurückgesetzt. Du kannst dich jetzt erneut anmelden.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        ...form,
        simulator: simChoice === "OTHER" ? simOther.trim() : simChoice,
        charts: chartsChoice === "OTHER" ? chartsOther.trim() : chartsChoice,
        other: [form.other, discordStatus ? `VATSIM Germany Discord: ${discordStatus}` : "", trafficStatus ? `Online Traffic: ${trafficStatus}` : ""]
          .filter(Boolean)
          .join("\n"),
      };

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit registration");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <PageLayout>
        <div className="container">
          <p>Laden...</p>
        </div>
      </PageLayout>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will be redirected by useEffect
  }

  return (
    <PageLayout>
      <div className="container">
        <div className="anmeldung-form-container">
          <h2>Anmeldung zum Piloten-Mentoren-Programm</h2>
          {error && (
            <div className="form-error info-error" style={{ marginBottom: "20px", color: "red", padding: "10px", border: "1px solid red", borderRadius: "4px" }}>
              {error}
            </div>
          )}
          
          {showResetConfirm && (
            <div className="info-warning" style={{ marginBottom: "20px", padding: "15px", border: "2px solid orange", borderRadius: "8px", backgroundColor: "rgba(255, 165, 0, 0.1)" }}>
              <h3 style={{ marginTop: 0 }}>Willkommen zurück!</h3>
              <p>Du hast bereits eine abgebrochene Anmeldung. Möchtest du deine alten Trainingsdaten zurücksetzen und dich erneut anmelden?</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button 
                  onClick={handleResetOldData}
                  disabled={isLoading}
                  className="button"
                  style={{ margin: 0 }}
                >
                  {isLoading ? "Wird zurückgesetzt..." : "Ja, alte Daten löschen und neu anmelden"}
                </button>
                <button 
                  onClick={() => router.push("/")}
                  className="button"
                  style={{ margin: 0, backgroundColor: "var(--container-bg)", color: "var(--text-color)" }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
          
          {submitted ? (
            <div className="form-success info-success">Vielen Dank für deine Anmeldung! Ein Mentor wird sich in Kürze über das Forum per Private Message bei dir melden, stelle also sicher, dass du einen Account besitzt. Gehe dazu einfach auf <Link href="https://board.vatsim-germany.org">diesen Link</Link> und melde dich dort einmalig an.</div>
          ) : !showResetConfirm && (
            <form onSubmit={handleSubmit} className="anmeldung-form form-card">
              <label className="form-label">
                Flugregel und Kategorie
                <select
                  className="form-select"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="IFR Airliner">IFR Airliner</option>
                  <option value="IFR General Aviation">IFR General Aviation</option>
                  <option value="VFR">VFR</option>
                </select>
              </label>

              <label className="form-label">
                Flugsimulator
                <select
                  className="form-select"
                  value={simChoice}
                  onChange={(e) => setSimChoice(e.target.value)}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="MSFS 2024">MSFS 2024</option>
                  <option value="MSFS 2020">MSFS 2020</option>
                  <option value="XP12">XP12</option>
                  <option value="XP11">XP11</option>
                  <option value="OTHER">Andere (bitte angeben)</option>
                </select>
                {simChoice === "OTHER" && (
                  <input
                    className="form-input"
                    name="simulator"
                    value={simOther}
                    onChange={(e) => setSimOther(e.target.value)}
                    placeholder="Welcher Simulator?"
                    required
                  />
                )}
              </label>

              <label className="form-label">
                Navigraph Abonnement
                <select
                  className="form-select"
                  name="airac"
                  value={form.airac}
                  onChange={handleChange}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="Full">Full</option>
                  <option value="Navigation Data">Navigation Data</option>
                  <option value="Nein">Nein</option>
                </select>
              </label>

              <label className="form-label">
                Charts
                <select
                  className="form-select"
                  value={chartsChoice}
                  onChange={(e) => setChartsChoice(e.target.value)}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="Navigraph">Navigraph</option>
                  <option value="MSFS Flight Planner">MSFS Flight Planner</option>
                  <option value="Chartfox">Chartfox</option>
                  <option value="OTHER">Andere (bitte angeben)</option>
                </select>
                {chartsChoice === "OTHER" && (
                  <input
                    className="form-input"
                    name="charts"
                    value={chartsOther}
                    onChange={(e) => setChartsOther(e.target.value)}
                    placeholder="Welche Charts nutzt du?"
                    required
                  />
                )}
              </label>

              <label className="form-label">
                Erfahrungen mit der Flugsimulation
                <textarea
                  className="form-textarea"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  required
                  placeholder={"Wie lange machst du Flugsimulation? Seit wann bei VATSIM? Schon als Observer zugehört? Schon online geflogen? Was hast du sonst unternommen?"}
                />
              </label>

              <label className="form-label">
                Flugzeug
                <textarea
                  className="form-textarea"
                  name="aircraft"
                  value={form.aircraft}
                  onChange={handleChange}
                  required
                  placeholder={"Mit welchem Flugzeug willst du trainieren? Wie gut kommst du damit zurecht (Geht so / Meistens unfallfrei / Fortgeschritten)?"}
                />
              </label>

              <label className="form-label">
                Deine Hardware-Ausstattung
                <textarea
                  className="form-textarea"
                  name="communication"
                  value={form.communication}
                  onChange={handleChange}
                  required
                  placeholder={"Monitore? Steuerhardware? Headset?"}
                />
              </label>

              <label className="form-label">
                Persönliches
                <textarea
                  className="form-textarea"
                  name="personal"
                  value={form.personal}
                  onChange={handleChange}
                  placeholder={"Alter, Beruf/Schule, Wohnort/Gegend"}
                />
              </label>

              <label className="form-label">
                Fliegerische Themen
                <textarea
                  className="form-textarea"
                  name="topics"
                  value={form.topics}
                  onChange={handleChange}
                  placeholder={"Was möchtest du in unserem Training lernen?"}
                />
              </label>

              <label className="form-label">
                Terminvorstellung
                <input
                  className="form-input"
                  name="schedule"
                  value={form.schedule}
                  onChange={handleChange}
                  required
                  placeholder="Wochentage, Zeiträume"
                />
              </label>

              <label className="form-label">
                Was du uns sonst noch mitteilen möchtest
                <textarea
                  className="form-textarea"
                  name="other"
                  value={form.other}
                  onChange={handleChange}
                  placeholder={"Alter, Beruf/Schule, Wohnort/Gegend, weitere Hobbies, sonstige Anmerkungen"}
                />
              </label>

              <label className="form-label">
                Piloten-Client
                <input
                  className="form-input"
                  name="client"
                  value={form.client}
                  onChange={handleChange}
                  required
                  placeholder="vPilot, xPilot, swift, …"
                />
              </label>

              <label className="form-label">
                Piloten-Client Status
                <select
                  className="form-select"
                  name="clientSetup"
                  value={form.clientSetup}
                  onChange={handleChange}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="Eingerichtet und läuft">Eingerichtet und läuft</option>
                  <option value="Brauche noch Hilfe beim Einrichten">Brauche noch Hilfe beim Einrichten</option>
                  <option value="Was ist das?">Was ist das?</option>
                </select>
              </label>

              <label className="form-label">
                Vatsim Germany Discord
                <select
                  className="form-select"
                  value={discordStatus}
                  onChange={(e) => setDiscordStatus(e.target.value)}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="Ich bin registriert und kann alle Channels sehen">Ich bin registriert und kann alle Channels sehen</option>
                  <option value="Bin mir nicht sicher">Bin mir nicht sicher</option>
                </select>
              </label>

              <label className="form-label">
                Online Traffic im Simulator
                <select
                  className="form-select"
                  value={trafficStatus}
                  onChange={(e) => setTrafficStatus(e.target.value)}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="Ich sehe Online Traffic und er ist realistisch">Ich sehe Online Traffic und er ist realistisch</option>
                  <option value="Ich sehe alle möglichen Flugzeuge">Ich sehe alle möglichen Flugzeuge</option>
                  <option value="Ich sehe keine anderen Flugzeuge">Ich sehe keine anderen Flugzeuge</option>
                </select>
              </label>

              <button type="submit" className="button form-submit" disabled={isLoading}>
                {isLoading ? "Wird abgesendet..." : "Absenden"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

