'use client';

import React from 'react';
import { motion } from 'framer-motion';

// --- Types ---
type GeneralEvent = {
  id: string;
  title: string;
  time: string; // Display string e.g., "08:30 AM – 09:15 AM"
  icon: string;
  color: string;
};

type MegaTrack = {
  id: string;
  title: string;
  time: string;
  color: string;
  gradient: string;
};

type EventSlot = {
  start: string; // 12h format
  end: string; // 12h format
};

type EventFlow = {
  id: string;
  title: string;
  level1Slots: EventSlot[];
  finalSlot: EventSlot;
  color: string;
  lightColor: string;
  icon: string;
};

// --- Data ---
const GENERAL_EVENTS_START: GeneralEvent[] = [
  {
    id: 'registration',
    title: 'Registration',
    time: '08:30 AM – 09:15 AM',
    icon: '📝',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'inaugural',
    title: 'Inaugural Ceremony',
    time: '09:30 AM – 10:30 AM',
    icon: '🎊',
    color: 'bg-purple-100 text-purple-700',
  },
];

const GENERAL_EVENTS_END: GeneralEvent[] = [
  {
    id: 'lunch',
    title: 'Lunch Break',
    time: '01:00 PM – 02:20 PM',
    icon: '🍱',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'valedictory',
    title: 'Valedictory Ceremony',
    time: '02:30 PM – 03:30 PM',
    icon: '🏆',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

const MEGA_TRACKS: MegaTrack[] = [
  {
    id: 'buildathon',
    title: 'Buildathon',
    time: '10:30 AM – 01:00 PM',
    color: 'text-blue-600',
    gradient: 'from-blue-500/20 to-cyan-400/20',
  },
  {
    id: 'gaming',
    title: 'Gaming',
    time: '10:30 AM – 01:00 PM',
    color: 'text-purple-600',
    gradient: 'from-purple-500/20 to-pink-400/20',
  },
  {
    id: 'presentation',
    title: 'Paper Presentation',
    time: '10:30 AM – 01:00 PM',
    color: 'text-orange-600',
    gradient: 'from-orange-500/20 to-amber-400/20',
  },
];

const EVENTS_FLOW: EventFlow[] = [
  {
    id: 'bug-smashing',
    title: 'Bug Smashing',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-500/10',
    icon: '🐛',
    level1Slots: [
      { start: '10:30 AM', end: '11:00 AM' },
      { start: '11:00 AM', end: '11:30 AM' },
    ],
    finalSlot: { start: '12:00 PM', end: '12:30 PM' },
  },
  {
    id: 'ctrl-quiz',
    title: 'Ctrl + Quiz',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-500/10',
    icon: '🧠',
    level1Slots: [
      { start: '10:30 AM', end: '11:00 AM' },
      { start: '11:00 AM', end: '11:30 AM' },
    ],
    finalSlot: { start: '12:00 PM', end: '12:30 PM' },
  },
  {
    id: 'code-hunt',
    title: 'Code Hunt',
    color: 'bg-violet-500',
    lightColor: 'bg-violet-500/10',
    icon: '🔍',
    level1Slots: [
      { start: '11:10 AM', end: '11:30 AM' },
      { start: '11:40 AM', end: '12:00 PM' },
    ],
    finalSlot: { start: '12:30 PM', end: '01:00 PM' },
  },
  {
    id: 'think-link',
    title: 'Think & Link',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-500/10',
    icon: '🔗',
    level1Slots: [
      { start: '11:00 AM', end: '11:30 AM' },
      { start: '11:30 AM', end: '12:00 PM' },
    ],
    finalSlot: { start: '12:30 PM', end: '01:00 PM' },
  },
];

// --- Helpers ---
const START_TIME_MINUTES = 630; // 10:30 AM
const TOTAL_DURATION = 150; // 2.5 hours

const parseTime12h = (timeStr: string) => {
  const [time, period] = timeStr.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const getPosition = (timeStr: string) => {
  const totalMinutes = parseTime12h(timeStr);
  const relativeMinutes = totalMinutes - START_TIME_MINUTES;
  return (relativeMinutes / TOTAL_DURATION) * 100;
};

// --- Components ---

const GlassCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`backdrop-blur-xl bg-white/60 border border-white/50 shadow-sm rounded-[1.5rem] ${className}`}
  >
    {children}
  </div>
);

const GeneralEventCard = ({ event }: { event: GeneralEvent }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="flex items-center gap-6 p-6 mb-4 max-w-2xl mx-auto rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${event.color.split(' ')[0]} ${event.color.split(' ')[1]}`}
    >
      {event.icon}
    </div>
    <div className="flex-1">
      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
      <p className="text-sm font-medium text-gray-500 mt-1">{event.time}</p>
    </div>
  </motion.div>
);

const MegaTrackCard = ({ track, index }: { track: MegaTrack; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="h-full"
  >
    <GlassCard className="h-full p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${track.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-white/50 text-[10px] font-bold uppercase tracking-widest text-gray-500 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
        <div>
          <h3 className={`text-2xl font-bold mb-2 tracking-tight ${track.color}`}>{track.title}</h3>
          <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
            ⏱ {track.time}
          </p>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

const TimelineEventRow = ({ event, index }: { event: EventFlow; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      className="relative h-28 flex items-center mb-8"
    >
      {/* Label */}
      <div className="absolute left-0 -top-4 w-48 z-20">
        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">{event.title}</h4>
      </div>

      {/* Main Track Line */}
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200/50 rounded-full w-full -z-10" />

      {/* Level 1 Group */}
      {event.level1Slots.map((slot, i) => {
        const start = getPosition(slot.start);
        const end = getPosition(slot.end);
        const width = end - start;

        return (
          <React.Fragment key={`l1-${i}`}>
            {/* The Block */}
            <motion.div
              initial={{ y: '-50%' }}
              animate={{ y: '-50%' }}
              whileHover={{ scale: 1.05, y: 'calc(-50% - 4px)' }}
              className={`absolute top-1/2 h-14 rounded-2xl ${event.lightColor} backdrop-blur-sm border border-white/50 shadow-sm flex flex-col items-center justify-center cursor-pointer overflow-hidden z-10`}
              style={{ left: `${start}%`, width: `${width}%` }}
            >
              {/* Accent Top Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${event.color}`} />
              <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Level 1</span>
              <span className="text-[10px] font-bold text-gray-700">
                {slot.start.replace(' AM', '').replace(' PM', '')}
              </span>
            </motion.div>
          </React.Fragment>
        );
      })}

      {/* Finals */}
      {(() => {
        const start = getPosition(event.finalSlot.start);
        const end = getPosition(event.finalSlot.end);
        const width = end - start;

        return (
          <motion.div
            initial={{ y: '-50%' }}
            animate={{ y: '-50%' }}
            whileHover={{ scale: 1.05, y: 'calc(-50% - 4px)' }}
            className={`absolute top-1/2 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl flex flex-col items-center justify-center cursor-pointer z-10 border border-gray-700`}
            style={{ left: `${start}%`, width: `${width}%` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${event.color} opacity-20`} />
            <span className="text-[10px] uppercase font-bold text-white/60 mb-1 tracking-widest relative z-10">
              Finals
            </span>
            <span className="text-[10px] font-bold text-white relative z-10">
              {event.finalSlot.start.replace(' AM', '').replace(' PM', '')}
            </span>
          </motion.div>
        );
      })()}
    </motion.div>
  );
};

const MobileEventCard = ({ event }: { event: EventFlow }) => (
  <GlassCard className="mb-6 p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner ${event.lightColor}`}
        >
          {event.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
      </div>
    </div>

    <div className="space-y-6 relative">
      <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gray-100 -z-10" />

      {/* Level 1 Section */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-100 shadow-sm z-10">
            <span className="text-sm font-bold text-gray-400">01</span>
          </div>
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Level 1 (Qualifiers)
          </span>
        </div>

        <div className="pl-12 grid grid-cols-2 gap-3">
          {event.level1Slots.map((slot, i) => {
            return (
              <div
                key={i}
                className="p-3 rounded-xl border border-primary-500 ring-1 ring-primary-500/20 shadow-primary-900/5 bg-gray-50/50 text-center hover:bg-white hover:shadow-md transition-all h-20 flex flex-col justify-center items-center"
              >
                <span className="block text-sm font-bold text-gray-800">{slot.start}</span>
                <span className="text-xs text-gray-400 my-0.5">-</span>
                <span className="block text-sm font-bold text-gray-800">{slot.end}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Finals Section */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-${event.color.split('-')[1]}-500/30 z-10 ${event.color}`}
          >
            <span className="text-sm font-bold">🏆</span>
          </div>
          <span
            className={`text-sm font-bold uppercase tracking-wider ${event.color.replace('bg-', 'text-')}`}
          >
            Finals
          </span>
        </div>

        <div className="pl-12">
          <div
            className={`p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg flex items-center justify-center relative overflow-hidden h-16`}
          >
            <div className={`absolute inset-0 ${event.color} opacity-20 blur-xl`} />
            <div className="relative z-10 flex gap-2 items-center">
              <span className="text-base font-bold">{event.finalSlot.start}</span>
              <span className="text-white/60 text-sm">-</span>
              <span className="text-base font-bold">{event.finalSlot.end}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </GlassCard>
);

const SchedulePage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans selection:bg-indigo-100 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden text-primary-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-12 lg:py-20 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <span className="inline-flex mt-10 items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 shadow-sm text-sm font-semibold text-primary-700 uppercase tracking-wider">
              <span className="text-lg">📅</span> Timeline
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-gray-900 mb-6 tracking-tight">
            Event <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
              Schedule
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Follow the flow of innovation. A packed day of coding, gaming, and technical excellence
            awaits.
          </p>
        </motion.div>

        {/* --- STARTING EVENTS (08:30 - 10:30) --- */}
        <div className="space-y-4 mb-20 relative">
          <div className="absolute left-[28px] md:left-1/2 top-4 bottom-4 w-0.5 bg-gray-100 -z-10 -translate-x-1/2 hidden md:block" />
          {GENERAL_EVENTS_START.map((event) => (
            <GeneralEventCard key={event.id} event={event} />
          ))}
        </div>

        {/* --- COMPETITION BLOCK (10:30 - 01:00) --- */}
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-10 justify-center">
            <div className="h-px bg-gray-200 w-12 md:w-32" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Competition Phase</h2>
            <div className="h-px bg-gray-200 w-12 md:w-32" />
          </div>

          {/* Mega Tracks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {MEGA_TRACKS.map((track, i) => (
              <MegaTrackCard key={track.id} track={track} index={i} />
            ))}
          </div>

          {/* --- Desktop Map (>= md) --- */}
          <div className="hidden md:block relative">
            {/* Time Axis Header */}
            <div className="relative h-12 mb-10 w-full">
              {[10.5, 11, 11.5, 12, 12.5, 13].map((time) => {
                const hours = Math.floor(time);
                const minutes = (time % 1) * 60;
                const timeStr = `${hours > 12 ? hours - 12 : hours}:${minutes === 0 ? '00' : minutes}`;
                const period = hours >= 12 ? 'PM' : 'AM';
                const left = getPosition(`${timeStr} ${period}`);
                return (
                  <div
                    key={time}
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${left}%` }}
                  >
                    <span className="text-sm font-bold text-gray-400 mb-2">
                      {timeStr} <span className="text-[10px]">{period}</span>
                    </span>
                    <div className="w-px h-full bg-gray-200" />
                  </div>
                );
              })}
            </div>

            {/* Event Rows */}
            <div className="relative space-y-4">
              {/* Vertical Grid Lines Background */}
              <div className="absolute inset-0 pointer-events-none -z-20">
                {[10.5, 11, 11.5, 12, 12.5, 13].map((time) => {
                  const hours = Math.floor(time);
                  const minutes = (time % 1) * 60;
                  const timeStr = `${hours > 12 ? hours - 12 : hours}:${minutes === 0 ? '00' : minutes}`;
                  const period = hours >= 12 ? 'PM' : 'AM';
                  const left = getPosition(`${timeStr} ${period}`);
                  return (
                    <div
                      key={`g-${time}`}
                      className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-200"
                      style={{ left: `${left}%` }}
                    />
                  );
                })}
              </div>

              {EVENTS_FLOW.map((event, i) => (
                <TimelineEventRow key={event.id} event={event} index={i} />
              ))}
            </div>
          </div>

          {/* --- Mobile Feed (< md) --- */}
          <div className="md:hidden space-y-8">
            <div className="pl-2 border-l-2 border-gray-100">
              {EVENTS_FLOW.map((event) => (
                <MobileEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>

        {/* --- CLOSING EVENTS (01:00 - 03:30) --- */}
        <div className="space-y-4 relative">
          <div className="absolute left-[28px] md:left-1/2 top-4 bottom-4 w-0.5 bg-gray-100 -z-10 -translate-x-1/2 hidden md:block" />
          {GENERAL_EVENTS_END.map((event) => (
            <GeneralEventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
