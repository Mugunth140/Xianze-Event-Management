'use client'

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";

const Countdown = dynamic(() => import("../components/Countdown"), { ssr: false });

const RegisterCounter = () => {
  return (
    <section
      className="
        relative w-full
        py-20 px-6
        flex items-center justify-center
        bg-white
        overflow-hidden
      "
    >
      {/* subtle background gradient */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-b
          from-violet-50/60
          via-white
          to-white
          pointer-events-none
        "
      />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="
          relative z-10
          w-full max-w-[720px]
          rounded-3xl
          bg-white/80
          backdrop-blur-xl
          border border-violet-200/40
          shadow-[0_20px_40px_rgba(124,58,237,0.25)]
          px-10 py-12
          text-center
          md:px-6 md:py-10
        "
      >
        {/* Heading */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="
                inline-flex items-center gap-2
                rounded-full
                bg-violet-100/70
                px-4 py-1.5
                text-sm font-semibold
                text-violet-700
                border border-violet-200
                shadow-sm
            "
            >
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600"></span>
            </span>
            Limited Availability
            </motion.div>

        <p
          className="
            text-neutral-600
            text-[1.05rem]
            max-w-[520px]
            mx-auto
            mb-8
            mt-5
            md:text-[0.95rem]
          "
        >
          Secure your spot before it’s too late. Register now and be part of
          <span className="font-semibold text-violet-600"> Xianze 2K26</span>.
        </p>

        {/* Countdown */}
        <div
          className="
            mb-10
            text-3xl font-semibold
            text-violet-700
            md:text-2xl
          "
        >
          <Countdown targetDate="2026-02-07T23:59:59" />
        </div>

        {/* CTA */}
        <Link
          href="/register"
          className="
            inline-flex items-center justify-center
            rounded-xl
            bg-violet-600
            px-8 py-3
            text-white
            font-semibold
            text-[1rem]
            transition-all duration-300
            hover:bg-violet-700
            hover:-translate-y-0.5
            hover:shadow-lg
            active:translate-y-0
            md:px-6 md:py-2.5 md:text-[0.95rem]
          "
        >
          Register Now
        </Link>
      </motion.div>
    </section>
  );
};

export default RegisterCounter;
