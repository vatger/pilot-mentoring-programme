// VATSIM PMP - Simple Express Server
const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()

// Statische Dateien aus public/ servieren
app.use(express.static(path.join(__dirname, 'public')))

// Helper to inject header/footer into a page
function renderWithLayout(pagePath, res) {
  const header = fs.readFileSync(path.join(__dirname, 'public', 'header.html'), 'utf8')
  const footer = fs.readFileSync(path.join(__dirname, 'public', 'footer.html'), 'utf8')
  let page = fs.readFileSync(pagePath, 'utf8')
  page = page.replace('<!--#HEADER-->', header).replace('<!--#FOOTER-->', footer)
  res.send(page)
}

// Serve header and footer as partials
app.get('/header.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'header.html'))
})
app.get('/footer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'footer.html'))
})

// Route für die Hauptseite
app.get('/', (req, res) => {
  renderWithLayout(path.join(__dirname, 'public', 'index.html'), res)
})

// Route für Teilnahme
app.get('/teilnahme', (req, res) => {
  renderWithLayout(path.join(__dirname, 'public', 'teilnahme.html'), res)
})

// Route für Events
app.get('/events', (req, res) => {
  renderWithLayout(path.join(__dirname, 'public', 'events.html'), res)
})

// Route für Kontakt
app.get('/kontakt', (req, res) => {
  renderWithLayout(path.join(__dirname, 'public', 'kontakt.html'), res)
})

// Route für Anleitung
app.get('/howto', (req, res) => {
  renderWithLayout(path.join(__dirname, 'public', 'howto.html'), res)
})

// Route für Status
app.get('/status', (req, res) => {
  res.json({
    status: 'Online',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + ' seconds'
  })
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
