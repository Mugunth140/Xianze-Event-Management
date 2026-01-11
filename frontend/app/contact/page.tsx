'use client'

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";

const Contact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatusMessage("Message sent successfully!");
        setFormData({ name: "", email: "", message: "" });
      } else {
        console.log(response);
        setStatusMessage("Failed to send message. Please try again.");
      }
    } catch (error) {
      setStatusMessage("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => setStatusMessage(""), 5000);
  };

  return (
    <section className=" mt-10 lg:mt-20 flex justify-center items-center min-h-screen px-4 bg-white bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.08),transparent_40%)]">
      <div className="bg-white/70 backdrop-blur-xl p-10 rounded-2xl border border-violet-200/40 shadow-[0_20px_40px_rgba(124,58,237,0.25)] max-w-[600px] w-full flex flex-col gap-6 animate-[fadeUp_0.8s_ease-out]">
        
        <h2 className="text-3xl font-bold text-neutral-900 text-center tracking-tight">Contact Us</h2>
        <p className="text-center text-neutral-700 mb-2">Have questions? Reach out to us!</p>

        <Link href="https://chat.whatsapp.com/GObiBOjDxn5KTC2GVwCXXp" target="_blank" className="inline-flex items-center justify-center gap-2 text-white bg-green-500 hover:bg-green-600 rounded-lg px-4 py-2 font-semibold shadow-md transition-all duration-300 text-sm">
          <FaWhatsapp size={22} /> WhatsApp Community
        </Link>

        {/* Student Coordinators Dropdown */}
        <div className="relative mt-4 mb-4" ref={dropdownRef}>
          <button
            className="w-full bg-violet-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all duration-300 hover:bg-violet-700 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            Student Coordinators
          </button>
            {isOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-violet-200/40 rounded-2xl shadow-lg flex flex-col z-10 overflow-hidden">
      
            <a
                href="tel:+918148529920"
                className="px-4 py-3 text-neutral-800 hover:bg-violet-50 transition-colors font-medium"
            >
                Sharulatha - 8148529920
            </a>

            <a
                href="tel:+918072390391"
                className="px-4 py-3 text-neutral-800 hover:bg-violet-50 transition-colors font-medium"
            >
                Rajakavika - 8072390391
            </a>

            <a
                href="tel:+916384761234"
                className="px-4 py-3 text-neutral-800 hover:bg-violet-50 transition-colors font-medium"
            >
                Mugunth - 6384761234
            </a>

            </div>
          )}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`text-center py-2 px-4 rounded-lg font-medium ${statusMessage.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {statusMessage}
          </div>
        )}

        {/* Loader */}
        {isLoading && (
          <div className="flex justify-center my-2">
            <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Contact Form */}
        <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg text-neutral-800 bg-white border-neutral-300 placeholder:text-neutral-400 transition-all duration-300 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg text-neutral-800 bg-white border-neutral-300 placeholder:text-neutral-400 transition-all duration-300 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg text-neutral-800 bg-white border-neutral-300 placeholder:text-neutral-400 transition-all duration-300 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
          ></textarea>
          <button
            type="submit"
            className="mt-2 px-4 py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-700 shadow-[0_12px_25px_rgba(124,58,237,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(124,58,237,0.55)] active:translate-y-0"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* Fade-up animation using inline Tailwind */}
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-[fadeUp_0.8s_ease-out] {
          animation: fadeUp 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default Contact;
