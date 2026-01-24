// export interface Event {
//   id: number;
//   name: string;
//   tagline: string;
//   image: string;
//   color: string;
//   bgColor: string;
//   rules: string[];
//   instructions: string[];
//   notes: string[];
//   themes?: string[];
//   noteTheme?: string;
// }

// export const events: Event[] = [
//   {
//     id: 1,
//     name: 'Buildathon',
//     tagline: "Develop a web application by integrating multiple API endpoints with mixed data, applying necessary calculations, and presenting precise information through a well-designed frontend.",
//     image: '/event-hackathon.svg',
//     color: 'bg-blue-500',
//     bgColor: 'bg-blue-50',
//     rules: [
//       'Team can consist of 2-4 members',
//       'Prototypes must be completed within 2-hour time limit',
//       'No pre-existing prototypes or modules',
//     ],
//     instructions: [
//       'Praticipants have to build a prototype using the provided APIs',
//       'Judging based on creativity and implementation',

//     ],
//     notes: ['Bring your own laptop; Wi-Fi will not be provided.'],
//   },
//   {
//     id: 2,
//     name: 'Bug Smash',
//     tagline: 'Bug smash is a fast paced challlenge focused on finding and fixing the errors ',
//     image: '/event-debugging.svg',
//     color: 'bg-yellow-500',
//     bgColor: 'bg-yellow-50',
//     rules: ['Team consists of 2 members', 'No smart devices allowed', 'C/C++/Java/Python/JS only'],
//     instructions: [
//       'One elimination round',
//       'Time-bound challenges',
//       'Find and fix bugs in given code snippets',
//     ],
//     notes: ['Systems will be provided'],
//     noteTheme: 'green',
//   },
//   {
//     id: 3,
//     name: 'Paper Presentation',
//     tagline: 'Technology-focused research presentations',
//     image: '/event-presentation.svg',
//     color: 'bg-pink-500',
//     bgColor: 'bg-pink-50',
//     rules: [
//       'Teams consist of maximum 2 members',
//       'Strict time limit enforcement',
//       'Original research work only',
//     ],
//     instructions: [
//       'PPT should consist of minimum 8 slides',
//       '3 minutes for presentation followed by 2 minutes for Q&A',
//     ],
//     themes: [
//       'Machine Learning',
//       'Deep Learning',
//       'Data Science',
//       'Block chain technology',
//       'Cryptography & Cyber security',
//       'Cloud computing',
//       'Soft computing',
//       'Automation and Robotics',
//       'Network Security',
//       'Computer vision',
//       'IOT',
//       'Natural Language processing',
//     ],
//     notes: [],
//   },
//   {
//     id: 4,
//     name: 'Ctrl+ Quiz',
//     tagline: 'Twist and Turn your IQ to identify the given Shortcut keys, Basic commands and Abbreviations.',
//     image: '/event-quiz.svg',
//     color: 'bg-orange-500',
//     bgColor: 'bg-orange-50',
//     rules: [
//       'Team consists of 2 members',
//       'No smart devices allowed',
//       'Tie-breaker rounds available',
//     ],
//     instructions: [
//       'Quiz consists of 2 rounds',
//       'Questions based on MCQ',
//       'Top scorers advance to finals',
//     ],
//     notes: ['Topics: Programming languages: C, C++, Java, Python, and SQL'],
//   },
//   {
//     id: 5,
//     name: 'Code Hunt: Word Edition',
//     tagline: 'Join us for a fun & challenging tech event where the team battles on fun tech riddles Jumbled words and  Dumsarats consisting a pack of knowledge filled entertainment',
//     image: '/event-query.svg',
//     color: 'bg-green-500',
//     bgColor: 'bg-green-50',
//     rules: ['Team consists of 2 members', 'Round 1: 15 fun and technical MCQs (Riddles, Jumbled Words)', 'Round 2: Act and find-me tech words (Dumsarats)'],
//     instructions: [],
//     notes: [],
//   },
//   {
//     id: 6,
//     name: 'Think & Link',
//     tagline: 'The challenge focuses on visual tasks where participants need to “think” and make connections (“link”) within the given time, relying only on their own skills.',
//     image: '/event-connection.svg',
//     color: 'bg-purple-500',
//     bgColor: 'bg-purple-50',
//     rules: [
//       'Teams can consist of 2 members',
//       'Players are expected to play fairly',
//       "Judges' decisions are final",
//     ],
//     instructions: ['30-minute time limit for Round 1', 'Top scorers advance to Round 2'],
//     notes: ['No external resources allowed'],
//   },
//   {
//     id: 7,
//     name: 'Gaming',
//     tagline: 'Free Fire competitive gaming event.',
//     image: '/event-gaming.svg',
//     color: 'bg-sky-400',
//     bgColor: 'bg-sky-50',
//     rules: [
//       '4-player squad from same college',
//       'Players are expected to play fairly',
//       'Misbehavior or disputes result in disqualification',
//       'use of panel, or exploiting glitches is strictly prohibited.',
//     ],
//     instructions: [
//       'Players will qualify through Battle Royal mode and Clash Squad mode.',
//       'skills and gun skins are permitted only in Battle Royal mode, not in Clash Squad mode.',
//       'Final decisions rest solely with the coordinators.',
//       'The committee is not responsible for network issues during the event.',
//     ],
//     notes: ['WiFi will NOT be provided'],
//   },
// ];

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
  themes?: string[];
  noteTheme?: string;
}

