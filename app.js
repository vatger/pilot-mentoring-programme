// VATSIM PMP - Simple Express Server
const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()

// Statische Dateien aus public/ servieren
app.use(express.static(path.join(__dirname, 'public')))

// Helper to inject header/footer into a page
function renderWithLayout(pagePath, res) {
  try {
    // Use path.resolve to ensure absolute paths
    const headerPath = path.resolve(__dirname, 'public', 'header.html');
    const footerPath = path.resolve(__dirname, 'public', 'footer.html');
    const contentPath = path.resolve(pagePath);
    
    // Check if files exist
    if (!fs.existsSync(headerPath)) {
      console.error(`Header file not found: ${headerPath}`);
      return res.status(500).send('Server Error: Header template missing');
    }
    
    if (!fs.existsSync(footerPath)) {
      console.error(`Footer file not found: ${footerPath}`);
      return res.status(500).send('Server Error: Footer template missing');
    }
    
    if (!fs.existsSync(contentPath)) {
      console.error(`Content file not found: ${contentPath}`);
      return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }
    
    // Read files with error handling
    const header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');
    let page = fs.readFileSync(contentPath, 'utf8');
    
    // Replace placeholders
    page = page.replace('<!--#HEADER-->', header).replace('<!--#FOOTER-->', footer);
    
    // Send the response
    res.send(page);
    
  } catch (error) {
    console.error('Error in renderWithLayout:', error);
    res.status(500).send('Server Error: Failed to render page');
  }
}

// Serve header and footer as partials
app.get('/header.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'header.html'))
})
app.get('/footer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'footer.html'))
})

// Image routes for back1-9
app.get('/back1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '1.png'))
})

app.get('/back2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '2.png'))
})

app.get('/back3', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '3.png'))
})

app.get('/back4', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '4.png'))
})

app.get('/back5', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '5.png'))
})

app.get('/back6', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '6.png'))
})

app.get('/back7', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '7.png'))
})

app.get('/back8', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '8.png'))
})

app.get('/back9', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'img', '9.png'))
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

// Error handling for static files
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Server Error');
});

// 404 Handler - make sure this is the last middleware
app.use((req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
})

// Better error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't exit the process, just log the error
});

// Better error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Improve the export for Passenger
if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
  
if (require.main === module) {
  const port = process.env.PORT || 80;
  app.listen(port, () => {
    console.log(`VATSIM PMP running in standalone mode on port ${port}`);
  });
}
}
