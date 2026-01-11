'use client'
import { useEffect, useState } from "react";

export default function Countdown({ targetDate }) {
  const calculateTimeLeft = () => {
    const difference = new Date(targetDate) - new Date();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const Box = ({ value, label }) => (
    <div
      className="
        group
        w-[120px]
        rounded-2xl
        bg-white/80
        backdrop-blur-md
        border border-violet-200/40
        p-5
        text-center
        shadow-[0_10px_25px_rgba(124,58,237,0.15)]
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_20px_40px_rgba(124,58,237,0.20)]
        sm:w-[100px] sm:p-4
        xs:w-[90px] xs:p-3
      "
    >
      <span
        className="
          block
          text-[2.6rem]
          font-bold
          text-violet-700
          leading-none
          transition-colors
          group-hover:text-violet-800
          sm:text-[2.2rem]
          xs:text-[2rem]
        "
      >
        {String(value).padStart(2, "0")}
      </span>

      <span
        className="
          mt-2 block
          text-[0.7rem]
          font-semibold
          uppercase
          tracking-widest
          text-neutral-500
        "
      >
        {label}
      </span>
    </div>
  );

  return (
    <div
      className="
        flex
        flex-wrap
        items-center
        justify-center
        gap-6
        md:gap-4
      "
    >
      <Box value={timeLeft.days} label="Days" />
      <Box value={timeLeft.hours} label="Hours" />
      <Box value={timeLeft.minutes} label="Minutes" />
      <Box value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}
