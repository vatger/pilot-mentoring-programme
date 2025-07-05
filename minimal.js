// VATSIM PMP - Ultra-minimal Version
const express = require('express')

console.log('Starting ultra-minimal VATSIM PMP...')

const app = express()

app.get('/', (req, res) => {
  console.log('Home route accessed')
  res.send(`
    <html>
    <head><title>VATSIM PMP</title></head>
    <body>
      <h1>VATSIM Germany PMP</h1>
      <p>Ultra-minimal version running successfully!</p>
      <p>Time: ${new Date()}</p>
      <p><a href="/test">Test Link</a></p>
    </body>
    </html>
  `)
})

app.get('/test', (req, res) => {
  console.log('Test route accessed')
  res.json({ status: 'OK', time: new Date() })
})

app.use((req, res) => {
  res.status(404).send('<h1>404 Not Found</h1>')
})

module.exports = app

if (require.main === module) {
  const port = process.env.PORT || 80
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}
