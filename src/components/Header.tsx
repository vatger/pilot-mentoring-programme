'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {

  const { data: session, status } = useSession();
  const [theme, setTheme] = useState('light');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManualToggle, setIsManualToggle] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [isCheckrideReady, setIsCheckrideReady] = useState(false);
  const [hasCheckrideInfo, setHasCheckrideInfo] = useState(false);
  const isManualToggleRef = useRef(isManualToggle);

  useEffect(() => {
    setIsHydrated(true);
    // Set initial theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedShowInternal = localStorage.getItem('showInternal');
    if (savedShowInternal !== null) {
      setShowInternal(savedShowInternal === 'true');
    }

    // Set initial collapsed state for mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsCollapsed(true);
    }

    // Set initial mobile state
    setIsMobile(window.innerWidth < 768);

    // Set active nav item based on path
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    setActiveNavItem(path);

    // Handle resize (reads latest manual-toggle flag from ref)
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && !isManualToggleRef.current) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 768) {
        setIsCollapsed(false);
        setIsManualToggle(false);
        isManualToggleRef.current = false;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleInternal = () => {
    setShowInternal((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('showInternal', String(next));
      }
      return next;
    });
  };

  const hideInternal = () => {
    setShowInternal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('showInternal', 'false');
    }
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  const toggleMenu = () => {
  setIsCollapsed(!isCollapsed);
  setIsManualToggle(true);
  isManualToggleRef.current = true;
  };

  const teams = (session?.user as any)?.teams || [];
  const userRole = (session?.user as any)?.role;
  
  // Role-based access determination
  const isAdmin = userRole === "ADMIN";
  const isLeitung = userRole === "PMP_LEITUNG";
  const isExaminer = userRole === "PMP_PRÜFER" || isAdmin || isLeitung;
  const isMentor = userRole === "MENTOR" || userRole === "PMP_PRÜFER" || isLeitung || isAdmin;
  const isTrainee = userRole === "TRAINEE" || userRole === "PENDING_TRAINEE";
  const isPendingTrainee = userRole === "PENDING_TRAINEE";
  const isVisitor = userRole === "VISITOR";

  useEffect(() => {
    if (status !== 'authenticated') {
      setHasCheckrideInfo(false);
      setIsCheckrideReady(false);
      return;
    }
    if (userRole === 'TRAINEE') {
      (async () => {
        try {
          const res = await fetch('/api/checkrides/me', { cache: 'no-store' });
          if (!res.ok) throw new Error('Load failed');
          const data = await res.json();
          setIsCheckrideReady(Boolean(data?.training?.readyForCheckride));
          setHasCheckrideInfo(true);
        } catch {
          setIsCheckrideReady(false);
          setHasCheckrideInfo(false);
        }
      })();
    } else {
      setHasCheckrideInfo(false);
      setIsCheckrideReady(false);
    }
  }, [status, userRole]);

  if (!isHydrated || shouldRedirect) {
    return null;
  }
  
  return (
    <>
      {isMobile && (
        <div className="mobile-header-controls">
          <button 
            id="mobile-menu-toggle" 
            className={`mobile-menu-toggle ${isCollapsed ? 'menu-closed' : ''}`}
            aria-label="Toggle Navigation Menu"
            aria-expanded={!isCollapsed}
            onClick={toggleMenu}
          >
            <svg className="icon-plane" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#fff" stroke="currentColor" strokeWidth="2">
              <path d="M10.18 9" />
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V21l2-1 2 1v-7.5z" />
            </svg>
            <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
              Toggle Menu
            </span>
          </button>
        </div>
      )}
      <div className={`header-container ${isCollapsed ? 'collapsed' : ''}`} id="header-container">
        <div className="header">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                paddingTop: '0px'
              }}
            >
              <button className="button" onClick={toggleInternal} style={{ justifySelf: 'start' }}>
                Intern
              </button>
              <Link href="/" className="logo-link" style={{ justifySelf: 'center' }}>
                <div className="logo">
                  {/* background image chosen by CSS via [data-theme] */}
                  <div className="logo-visual" role="img" aria-label="VATGer logo" />
                </div>
              </Link>
              <button
                className={`dark-mode-toggle ${theme === 'dark' ? 'dark-active' : ''}`}
                aria-label="Toggle Dark Mode"
                onClick={toggleTheme}
                style={{ justifySelf: 'end', position: 'static', top: 'auto', right: 'auto' }}
              >
                <svg className="icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <svg className="icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span className="toggle-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
            <h1>Piloten-Mentoren-Programm</h1>
          </div>
        {showInternal ? (
          <div
            className="nav"
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 0',
            }}
          >
            {status === 'loading' && <div className="card"><p style={{ margin: 0 }}>Lade Session...</p></div>}

            {status !== 'loading' && !session && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '720px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div className="stepper-progress" style={{ margin: 0 }}>Interner Bereich</div>
                  <p style={{ margin: 0 }}>Bitte anmelden, um die internen Links zu sehen.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="button" onClick={() => signIn('vatsim', { callbackUrl: '/trainings' })}>
                    Mit VATGER anmelden
                  </button>
                  <button className="button" onClick={hideInternal}>Zurück zur Hauptseite</button>
                </div>
              </div>
            )}

            {session && (
              <>
                <div className="card" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '900px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="stepper-progress" style={{ margin: 0 }}>Interner Bereich</div>
                    <div style={{ fontWeight: 600 }}>{session.user?.name}</div>
                    <div style={{ color: 'var(--text-color)', fontSize: '0.95em' }}>Rolle: {userRole || 'N/A'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="button" onClick={() => signOut({ callbackUrl: '/' })}>Logout</button>
                    <button className="button" onClick={hideInternal}>Zurück</button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    width: '100%',
                    maxWidth: '960px',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  }}
                >
                  {(isAdmin || isLeitung) && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Leitung & Admin</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Schnellzugriff auf Admin-Tools.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link className="button" href="/admin">Admin Control Panel</Link>
                        <Link className="button" href="/pmp-tracking">PMP-Tracking</Link>
                        <Link className="button" href="/mentor/trainee">Alle Trainees</Link>
                      </div>
                    </div>
                  )}

                  {isExaminer && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Checkride Prüfer</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Slots anlegen und Assessments öffnen.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link className="button" href="/examiner/availability">Checkride Slots</Link>
                      </div>
                    </div>
                  )}

                  {isMentor && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Mentor</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Trainings verwalten und Sessions loggen.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link className="button" href="/mentor/dashboard">Mentoren Dashboard</Link>
                      </div>
                    </div>
                  )}

                  {isTrainee && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Trainee</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Deinen Fortschritt und Checkride verwalten.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {!isPendingTrainee && <Link className="button" href="/trainee/progress">Mein Trainingsfortschritt</Link>}
                        {isPendingTrainee && <Link className="button" href="/anmeldung">Jetzt für das PMP anmelden</Link>}
                        {isCheckrideReady && hasCheckrideInfo && (
                          <Link className="button" href="/trainee/checkride">Checkride buchen / Ergebnis</Link>
                        )}
                      </div>
                    </div>
                  )}

                  {(isVisitor || isPendingTrainee) && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Registrierung</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Starte oder vervollständige deine Anmeldung.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link className="button" href="/anmeldung">PMP Anmeldung</Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          activeNavItem !== null && (
            <nav className="nav" aria-label="Hauptnavigation">
              <Link href="/" className={activeNavItem === '/' ? 'active' : ''}>Home</Link>
              <Link href="/pmp" className={activeNavItem === '/pmp' ? 'active' : ''}>PMP</Link>
              <Link href="/howto" className={activeNavItem === '/howto' ? 'active' : ''}>How to get started</Link>
              <Link href="/infos-fuer-piloten" className={activeNavItem === '/infos-fuer-piloten' ? 'active' : ''}>Infos für Piloten</Link>
              <Link href="/events" className={activeNavItem === '/events' ? 'active' : ''}>Online-Event</Link>
              <Link href="/anmeldung" className={activeNavItem === '/anmeldung' ? 'active' : ''}>Anmeldung</Link>
              <Link href="/mentorenbewerbung" className={activeNavItem === '/mentorenbewerbung' ? 'active' : ''}>Mentorenbewerbung</Link>
              <Link href="/kontakt" className={activeNavItem === '/kontakt' ? 'active' : ''}>Kontakt</Link>
            </nav>
          )
        )}
      </div>
    </>
  );
}

