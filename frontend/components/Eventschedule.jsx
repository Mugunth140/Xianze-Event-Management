'use client';

import { motion } from 'framer-motion';

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08, // faster
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32, // fast
      ease: [0.25, 0.8, 0.25, 1],
    },
  },
};

const Eventschedule = () => {
  const schedule = [
    { title: 'Spot Registration', time: '8:30 AM - 9:15 AM' },
    { title: 'Inauguration', time: '9:15 AM - 10:30 AM' },
    { title: 'Event Timing', time: '10:30 AM - 1:30 PM' },
    { title: 'Lunch Timing', time: '1:30 PM - 2:30 PM' },
    { title: 'Ceremony', time: '2:30 PM - 3:30 PM' },
  ];
  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }} // ✅ NO LOOP
      transition={{
        duration: 0.4, // fast entrance
        ease: 'easeOut',
      }}
      className="
        relative
        max-w-[700px] w-[90%]
        mx-auto mt-24
        p-8 md:p-6
        bg-white/70 backdrop-blur-xl
        border border-violet-200/40
        rounded-2xl
        shadow-[0_20px_40px_rgba(124,58,237,0.25)]
        text-center
        overflow-hidden
      "
    >
      {/* Soft static glow (no animation) */}
      <div
        className="
        absolute -top-28 -right-28
        w-80 h-80
        bg-violet-200/10
        rounded-full
        blur-3xl
        pointer-events-none
      "
      />

      <h2
        className="
          text-3xl font-bold text-neutral-900
          mb-8
          inline-block pb-2
          tracking-tight
          border-b-2 border-violet-600
        "
      >
        Event Schedule
      </h2>

      <motion.ul
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }} // ✅ reveal once
        className="mt-4 space-y-3"
      >
        {schedule.map((item, index) => (
          <motion.li
            key={index}
            variants={itemVariants}
            whileHover={{ y: -2 }} // subtle hover only
            className="
              group
              relative
              flex flex-row-reverse justify-between items-center
              px-5 py-4
              rounded-xl
              border border-neutral-200
              overflow-hidden
              transition-colors duration-200
              hover:bg-violet-50
              md:flex-col-reverse md:text-center
            "
          >
            {/* Fast hover sheen */}
            <div
              className="
              absolute inset-0
              bg-gradient-to-r from-transparent via-violet-100 to-transparent
              opacity-0
              group-hover:opacity-100
              transition-opacity duration-200
            "
            />

            <span className="relative text-lg font-semibold text-violet-600 md:text-base">
              {item.time}
            </span>

            <span className="relative text-neutral-700 font-medium mb-2 md:text-base">
              {item.title}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
};

export default Eventschedule;
