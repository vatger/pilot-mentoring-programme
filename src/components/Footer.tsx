'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());
  
  return (
    <div className="footer">
      <p>
        &copy; {year} &ndash; VATSIM Germany PMP<br />
        <small>
          Fragen? Kontaktiere uns jederzeit über das <a href="/kontakt">Forum</a>.<br />
          <a href="https://vatsim-germany.org/policies/gdpr">GDPR / Datenschutz</a> | <a href="https://vatsim-germany.org/policies/imprint">Impressum</a>
        </small>
      </p>
    </div>
  );
}
