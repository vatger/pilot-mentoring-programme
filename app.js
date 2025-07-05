// VATSIM PMP - Vollständige Website mit Logging
const express = require('express')
const { createServer } = require('http')
const fs = require('fs')
const path = require('path')

const port = process.env.PORT || 80
const dev = process.env.NODE_ENV !== 'production'

// Eigenes Logging System
const logFile = path.join(__dirname, 'app.log')

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${type}: ${message}\n`
  
  // In Konsole ausgeben
  console.log(`${type}: ${message}`)
  
  // In Datei schreiben
  try {
    fs.appendFileSync(logFile, logEntry)
  } catch (error) {
    console.error('Logging Error:', error)
  }
}

log('🚀 Starting VATSIM PMP App...')
log(`Environment: ${dev ? 'development' : 'production'}`)
log(`Port: ${port}`)

const app = express()

// Middleware für Logging aller Requests
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || 'Unknown'
  const ip = req.ip || req.connection.remoteAddress || 'Unknown'
  log(`${req.method} ${req.url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}...`)
  next()
})

// Statische Dateien servieren
app.use('/public', express.static('public'))
app.use('/css', express.static('css'))
app.use('/js', express.static('js'))

// Gemeinsame HTML-Struktur
function renderPage(title, content, activePage = '') {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - VATSIM PMP</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23002F5D'/><text x='16' y='20' font-family='Arial' font-size='20' font-weight='bold' fill='white' text-anchor='middle'>P</text></svg>">
        <style>
            :root {
                --primary: #002F5D;
                --secondary: #FFFFFF;
                --accent-red: #D32F2F;
                --accent-yellow: #FFC107;
                --gray-light: #f8f9fa;
                --gray-dark: #343a40;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', 'Helvetica', sans-serif;
                line-height: 1.6;
                color: #333;
                background: #fff;
            }
            
            /* Navigation */
            .navbar {
                background: var(--primary);
                padding: 1rem 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .nav-logo {
                color: white;
                font-size: 1.5rem;
                font-weight: bold;
                text-decoration: none;
            }
            
            .nav-menu {
                display: flex;
                list-style: none;
                gap: 2rem;
                flex-wrap: wrap;
            }
            
            .nav-link {
                color: white;
                text-decoration: none;
                padding: 0.5rem 1rem;
                border-radius: 5px;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .nav-link:hover,
            .nav-link.active {
                background: var(--accent-yellow);
                color: #000;
                transform: translateY(-2px);
            }
            
            /* Main Content */
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            
            .hero {
                background: linear-gradient(135deg, var(--primary) 0%, #1e4d8b 100%);
                color: white;
                padding: 4rem 0;
                text-align: center;
            }
            
            .hero h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .hero .subtitle {
                font-size: 1.3rem;
                margin-bottom: 2rem;
                opacity: 0.9;
            }
            
            .hero .description {
                font-size: 1.1rem;
                margin-bottom: 3rem;
                max-width: 800px;
                margin-left: auto;
                margin-right: auto;
                opacity: 0.8;
            }
            
            /* Buttons */
            .btn {
                display: inline-block;
                padding: 1rem 2rem;
                margin: 0.5rem;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .btn-primary {
                background: var(--accent-yellow);
                color: #000;
            }
            
            .btn-primary:hover {
                background: #ffcd3c;
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
            }
            
            .btn-secondary {
                background: transparent;
                color: white;
                border: 2px solid white;
            }
            
            .btn-secondary:hover {
                background: white;
                color: var(--primary);
            }
            
            /* Cards */
            .cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                padding: 4rem 0;
            }
            
            .card {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                text-align: center;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid #e9ecef;
            }
            
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            }
            
            .card-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                display: block;
            }
            
            .card h3 {
                color: var(--primary);
                margin-bottom: 1rem;
                font-size: 1.3rem;
            }
            
            .card p {
                color: #666;
                line-height: 1.6;
            }
            
            /* Sections */
            .section {
                padding: 4rem 0;
            }
            
            .section-alt {
                background: var(--gray-light);
            }
            
            .section h2 {
                text-align: center;
                color: var(--primary);
                margin-bottom: 3rem;
                font-size: 2.5rem;
            }
            
            /* Footer */
            .footer {
                background: var(--primary);
                color: white;
                padding: 3rem 0 1rem;
                margin-top: 4rem;
            }
            
            .footer-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .footer h4 {
                margin-bottom: 1rem;
                color: var(--accent-yellow);
            }
            
            .footer a {
                color: #ccc;
                text-decoration: none;
                transition: color 0.3s ease;
            }
            
            .footer a:hover {
                color: var(--accent-yellow);
            }
            
            .footer-bottom {
                text-align: center;
                padding-top: 2rem;
                border-top: 1px solid #404f6b;
                color: #ccc;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .nav-container {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .nav-menu {
                    gap: 1rem;
                }
                
                .hero h1 {
                    font-size: 2rem;
                }
                
                .hero .subtitle {
                    font-size: 1.1rem;
                }
                
                .cards {
                    grid-template-columns: 1fr;
                    padding: 2rem 0;
                }
                
                .container {
                    padding: 0 15px;
                }
            }
            
            /* Animations */
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .fade-in {
                animation: fadeInUp 0.6s ease forwards;
            }
            
            /* Status indicators */
            .status-online {
                display: inline-block;
                width: 12px;
                height: 12px;
                background: #28a745;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        </style>
    </head>
    <body>
        <!-- Navigation -->
        <nav class="navbar">
            <div class="nav-container">
                <a href="/" class="nav-logo">✈️ VATSIM PMP</a>
                <ul class="nav-menu">
                    <li><a href="/" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="/teilnahme" class="nav-link ${activePage === 'teilnahme' ? 'active' : ''}">Teilnahme</a></li>
                    <li><a href="/events" class="nav-link ${activePage === 'events' ? 'active' : ''}">Events</a></li>
                    <li><a href="/kontakt" class="nav-link ${activePage === 'kontakt' ? 'active' : ''}">Kontakt</a></li>
                    <li><a href="/logs" class="nav-link ${activePage === 'logs' ? 'active' : ''}">Logs</a></li>
                </ul>
            </div>
        </nav>

        <!-- Main Content -->
        <main>
            ${content}
        </main>

        <!-- Footer -->
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div>
                        <h4>VATSIM PMP</h4>
                        <p>Persönliche 1:1-Betreuung für neue Piloten im VATSIM Netzwerk.</p>
                        <p><span class="status-online"></span>Server Online</p>
                    </div>
                    <div>
                        <h4>Quick Links</h4>
                        <p><a href="/teilnahme">Jetzt teilnehmen</a></p>
                        <p><a href="/events">Aktuelle Events</a></p>
                        <p><a href="/kontakt">Support</a></p>
                    </div>
                    <div>
                        <h4>VATSIM Germany</h4>
                        <p><a href="https://vatsim-germany.org" target="_blank">Website</a></p>
                        <p><a href="https://forum.vatsim-germany.org" target="_blank">Forum</a></p>
                        <p><a href="https://discord.gg/vatsim-germany" target="_blank">Discord</a></p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2025 VATSIM Germany. Alle Rechte vorbehalten.</p>
                    <p>Server läuft seit: ${new Date().toLocaleDateString('de-DE')}</p>
                </div>
            </div>
        </footer>

        <script>
            // Einfache Animationen
            document.addEventListener('DOMContentLoaded', function() {
                const cards = document.querySelectorAll('.card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('fade-in');
                    }, index * 100);
                });
            });
        </script>
    </body>
    </html>
  `
}

