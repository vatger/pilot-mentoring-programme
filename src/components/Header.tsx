'use client';
import { Moon, Plane, Sun } from 'lucide-react';
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
const isCompletedTrainee = userRole === "COMPLETED_TRAINEE" || userRole === "CHECKRIDE_COMPLETED";

useEffect(() => {
  if (status !== 'authenticated') {
    setHasCheckrideInfo(false);
    setIsCheckrideReady(false);
    return;
  }
  if (userRole === 'TRAINEE' || isCompletedTrainee) {
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
            <Plane className="icon-plane" style={{transform: 'rotate(180deg)'}} />
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
              <button 
                className="button" 
                onClick={toggleInternal} 
                style={{
                  justifySelf: 'start',
                  ...(window.innerWidth < 500 && { display: 'hidden', opacity:0 })
                }}
              >
                PMP Intern
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
                <Moon className='icon-moon' />
                <Sun className='icon-sun' />
                <span className="toggle-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
            <h1>Piloten-Mentoren-Programm</h1>
          </div>
        {showInternal ? (
          <div className="nav" style={{ flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 0', }}>
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
                        <Link className="button" href="/mentors-activity">Mentorenaktivität</Link>
                      </div>
                    </div>
                  )}

                  {isExaminer && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Checkride Prüfer</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Ready-Queue prüfen und Assessments öffnen.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link className="button" href="/examiner/availability">Checkride Queue</Link>
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

                  {isTrainee || isCompletedTrainee && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Trainee</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Deinen Fortschritt und Checkride verwalten.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {!isPendingTrainee && (
                          <Link className="button" href="/trainee/progress">Mein Trainingsfortschritt</Link>
                        )}
                        {isPendingTrainee && (
                          <div className="stepper-progress" style={{ margin: 0 }}>Anmeldung eingegangen – wartet auf Zuweisung</div>
                        )}
                        {isCheckrideReady && hasCheckrideInfo && (
                          <Link className="button" href="/trainee/checkride">Checkride Status / Ergebnis</Link>
                        )}
                      </div>
                    </div>
                  )}

                  {isVisitor && (
                    <div className="card" style={{ marginBottom: 0, padding: '12px 14px' }}>
                      <h3 style={{ margin: '0 0 6px 0' }}>Registrierung</h3>
                      <p style={{ margin: '0 0 8px 0' }}>Starte oder vervollständige deine Anmeldung.</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link className="button" href="/anmeldung-forum">PMP Anmeldung</Link>
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
              <Link href="/" className={activeNavItem === '/' ? 'active' : ''}>PMP Home</Link>
              <Link href="/events" className={activeNavItem === '/events' ? 'active' : ''}>Online Event</Link>
              <Link href="/infos-fuer-piloten" className={activeNavItem === '/infos-fuer-piloten' ? 'active' : ''}>Piloten-Knowhow</Link>
              <Link href="/kontakt" className={activeNavItem === '/kontakt' ? 'active' : ''}>Kontakt</Link>
              <Link href="/for-pilots" className={activeNavItem === '/for-pilots' ? 'active' : ''}>For Pilots</Link>
              <Link href="#" onClick={(e) => { e.preventDefault(); setShowInternal(true); }} className={showInternal ? 'active' : ''}>PMP Intern</Link>
            </nav>
          )
        )}
      </div>
    </>
  );
}

