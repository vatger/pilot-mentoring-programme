"use client";

import { useState } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Modal from '@/components/Modal';

type CardKey = 'vatsim' | 'not' | 'pilot';

const details: Record<CardKey, { title: string; content: string; ctas?: { text: string; href: string }[] }> = {
  vatsim: {
    title: 'Was ist VATSIM?',
  content: `Vatsim ist ein weltweites Online-Netzwerk für Flugsimulation mit ca. 200.000 Mitgliedern. Wir simulieren Flugverkehr und machen das so realistisch wie möglich.
Das Zahlenverhältnis Piloten zu Lotsen ist aktuell ca. 12:1, das heißt ca. 8% unserer Mitglieder sind aktive Lotsen. Allerdings fliegen viele von ihnen auch selber.
Deutschland gehört mit zu den verkehrsreichsten Regionen auf Vatsim, deshalb ist es hier besonders wichtig, die Regeln des Luftverkehrs zu beherrschen. Schon kleine Störungen können Chaos und Frustration verursachen und den Teilnehmern den Spaß verderben.
Das verstärkt sich noch durch die Situation, dass erstens oft nicht alle Bereiche des Luftraums mit Lotsen besetzt sind, und zweitens, dass Lufträume, die in der Realität von mehreren Lotsen betreut werden, auf Vatsim nur einen oder zwei Lotsen haben.
Stell dir z.B. Frankfurt vor. In Frankfurt gibt es real 19 Lotsenpositionen, 13 am Boden und 6 in der Luft, die permanent besetzt sind - und auf denen jeder Lotse noch einen Kollegen hat, der ihn unterstützt.
Auf Vatsim sind selbst an einem Online Day vielleicht die Hälfte dieser Positionen besetzt, und das auch nur mit jeweils einer Person. Dafür hat Frankfurt auf Vatsim oft mehr Verkehr als in der Realität.
Das erhöht natürlich die Arbeitsbelastung für diese Lotsen, und um so wichtiger ist es, dass sie sich auf dich als Piloten verlassen können.
Auf Vatsim wird natürlich auch VFR geflogen, was viel Spaß machen kann und wozu es auch immer wieder spezielle Events gibt.
Und um beim Beispiel Frankfurt zu bleiben: In der Realität muss ein VFR-Flieger dort fast immer draußen bleiben - auf Vatsim wird, wenn es irgend geht, jede Anfrage nach einem Durchflug durch die Kontrollzone positiv beantwortet.`,
    ctas: [
      { text: 'Ich habe verstanden dass Vatsim nicht irgendein Spiel ist und gehe zum PMP.', href: '/pmp' },
    ],
  },
  not: {
    title: 'Was ist VATSIM nicht?',
  content: `Vatsim ist <strong>kein</strong> Online Game, in dem du im Militärjet Tiefflüge machen kannst oder andere Flugzeuge abfängst.
Vatsim ist <strong>keine</strong> Umgebung, in der du mit einem A380 von Dortmund oder einem ähnlich kleinen Airport startest oder dort landest.
Bei Vatsim verwendest du die Advisory Frequency 122.8 <strong>nicht</strong> dazu, mit deinen Kumpels zu texten, komische Geräusche zu machen oder Sounds oder Musik abzuspielen
Bei Vatsim connectest du dich <strong>nicht</strong> auf der Runway oder einem Taxiway und startest einfach, sondern befolgst Lotsenanweisungen oder stimmst dich mit anderen Piloten ab.
Bei Vatsim schaltest du <strong>nicht</strong> den Autopiloten ein und schaust mal was das Flugzeug macht, sondern kannst dein Flugzeug bedienen.
Bei Vatsim fliegst du <strong>nicht</strong> gegen Häuser und spielst auch <strong>nicht</strong> „Flugzeugentführung“ oder ähnlichen Unsinn.
All das sind Dinge, die auf Vatsim (leider) regelmäßig passieren.
Dagegen wollen wir im PMP etwas tun.`,
    ctas: [
      { text: 'Ich habe verstanden dass Vatsim nicht irgendein Spiel ist und gehe zum PMP.', href: '/pmp' },
    ],
  },
  pilot: {
    title: 'Was du als Pilot wissen solltest',
  content: `Wenn du als Pilot bei uns auf Vatsim fliegen möchtest, musst du bestimmte Dinge wissen und beherrschen. Gerade in Deutschland haben wir regelmäßig viel Verkehr (deswegen bist du ja hier, oder?) - aber dieser Verkehr soll ja auch funktionieren.
Wenn du bei uns Airliner fliegen möchtest, solltest du die nachfolgenden Fragen beantworten können und wissen was du in den verschiedenen Situation zu tun hast.
Denn: „Mein Flugzeug macht nicht was es soll“ gilt bei uns nicht. DU als Pilot sagst dem Flugzeug was es wann machen soll. Wenn es das nicht tut, musst du noch üben.
- Was ist eine ATIS, und welche Informationen enthält sie?
- Was bedeutet SID und STAR?
- Was bedeutet „flight planned route“?
- Was bedeutet „climb via SID"?
- Was ist eine "blue line" bzw. eine "orange line"?
- Was bedeutet „hold short"?
- Was bedeutet „squawk mode charlie"?
- Was ist eine conditional clearance?
- Was ist der Unterschied zwischen altitude und flight level?
- Was bedeuten „transition altitude" und „transition level"?
- Was ist eine speed restriction und wie lange gilt sie?
- Was ist eine RNAV Transition?
- Kannst du eine Anweisung wie „proceed direct DH437" sofort befolgen?
- Was ist ein Clearance Limit?
- Was ist ein Holding?
- Was ist ein IAF?
- Was bedeutet „maintain 160 until 5 DME"?
- Was bedeutet „fly published missed approach"?
`,
    ctas: [
      { text: 'Du weißt das alles? Schließen und Fliegen.', href: '/howto' },
      { text: 'Da fehlt dir doch noch was? Weiter zum PMP!', href: '/pmp' },
    ],
  },
};