// Hauptseite (Home)
app.get('/', (req, res) => {
  log(`Homepage aufgerufen - IP: ${req.ip}`)
  
  const content = `
    <section class="hero">
      <div class="container">
        <h1 class="fade-in">Piloten-Mentoren-Programm</h1>
        <p class="subtitle fade-in">Persönliche 1:1-Betreuung für neue Piloten im VATSIM Netzwerk</p>
        <p class="description fade-in">
          Starte deine VATSIM-Reise mit professioneller Unterstützung. 
          Unsere erfahrenen Mentoren helfen dir dabei, den Einstieg zu erleichtern 
          und deine Flugsimulations-Fähigkeiten zu entwickeln.
        </p>
        <div class="fade-in">
          <a href="/teilnahme" class="btn btn-primary">Jetzt teilnehmen →</a>
          <a href="/events" class="btn btn-secondary">Events ansehen</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2>Warum das PMP?</h2>
        <div class="cards">
          <div class="card">
            <span class="card-icon">👥</span>
            <h3>1:1 Betreuung</h3>
            <p>Persönliche Mentoren stehen dir individuell zur Seite und begleiten dich durch deine ersten Schritte bei VATSIM.</p>
          </div>
          <div class="card">
            <span class="card-icon">📚</span>
            <h3>Schritt-für-Schritt</h3>
            <p>Strukturierte Anleitungen für deinen VATSIM-Einstieg - von der Registrierung bis zum ersten Flug.</p>
          </div>
          <div class="card">
            <span class="card-icon">📅</span>
            <h3>Newbie-Days</h3>
            <p>Regelmäßige Events speziell für Einsteiger mit intensiver Betreuung und praktischen Übungen.</p>
          </div>
          <div class="card">
            <span class="card-icon">💬</span>
            <h3>Community Support</h3>
            <p>Aktive Community in Forum und Discord für schnelle Hilfe und Erfahrungsaustausch.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2>So funktioniert's</h2>
        <div class="cards">
          <div class="card">
            <span class="card-icon">1️⃣</span>
            <h3>VATSIM Registrierung</h3>
            <p>Erstelle deinen kostenlosen VATSIM Account und registriere dich bei VATSIM Germany</p>
          </div>
          <div class="card">
            <span class="card-icon">2️⃣</span>
            <h3>Mentor zuweisen</h3>
            <p>Wir verbinden dich mit einem erfahrenen Mentor, der zu deinen Bedürfnissen passt</p>
          </div>
          <div class="card">
            <span class="card-icon">3️⃣</span>
            <h3>Abheben!</h3>
            <p>Starte deine ersten Flüge mit professioneller Unterstützung und werde Teil der Community</p>
          </div>
        </div>
      </div>
    </section>
  `
  
  res.send(renderPage('Piloten-Mentoren-Programm', content, 'home'))
})

