"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
const steps = [
  {
    icon: '1',
    title: 'Registrierung VATSIM',
    desc: (
      <>
        Für die Nutzung des VATSIM Netzwerks benötigst du einen VATSIM Account. Falls du bereits einen Account hast, kannst du diesen Schritt überspringen.<br /><br />
        Erstelle dir unter <a href="https://my.vatsim.net/register" target="_blank">https://my.vatsim.net/register</a> einen neuen Account. Gib deine echten Daten an (keine Fantasienamen!) und wähle:
        Nach erfolgreicher Registrierung erhältst du eine VATSIM-ID (CID) und ein Passwort per E-Mail.
      </>
    ),
    info: (
      <div className="info-danger">
        <strong>Hinweis:</strong> Erstelle <strong>niemals</strong> einen zweiten VATSIM Account! Mehrere Accounts führen zu einer permanenten Sperrung aller deiner Accounts. Bei Problemen wende dich an den VATSIM Support.
      </div>
    ),
  },
  {
    icon: '2',
    title: 'New Member Orientation Test',
    desc: (
      <>
        Nach der Registrierung musst du den <strong>New Member Orientation Test</strong> absolvieren. Dieser Test stellt sicher, dass du die Grundlagen des Netzwerks verstanden hast. Den Link zum Test erhältst du nach der Registrierung per E-Mail und er ist auf <a href="https://my.vatsim.net/" target="_blank">my.vatsim.net</a> verfügbar.
      </>
    ),
  },
  {
    icon: '3',
    title: 'Zuordnung EMEA / EUD / GER',
    desc: (
      <>
        Nach Bestehen des Tests musst Du dich einer Region und Division zugeordnet:<br />
        <ul>
          <li><strong>Region:</strong> EMEA (Europa, Middle East and Africa)</li>
          <li><strong>Division:</strong> EUD (Europe except UK)</li>
          <li><strong>Subdivision:</strong> GER (Germany)</li>
        </ul>
        Sollte hier etwas nicht klappen, kontaktiere bitte den Membership Support der jeweiligen Organisation.
      </>
    ),
  },
  {
    icon: '4',
    title: 'Registrierung VATSIM Germany',
    desc: (
      <>
        Nach der VATSIM-Registrierung kannst du dich bei <a href="https://vatsim-germany.org/" target="_blank">VATSIM Germany</a> anmelden. Dort erhältst du Zugang zum Forum, zu Ressourcen und zum PMP.<br />
        <div className="info-success">
          <strong>Wichtige Links:</strong><br />
          - Forum: <a href="https://board.vatsim-germany.org/" target="_blank">VATSIM Germany Forum</a><br />
          - Knowledgebase: <a href="https://knowledgebase.vatsim-germany.org/" target="_blank">VATSIM Germany Knowledgebase</a>
        </div>
      </>
    ),
  },
  {
    icon: '5',
    title: 'Anmeldung im PMP',
    desc: (
      <>
        Jetzt kannst du dich im <a href="https://board.vatsim-germany.org/forums/piloten-mentoren-programm.739/" target="_blank">PMP-Forum</a> anmelden und deine Mentoring-Reise starten!
      </>
    ),
    info: (
      <div className="info-amber">
        <strong>Probleme mit deinem Account?</strong><br />
        <ul>
          <li>Passwort vergessen? <a href="https://my.vatsim.net/reset/password" target="_blank">Hier zurücksetzen</a></li>
          <li>VATSIM-ID oder E-Mail vergessen? Wende dich an den <a href="https://support.vatsim.net/" target="_blank">Membership Support</a></li>
          <li>Account gesperrt? <a href="https://my.vatsim.net/reactivate" target="_blank">Hier reaktivieren</a></li>
        </ul>
      </div>
    ),
  },
];


export default function HowtoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const year = new Date().getFullYear();

  // Responsive stepper layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      const stepperEl = document.getElementById('stepper');
      stepperEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, isMobile]);

  return (
    <PageLayout>
      <div className="content">
        <div className="container">
          <h2>How to get started – In 5 Schritten zum PMP</h2>
          <div className="steps-container">
            <div className="stepper-progress" id="stepper-progress">
              Schritt {currentStep + 1} von {steps.length}
            </div>
            {/* Flex column for step card and controls */}
            <div
              className="stepper"
              id="stepper"
              data-current-step={currentStep + 1}
              style={{ display: 'flex', flexDirection: 'column', minHeight: '420px' }}
            >
              <div className="step">
                {currentStep < steps.length - 1 && (
                  isMobile ? (
                    <div className="stepper-stripe" />
                  ) : (
                    <div className="stepper-stripe" />
                  )
                )}
                <div className="step-icon">
                  {steps[currentStep].icon}
                </div>
                <div className="step-content">
                  <div className="step-title">{steps[currentStep].title}</div>
                  <div className="step-desc">{steps[currentStep].desc}</div>
                  {steps[currentStep].info}
                </div>
              </div>
              {/* Controls always at bottom */}
              <div className="stepper-controls" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button className="button" id="prevStep" disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>Zurück</button>
                <button className="button" id="nextStep" onClick={() => {
                  if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>{currentStep === steps.length - 1 ? 'Fertig' : 'Weiter'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}



