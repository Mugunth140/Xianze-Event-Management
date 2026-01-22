'use client';

import { ApiError, createSubmitDebounce, fetchWithRetry, getApiUrl } from '@/lib/api';
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
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
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
  transactionId: string;
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

// Debounce for preventing double submissions
const submitDebounce = createSubmitDebounce(3000);

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
    transactionId: '',
  });

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const router = useRouter();

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
    'Buildathon',
    'Bug Smash',
    'Paper Presentation',
    'Ctrl + Quiz',
    'Think & Link',
    'Gaming',
    'Code Hunt : Word Edition',
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Strict Size Check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must be less than 5MB');
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
        return;
      }

      setScreenshot(file);
      // Clear any previous file-related errors
      if (errorMessage.includes('File')) setErrorMessage('');
    }
  };

  const handleTransactionIdBlur = () => {
    if (formData.transactionId && formData.transactionId.length !== 12) {
      setFieldErrors((prev) => ({
        ...prev,
        transactionId: 'Transaction ID must be exactly 12 digits',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent double submissions with debounce
    if (!submitDebounce()) {
      setErrorMessage('Please wait before submitting again.');
      return;
    }

    // Prevent submission while already loading
    if (loading) return;

    setLoading(true);
    setSubmitStatus('idle');
    setErrorMessage('');
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

    // Validate transaction ID - exactly 12 digits
    if (!formData.transactionId.trim()) {
      errors.transactionId = 'Transaction ID is required';
    } else if (formData.transactionId.length !== 12) {
      errors.transactionId = 'Transaction ID must be exactly 12 digits';
    } else if (!/^\d{12}$/.test(formData.transactionId)) {
      errors.transactionId = 'Transaction ID must contain only digits';
    }
    if (!screenshot) {
      setErrorMessage('Payment screenshot is required');
      setLoading(false);
      return;
    }

    // Check if there are validation errors
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitStatus('error');
      setErrorMessage('Please fix the errors above.');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('name', sanitizeInput(formData.name));
    data.append('email', formData.email.trim().toLowerCase());
    data.append(
      'course',
      sanitizeInput(formData.course === 'Others' ? formData.otherCourse : formData.course)
    );
    data.append(
      'branch',
      sanitizeInput(
        formData.course === 'Others' || formData.branch === 'Others'
          ? formData.otherBranch
          : formData.branch
      )
    );
    data.append('college', sanitizeInput(formData.college));
    data.append('contact', formData.contact.replace(/[^\d]/g, ''));
    data.append('event', formData.event);
    data.append('transactionId', sanitizeInput(formData.transactionId));
    if (screenshot) {
      data.append('screenshot', screenshot);
    }

    try {
      // Use fetchWithRetry for automatic retry on network/server errors
      const res = await fetchWithRetry(getApiUrl('/register'), {
        method: 'POST',
        body: data,
      });

      const dataRes = await res.json().catch(() => ({}));

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
          transactionId: '',
        });
        setScreenshot(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setSubmitStatus('error');
        // Parse meaningful error messages
        let friendlyMessage = 'Registration failed. Please try again.';

        if (res.status === 409) {
          friendlyMessage =
            dataRes.message ||
            dataRes.error ||
            'This email is already registered. Please use a different email.';
        } else if (res.status === 429) {
          friendlyMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (res.status >= 500) {
          friendlyMessage = 'Server is busy. Please try again in a few moments.';
        } else if (dataRes.message) {
          friendlyMessage = Array.isArray(dataRes.message)
            ? dataRes.message.join(', ')
            : dataRes.message;
        } else if (dataRes.error) {
          friendlyMessage = dataRes.error;
        }

        setErrorMessage(friendlyMessage);
      }
    } catch (error) {
      setSubmitStatus('error');
      if (error instanceof ApiError) {
        if (error.code === 'TIMEOUT') {
          setErrorMessage('Request timed out. Please check your connection and try again.');
        } else if (error.code === 'NETWORK_ERROR') {
          setErrorMessage('Network error. Please check your internet connection.');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }

    setLoading(false);
  };

  const upiId1 = 'gomathichandramohan2010@okhdfcbank';
  const upiId2 = 'klganesh78@okicici';
  const upiLink1 = `upi://pay?pa=${upiId1}&pn=Xianze2K26&am=100&cu=INR`;
  const upiLink2 = `upi://pay?pa=${upiId2}&pn=Xianze2K26&am=100&cu=INR`;

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
              {/* Success Icon */}
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Title */}
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
                Payment Submitted! 🎉
              </h3>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  Verification in Progress
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                We&apos;ve received your registration and payment details. Our team will verify your
                payment within <strong className="text-primary-600">8 hours</strong>.
              </p>

              {/* What&apos;s Next Card */}
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 mb-8 text-left border border-primary-100">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">📧</span> What happens next?
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Confirmation email sent to your inbox</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⏳</span>
                    <span>Payment verification within 8 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">🎟️</span>
                    <span>Event pass with QR code will be emailed after verification</span>
                  </li>
                </ul>
              </div>

              {/* Join Community Section */}
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border border-green-200 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-200/30 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-teal-200/30 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl">🎊</span>
                    <h4 className="font-bold text-gray-900 text-lg">Join Our Community!</h4>
                  </div>

                  <p className="text-sm text-gray-600 mb-5 text-center">
                    Connect with fellow participants, get event updates, and stay in the loop!
                  </p>

                  {/* Community Links */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* WhatsApp Button */}
                    <a
                      href={process.env.NEXT_PUBLIC_WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 px-5 py-3 
                      bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold 
                      rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl 
                      hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all 
                      duration-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span>WhatsApp Group</span>
                    </a>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    💡 Pro tip: Join the WhatsApp group for instant updates!
                  </p>
                </div>
              </div>

              {/* Single CTA Button */}
              <button
                onClick={() => router.push('/events')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <span>Explore Events</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
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
                      placeholder="e.g. John Doe"
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
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="e.g. john.doe@gmail.com"
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
                      placeholder="e.g. 9876543210"
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

              {/* SECTION 2: Academic Details */}
              <div className="form-section-item opacity-0 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                    🎓
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Academic Details</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                    <input
                      name="college"
                      placeholder="Search or enter college name..."
                      value={formData.college}
                      onChange={handleChange}
                      className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.college ? 'border-red-400' : 'border-gray-100'}`}
                    />
                    {fieldErrors.college && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.college}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Degree / Course
                    </label>
                    <CustomDropdown
                      label="Course"
                      options={Object.keys(courses)}
                      selected={formData.course}
                      setSelected={(val) =>
                        handleChange({
                          target: { name: 'course', value: val },
                        } as unknown as React.ChangeEvent<HTMLInputElement>)
                      }
                    />
                    {fieldErrors.course && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.course}</p>
                    )}
                  </div>

                  {formData.course === 'Others' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Course Name
                      </label>
                      <input
                        name="otherCourse"
                        placeholder="e.g. B.Arch"
                        value={formData.otherCourse}
                        onChange={handleChange}
                        className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.otherCourse ? 'border-red-400' : 'border-gray-100'}`}
                      />
                      {fieldErrors.otherCourse && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.otherCourse}</p>
                      )}
                    </div>
                  )}

                  {!['Others', 'BDS', 'MS', 'B.Ed'].includes(formData.course) &&
                    formData.course !== '' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch / Specialization
                        </label>
                        <CustomDropdown
                          label="Branch"
                          options={courses[formData.course] || []}
                          selected={formData.branch}
                          setSelected={(val) =>
                            handleChange({
                              target: { name: 'branch', value: val },
                            } as unknown as React.ChangeEvent<HTMLInputElement>)
                          }
                        />
                      </div>
                    )}

                  {formData.branch === 'Others' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Branch Name
                      </label>
                      <input
                        name="otherBranch"
                        placeholder="e.g. Marine Engineering"
                        value={formData.otherBranch}
                        onChange={handleChange}
                        className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.otherBranch ? 'border-red-400' : 'border-gray-100'}`}
                      />
                      {fieldErrors.otherBranch && (
                        <p className="mt-1 text-sm text-red-500">{fieldErrors.otherBranch}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Event Selection */}
              <div className="form-section-item opacity-0 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Event Selection</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Choose an Event
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {eventsList.map((event) => (
                      <div
                        key={event}
                        onClick={() =>
                          handleChange({
                            target: { name: 'event', value: event },
                          } as unknown as React.ChangeEvent<HTMLInputElement>)
                        }
                        className={`relative group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${formData.event === event
                          ? 'bg-primary-50 border-primary-500 shadow-md transform scale-[1.02]'
                          : 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-lg'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium ${formData.event === event ? 'text-primary-700' : 'text-gray-700'}`}
                          >
                            {event}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.event === event
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                              }`}
                          >
                            {formData.event === event && (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {fieldErrors.event && (
                    <p className="mt-2 text-sm text-red-500">{fieldErrors.event}</p>
                  )}
                </div>
              </div>

              {/* SECTION 4: Payment Details */}
              <div className="form-section-item opacity-0 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                    ₹
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Payment Details</h3>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="text-sm text-primary-800 mb-2 font-medium">
                      Registration Fee: ₹100
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      {/* Mobile Button 1*/}
                      <a
                        href={upiLink1}
                        className="md:hidden w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-primary-500/20 active:scale-95 transition-transform"
                      >
                        <span>Pay via UPI </span>
                      </a>
                        {/* Mobile Button 2 - Alternative */}
                      <a
                        href={upiLink2}
                        className="md:hidden w-full flex items-center justify-center gap-2 bg-amber-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
                      >
                        <span>Pay via UPI (Alternative) </span>
                      </a>

                      {/* Desktop QR */}
                      <div className="hidden lg:flex flex-row items-start gap-6 bg-white p-6 rounded-2xl border border-gray-200 w-full">
                        <div className="flex flex-col items-center gap-3 shrink-0">
                          <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm relative w-[140px] h-[140px]">
                            <NextImage
                              src="/upi_qr.jpeg"
                              alt="UPI QR Code"
                              fill
                              className="object-contain rounded-lg"
                            />
                          </div>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                            Scan to Pay
                          </p>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              UPI ID
                            </p>
                            <div className="relative group">
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-sm text-gray-700 break-all pr-10">
                                {upiId1}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(upiId1);
                                  const btn = document.getElementById('copy-btn');
                                  if (btn) {
                                    btn.innerHTML = '✓';
                                    setTimeout(() => (btn.innerHTML = '📋'), 2000);
                                  }
                                }}
                                id="copy-btn"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all"
                                title="Copy UPI ID"
                              >
                                📋
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 leading-relaxed">
                            <p>1. Scan the QR code or copy the UPI ID.</p>
                            <p>
                              2. Pay <strong>₹100</strong> via any UPI app (GPay, PhonePe, Paytm).
                            </p>
                            <p>
                              3. Enter the <strong>Transaction ID (UTR)</strong> below and upload a
                              screenshot.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="lg:hidden text-sm text-gray-600 text-center">
                        <p>Pay via button above, then enter details below.</p>
                      </div>
                    </div>
                  </div>

                  {/* Alternative Payment QR Code */}
                  <div className="hidden lg:block p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-800 mb-4 font-medium">
                      ⚠️ Can't register online? Try this alternative QR code:
                    </p>

                    <div className="hidden lg:flex flex-row items-start gap-6 bg-white p-6 rounded-2xl border border-gray-200 w-full">
                      <div className="flex flex-col items-center gap-3 shrink-0">
                        <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm relative w-[140px] h-[140px]">
                          <NextImage
                            src="/qr2.png"
                            alt="Alternative UPI QR Code"
                            fill
                            className="object-contain rounded-lg"
                          />
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                          Scan to Pay
                        </p>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            UPI ID
                          </p>
                          <div className="relative group">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-sm text-gray-700 break-all pr-10">
                              {upiId2}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(upiId2);
                                const btn = document.getElementById('copy-btn-alt');
                                if (btn) {
                                  btn.innerHTML = '✓';
                                  setTimeout(() => (btn.innerHTML = '📋'), 2000);
                                }
                              }}
                              id="copy-btn-alt"
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all"
                              title="Copy UPI ID"
                            >
                              📋
                            </button>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 leading-relaxed">
                          <p>1. Scan the QR code or copy the UPI ID.</p>
                          <p>
                            2. Pay <strong>₹100</strong> via any UPI app (GPay, PhonePe, Paytm).
                          </p>
                          <p>
                            3. Enter the <strong>Transaction ID (UTR)</strong> and upload a screenshot below.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden text-sm text-gray-600 text-center">
                      <p>Try using the alternative UPI ID below then enter details further down.</p>
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Alternative UPI ID
                        </p>
                        <p className="font-mono text-sm text-gray-700">{upiId2}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="transactionId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Transaction ID (UTR)
                    </label>
                    <input
                      id="transactionId"
                      type="text"
                      name="transactionId"
                      placeholder="e.g. 123456789012"
                      value={formData.transactionId}
                      onChange={handleChange}
                      onBlur={handleTransactionIdBlur}
                      maxLength={12}
                      pattern="\d{12}"
                      inputMode="numeric"
                      required
                      className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.transactionId ? 'border-red-400' : 'border-gray-100'}`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.transactionId.length}/12 digits
                    </p>
                    {fieldErrors.transactionId && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.transactionId}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="screenshot"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Payment Screenshot
                    </label>

                    {!screenshot ? (
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          id="screenshot"
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          required
                          className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 border-dashed transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${errorMessage && errorMessage.includes('File')
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-300 hover:border-primary-400'
                            }`}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-xl shrink-0">
                            🖼️
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {screenshot.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(screenshot.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            setErrorMessage('');
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {errorMessage && errorMessage.includes('File') && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
                      </div>
                    )}

                    {!screenshot && (
                      <p className="mt-2 text-xs text-gray-500">
                        Max size: 5MB. Formats: JPG, PNG.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>

              {/* Error Banner - Below Submit Button */}
              {submitStatus === 'error' && errorMessage && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mt-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 mb-1">Registration Failed</h4>
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSubmitStatus('idle');
                      setErrorMessage('');
                    }}
                    className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
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