// Teilnahme-Seite
app.get('/teilnahme', (req, res) => {
  log(`Teilnahme-Seite aufgerufen - IP: ${req.ip}`)
  
  const content = `
    <section class="hero">
      <div class="container">
        <h1>Anleitung zur Teilnahme</h1>
        <p class="subtitle">Folge diesen einfachen Schritten, um am Piloten-Mentoren-Programm teilzunehmen</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cards">
          <div class="card">
            <span class="card-icon">🌐</span>
            <h3>1. VATSIM Account erstellen</h3>
            <p>Erstelle zunächst einen kostenlosen VATSIM Account, falls du noch keinen hast.</p>
            <p><strong>Benötigt:</strong></p>
            <ul style="text-align: left; margin: 1rem 0;">
              <li>Gültige E-Mail-Adresse</li>
              <li>Vollständiger Name</li>
              <li>Flugsimulator (MSFS, X-Plane, P3D)</li>
            </ul>
            <a href="https://my.vatsim.net/register" target="_blank" class="btn btn-primary">Bei VATSIM registrieren</a>
          </div>
          
          <div class="card">
            <span class="card-icon">🇩🇪</span>
            <h3>2. VATSIM Germany beitreten</h3>
            <p>Melde dich bei VATSIM Germany an, um Zugang zu unseren deutschsprachigen Services zu erhalten.</p>
            <p style="background: #e3f2fd; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
              <strong>Wichtig:</strong> Du benötigst zuerst einen gültigen VATSIM Account!
            </p>
            <a href="https://vatsim-germany.org/register" target="_blank" class="btn btn-primary">Bei VATSIM Germany anmelden</a>
          </div>
          
          <div class="card">
            <span class="card-icon">✈️</span>
            <h3>3. PMP Bewerbung</h3>
            <p>Sobald du dich bei VATSIM Germany registriert hast, kannst du dich für das PMP bewerben.</p>
            <p><strong>Was passiert als nächstes:</strong></p>
            <ul style="text-align: left; margin: 1rem 0;">
              <li>Kurzer Fragebogen</li>
              <li>Mentor-Zuweisung</li>
              <li>Kontakt innerhalb 48h</li>
              <li>Erste Flugplanung</li>
            </ul>
            <a href="https://forum.vatsim-germany.org/pmp" target="_blank" class="btn btn-primary">PMP Bewerbung starten</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2>Voraussetzungen</h2>
        <div class="cards">
          <div class="card">
            <h3>Technische Anforderungen</h3>
            <ul style="text-align: left;">
              <li>✅ Flugsimulator (MSFS, X-Plane, P3D)</li>
              <li>✅ Headset oder Mikrofon</li>
              <li>✅ Stabile Internetverbindung</li>
              <li>✅ Windows/Mac/Linux PC</li>
            </ul>
          </div>
          <div class="card">
            <h3>Persönliche Anforderungen</h3>
            <ul style="text-align: left;">
              <li>✅ Grundkenntnisse in der Luftfahrt</li>
              <li>✅ Bereitschaft zum Lernen</li>
              <li>✅ Zeit für regelmäßige Sessions</li>
              <li>✅ Deutschkenntnisse</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `
  
  res.send(renderPage('Teilnahme', content, 'teilnahme'))
})

