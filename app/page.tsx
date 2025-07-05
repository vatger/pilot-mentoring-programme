import React from 'react'
import Link from 'next/link'
import { ArrowRight, Users, BookOpen, Calendar, MessageCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Piloten-Mentoren-Programm
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Persönliche 1:1-Betreuung für neue Piloten im VATSIM Netzwerk
            </p>
            <p className="text-lg mb-10 text-blue-200 max-w-3xl mx-auto">
              Starte deine VATSIM-Reise mit professioneller Unterstützung. 
              Unsere erfahrenen Mentoren helfen dir dabei, den Einstieg zu erleichtern 
              und deine Flugsimulations-Fähigkeiten zu entwickeln.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/teilnahme"
                className="bg-accent-yellow text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors inline-flex items-center justify-center"
              >
                Jetzt teilnehmen
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link 
                href="/events"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
              >
                Events ansehen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Warum das PMP?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Unser Programm bietet dir alles, was du für einen erfolgreichen Start bei VATSIM benötigst.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
              <Users className="mx-auto mb-4 text-primary" size={48} />
              <h3 className="text-xl font-semibold mb-3">1:1 Betreuung</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Persönliche Mentoren stehen dir individuell zur Seite
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
              <BookOpen className="mx-auto mb-4 text-primary" size={48} />
              <h3 className="text-xl font-semibold mb-3">Schritt-für-Schritt</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Strukturierte Anleitungen für deinen VATSIM-Einstieg
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
              <Calendar className="mx-auto mb-4 text-primary" size={48} />
              <h3 className="text-xl font-semibold mb-3">Newbie-Days</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Regelmäßige Events speziell für Einsteiger
              </p>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
              <MessageCircle className="mx-auto mb-4 text-primary" size={48} />
              <h3 className="text-xl font-semibold mb-3">Community Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Aktive Community in Forum und Discord
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              So funktioniert's
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              In nur wenigen Schritten zu deinem VATSIM-Abenteuer
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">VATSIM Registrierung</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Erstelle deinen kostenlosen VATSIM Account und registriere dich bei VATSIM Germany
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Mentor zuweisen</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Wir verbinden dich mit einem erfahrenen Mentor, der zu deinen Bedürfnissen passt
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Abheben!</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Starte deine ersten Flüge mit professioneller Unterstützung und werde Teil der Community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit für dein VATSIM-Abenteuer?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Schließe dich hunderten von Piloten an, die bereits erfolgreich mit dem PMP gestartet sind.
          </p>
          <Link 
            href="/teilnahme"
            className="bg-accent-yellow text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors inline-flex items-center text-lg"
          >
            Jetzt kostenlos anmelden
            <ArrowRight className="ml-2" size={24} />
          </Link>
        </div>
      </section>
    </div>
  )
}
