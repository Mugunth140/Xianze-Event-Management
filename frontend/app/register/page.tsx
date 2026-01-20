'use client';

import {
  sanitizeInput,
  validateCollege,
  validateEmail,
  validateName,
  validatePhone,
  validateSelection,
} from '@/lib/validation';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface FormData {
  name: string;
  email: string;
  course: string;
  branch: string;
  college: string;
  contact: string;
  event: string;
  otherCourse: string;
  otherBranch: string;
}

interface DropdownProps {
  label: string;
  options: string[];
  selected: string;
  setSelected: (value: string) => void;
  placeholder?: string;
}

const CustomDropdown = ({ label, options, selected, setSelected, placeholder }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-5 rounded-2xl text-gray-800 bg-white border-2 border-gray-100 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none flex items-center justify-between"
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected || placeholder || `Select ${label}`}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl flex flex-col z-20 max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors text-left font-medium first:rounded-t-2xl last:rounded-b-2xl ${selected === option ? 'bg-primary-50 text-primary-600' : ''}`}
              onClick={() => {
                setSelected(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const triggerConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
    });
  }, 250);
};

const Register = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    course: '',
    branch: '',
    college: '',
    contact: '',
    event: '',
    otherCourse: '',
    otherBranch: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Unified Animation Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%', // Trigger earlier for better visibility
        toggleActions: 'play none none none', // Don't reverse, just play once cleanly
      },
    });

    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 60, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' }
      );
    }

    // Stagger Form Sections
    const formSections = document.querySelectorAll('.form-section-item');
    if (formSections.length > 0) {
      tl.fromTo(
        formSections,
        { opacity: 0, y: 50, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.1,
          ease: 'power4.out',
        },
        '-=0.6'
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const eventsList = [
    'BuildAThon',
    'Bug Smash',
    'Paper Presentation',
    'Ctrl+ Quiz',
    'Code Hunt: Word Edition',
    'Think & Link',
    'Gaming',
  ];

  const courses: Record<string, string[]> = {
    'B.Tech': [
      'Computer Science',
      'Information Technology',
      'Electronics',
      'Mechanical',
      'Civil',
      'Aerospace',
      'Automobile',
      'Biotechnology',
      'Chemical',
      'Electrical',
      'Electronics and Communication',
      'Instrumentation',
      'Others',
    ],
    'M.Tech': [
      'Computer Science',
      'Data Science',
      'Artificial Intelligence',
      'VLSI',
      'Cyber Security',
      'Information Security',
      'Network Security',
      'Cloud Computing',
      'Data Analytics',
      'Machine Learning',
      'Robotics',
      'Others',
    ],
    'B.Sc': [
      'Mathematics',
      'Physics',
      'Computer Science',
      'Information Technology',
      'Biology',
      'Chemistry',
      'Zoology',
      'Botany',
      'Statistics',
      'Electronics',
      'Microbiology',
      'Biochemistry',
      'Others',
    ],
    'M.Sc': [
      'Mathematics',
      'Physics',
      'Computer Science',
      'Information Technology',
      'Software System',
      'Biology',
      'Chemistry',
      'Zoology',
      'Botany',
      'Statistics',
      'Electronics',
      'Microbiology',
      'Biochemistry',
      'Biotechnology',
      'Environmental Science',
      'Others',
    ],
    BCA: [
      'General',
      'Cloud Computing',
      'Data Analytics',
      'Artificial Intelligence',
      'Cyber Security',
      'Mobile Application Development',
      'Web Development',
      'Networking',
      'Database Management',
      'Others',
    ],
    MCA: [
      'General',
      'Artificial Intelligence',
      'Cyber Security',
      'Data Science',
      'Cloud Computing',
      'Mobile Application Development',
      'Web Development',
      'Networking',
      'Database Management',
      'Enterprise Resource Planning',
      'Others',
    ],
    'B.A': [
      'English',
      'Hindi',
      'History',
      'Geography',
      'Economics',
      'Political Science',
      'Psychology',
      'Sociology',
      'Philosophy',
      'Others',
    ],
    'M.A': [
      'English',
      'Hindi',
      'History',
      'Geography',
      'Economics',
      'Political Science',
      'Psychology',
      'Sociology',
      'Philosophy',
      'Anthropology',
      'Linguistics',
      'Others',
    ],
    'B.Com': [
      'General',
      'Honors',
      'Accounting',
      'Finance',
      'Marketing',
      'Human Resource',
      'International Business',
      'Banking and Insurance',
      'Computer Application',
      'Others',
    ],
    'M.Com': [
      'General',
      'Accounting',
      'Finance',
      'Marketing',
      'Human Resource',
      'International Business',
      'Computer Application',
      'Banking and Insurance',
      'Taxation',
      'Financial Management',
      'Others',
    ],
    BBA: [
      'General',
      'Human Resource',
      'Marketing',
      'Finance',
      'International Business',
      'Entrepreneurship',
      'Operations Management',
      'Computer Application',
      'Others',
    ],
    MBA: [
      'General',
      'Human Resource',
      'Marketing',
      'Finance',
      'International Business',
      'Entrepreneurship',
      'Computer Application',
      'Operations Management',
      'Supply Chain Management',
      'Information Technology',
      'Others',
    ],
    'B.Ed': [
      'General',
      'Special Education',
      'Elementary Education',
      'Secondary Education',
      'Others',
    ],
    MS: ['General Surgery', 'Orthopedics', 'Ophthalmology', 'ENT', 'Others'],
    BDS: ['General'],
    MDS: [
      'General',
      'Orthodontics',
      'Prosthodontics',
      'Periodontics',
      'Pedodontics',
      'Oral Surgery',
      'Others',
    ],
    Others: [],
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear field error when user starts typing
    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (name === 'course') {
      setFormData((prev) => ({
        ...prev,
        branch: '',
        otherCourse: value === 'Others' ? '' : prev.otherCourse,
        otherBranch: '',
      }));
    }

    if (name === 'branch' && value !== 'Others') {
      setFormData((prev) => ({ ...prev, otherBranch: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    // Clear previous errors
    setFieldErrors({});

    // Validate all fields
    const errors: Partial<Record<keyof FormData, string>> = {};

    const nameResult = validateName(formData.name);
    if (!nameResult.isValid) errors.name = nameResult.error!;

    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) errors.email = emailResult.error!;

    const phoneResult = validatePhone(formData.contact);
    if (!phoneResult.isValid) errors.contact = phoneResult.error!;

    const collegeResult = validateCollege(formData.college);
    if (!collegeResult.isValid) errors.college = collegeResult.error!;

    const courseResult = validateSelection(formData.course, 'course');
    if (!courseResult.isValid) errors.course = courseResult.error!;

    if (formData.course === 'Others') {
      const otherCourseResult = validateSelection(formData.otherCourse, 'course name');
      if (!otherCourseResult.isValid) errors.otherCourse = otherCourseResult.error!;
    }

    const eventResult = validateSelection(formData.event, 'event');
    if (!eventResult.isValid) errors.event = eventResult.error!;

    // Check if there are validation errors
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitStatus('error');
      setErrorMessage('Please fix the errors above.');
      setLoading(false);
      return;
    }

    const submittedData = {
      name: sanitizeInput(formData.name),
      email: formData.email.trim().toLowerCase(),
      course: sanitizeInput(formData.course === 'Others' ? formData.otherCourse : formData.course),
      branch: sanitizeInput(
        formData.course === 'Others' || formData.branch === 'Others'
          ? formData.otherBranch
          : formData.branch
      ),
      college: sanitizeInput(formData.college),
      contact: formData.contact.replace(/[^\d]/g, ''),
      event: formData.event,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submittedData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitStatus('success');
        triggerConfetti();

        // Scroll to top with timeout for mobile reliability
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);

        // Play success sound (local file)
        const audio = new Audio('/success.mp3');
        audio.volume = 0.5;
        // eslint-disable-next-line no-console
        audio.play().catch((e) => console.error('Audio play failed:', e));

        setFormData({
          name: '',
          email: '',
          course: '',
          branch: '',
          college: '',
          contact: '',
          event: '',
          otherCourse: '',
          otherBranch: '',
        });
      } else {
        setSubmitStatus('error');
        // Parse meaningful error messages
        let friendlyMessage = 'Registration failed. Please try again.';

        if (res.status === 409) {
          friendlyMessage =
            data.message ||
            data.error ||
            'This email is already registered. Please use a different email.';
        } else if (data.message) {
          friendlyMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        } else if (data.error) {
          friendlyMessage = data.error;
        }

        setErrorMessage(friendlyMessage);
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }

    setLoading(false);
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  // Validation Logic
  const isFormValid =
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.contact.trim() !== '' &&
    formData.college.trim() !== '' &&
    formData.course !== '' &&
    formData.event !== '' &&
    (formData.course === 'Others' ? formData.otherCourse.trim() !== '' : true) &&
    (formData.branch === 'Others'
      ? formData.otherBranch.trim() !== ''
      : formData.course === 'B.Tech' || formData.course === 'M.Tech'
        ? formData.branch !== ''
        : true);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen pt-28 pb-20"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 30%, #f0e8ff 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-20 left-10 w-72 h-72 rounded-full opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(109, 64, 212, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="fixed bottom-20 right-10 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 mb-6 shadow-sm">
            <span className="text-2xl">🚀</span>
            <span className="text-sm font-semibold text-primary-700 uppercase tracking-wider">
              Join Xianze 2K26
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-4">
            Register{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary-600">Now</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-primary-200/60 -rotate-1 -z-0" />
            </span>
            !
          </h1>

          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Secure your spot at the ultimate inter-collegiate tech symposium. Fill out the form
            below to get started!
          </p>
        </div>

        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          {/* Success State */}
          {submitStatus === 'success' && (
            <div className="rounded-3xl bg-white border border-gray-100 p-8 sm:p-12 shadow-xl shadow-primary-500/5 text-center overflow-hidden">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 text-5xl">
                🎉
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
                Registration Successfull!
              </h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                You&apos;re all set for XIANZE 2K26! We&apos;ve sent a confirmation to your email.
                See you there! 🎊
              </p>
              <button
                onClick={resetForm}
                className="liquid-glass-btn inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-xl"
              >
                Register Another
              </button>
            </div>
          )}

          {/* Form State */}
          {submitStatus !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: Personal Details */}
              <div className="form-section-item opacity-0 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-30">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Personal Details</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.name ? 'border-red-400' : 'border-gray-100'}`}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.email ? 'border-red-400' : 'border-gray-100'}`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="contact"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Contact Number
                    </label>
                    <input
                      id="contact"
                      type="tel"
                      name="contact"
                      placeholder="10-digit mobile number"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                      className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.contact ? 'border-red-400' : 'border-gray-100'}`}
                    />
                    {fieldErrors.contact && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.contact}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Academic Info */}
              <div className="form-section-item opacity-0 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                    🎓
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Academic Info</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="college"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      College Name
                    </label>
                    <input
                      id="college"
                      type="text"
                      name="college"
                      placeholder="Your college name"
                      value={formData.college}
                      onChange={handleChange}
                      required
                      className="w-full p-4 rounded-xl text-gray-800 bg-white border-2 border-gray-100 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <CustomDropdown
                      label="Course"
                      options={Object.keys(courses)}
                      selected={formData.course}
                      setSelected={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          course: value,
                          branch: '',
                          otherBranch: '',
                        }))
                      }
                      placeholder="Select your course"
                    />
                  </div>
                  {formData.course === 'Others' && (
                    <div>
                      <label
                        htmlFor="otherCourse"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Specify Course
                      </label>
                      <input
                        id="otherCourse"
                        type="text"
                        name="otherCourse"
                        placeholder="Enter your course"
                        value={formData.otherCourse}
                        onChange={handleChange}
                        required
                        className="w-full p-4 rounded-xl text-gray-800 bg-white border-2 border-gray-100 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none"
                      />
                    </div>
                  )}

                  {formData.course && formData.course !== 'Others' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                      <CustomDropdown
                        label="Branch"
                        options={courses[formData.course] || []}
                        selected={formData.branch}
                        setSelected={(value) => setFormData((prev) => ({ ...prev, branch: value }))}
                        placeholder="Select your branch"
                      />
                    </div>
                  )}

                  {(formData.course === 'Others' || formData.branch === 'Others') && (
                    <div>
                      <label
                        htmlFor="otherBranch"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Specify Branch
                      </label>
                      <input
                        id="otherBranch"
                        type="text"
                        name="otherBranch"
                        placeholder="Enter your branch"
                        value={formData.otherBranch}
                        onChange={handleChange}
                        required
                        className="w-full p-4 rounded-xl text-gray-800 bg-white border-2 border-gray-100 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Event Selection */}
              <div className="form-section-item opacity-0 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-2xl">
                    🚀
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Select Event</h3>
                </div>
                <div>
                  <CustomDropdown
                    label="Event"
                    options={eventsList}
                    selected={formData.event}
                    setSelected={(value) => setFormData((prev) => ({ ...prev, event: value }))}
                    placeholder="Choose an event to participate"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="form-section-item opacity-0 w-full liquid-glass-btn inline-flex items-center justify-center px-8 py-5 text-white text-lg font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-500/20 hover:shadow-2xl hover:shadow-primary-500/30 hover:-translate-y-1 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Registering...
                  </>
                ) : (
                  <>Register</>
                )}
              </button>

              {/* Validation / Error Message */}
              {!isFormValid && (
                <div className="text-center text-sm text-gray-500 animate-pulse">
                  * Please fill all the fields to complete registration.
                </div>
              )}

              {/* Error Message - Below Submit Button */}
              {submitStatus === 'error' && errorMessage && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 text-center font-medium">
                  ❌ {errorMessage}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Register;