// Events-Seite
app.get('/events', (req, res) => {
  log(`Events-Seite aufgerufen - IP: ${req.ip}`)
  
  const events = [
    {
      title: 'Newbie-Day: Erste Schritte bei VATSIM',
      date: '12. Juli 2025',
      time: '14:00 - 17:00',
      location: 'EDDF (Frankfurt)',
      participants: '8/12',
      level: 'Anfänger'
    },
    {
      title: 'IFR-Grundlagen Workshop',
      date: '19. Juli 2025', 
      time: '15:30 - 17:30',
      location: 'EDDM (München)',
      participants: '5/8',
      level: 'Fortgeschritten'
    },
    {
      title: 'Community-Flug: Deutschlandtour',
      date: '26. Juli 2025',
      time: '16:00 - 20:00', 
      location: 'EDDS → EDDH',
      participants: '15/20',
      level: 'Alle'
    }
  ]
  
  const eventCards = events.map(event => `
    <div class="card">
      <h3>${event.title}</h3>
      <p><strong>📅 Datum:</strong> ${event.date}</p>
      <p><strong>🕐 Zeit:</strong> ${event.time}</p>
      <p><strong>📍 Ort:</strong> ${event.location}</p>
      <p><strong>👥 Teilnehmer:</strong> ${event.participants}</p>
      <p><strong>📊 Level:</strong> <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 3px;">${event.level}</span></p>
      <a href="/kontakt" class="btn btn-primary" style="margin-top: 1rem;">Anmelden</a>
    </div>
  `).join('')
  
  const content = `
    <section class="hero">
      <div class="container">
        <h1>Newbie-Days & Veranstaltungen</h1>
        <p class="subtitle">Nimm an unseren speziellen Events teil und lerne zusammen mit anderen neuen Piloten</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2>Kommende Events</h2>
        <div class="cards">
          ${eventCards}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2>Event-Kategorien</h2>
        <div class="cards">
          <div class="card">
            <span class="card-icon">🎓</span>
            <h3>Newbie-Days</h3>
            <p>Spezielle Tage für absolute Anfänger mit intensiver Betreuung und praktischen Übungen.</p>
          </div>
          <div class="card">
            <span class="card-icon">🛠️</span>
            <h3>Workshops</h3>
            <p>Thematische Workshops zu spezifischen Aspekten der Fliegerei wie IFR, Navigation und Kommunikation.</p>
          </div>
          <div class="card">
            <span class="card-icon">🌍</span>
            <h3>Gruppenflüge</h3>
            <p>Community-Flüge für Piloten aller Erfahrungsstufen zum Kennenlernen und gemeinsamen Fliegen.</p>
          </div>
        </div>
      </div>
    </section>
  `
  
  res.send(renderPage('Events', content, 'events'))
})