export default function HomePage() {
  const [open, setOpen] = useState<CardKey | null>(null);

  function openCard(key: CardKey) {
    setOpen(key);
  }

  function parseContent(text: string, opts?: { highlightFirstN?: number; highlightClass?: string }) {
    const lines = text.split(/\r?\n/);
    const elements: JSX.Element[] = [];
    let listBuffer: string[] | null = null;
    const highlightN = opts?.highlightFirstN ?? 0;
    const highlightClass = opts?.highlightClass;
    let listFlushed = false;
    let normalCount = 0;
    const dangerLines: string[] = [];

    function flushList() {
      if (!listBuffer || listBuffer.length === 0) return;
      elements.push(
        <ul key={elements.length}>{listBuffer.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: li.trim() }} />)}</ul>
      );
      listBuffer = null;
      listFlushed = true;
    }

    for (const raw of lines) {
      const line = raw.replace(/\u00A0/g, ' ').trim();
      if (line === '') {
        // blank line: flush any list in progress
        flushList();
        continue;
      }

      // bullet markers -> group into a list
      if (/^[●\-\*]/.test(line)) {
        if (!listBuffer) {
          listBuffer = [];
        }
        const item = line.replace(/^[●\-\*]\s*/, '');
        listBuffer.push(item);
        continue;
      }

      if (listBuffer) {
        flushList();
      }


      elements.push(<p key={elements.length} dangerouslySetInnerHTML={{ __html: line }} />);
      normalCount++;
    }

    flushList();

    if (dangerLines.length > 0) {
      if (highlightClass) {
        elements.unshift(
          <div key={`danger`} className={highlightClass}>
            {dangerLines.map((d, idx) => <p key={idx} dangerouslySetInnerHTML={{ __html: d }} />)}
          </div>
        );
      } else {
        elements.unshift(...dangerLines.map((d, idx) => <p key={`d-${idx}`} dangerouslySetInnerHTML={{ __html: d }} />));
      }
    }

    return elements.length ? elements : [<p key={0} dangerouslySetInnerHTML={{ __html: text }} />];
  }

  return (
    <PageLayout>
      <h2>Herzlich willkommen als Pilot bei VATSIM!</h2>
      <div className="card">
        <h3>Warum du dir das PMP näher ansehen solltest:</h3>
        <p>
          Fliegen auf Vatsim ist ein Zusammenspiel zweier Teams. Ein Spiel, das nach bestimmten, komplexen Regeln
          funktioniert und nur dann Spaß macht, wenn alle diese Regeln kennen und sie auch befolgen. Lotsen auf Vatsim
          müssen eine aufwändige und langwierige Ausbildung durchlaufen und Prüfungen bestehen, um bei uns lotsen zu
          können. Als Pilot werden auch von dir bestimmte Kenntnisse und Fähigekeiten gefordert - wie du im New Member
          Orientation Course entweder schon erfahren hast oder noch erfahren wirst. Aber was bedeutet das jetzt genau?
          Was solltest du wissen und können, um erfolgreich und mit Spaß an der Sache unser schönes Hobby betreiben zu
          können? Dabei unterstützen wir dich!
        </p>
      </div>

      <h3>Worum geht es hier?</h3>

      <div className="three-col-grid">
        <div className="card" role="button" tabIndex={0} onClick={() => openCard('vatsim')} onKeyDown={(e) => e.key === 'Enter' && openCard('vatsim')}>
          <h3>Was ist VATSIM?</h3>
          <p className="link-like" aria-hidden="true">Mehr erfahren</p>
        </div>
        <div className="card" role="button" tabIndex={0} onClick={() => openCard('not')} onKeyDown={(e) => e.key === 'Enter' && openCard('not')}>
          <h3>Was ist VATSIM nicht?</h3>
          <p className="link-like" aria-hidden="true">Mehr erfahren</p>
        </div>
        <div className="card" role="button" tabIndex={0} onClick={() => openCard('pilot')} onKeyDown={(e) => e.key === 'Enter' && openCard('pilot')}>
          <h3>Was du als Pilot wissen solltest:</h3>
          <p className="link-like" aria-hidden="true">Mehr erfahren</p>
        </div>
      </div>

      <div className="card">
        <h3>Was wir dir anbieten:</h3>
        <ul>
          <li>Ein erstes Assessment: Eine halbe Stunde auf Discord mit einem Mentor. Bist du fit für’s Online-Fliegen - oder solltest du noch an deinen Fähigkeiten arbeiten?</li>
          <li>Individuelles Pilotentraining: One-on-one Sessions, ausgehend von deinen Fähigkeiten. Flüge planen, mit den richtigen Daten und Karten. Fliegen, IFR oder VFR, mit dem Airliner oder einem Flugzeug der General Aviation. Kommunikation mit ATC. Verhalten im Netzwerk.</li>
          <li>Ein regelmäßiges Online-Event</li>
          <li>Starke Community und freundliche Atmosphäre</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ textAlign: 'center' }}>
          <Link href="/pmp">Und jetzt sieh dir das PMP näher an!</Link>
        </h3>
      </div>

  <Modal isOpen={open !== null} onClose={() => setOpen(null)} title={open ? details[open as CardKey].title : undefined} variant={open ?? undefined}>
        {open ? (
          <>
            {open === 'not' ? (
              parseContent(details[open as CardKey].content, { highlightFirstN: 6, highlightClass: 'modal-danger' })
            ) : (
              parseContent(details[open as CardKey].content)
            )}
            {details[open as CardKey].ctas?.map((cta, i) => (
              <p className="modal-cta" key={i}><Link href={cta.href}>{cta.text}</Link></p>
            ))}
          </>
        ) : null}
      </Modal>
    </PageLayout>
  );
}
