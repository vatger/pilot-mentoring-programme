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
  const [submitted, setSubmitted] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
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
          {submitted ? (
            <div className="form-success info-success">Vielen Dank für deine Anmeldung! Ein Mentor wird sich in Kürze über das Forum per Private Message bei dir melden, stelle also sicher, dass du einen Account besitzt. Gehe dazu einfach auf <Link href="https://board.vatsim-germany.org">diesen Link</Link> und melde dich dort einmalig an.</div>
          ) : (
            <form onSubmit={handleSubmit} className="anmeldung-form form-card">
              <label className="form-label">
                Flugsimulator:
                <input className="form-input" name="simulator" value={form.simulator} onChange={handleChange} required placeholder="z.B. MSFS, X-Plane, P3D" />
              </label>
              <label className="form-label">
                Flugzeug:
                <textarea className="form-textarea" name="aircraft" value={form.aircraft} onChange={handleChange} required placeholder="Welche Flugzeuge kennst du, welches möchtest du nutzen?" />
              </label>
              <label className="form-label">
                Pilotenclient:
                <input className="form-input" name="client" value={form.client} onChange={handleChange} required placeholder="z.B. vPilot, xPilot, swift" />
              </label>
              <label className="form-label">
                Client eingerichtet?
                <select className="form-select" name="clientSetup" value={form.clientSetup} onChange={handleChange} required>
                  <option value="">Bitte wählen</option>
                  <option value="ja">Ja</option>
                  <option value="nein">Nein</option>
                </select>
              </label>
              <label className="form-label">
                Erfahrungen:
                <textarea className="form-textarea" name="experience" value={form.experience} onChange={handleChange} required placeholder="Wie lange Flugsimulation, schon online geflogen?" />
              </label>
              <label className="form-label">
                Kartenmaterial:
                <input className="form-input" name="charts" value={form.charts} onChange={handleChange} required placeholder="Navigraph, Chartfox, AIP, andere?" />
              </label>
              <label className="form-label">
                AIRAC-Daten vorhanden?
                <select className="form-select" name="airac" value={form.airac} onChange={handleChange} required>
                  <option value="">Bitte wählen</option>
                  <option value="ja-navigraph">Ja, Navigraph subscription</option>
                  <option value="ja-simbrief">Ja, Simbrief (AIRAC 2403)</option>
                  <option value="ja-andere">Ja, andere</option>
                  <option value="nein">Nein</option>
                  <option value="nicht relevant">Nicht relevant</option>
                </select>
              </label>
              <label className="form-label">
                Flugregeln und Ziele:
                <select className="form-select" name="category" value={form.category} onChange={handleChange} required>
                  <option value="">Bitte wählen</option>
                  <option value="if_airliner">IFR mit Airliner</option>
                  <option value="if_ga">IFR mit GA-Flugzeug</option>
                  <option value="vfr">VFR</option>
                </select>
              </label>
              <label className="form-label">
                Fliegerische Themen:
                <textarea className="form-textarea" name="topics" value={form.topics} onChange={handleChange} placeholder="Flugplanung, Durchführung, besondere Verfahren etc." />
              </label>
              <label className="form-label">
                Terminvorstellung:
                <input className="form-input" name="schedule" value={form.schedule} onChange={handleChange} required placeholder="Wochentage, Zeiträume" />
              </label>
              <label className="form-label">
                Kommunikation:
                <textarea className="form-textarea" name="communication" value={form.communication} onChange={handleChange} required placeholder="Teamspeak, Discord, Zugang vorhanden?" />
              </label>
              <label className="form-label">
                Persönliches:
                <textarea className="form-textarea" name="personal" value={form.personal} onChange={handleChange} placeholder="Alter, Beruf, Wohnort (optional)" />
              </label>
              <label className="form-label">
                Sonstiges:
                <textarea className="form-textarea" name="other" value={form.other} onChange={handleChange} placeholder="Was du noch erwähnen möchtest" />
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