export const events: Event[] = [
  {
    id: 1,
    name: 'Buildathon',
    tagline:
      'Develop a web application by integrating multiple API endpoints with mixed data, applying necessary calculations, and presenting precise information through a well-designed frontend.',
    image: '/event-hackathon.svg',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    rules: [
      'Team can consist of 2–4 members',
      'Prototypes must be completed within a 2-hour time limit',
      'No pre-existing prototypes or modules are allowed',
    ],
    instructions: [
      'Participants must build a prototype using the provided APIs',
      'Judging will be based on creativity and implementation',
    ],
    notes: ['Bring your own laptop; Wi-Fi will not be provided.'],
  },
  {
    id: 2,
    name: 'Bug Smash',
    tagline: 'Bug Smash is a fast-paced challenge focused on finding and fixing errors.',
    image: '/event-debugging.svg',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    rules: [
      'Team consists of 2 members',
      'No smart devices allowed',
      'C, C++, Java, Python, and JavaScript only',
    ],
    instructions: [
      'One elimination round',
      'Time-bound challenges',
      'Find and fix bugs in the given code snippets',
    ],
    notes: ['Systems will be provided'],
    noteTheme: 'green',
  },
  {
    id: 3,
    name: 'Paper Presentation',
    tagline: 'Technology-focused research presentations',
    image: '/event-presentation.svg',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50',
    rules: [
      'Teams consist of a maximum of 2 members',
      'Strict time limit enforcement',
      'Original research work only',
    ],
    instructions: [
      'PPT should consist of a minimum of 8 slides',
      '3 minutes for presentation followed by 2 minutes for Q&A',
    ],
    themes: [
      'Machine Learning',
      'Deep Learning',
      'Data Science',
      'Blockchain Technology',
      'Cryptography & Cyber Security',
      'Cloud Computing',
      'Soft Computing',
      'Automation and Robotics',
      'Network Security',
      'Computer Vision',
      'IoT',
      'Natural Language Processing',
    ],
    notes: [],
  },
  {
    id: 4,
    name: 'Ctrl+ Quiz',
    tagline: 'Twist and turn your IQ to identify shortcut keys, basic commands, and abbreviations.',
    image: '/event-quiz.svg',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    rules: [
      'Team consists of 2 members',
      'No smart devices allowed',
      'Tie-breaker rounds available',
    ],
    instructions: [
      'The quiz consists of 2 rounds',
      'Questions are MCQ-based',
      'Top scorers advance to the finals',
    ],
    notes: ['Topics include C, C++, Java, Python, and SQL'],
  },
  {
    id: 5,
    name: 'Code Hunt: Word Edition',
    tagline:
      'A fun and challenging tech event where teams battle through riddles, jumbled words, and Dumb Charades, packed with knowledge and entertainment.',
    image: '/event-query.svg',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    rules: [
      'Team consists of 2 members',
      'Round 1: 15 fun and technical MCQs (Riddles, Jumbled Words)',
      'Round 2: Act and find technical words (Dumb Charades)',
    ],
    instructions: [],
    notes: [],
  },
  {
    id: 6,
    name: 'Think & Link',
    tagline:
      'The challenge focuses on visual tasks where participants think and make connections within the given time, relying solely on their skills.',
    image: '/event-connection.svg',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    rules: [
      'Teams consist of 2 members',
      'Players are expected to play fairly',
      "Judges' decisions are final",
    ],
    instructions: ['30-minute time limit for Round 1', 'Top scorers advance to Round 2'],
    notes: ['No external resources allowed'],
  },
  {
    id: 7,
    name: 'Gaming',
    tagline: 'Free Fire competitive gaming event.',
    image: '/event-gaming.svg',
    color: 'bg-sky-400',
    bgColor: 'bg-sky-50',
    rules: [
      '4-player squad from the same college',
      'Players are expected to play fairly',
      'Misbehavior or disputes will result in disqualification',
      'Use of panels or exploiting glitches is strictly prohibited',
    ],
    instructions: [
      'Players will qualify through Battle Royale and Clash Squad modes',
      'Skills and gun skins are permitted only in Battle Royale mode, not in Clash Squad mode',
      'Final decisions rest solely with the coordinators',
      'The committee is not responsible for network issues during the event',
    ],
    notes: ['Wi-Fi will NOT be provided'],
  },
];
