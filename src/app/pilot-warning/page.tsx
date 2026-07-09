"use client";

import { useState } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Modal from '@/components/Modal';

type CardKey = 'card1' | 'card2' | 'card3';

const englishDetails: Record<CardKey, { title: string; content: string; ctas?: { text: string; href: string }[] }> = {
  card1: {
    title: 'Card Title 1',
    content: `Placeholder content for card 1. This is where you can add detailed information or instructions.`,
    ctas: [
      { text: 'Placeholder CTA 1', href: '/placeholder-link-1' },
    ],
  },
  card2: {
    title: 'Card Title 2',
    content: `Placeholder content for card 2. This is where you can add detailed information or instructions.`,
    ctas: [
      { text: 'Placeholder CTA 2', href: '/placeholder-link-2' },
    ],
  },
  card3: {
    title: 'Card Title 3',
    content: `Placeholder content for card 3. This is where you can add detailed information or instructions.`,
    ctas: [
      { text: 'Placeholder CTA 3', href: '/placeholder-link-3' },
    ],
  },
};

const germanDetails: Record<CardKey, { title: string; content: string; ctas?: { text: string; href: string }[] }> = {
  card1: {
    title: 'Karten Titel 1',
    content: `Platzhalterinhalt für Karte 1. Hier können Sie detaillierte Informationen oder Anleitungen hinzufügen.`,
    ctas: [
      { text: 'Platzhalter-CTA 1', href: '/placeholder-link-1' },
    ],
  },
  card2: {
    title: 'Karten Titel 2',
    content: `Platzhalterinhalt für Karte 2. Hier können Sie detaillierte Informationen oder Anleitungen hinzufügen.`,
    ctas: [
      { text: 'Platzhalter-CTA 2', href: '/placeholder-link-2' },
    ],
  },
  card3: {
    title: 'Karten Titel 3',
    content: `Platzhalterinhalt für Karte 3. Hier können Sie detaillierte Informationen oder Anleitungen hinzufügen.`,
    ctas: [
      { text: 'Platzhalter-CTA 3', href: '/placeholder-link-3' },
    ],
  },
};

