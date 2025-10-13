import PageLayout from '@/components/PageLayout';

export default function KontaktPage() {
  return (
    <PageLayout>
      <h2>Kontakt</h2>
      <p>
        Du möchtest mit der Leitung des PMP in Kontakt treten? Das geht über das Vatsim Germany Forum. Gerne per PN.
      </p>
      
      <div className="card">
        <p>
          Boris Pilecki (955179)
        </p>
        <p>
          Timo Heller (1257735)
        </p>
      </div>
      <p>Du möchtest etwas über das PMP loswerden, aber nicht bei uns? Das PMP ist dem Vatsim Germany Pilot Training Department (PTD) zugeordnet, und du wendest dich am besten an</p>
      <div className="card">
        <p>
          Tim Fuchs (1342244)
        </p>
      </div>
    </PageLayout>
  );
}
