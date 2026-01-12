export interface Event {
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

export const events: Event[] = [
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
            'Players are expected to play fairly',
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
            'Players are expected to play fairly',
            'Misbehavior or disputes result in disqualification',
        ],
        instructions: [
            'Battle Royale & Clash Squad modes',
            'Skin restrictions in Clash Squad',
            'Multiple elimination rounds',
        ],
        notes: ['WiFi will NOT be provided'],
    },
];