export default function HomePage() {
  const [open, setOpen] = useState<CardKey | null>(null);
  const [language, setLanguage] = useState<'en' | 'de'>('de');

  function openCard(key: CardKey) {
    setOpen(key);
  }

  const details = language === 'en' ? englishDetails : germanDetails;

  return (
    <PageLayout>
      <>
      <div className="card">
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
          <button onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}>
            {language === 'en' ? (
              <img src="germany.svg" alt="German Flag" style={{ width: '60px', height: '60px' }} />
            ) : (
              <img src="/united-kingdom.svg" alt="English Flag" style={{ width: '60px', height: '60px' }} />
            )}
          </button>
        </div>

        <h1>Dear Pilot! / Lieber Pilot!</h1>

        <p>
          {language === 'en'
            ? `If you have received this page, it is likely because your flight caused
              difficulties for an air traffic controller. Please don't see this as a
              punishment – every experienced VATSIM pilot was once a beginner, and
              making mistakes is a natural part of the learning process.`
            : `Falls dir dieser Link geschickt wurde, liegt das wahrscheinlich daran,
              dass dein Flug einem Lotsen Schwierigkeiten bereitet hat. Bitte sieh das
              nicht als Bestrafung – jeder erfahrene VATSIM-Pilot hat einmal klein
              angefangen, und Fehler gehören ganz selbstverständlich zum Lernprozess.`}
        </p>

        <p>
          {language === 'en'
            ? `However, choosing a very busy airport such as Frankfurt, Munich, Hamburg
              or Düsseldorf for one of your first online flights can quickly become
              overwhelming. These airports often handle dozens of aircraft
              simultaneously, requiring controllers to issue instructions quickly while
              maintaining a safe and efficient traffic flow.`
            : `Die Wahl eines stark frequentierten Flughafens wie Frankfurt, München,
              Hamburg oder Düsseldorf für einen der ersten Online-Flüge kann jedoch
              schnell überfordernd werden. Gerade zu Stoßzeiten müssen dort zahlreiche
              Flugzeuge gleichzeitig abgefertigt werden. Lotsen müssen Anweisungen zügig
              geben und gleichzeitig einen sicheren und flüssigen Verkehrsablauf
              gewährleisten. Meist ist auf den Frequenzen kaum eine Pause und somit auch keine Zeit, um Fragen zu beantworten
              und kaum eine Marge für Fehler. Das kann schnell zu Missverständnissen und Frustration führen.`}
        </p>

        <p>
          {language === 'en'
            ? `A single aircraft that is unable to follow instructions correctly or in
              a timely manner can have a significant impact on the entire operation.
              Controllers may need to delay departures, extend approaches, issue
              additional vectors or even instruct other aircraft to go around. This
              increases workload for everyone and reduces the airport's overall
              capacity.`
            : `Bereits ein einziges Flugzeug, das Anweisungen nicht korrekt oder
              rechtzeitig umsetzen kann, kann den gesamten Ablauf erheblich
              beeinflussen. Lotsen müssen dann möglicherweise Starts verzögern,
              Anflüge verlängern, zusätzliche Radarvektoren vergeben oder andere
              Flugzeuge durchstarten lassen. Das erhöht die Arbeitsbelastung für alle
              Beteiligten und verringert die Kapazität des Flughafens erheblich.
              Dadurch entstehen unnötige Verzögerungen, die sich auf alle anderen Piloten auswirken - nicht nur unbedingt
              auf den der die Schwierigkeiten verursacht hat.`}
        </p>

        <p>
          {language === 'en'
            ? `This does <strong>not</strong> mean that new pilots are unwelcome. Quite
              the opposite: VATSIM is a network for everyone. We simply encourage new
              pilots to gain experience at quieter airports first, where there is more
              time to learn procedures, practise communication and build confidence
              before flying into the busiest airspace.`
            : `Das bedeutet <strong>nicht</strong>, dass neue Piloten auf VATSIM nicht
              willkommen sind – ganz im Gegenteil. VATSIM ist ein Netzwerk für alle mit dem Ziel,
              gemeinsam zu lernen und viele gerade junge Menschen für die Luftfahrt zu begeistern.
              Wir empfehlen lediglich, die ersten Erfahrungen an ruhigeren Flughäfen zu
              sammeln. Dort bleibt mehr Zeit, Verfahren kennenzulernen, den Funk zu
              üben und Routine zu entwickeln, bevor man sich an die verkehrsreichsten
              Flughäfen wagt. Dort hast du meist auch die Möglichkeit, den Lotsen fragen zu stellen.`}
        </p>

    </div>
<div className="card">
        <div className="info-danger">
        <strong>In deinem eigenen Interesse: Lass zunächst die Finger von den Major Airports:</strong>
        <div style={{paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>EDDF</li>
          <li>EDDM</li>
          <li>EDDH</li>
          <li>EDDL</li>
          <li>EDDB</li>
        </div>
      </div>

      <div className="info-success">
        <strong>Starte zunächst lieber an den kleineren Flughäfen!</strong>
        <div style={{paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>EDDG</li>
          <li>EDDC</li>
          <li>EDDW</li>
          <li>EDAH</li>
          <li>EDSB</li>
          <p>Und viele weitere... Das sind auch die Airports, wo neue Lotsen beginnen. Es ist also eine Win-Win Situation, wenn dort mehr los ist!</p>
        </div>
      </div>
</div>
<div className="card">
  {language === 'en'
    ? (
      <>
        <h3>Before flying into major airports, you should be able to:</h3>
        <ul>
          <li>Fly your aircraft confidently without relying on guesswork.</li>
          <li>Understand and correctly read back ATC instructions.</li>
          <li>Accurately follow headings, altitudes, speeds and direct routings.</li>
          <li>Taxi using an airport chart.</li>
          <li>Understand the basic phases of an IFR or VFR flight.</li>
          <li>Ask ATC whenever something is unclear instead of guessing.</li>
        </ul>
      </>
    )
    : (
      <>
        <h3>Bevor Du große Flughäfen anfliegst, sollten Du in der Lage sein:</h3>
        <ul>
          <li>Dein Flugzeug sicher zu bedienen, ohne zu raten oder jedes mal etwas nachzuschlagen.</li>
          <li>ATC-Anweisungen zu verstehen und korrekt zurückzulesen.</li>
          <li>Kurse, Höhen, Geschwindigkeiten und direkte Freigaben zuverlässig einzuhalten.</li>
          <li>Mit Hilfe von Charts sicher zu rollen.</li>
          <li>Die grundlegenden Phasen eines IFR- oder VFR-Fluges zu verstehen und dich entsprechend darauf vorzubereiten.</li>
          <li>ATC zu fragen, wenn etwas unklar ist, anstatt zu raten.</li>
        </ul>
      </>
    )}
</div>

<div className="card">
  {language === 'en'
    ? (
      <>
        <h3>Need some help? That's exactly why the Pilot Mentoring Program exists.</h3>

        <p>
          Our mentors are experienced VATSIM pilots who will help you learn the
          basics of flying online in a relaxed environment. Whether you need help
          with radio communication, IFR procedures, aircraft operation or simply
          want someone to accompany your first flights – we're happy to help.
        </p>

        <p>
          The goal is simple: give you the confidence to enjoy VATSIM while making
          the experience enjoyable for everyone else as well.
        </p>
      </>
    )
    : (
      <>
        <h3>Du benötigst Unterstützung? Genau dafür gibt es das Piloten-Mentoren-Programm.</h3>

        <p>
          Unsere Mentoren sind erfahrene VATSIM-Piloten und Lotsen, die Dir helfen, die
          Grundlagen des Onlinefliegens in einer entspannten Umgebung zu erlernen.
          Egal, ob Du Unterstützung bei der Funkkommunikation, IFR-Verfahren,
          dem Umgang mit deinem Flugzeug benötigst oder einfach jemanden suchen,
          der Deine ersten Flüge begleitet – wir helfen Dir gerne.
        </p>

        <p>
          Das Ziel ist einfach: Dir die Sicherheit zu geben, VATSIM mit Freude
          zu nutzen und gleichzeitig allen anderen Beteiligten ein angenehmes
          Erlebnis zu ermöglichen.
        </p>
      </>
    )}
</div>
        <div className="card">
          {language === 'en'
            ? (
              <>
                <h3 style={{ textAlign: "center" }}>
                  <Link href="/">
                    Join the Pilot Mentoring Program
                  </Link>
                </h3>
              </>
            )
            : (
              <>
                <h3 style={{ textAlign: "center" }}>
                  <Link href="/">
                    Finde deinen Mentor beim PMP
                  </Link>
                </h3>
              </>
            )}
        </div>

        <Modal isOpen={open !== null} onClose={() => setOpen(null)} title={open ? details[open as CardKey].title : undefined} variant={open ?? undefined}>
          {open ? (
            <>
              <p>{details[open as CardKey].content}</p>
              {details[open as CardKey].ctas?.map((cta, i) => (
                <p className="modal-cta" key={i}><Link href={cta.href}>{cta.text}</Link></p>
              ))}
            </>
          ) : null}
        </Modal>
      </>
    </PageLayout>
  );
}