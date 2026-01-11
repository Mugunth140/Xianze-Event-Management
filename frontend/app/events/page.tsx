import Image from 'next/image';
import Link from 'next/link';

interface Event {
  id: number;
  name: string;
  tagline: string;
  image: string;
  color: string;
  bgColor: string;
  rules: string[];
  instructions: string[];
  notes: string[];
}

const events: Event[] = [
  {
    id: 1,
    name: 'Buildathon',
    tagline: '2-hour rapid prototyping challenge',
    image: '/event-hackathon.svg',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    rules: [
      'Team can consist of 2-4 members',
      'Prototypes must be completed within 2-hour time limit',
      'No pre-existing prototypes or modules',
      'AI tools are allowed',
    ],
    instructions: [
      'Praticipants have to build a prototype using the provided APIs',
      'Judging based on creativity and implementation',
      'Present your solution at the end',
    ],
    notes: ['Participants should bring their own laptop'],
  },
  {
    id: 2,
    name: 'Bug Smash',
    tagline: 'Multi-round code debugging competition',
    image: '/event-debugging.svg',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    rules: ['Team consists of 2 members', 'No smart devices allowed', 'C/C++/Java/Python only'],
    instructions: [
      'Two elimination rounds',
      'Time-bound challenges',
      'Find and fix bugs in given code snippets',
    ],
    notes: ['Systems will be provided'],
  },
  {
    id: 3,
    name: 'Paper Presentation',
    tagline: 'Technology-focused research presentations',
    image: '/event-presentation.svg',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50',
    rules: [
      'Teams consist of maximum 2 members',
      'Strict time limit enforcement',
      'Original research work only',
    ],
    instructions: [
      'PPT should consist of minimum 8 slides',
      '5-8 minute time limit per presentation',
      'Q&A session after each presentation',
    ],
    notes: ['Themes: AI, ML, Data Science, Blockchain, Network Security, IoT, NLP'],
  },
  {
    id: 4,
    name: 'Ctrl+ Quiz',
    tagline: 'Multi-round technical quiz battle',
    image: '/event-quiz.svg',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    rules: [
      'Team consists of 2 members',
      'No smart devices allowed',
      'Tie-breaker rounds available',
    ],
    instructions: [
      'Quiz consists of 2 rounds',
      'Questions based on MCQ, True/False, and Fill-in-the-blanks',
      'Top scorers advance to finals',
    ],
    notes: ['Topics: Technical, Programming, and Scientific fields'],
  },
  {
    id: 5,
    name: 'Code Hunt: Word Edition',
    tagline: 'SQL query challenge series',
    image: '/event-query.svg',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    rules: ['Team consists of 2 members', 'Three progressive rounds', '2-hour time limit'],
    instructions: [
      'Riddle-based initial round',
      'Fun-filled SQL challenges',
      'Logical problem solving required',
    ],
    notes: ['Participants should bring their own laptop'],
  },
  {
    id: 6,
    name: 'Think & Link',
    tagline: 'Two-round visual based challenge',
    image: '/event-connection.svg',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    rules: [
      'Teams can consist of 2 members',
      'Cheating or rule violations lead to disqualification',
      "Judges' decisions are final",
    ],
    instructions: [
      '45-minute time limit for Round 1',
      'Top scorers advance to Round 2',
      '3 questions per presentation slide',
    ],
    notes: ['No external resources allowed'],
  },
  {
    id: 7,
    name: 'Gaming',
    tagline: 'Multi-stage mobile gaming tournament',
    image: '/event-gaming.svg',
    color: 'bg-sky-400',
    bgColor: 'bg-sky-50',
    rules: [
      '4-player squad from same college',
      'Cheating, hacks, or exploiting glitches is strictly prohibited',
      'Misbehavior or disputes result in disqualification',
    ],
    instructions: [
      'Battle Royale & Clash Squad modes',
      'Skin restrictions in Clash Squad',
      'Multiple elimination rounds',
    ],
    notes: ['WiFi will NOT be provided - bring your own data'],
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-12 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-100/50 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gray-100 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
              Explore Our Events
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Compete, collaborate, and showcase your skills across 7 exciting events. From
              hackathons to gaming tournaments, there&apos;s something for everyone.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-full shadow-lg shadow-primary-500/25 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16 sm:space-y-24">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } gap-8 lg:gap-16 items-center`}
              >
                {/* Image Section */}
                <div className="w-full lg:w-1/2">
                  <div
                    className={`relative ${event.bgColor} rounded-3xl p-8 overflow-hidden group`}
                  >
                    {/* Event number badge */}
                    <div className="absolute top-6 left-6 z-10">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${event.color} text-white font-display font-bold text-lg shadow-lg`}
                      >
                        {String(event.id).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-square max-w-md mx-auto transition-transform duration-500 group-hover:scale-105">
                      <Image src={event.image} alt={event.name} fill className="object-contain" />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="w-full lg:w-1/2">
                  <div className="max-w-lg">
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3">
                      {event.name}
                    </h2>
                    <p className="text-lg font-medium text-gray-600 mb-6">{event.tagline}</p>

                    {/* Rules */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Rules
                      </h3>
                      <ul className="space-y-2">
                        {event.rules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span
                              className={`flex-shrink-0 w-5 h-5 rounded-full ${event.color} flex items-center justify-center mt-0.5`}
                            >
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                            <span className="text-gray-700">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Instructions */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Instructions
                      </h3>
                      <ul className="space-y-2">
                        {event.instructions.map((instruction, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-gray-700">{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Notes */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Note: </span>
                          <span className="text-sm text-gray-600">{event.notes.join('. ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gray-900 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            Ready to Compete?
          </h2>
          <p className="text-md text-gray-400 mb-8 max-w-2xl mx-auto">
            Don&apos;t miss out on the biggest inter-collegiate tech symposium. Register now and be
            part of Xianze 2026.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Register Now
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              View Schedule
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
