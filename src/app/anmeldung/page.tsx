"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import { useRouter } from "next/navigation";

// Only allow access if logged in (dummy check for now)
const isLoggedIn = () => {
  // Replace with real SSO/session check
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("pmp_logged_in");
  }
  return false;
};

export default function AnmeldungPage() {
  const router = useRouter();
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

  // SSO bypass: allow access for now
  // Remove this block when SSO is available
  // if (!isLoggedIn()) {
  //   if (typeof window !== "undefined") {
  //     window.location.href =
  //       "https://sso.vatsim-germany.org/login?redirect=" +
  //       encodeURIComponent(window.location.href);
  //   }
  //   return null;
  // }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: Send form data to backend
  };

  return (
    <PageLayout>
      <div className="container">
        <div className="anmeldung-form-container">
          <h2>Anmeldung zum Piloten-Mentoren-Programm KEIN UPSTREAM BACKEND</h2>
          {submitted ? (
            <div className="form-success info-success">Vielen Dank für deine Anmeldung! Ein Mentor wird sich in kürze über das Forum bei dir melden, stelle also sicher, dass du einen Account besitzt.</div>
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
              <button type="submit" className="button form-submit">Absenden</button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

