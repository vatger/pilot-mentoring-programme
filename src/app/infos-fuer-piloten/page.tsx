"use client";

import React, { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import Modal from '@/components/Modal';

type CardKey = 'nav' | 'briefing' | 'radar' | 'transitions';

const cards: Record<CardKey, { title: string; excerpt: string; content: string }> = {
  nav: {
    title: 'Navigationsdaten und Charts',
    excerpt: 'Mehr erfahren',
  content: `Optimal ausgestattet bist du natürlich mit einem Navigraph Unlimited Abonnement. Damit bekommst du immer die aktuellen AIRAC-Daten für deinen Simulator und ein starkes Charts Tool. Bequemer geht es nicht. Die meisten Vatsim-Piloten haben es.
Navigraph Charts gibt es im Browser, als App, für Desktop und Mobilgeräte und im EFB der meisten Addon-Flugzeuge. Allerdings kostet dieses Abonnement auch knapp 100€ im Jahr.

Kostenfreie Charts gibt es bei Chartfox (Airports) und Skyvector (Enroute). Bei Chartfox findest du die Charts der offiziellen Luftfahrthandbücher (AIP). Diese unterscheiden sich optisch je nach Land; du musst dich also jeweils mit ihnen vertraut machen. Für deine Flugvorbereitung kannst du deine Charts je Airport auf einem Pinboard anpinnen und während des Flugs abrufen. Chartfox läuft im Web-Browser.

Für die Flugplanung verwendest du vermutlich Simbrief. Hierzu musst du wissen, dass Simbrief zu Navigraph gehört und ohne Abonnement nur veraltete Navigationsdaten bereitstellt. Falls du also kein Navigraph-Abo hast, musst du deine Simbrief-Flugplanung mit den aktuellen Charts abgleichen.

Navigraph bietet allerdings ein „Navigation Data“ Abonnement an, ohne Charts. Das kostet ca. 35€ im Jahr und hält Simbrief aktuell.

Der MSFS 2020 bekommt regelmäßig aktuelle Navdaten per Update, diese sind aber mitunter nicht vollständig. So fehlen z. B. auf RNAV Transitions manchmal Waypoints entlang der Strecke. Auch können diese Navdaten nicht in Addon-Flugzeugen verwendet werden.`,
  },
    briefing: {
    title: 'Flugvorbereitung und Durchführung',
    excerpt: 'Mehr erfahren',
  content: `Zunächst ein paar Worte zur Airport-Auswahl für deine ersten Flüge. Klar ist Frankfurt großartig, es gibt tolle Szenerien und viel Verkehr. Aber es ist auch ein sehr großer und komplexer Airport.

Unser Tipp: Meide am Anfang die größten Airports (EDDF, EDDM und EDDH), zumindest an den Online Days. Schau dir den Verkehr dort im Netzwerk-Monitor an und frage dich, ob das am Anfang etwas für dich ist. Denn dort musst du wirklich auf Zack sein. Da ist keine Zeit für „say again“, und jede Anweisung muss sofort ausgeführt – und zügig zurückgelesen – werden, damit der Verkehr reibungslos fließen kann.

Wir haben auf Vatsim jede Menge andere Airports, größer und kleiner, auf denen nicht so viel Verkehr ist und wo du wunderbar Erfahrungen sammeln kannst.

Wenn du dich auf einem Airport connected hast, gehe in die Außensicht und schau, ob nicht an deinem Gate ein anderes Flugzeug steht. Wenn das der Fall ist, verschiebe dein Flugzeug auf ein freies Gate.

Notiere dir die Abfolge der ATC-Frequenzen für Departure und Destination. Das hilft ungemein bei Frequenzwechseln. Alle Frequenzen außer denen der Center stehen auf den Charts. Achte auch auf Frequenzangaben in der ATIS.

Stelle jede Frequenz, die du bereits kennst, im STBY ein, sobald du die aktive Frequenz gewechselt hast. Du möchtest nicht z. B. die Radar-Frequenz, zu der du wechseln sollst, kurz nach dem Start erst noch heraussuchen.

Führe während deines Fluges mindestens folgende Briefings durch:
- Voraussichtliche Taxi-Strecke zur Runway
- Restrictions auf der Departure
- In Frage kommende Arrivals / Transitions (nicht nur die, die du geplant hast)
- Bei mehreren Runways an der Destination: Alle in Frage kommenden Approaches (insbesondere bei Airports mit parallelen Runways)
- Missed Approach Procedure
- Voraussichtliche Taxi-Strecke nach der Landung`,
  },
  radar: {
    title: 'Netzwerk-Monitor',
    excerpt: 'Mehr erfahren',
  content: `Der gängigste Netzwerk-Monitor mit den meisten Funktionen aktuell ist Vatsim Radar. Und eben weil er so viele Funktionen hat, nimm dir vor deinen ersten Flügen etwas Zeit, dich damit vertraut zu machen. Damit du während deines Fluges die Information, die du brauchst, auch schnell findest.`,
  },
  transitions: {
    title: 'RNAV-Transitions',
    excerpt: 'Mehr erfahren',
  content: `RNAV Transitions sind eine deutsche Besonderheit – in anderen Ländern findet man sie kaum.

Die Besonderheit der meisten RNAV Transitions ist: Sie dürfen nur nach Freigabe durch ATC geflogen werden. Achte auf den Text in der Chart: „Use of RNAV Transitions only when cleared by ATC“.

Das heißt dann: Eine solche RNAV Transition kommt nicht in deinen Flugplan. Dort planst du die passende STAR. Du musst aber vorbereitet sein, die RNAV Transition zu fliegen.

Und keine Regel ohne Ausnahme: EDDB Berlin-Brandenburg. Dort gibt es nur RNAV Transitions, die du dann auch in deinen Flugplan einträgst.

Prüfe also das Vorhandensein der für dich zutreffenden RNAV Transition in den Navdaten deines Flugzeugs.

Sei darauf vorbereitet, jeden beliebigen Waypoint einer solchen Transition direkt anzufliegen, auch schon vor Erreichen des Clearance Limit.

Stelle dich auf der Transition jederzeit auf Vektoren zum ILS ein. Sei darauf vorbereitet, Richtungsänderungen SOFORT auszuführen – auf einer Transition ist meist nicht viel Platz zum Kurven fliegen.`,
  },
};

export default function InfosFuerPilotenPage() {
  const [open, setOpen] = useState<CardKey | null>(null);

  // Render content: each non-empty line becomes a paragraph; lines starting with -, • or ● become list items
  function renderContent(text: string) {
    const lines = text.split(/\r?\n/);
    const nodes: React.ReactNode[] = [];
    let listBuffer: string[] = [];

    const flushList = (keyBase: string) => {
      if (listBuffer.length === 0) return;
      nodes.push(
        <ul key={keyBase + '-ul'}>
          {listBuffer.map((li, idx) => (
            <li key={keyBase + '-li-' + idx} dangerouslySetInnerHTML={{ __html: li }} />
          ))}
        </ul>
      );
      listBuffer = [];
    };

    lines.forEach((raw, idx) => {
      const line = raw.replace(/\t/g, ' ').trim();
      if (!line) {
        // blank line separates paragraphs / lists
        flushList(String(idx));
        return;
      }

      const m = line.match(/^[-–—•●]\s*(.*)$/);
      if (m) {
        // list item
        listBuffer.push(m[1]);
      } else {
        // normal paragraph
        flushList(String(idx));
        nodes.push(<p key={'p-' + idx} dangerouslySetInnerHTML={{ __html: line }} />);
      }
    });

    // flush any remaining list
    flushList('end');
    return nodes;
  }

  return (
    <PageLayout>
      <h2>Wissenswertes für Piloten</h2>
      <p>Auf dieser Seite haben wir ein paar Informationen für neue Piloten bei uns auf Vatsim zusammengestellt. Es handelt sich dabei nicht um ein vollständiges Nachschlagewerk, sondern eher um Stichworte, die dir eine Orientierung geben sollen was du wissen und beachten solltest.</p>
      <p>Diese Informationen richten sich in erster Linie an unsere Airliner-Piloten.</p>


        <div className="card" role="button" tabIndex={0} onClick={() => setOpen('nav')} onKeyDown={(e) => e.key === 'Enter' && setOpen('nav')}>
          <h3>Navigationsdaten und Charts</h3>
          <p className="link-like" aria-hidden="true">Mehr erfahren</p>
        </div>
        <div className="card" role="button" tabIndex={0} onClick={() => setOpen('briefing')} onKeyDown={(e) => e.key === 'Enter' && setOpen('briefing')}>
          <h3>Flugvorbereitung und Durchführung</h3>
          <p className="link-like" aria-hidden="true">Mehr erfahren</p>
        </div>
        <div className="card" role="button" tabIndex={0} onClick={() => setOpen('radar')} onKeyDown={(e) => e.key === 'Enter' && setOpen('radar')}>
          <h3>Netzwerkmonitor</h3>
          <p className="link-like" aria-hidden="true">Mehr erfahren</p>
        </div>
        <div className="card" role="button" tabIndex={0} onClick={() => setOpen('transitions')} onKeyDown={(e) => e.key === 'Enter' && setOpen('transitions')}>
          <h3>RNAV-Transitions</h3>
          <p className="link-like" aria-hidden="true">Mehr erfahren</p>
        </div>


      <Modal isOpen={open !== null} onClose={() => setOpen(null)} title={open ? cards[open].title : undefined} variant={open ?? undefined}>
        {open ? <div className="card">{renderContent(cards[open].content)}</div> : null}
      </Modal>
    </PageLayout>
  );
}
