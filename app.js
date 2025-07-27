// VATSIM PMP - Simple Express Server
const express = require('express')
const path = require('path')

const app = express()

// Statische Dateien aus public/ servieren
app.use(express.static(path.join(__dirname, 'public')))

// Route für Events
app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'events.html'))
})

// Route für Kontakt
app.get('/kontakt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kontakt.html'))
})

// Route für Anleitung
app.get('/howto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'howto.html'))
})

// Route für Teilnahme
app.get('/teilnahme', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teilnahme.html'))
})

// Redirect .html URLs to their route counterparts
app.get('/teilnahme.html', (req, res) => res.redirect('/teilnahme'))
app.get('/events.html', (req, res) => res.redirect('/events'))
app.get('/kontakt.html', (req, res) => res.redirect('/kontakt'))
app.get('/howto.html', (req, res) => res.redirect('/howto'))

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'))
})

// Export für Passenger
module.exports = app

// Start Server wenn direkt ausgeführt
if (require.main === module) {
  const port = process.env.PORT || 80
  app.listen(port, () => {
    console.log(`VATSIM PMP running on port ${port}`)
  })
}

// Export für Passenger
module.exports = app

