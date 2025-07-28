import PageLayout from '@/components/PageLayout';

export default function KontaktPage() {
  return (
    <PageLayout>
      <h2>Kontakt</h2>
      <p>
        Wenn Sie Fragen zum Piloten-Mentoren-Programm haben oder Interesse an einer Teilnahme haben, zögern Sie nicht, uns zu kontaktieren.
      </p>
      
      <div className="card">
        <h3>Kontaktmöglichkeiten</h3>
        <p>
          Am besten erreichen Sie uns über das <a href="https://board.vatsim-germany.org/forums/piloten-mentoren-programm.739/" target="_blank" rel="noopener noreferrer">VATSIM Germany Forum</a>.
        </p>
        <p>
          Alternativ können Sie auch eine E-Mail an das PMP-Team senden.
        </p>
      </div>
    </PageLayout>
  );
}
