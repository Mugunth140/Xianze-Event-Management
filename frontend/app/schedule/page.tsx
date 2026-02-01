'use client';

import React from 'react';
import { motion } from 'framer-motion';

const SchedulePage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden relative font-sans selection:bg-primary-500/30">
      {/* Ambient Background Effects - Light Mode */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/30 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[100px] animate-pulse-soft delay-1000" />

        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] invert" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 max-w-7xl">
        {/* Header - Aligned with Events Page */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center justify-center mb-6">
            <span className="px-5 py-2 rounded-full bg-white border border-primary-100 shadow-sm text-sm font-semibold text-primary-700 uppercase tracking-wider flex items-center gap-2">
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

        {/* Timeline Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary-300 -translate-x-1/2 hidden md:block" />
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary-300 md:hidden" />

          <div className="space-y-16 md:space-y-24">
            {/* 08:30 AM: Spot Registration */}
            <TimelineItem
              time="08:30 AM"
              title="Spot Registration"
              description="Get your ID cards and welcome kits at the registration desk."
              align="left"
              icon="📝"
              delay={0.2}
            />

            {/* 09:15 AM: Inauguration */}
            <TimelineItem
              time="09:15 AM"
              title="Inauguration"
              description="Official opening ceremony with keynote speakers."
              align="right"
              icon="🚀"
              delay={0.4}
            />

            {/* 10:30 AM: Fun Games */}
            <TimelineItem
              time="10:30 AM"
              title="Fun Games"
              description="Join the excitement with various fun games and activities."
              align="left"
              icon="🎮"
              delay={0.5}
            />

            {/* 10:30 AM - 01:30 PM: MAIN EVENT ZONE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="relative md:col-span-2 py-4 pl-12 md:pl-0"
            >
              {/* Mobile Connector Node */}
              <div className="absolute left-4 top-12 w-4 h-4 bg-white rounded-full -translate-x-1/2 border-[3px] border-primary-600 z-20 md:hidden shadow-[0_0_0_4px_rgba(255,255,255,1)]" />

              <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 md:p-12 overflow-hidden group shadow-xl shadow-primary-900/5">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-100/50 rounded-full blur-[80px] group-hover:bg-primary-100/80 transition-colors duration-500" />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-100 pb-8">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
                        Main Event Zone
                      </h2>
                      <p className="text-gray-500">Concurrent sessions across venues</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-lg text-primary-700 font-mono bg-primary-50 px-6 py-2 rounded-full border border-primary-100">
                      10:30 AM - 01:30 PM
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Batch A */}
                    <div className="relative group/batch h-full">
                      <div className="relative p-8 border border-gray-100 rounded-[2rem] bg-white hover:bg-primary-50/30 hover:border-primary-200 transition-all duration-300 h-full shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
                            A
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Batch A</h3>
                            <span className="text-sm text-gray-500">Starts 10:30 AM</span>
                          </div>
                        </div>
                        <ul className="space-y-4">
                          {['Paper Presentation', 'Debugging', 'Think & Link', 'Buildathon'].map(
                            (item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-3 text-gray-600 group-hover/batch:text-primary-700 transition-colors"
                              >
                                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Batch B */}
                    <div className="relative group/batch h-full">
                      <div className="relative p-8 border border-gray-100 rounded-[2rem] bg-white hover:bg-purple-50/30 hover:border-purple-200 transition-all duration-300 h-full shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
                            B
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Batch B</h3>
                            <span className="text-sm text-gray-500">Starts 11:30 AM</span>
                          </div>
                        </div>
                        <ul className="space-y-4">
                          {['Ctrl+Quiz', 'Code Hunt'].map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-3 text-gray-600 group-hover/batch:text-purple-700 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 01:30 PM: Lunch Break */}
            <TimelineItem
              time="01:30 PM"
              title="Lunch Break"
              description="Refuel and network with other participants."
              align="left"
              icon="🍱"
              delay={0.6}
            />

            {/* 02:30 PM: Valedictory & Closing */}
            <TimelineItem
              time="02:30 PM"
              title="Valedictory & Closing"
              description="Prize distribution and closing remarks."
              align="right"
              icon="🏆"
              delay={0.8}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineItem = ({
  time,
  title,
  description,
  align,
  icon,
  delay,
}: {
  time: string;
  title: string;
  description: string;
  align: 'left' | 'right';
  icon: string;
  delay: number;
}) => {
  return (
    <div
      className={`relative flex items-center justify-between md:justify-center w-full ${align === 'left' ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Center Node */}
      <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 border-[3px] border-primary-600 z-20 hidden md:block shadow-[0_0_0_4px_rgba(255,255,255,1)]" />
      <div className="absolute left-4 w-4 h-4 bg-white rounded-full -translate-x-1/2 border-[3px] border-primary-600 z-20 md:hidden shadow-[0_0_0_4px_rgba(255,255,255,1)]" />

      {/* Horizontal Connector Line */}
      <div
        className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-0.5 bg-primary-300 w-[calc(50%-2rem)] ${align === 'left' ? 'right-1/2 mr-8' : 'left-1/2 ml-8'}`}
      />

      {/* Spacer for alignment */}
      <div className="hidden md:block w-1/2" />

      {/* Content Card */}
      <motion.div
        initial={{ opacity: 0, x: align === 'left' ? -30 : 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, delay }}
        className={`w-full md:w-[45%] pl-12 md:pl-0 ${align === 'left' ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}
      >
        <div className="group cursor-default">
          <div
            className={`relative bg-white border-2 border-gray-200 p-8 rounded-[2rem] hover:border-primary-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/5 ${align === 'left' ? 'md:items-end' : ''} flex flex-col`}
          >
            <div className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-mono text-xs mb-4 w-fit border border-primary-100">
              {time}
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              {title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SchedulePage;
