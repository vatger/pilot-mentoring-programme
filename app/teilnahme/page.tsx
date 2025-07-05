import React from 'react'
import Link from 'next/link'
import { CheckCircle, ExternalLink, ArrowRight } from 'lucide-react'

export default function TeilnahmePage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Anleitung zur Teilnahme
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Folge diesen einfachen Schritten, um am Piloten-Mentoren-Programm teilzunehmen
          </p>
        </div>

        {/* Step 1: VATSIM Registration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-6 flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">VATSIM Account erstellen</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Erstelle zunächst einen kostenlosen VATSIM Account, falls du noch keinen hast. 
                VATSIM ist das weltweit größte Online-Flugsimulationsnetzwerk.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Was du benötigst:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Gültige E-Mail-Adresse</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Vollständiger Name</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <span>Flugsimulator (z.B. Microsoft Flight Simulator, X-Plane, P3D)</span>
                  </li>
                </ul>
              </div>
              
              <a 
                href="https://my.vatsim.net/register" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Bei VATSIM registrieren
                <ExternalLink className="ml-2" size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Step 2: VATSIM Germany */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-6 flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">Bei VATSIM Germany anmelden</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Melde dich bei VATSIM Germany an, um Zugang zu unseren deutschsprachigen 
                Services und dem Piloten-Mentoren-Programm zu erhalten.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Wichtiger Hinweis:</h3>
                <p className="text-blue-700 dark:text-blue-300">
                  Du benötigst zuerst einen gültigen VATSIM Account (Schritt 1), 
                  bevor du dich bei VATSIM Germany registrieren kannst.
                </p>
              </div>
              
              <a 
                href="https://vatsim-germany.org/register" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Bei VATSIM Germany anmelden
                <ExternalLink className="ml-2" size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Step 3: PMP Application */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-6 flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">Für das PMP bewerben</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Sobald du dich bei VATSIM Germany registriert hast, kannst du dich 
                für das Piloten-Mentoren-Programm bewerben.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Was passiert als nächstes:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" size={20} />
                    <span>Du füllst einen kurzen Fragebogen aus</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" size={20} />
                    <span>Wir weisen dir einen passenden Mentor zu</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" size={20} />
                    <span>Dein Mentor kontaktiert dich innerhalb von 48 Stunden</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" size={20} />
                    <span>Ihr plant gemeinsam eure ersten Flüge</span>
                  </li>
                </ul>
              </div>
              
              <button className="bg-accent-yellow text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors inline-flex items-center">
                PMP Bewerbung starten
                <ArrowRight className="ml-2" size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Voraussetzungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Technische Anforderungen:</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-sm">Flugsimulator (MSFS, X-Plane, P3D)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-sm">Headset oder Mikrofon</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-sm">Stabile Internetverbindung</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Persönliche Anforderungen:</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-sm">Grundkenntnisse in der Luftfahrt</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-sm">Bereitschaft zum Lernen</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-sm">Zeit für regelmäßige Sessions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Brauchst du Hilfe?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Unser Support-Team steht dir gerne zur Verfügung, falls du Fragen hast 
            oder Unterstützung bei der Registrierung benötigst.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/kontakt"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Kontakt aufnehmen
            </Link>
            <a 
              href="https://forum.vatsim-germany.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 border-primary text-primary dark:text-white dark:border-white px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              Forum besuchen
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
