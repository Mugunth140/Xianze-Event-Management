'use client';

import { useState } from "react";
import { motion } from "framer-motion";

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.25, 0.8, 0.25, 1],
    },
  },
};

const faqs = [
  {
    question: "What is Xianze?",
    answer:
      "Xianze is an inter-college technical event where students showcase their skills in various competitions and workshops.",
  },
  {
    question: "How can I register?",
    answer:
      "You can register online through Google forms or via official website.",
  },
  {
    question: "Is there a cash prize for winners?",
    answer:
      "Yes! Winners of competitions can win cash prizes of up to ₹20,000 along with certificates and other exciting rewards.",
  },
  {
    question: "Is food provided?",
    answer:
      "Yes, lunch will be provided for participants from other colleges.",
  },
  {
    question: "Who can participate?",
    answer:
      "Anyone with an interest in technology and innovation can participate.",
  },
  {
    question: "Will I get certificate?",
    answer:
      "Yes! All participants will receive certificate, and winners will get special recognition and prizes.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="
        relative
        max-w-[700px] w-[90%]
        mx-auto my-24
        p-8 md:p-6
        bg-white/70 backdrop-blur-xl
        border border-violet-200/40
        rounded-2xl
        shadow-[0_20px_40px_rgba(124,58,237,0.25)]
        text-center
        overflow-hidden
      "
    >
      {/* Static glow */}
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
        Frequently Asked Questions
      </h2>

      <motion.div
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="text-left space-y-3"
      >
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            onClick={() => toggleFAQ(index)}
            className="
              group
              relative
              cursor-pointer
              px-5 py-4
              rounded-xl
              border border-neutral-200
              overflow-hidden
              transition-colors duration-200
              hover:bg-violet-50
            "
          >
            {/* Hover sheen (visual only) */}
            <div
              className="
                absolute inset-0
                bg-gradient-to-r from-transparent via-violet-100 to-transparent
                opacity-0
                group-hover:opacity-100
                transition-opacity duration-200
                pointer-events-none
              "
            />

            {/* Question */}
            <div className="relative flex justify-between items-center">
              <span className="text-lg md:text-base font-semibold text-neutral-800">
                {faq.question}
              </span>
              <span
                className={`
                  text-2xl font-bold text-violet-600
                  transition-transform duration-200
                  ${openIndex === index ? "rotate-180" : ""}
                `}
              >
                {openIndex === index ? "−" : "+"}
              </span>
            </div>

            {/* Answer */}
            <motion.div
              initial={false}
              animate={{
                height: openIndex === index ? "auto" : 0,
                opacity: openIndex === index ? 1 : 0,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-neutral-600 text-[15px] leading-relaxed">
                {faq.answer}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default FAQ;
