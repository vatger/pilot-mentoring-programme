// VATSIM PMP - Minimal Passenger-kompatible Anwendung
const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()

// Einfaches Logging
function log(message) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}\n`
  console.log(message)
  try {
    fs.appendFileSync(path.join(__dirname, 'passenger.log'), logEntry)
  } catch (e) {
    console.error('Logging error:', e)
  }
}

log('🚀 VATSIM PMP Passenger App starting...')

// Request Logging
app.use((req, res, next) => {
  log(`${req.method} ${req.url}`)
  next()
})

// Statische Dateien
app.use(express.static(path.join(__dirname, 'public')))

// Einfache HTML-Funktion
function renderPage(title, content) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - VATSIM Germany PMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #004494; font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .nav { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
        .nav a { color: #004494; text-decoration: none; padding: 10px 15px; border-radius: 5px; transition: all 0.3s; }
        .nav a:hover { background: #004494; color: white; }
        .content { margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">VATSIM Germany</div>
            <h1>Piloten-Mentoren-Programm</h1>
        </div>
        <nav class="nav">
            <a href="/">Home</a>
            <a href="/teilnahme">Teilnahme</a>
            <a href="/events">Events</a>
            <a href="/kontakt">Kontakt</a>
            <a href="/status">Status</a>
        </nav>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; 2024 VATSIM Germany - Piloten-Mentoren-Programm</p>
        </div>
    </div>
</body>
</html>`
}

// Routes
app.get('/', (req, res) => {
  const content = `
    <h2>Willkommen beim Piloten-Mentoren-Programm</h2>
    <p>Das Piloten-Mentoren-Programm (PMP) von VATSIM Germany bietet angehenden Piloten die Möglichkeit, von erfahrenen Mentoren zu lernen und ihre Fähigkeiten zu verbessern.</p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>Für Mentees</h3>
            <p>Lernen Sie von erfahrenen Piloten und verbessern Sie Ihre Fähigkeiten im virtuellen Luftraum.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>Für Mentoren</h3>
            <p>Teilen Sie Ihr Wissen und helfen Sie neuen Piloten beim Einstieg in VATSIM.</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>Events</h3>
            <p>Nehmen Sie an speziellen Training-Events und Gruppenflügen teil.</p>
        </div>
    </div>
  `
  res.send(renderPage('Home', content))
})

app.get('/teilnahme', (req, res) => {
  const content = `
    <h2>Teilnahme am PMP</h2>
    <h3>Voraussetzungen für Mentees:</h3>
    <ul>
        <li>Aktive VATSIM-Mitgliedschaft</li>
        <li>Grundkenntnisse in der Flugzeugführung</li>
        <li>Bereitschaft zum Lernen</li>
    </ul>
    
    <h3>Anmeldung:</h3>
    <p>Die Anmeldung erfolgt über das VATSIM Germany Forum oder per E-Mail an das PMP-Team.</p>
    
    <h3>Was erwartet Sie:</h3>
    <ul>
        <li>Individuelles Mentoring</li>
        <li>Gruppen-Training</li>
        <li>Praktische Übungsflüge</li>
        <li>Feedback und Verbesserungsvorschläge</li>
    </ul>
  `
  res.send(renderPage('Teilnahme', content))
})

app.get('/events', (req, res) => {
  const content = `
    <h2>Aktuelle Events</h2>
    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Nächstes Training: Grundlagen IFR</h3>
        <p><strong>Datum:</strong> Samstag, 15. Dezember 2024</p>
        <p><strong>Zeit:</strong> 19:00 - 21:00 UTC</p>
        <p><strong>Thema:</strong> IFR-Verfahren und Navigation</p>
    </div>
    
    <h3>Regelmäßige Events:</h3>
    <ul>
        <li>Wöchentliche Gruppen-Trainings (Samstags 19:00 UTC)</li>
        <li>Individuelle Mentoring-Sessions (nach Vereinbarung)</li>
        <li>Monatliche Gruppenflüge</li>
    </ul>
  `
  res.send(renderPage('Events', content))
})

app.get('/kontakt', (req, res) => {
  const content = `
    <h2>Kontakt</h2>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3>PMP-Team</h3>
        <p><strong>E-Mail:</strong> pmp@vatsim-germany.org</p>
        <p><strong>Forum:</strong> <a href="https://forum.vatsim-germany.org" target="_blank">VATSIM Germany Forum</a></p>
        <p><strong>Discord:</strong> VATSIM Germany Discord Server</p>
    </div>
    
    <h3>Häufige Fragen</h3>
    <p>Bevor Sie uns kontaktieren, schauen Sie gerne in unsere FAQ im Forum.</p>
  `
  res.send(renderPage('Kontakt', content))
})

app.get('/status', (req, res) => {
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  
  const content = `
    <h2>System Status</h2>
    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px;">
        <p><strong>Status:</strong> ✅ Online</p>
        <p><strong>Uptime:</strong> ${hours}h ${minutes}m</p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>
  `
  res.send(renderPage('Status', content))
})

// 404 Handler
app.use((req, res) => {
  log(`404 Not Found: ${req.url}`)
  const content = `
    <h2>Seite nicht gefunden</h2>
    <p>Die angeforderte Seite konnte nicht gefunden werden.</p>
    <p><a href="/">Zurück zur Startseite</a></p>
  `
  res.status(404).send(renderPage('404 - Nicht gefunden', content))
})

// Error Handler
app.use((err, req, res, next) => {
  log(`Error: ${err.message}`)
  console.error(err.stack)
  const content = `
    <h2>Ein Fehler ist aufgetreten</h2>
    <p>Bitte versuchen Sie es später erneut.</p>
    <p><a href="/">Zurück zur Startseite</a></p>
  `
  res.status(500).send(renderPage('500 - Server Fehler', content))
})

// Für Passenger
module.exports = app

// Für direkten Start
if (require.main === module) {
  const port = process.env.PORT || 80
  app.listen(port, () => {
    log(`✅ App running on port ${port}`)
  })
}
