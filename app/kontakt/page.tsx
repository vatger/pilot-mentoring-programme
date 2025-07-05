import React from 'react'
import { Mail, MessageCircle, ExternalLink, Users, HelpCircle, Phone } from 'lucide-react'

export default function KontaktPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Kontakt & Support
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Brauchst du Hilfe oder hast Fragen zum Piloten-Mentoren-Programm? 
            Wir sind gerne für dich da und helfen dir weiter.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Discord */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="text-indigo-600 dark:text-indigo-300" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Discord</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Unser aktivster Kommunikationskanal. Hier findest du schnell Hilfe von der Community.
            </p>
            <a 
              href="https://discord.gg/vatsim-germany" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              Discord beitreten
              <ExternalLink className="ml-2" size={16} />
            </a>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              24/7 Community Support
            </div>
          </div>

          {/* Forum */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="text-blue-600 dark:text-blue-300" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Forum</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Für ausführliche Diskussionen und langfristige Hilfestellung.
            </p>
            <a 
              href="https://forum.vatsim-germany.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              Forum besuchen
              <ExternalLink className="ml-2" size={16} />
            </a>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Strukturierte Hilfe & FAQs
            </div>
          </div>

          {/* E-Mail */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Mail className="text-green-600 dark:text-green-300" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">E-Mail</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Für persönliche Anliegen oder wenn du eine ausführliche Antwort benötigst.
            </p>
            <a 
              href="mailto:pmp@vatsim-germany.org"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center"
            >
              E-Mail senden
              <Mail className="ml-2" size={16} />
            </a>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Antwort innerhalb von 24h
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
          <div className="text-center mb-8">
            <HelpCircle className="mx-auto mb-4 text-primary" size={48} />
            <h2 className="text-3xl font-bold mb-4">Häufig gestellte Fragen</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Hier findest du Antworten auf die häufigsten Fragen zum PMP
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Allgemeine Fragen</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Kostet die Teilnahme am PMP etwas?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Nein, die Teilnahme am Piloten-Mentoren-Programm ist vollständig kostenlos. 
                    Du benötigst lediglich einen VATSIM Account.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Wie lange dauert das Mentoring?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Das ist individuell unterschiedlich. Die meisten Teilnehmer benötigen 
                    4-6 Sessions, um sich sicher bei VATSIM zu fühlen.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Welche Flugsimulator werden unterstützt?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Microsoft Flight Simulator, X-Plane 11/12, Prepar3D und andere 
                    gängige Simulatoren werden alle unterstützt.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Technische Fragen</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Was passiert bei technischen Problemen?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Unser Support-Team hilft dir bei der Installation und Konfiguration 
                    aller benötigten Software. Scheu dich nicht zu fragen!
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Brauche ich ein Headset?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ein Headset oder Mikrofon ist empfohlen, aber nicht zwingend erforderlich. 
                    Für den Anfang reicht auch Text-Kommunikation.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Wie gut muss mein Englisch sein?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Bei VATSIM Germany wird primär Deutsch gesprochen. Grundkenntnisse 
                    in Englisch sind hilfreich, aber nicht zwingend erforderlich.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Team */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Unser Support-Team</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                TM
              </div>
              <h3 className="text-lg font-semibold mb-2">Thomas Müller</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">PMP Koordinator</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Verantwortlich für die Koordination des Programms und Mentor-Zuweisung
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                SS
              </div>
              <h3 className="text-lg font-semibold mb-2">Sarah Schmidt</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Technischer Support</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hilft bei technischen Problemen und Software-Installation
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                MW
              </div>
              <h3 className="text-lg font-semibold mb-2">Michael Weber</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Community Manager</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organisiert Events und betreut die Community-Kanäle
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form Placeholder */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Direkter Kontakt</h2>
          <p className="text-xl mb-6 text-blue-100">
            Hast du spezielle Fragen oder benötigst individuelle Unterstützung?
          </p>
          <p className="mb-8 text-blue-200">
            Nutze unser Kontaktformular im VATSIM Germany Forum oder schreibe uns direkt eine E-Mail. 
            Wir melden uns schnellstmöglich bei dir zurück.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://forum.vatsim-germany.org/contact" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-accent-yellow text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors inline-flex items-center justify-center"
            >
              Kontaktformular
              <ExternalLink className="ml-2" size={20} />
            </a>
            <a 
              href="mailto:pmp@vatsim-germany.org"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors inline-flex items-center justify-center"
            >
              E-Mail schreiben
              <Mail className="ml-2" size={20} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
