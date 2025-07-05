import React from 'react'
import { Calendar, Clock, Users, MapPin } from 'lucide-react'

interface Event {
  id: number
  title: string
  date: string
  time: string
  duration: string
  participants: number
  maxParticipants: number
  location: string
  description: string
  level: 'Anfänger' | 'Fortgeschritten' | 'Alle'
  mentor: string
}

const upcomingEvents: Event[] = [
  {
    id: 1,
    title: 'Newbie-Day: Erste Schritte bei VATSIM',
    date: '2025-07-12',
    time: '14:00',
    duration: '3 Stunden',
    participants: 8,
    maxParticipants: 12,
    location: 'EDDF (Frankfurt)',
    description: 'Ein spezieller Tag für absolute Beginner. Wir führen dich durch deine ersten Schritte bei VATSIM, von der Software-Installation bis zu deinem ersten Flug.',
    level: 'Anfänger',
    mentor: 'Thomas Müller'
  },
  {
    id: 2,
    title: 'IFR-Grundlagen Workshop',
    date: '2025-07-19',
    time: '15:30',
    duration: '2 Stunden',
    participants: 5,
    maxParticipants: 8,
    location: 'EDDM (München)',
    description: 'Lerne die Grundlagen des Instrumentenflugs (IFR) kennen. Wir behandeln Flugpläne, Navigationshilfen und Anflugverfahren.',
    level: 'Fortgeschritten',
    mentor: 'Sarah Schmidt'
  },
  {
    id: 3,
    title: 'Community-Flug: Deutschlandtour',
    date: '2025-07-26',
    time: '16:00',
    duration: '4 Stunden',
    participants: 15,
    maxParticipants: 20,
    location: 'EDDS → EDDH',
    description: 'Ein entspannter Gruppenflug von Stuttgart nach Hamburg. Perfekt für Piloten aller Erfahrungsstufen, um die Community kennenzulernen.',
    level: 'Alle',
    mentor: 'Michael Weber'
  },
  {
    id: 4,
    title: 'ATC-Kommunikation für Piloten',
    date: '2025-08-02',
    time: '13:00',
    duration: '2.5 Stunden',
    participants: 3,
    maxParticipants: 10,
    location: 'EDDK (Köln/Bonn)',
    description: 'Verbessere deine Kommunikation mit der Flugsicherung. Wir üben Standardphrasen, Clearances und Notfallverfahren.',
    level: 'Anfänger',
    mentor: 'Anna Fischer'
  }
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'Anfänger':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'Fortgeschritten':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'Alle':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export default function EventsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Newbie-Days & Veranstaltungen
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Nimm an unseren speziellen Events teil und lerne zusammen mit anderen neuen Piloten. 
            Unsere Mentoren bieten regelmäßig Workshops und Gruppenflüge an.
          </p>
        </div>

        {/* Event Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-600 dark:text-green-300" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Newbie-Days</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Spezielle Tage für absolute Anfänger mit intensiver Betreuung
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="bg-orange-100 dark:bg-orange-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-orange-600 dark:text-orange-300" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Workshops</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Thematische Workshops zu spezifischen Aspekten der Fliegerei
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-blue-600 dark:text-blue-300" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gruppenflüge</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Community-Flüge für Piloten aller Erfahrungsstufen
            </p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Kommende Veranstaltungen</h2>
          <div className="space-y-6">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <h3 className="text-2xl font-bold mr-4">{event.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(event.level)}`}>
                          {event.level}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {event.description}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="text-gray-400 mr-2" size={16} />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="text-gray-400 mr-2" size={16} />
                          <span>{event.time} ({event.duration})</span>
                        </div>
                        
                        <div className="flex items-center">
                          <MapPin className="text-gray-400 mr-2" size={16} />
                          <span>{event.location}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="text-gray-400 mr-2" size={16} />
                          <span>{event.participants}/{event.maxParticipants} Teilnehmer</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                        <strong>Mentor:</strong> {event.mentor}
                      </div>
                    </div>
                    
                    <div className="mt-6 lg:mt-0 lg:ml-6">
                      <button className="w-full lg:w-auto bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Anmelden
                      </button>
                      <div className="mt-2 text-sm text-center lg:text-right">
                        <span className="text-gray-500 dark:text-gray-400">
                          {event.maxParticipants - event.participants} Plätze frei
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {event.participants >= event.maxParticipants * 0.8 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 px-6 py-3">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      <strong>Nur noch wenige Plätze verfügbar!</strong> Melde dich schnell an.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Event Guidelines */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Event-Teilnahme</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Anmeldung</h3>
              <ul className="space-y-2 text-sm">
                <li>• Anmeldung über das VATSIM Germany Forum</li>
                <li>• Bestätigung per E-Mail innerhalb von 24h</li>
                <li>• Kostenlose Teilnahme für alle Mitglieder</li>
                <li>• Stornierung bis 24h vor dem Event möglich</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Vorbereitung</h3>
              <ul className="space-y-2 text-sm">
                <li>• Discord und TeamSpeak installiert haben</li>
                <li>• Flugsimulator einsatzbereit</li>
                <li>• Bei IFR-Events: Charts vorbereitet</li>
                <li>• Pünktliches Erscheinen erwünscht</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button className="bg-accent-yellow text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
              Event vorschlagen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
