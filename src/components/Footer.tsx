'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());
  
  return (
    <div className="footer">
      <p>
        &copy; {year} &ndash; VATSIM Germany PMP<br />
        <small>Fragen? Kontaktieren Sie uns jederzeit über das <a href="/kontakt">Forum</a>.</small>
      </p>
    </div>
  );
}
