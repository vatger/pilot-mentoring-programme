import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-primary dark:bg-gray-800 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">PMP - VATSIM Germany</h3>
            <p className="text-gray-300">
              Persönliche 1:1-Betreuung für neue Piloten im VATSIM Netzwerk.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-accent-yellow transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/teilnahme" className="text-gray-300 hover:text-accent-yellow transition-colors">
                  Teilnahme
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-300 hover:text-accent-yellow transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-gray-300 hover:text-accent-yellow transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">VATSIM Germany</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://vatsim-germany.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-accent-yellow transition-colors"
                >
                  Website
                </a>
              </li>
              <li>
                <a 
                  href="https://forum.vatsim-germany.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-accent-yellow transition-colors"
                >
                  Forum
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/vatsim-germany" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-accent-yellow transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-300">
            © 2025 VATSIM Germany. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  )
}