// Kontakt-Seite
app.get('/kontakt', (req, res) => {
  log(`Kontakt-Seite aufgerufen - IP: ${req.ip}`)
  
  const content = `
    <section class="hero">
      <div class="container">
        <h1>Kontakt & Support</h1>
        <p class="subtitle">Brauchst du Hilfe oder hast Fragen zum Piloten-Mentoren-Programm?</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2>Kontaktmöglichkeiten</h2>
        <div class="cards">
          <div class="card">
            <span class="card-icon">💬</span>
            <h3>Discord</h3>
            <p>Unser aktivster Kommunikationskanal. Hier findest du schnell Hilfe von der Community.</p>
            <a href="https://discord.gg/vatsim-germany" target="_blank" class="btn btn-primary">Discord beitreten</a>
            <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">24/7 Community Support</p>
          </div>
          
          <div class="card">
            <span class="card-icon">📋</span>
            <h3>Forum</h3>
            <p>Für ausführliche Diskussionen und langfristige Hilfestellung.</p>
            <a href="https://forum.vatsim-germany.org" target="_blank" class="btn btn-primary">Forum besuchen</a>
            <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">Strukturierte Hilfe & FAQs</p>
          </div>
          
          <div class="card">
            <span class="card-icon">📧</span>
            <h3>E-Mail</h3>
            <p>Für persönliche Anliegen oder wenn du eine ausführliche Antwort benötigst.</p>
            <a href="mailto:pmp@vatsim-germany.org" class="btn btn-primary">E-Mail senden</a>
            <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">Antwort innerhalb von 24h</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2>Häufig gestellte Fragen</h2>
        <div class="cards">
          <div class="card">
            <h3>Allgemeine Fragen</h3>
            <div style="text-align: left;">
              <p><strong>Kostet die Teilnahme etwas?</strong><br>
              Nein, das PMP ist vollständig kostenlos.</p>
              
              <p><strong>Wie lange dauert das Mentoring?</strong><br>
              Meist 4-6 Sessions, je nach Bedarf.</p>
              
              <p><strong>Welche Simulatoren werden unterstützt?</strong><br>
              MSFS, X-Plane, P3D und andere gängige Simulatoren.</p>
            </div>
          </div>
          
          <div class="card">
            <h3>Technische Fragen</h3>
            <div style="text-align: left;">
              <p><strong>Was bei technischen Problemen?</strong><br>
              Unser Support-Team hilft bei Installation und Konfiguration.</p>
              
              <p><strong>Brauche ich ein Headset?</strong><br>
              Empfohlen, aber Text-Kommunikation ist auch möglich.</p>
              
              <p><strong>Wie gut muss mein Englisch sein?</strong><br>
              Bei VATSIM Germany wird primär Deutsch gesprochen.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
  
  res.send(renderPage('Kontakt', content, 'kontakt'))
})

// Logs-Seite (Eigenes Logging System)
app.get('/logs', (req, res) => {
  log(`Logs-Seite aufgerufen - IP: ${req.ip}`)
  
  try {
    let logContent = 'Keine Logs verfügbar.'
    
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8')
      const logLines = logs.split('\n').filter(line => line.trim()).reverse() // Neueste zuerst
      const recentLogs = logLines.slice(0, 100) // Nur die letzten 100 Einträge
      
      logContent = recentLogs.map(line => {
        const isError = line.includes('ERROR')
        const isWarning = line.includes('WARN')
        const color = isError ? '#dc3545' : isWarning ? '#ffc107' : '#28a745'
        return `<div style="color: ${color}; margin: 5px 0; font-family: monospace;">${line}</div>`
      }).join('')
    }
    
    const content = `
      <section class="hero">
        <div class="container">
          <h1>System Logs</h1>
          <p class="subtitle">Aktuelle Server-Aktivitäten und Debugging-Informationen</p>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="card">
            <h3>📊 Server Status</h3>
            <p><span class="status-online"></span>Online seit: ${new Date().toLocaleString('de-DE')}</p>
            <p>Port: ${port}</p>
            <p>Environment: ${dev ? 'Development' : 'Production'}</p>
            <p>Logfile: app.log</p>
          </div>
          
          <div class="card" style="max-height: 600px; overflow-y: auto; text-align: left;">
            <h3>📝 Aktuelle Logs (letzte 100 Einträge)</h3>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; font-size: 0.85rem;">
              ${logContent}
            </div>
          </div>
          
          <div class="card">
            <h3>🔄 Log-Aktionen</h3>
            <a href="/logs/download" class="btn btn-primary">Logs herunterladen</a>
            <a href="/logs/clear" class="btn btn-secondary" onclick="return confirm('Logs wirklich löschen?')">Logs löschen</a>
          </div>
        </div>
      </section>
    `
    
    res.send(renderPage('Logs', content, 'logs'))
  } catch (error) {
    log(`Fehler beim Laden der Logs: ${error.message}`, 'ERROR')
    res.status(500).send(renderPage('Logs - Fehler', '<div class="container"><h1>Fehler beim Laden der Logs</h1></div>'))
  }
})

// Log Download
app.get('/logs/download', (req, res) => {
  log(`Log-Download angefordert - IP: ${req.ip}`)
  
  if (fs.existsSync(logFile)) {
    res.download(logFile, 'vatsim-pmp-logs.txt')
  } else {
    res.status(404).send('Keine Logs verfügbar')
  }
})

// Logs löschen
app.get('/logs/clear', (req, res) => {
  log(`Logs gelöscht - IP: ${req.ip}`, 'WARN')
  
  try {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile)
    }
    log('Logs wurden gelöscht und System neu gestartet')
    res.redirect('/logs')
  } catch (error) {
    log(`Fehler beim Löschen der Logs: ${error.message}`, 'ERROR')
    res.status(500).send('Fehler beim Löschen der Logs')
  }
})

// Status-Route für Monitoring
app.get('/status', (req, res) => {
  const status = {
    status: 'OK',
    app: 'VATSIM PMP',
    version: '2.0.0',
    port: port,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  }
  
  log(`Status abgerufen - ${JSON.stringify(status)}`)
  res.json(status)
})

// 404 Handler
app.use((req, res) => {
  log(`404 - Seite nicht gefunden: ${req.url} - IP: ${req.ip}`, 'WARN')
  
  const content = `
    <section class="hero">
      <div class="container">
        <h1>404 - Seite nicht gefunden</h1>
        <p class="subtitle">Die angeforderte Seite existiert nicht.</p>
        <a href="/" class="btn btn-primary">Zur Startseite</a>
      </div>
    </section>
  `
  
  res.status(404).send(renderPage('404 - Seite nicht gefunden', content))
})

// Error Handler
app.use((error, req, res, next) => {
  log(`Server Error: ${error.message} - Stack: ${error.stack}`, 'ERROR')
  
  const content = `
    <section class="hero">
      <div class="container">
        <h1>500 - Server Fehler</h1>
        <p class="subtitle">Ein unerwarteter Fehler ist aufgetreten.</p>
        <a href="/" class="btn btn-primary">Zur Startseite</a>
      </div>
    </section>
  `
  
  res.status(500).send(renderPage('500 - Server Fehler', content))
})

// Server starten
const server = createServer(app)

server.listen(port, () => {
  log(`✅ VATSIM PMP Server gestartet auf Port ${port}`)
  log(`🌐 Verfügbar unter: http://pmp.hosting201623.ae912.netcup.net`)
  log(`📊 Environment: ${dev ? 'Development' : 'Production'}`)
})

server.on('error', (err) => {
  log(`❌ Server Error: ${err.message}`, 'ERROR')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM empfangen, Server wird beendet...', 'WARN')
  server.close(() => {
    log('Server erfolgreich beendet')
    process.exit(0)
  })
})

// Error handling
process.on('uncaughtException', (err) => {
  log(`❌ Uncaught Exception: ${err.message} - Stack: ${err.stack}`, 'ERROR')
})

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection: ${reason}`, 'ERROR')
})
