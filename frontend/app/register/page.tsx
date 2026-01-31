'use client';

import { events } from '@/data/events';
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
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
  paymentMode: 'online' | 'cash';
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
  const [showAlternativeQR, setShowAlternativeQR] = useState(false);
  const [showQRMobile, setShowQRMobile] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);

  // Registration status (open/closed)
  const [registrationStatus, setRegistrationStatus] = useState<{
    isOpen: boolean;
    loading: boolean;
  }>({ isOpen: true, loading: true });

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
    paymentMode: 'online',
  });

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submittedPaymentMode, setSubmittedPaymentMode] = useState<'online' | 'cash' | null>(null);

  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);

  // Check if registrations are open
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const res = await fetch(getApiUrl('/settings/registration-status'));
        if (res.ok) {
          const data = await res.json();
          setRegistrationStatus({
            isOpen: data.isOpen,
            loading: false,
          });
        } else {
          // If endpoint fails, assume open (fail-open)
          setRegistrationStatus({ isOpen: true, loading: false });
        }
      } catch {
        // Network error - assume open to not block registrations
        setRegistrationStatus({ isOpen: true, loading: false });
      }
    };
    checkRegistrationStatus();
  }, []);

  // Animation effects removed for performance

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
      'Computer Technology',
      'Artificial Intelligence',
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

  // Handle phone number input - only allow digits, max 10, must start with 6-9
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    // If first digit exists and is 0-5, reject it
    if (value.length > 0 && /^[0-5]/.test(value)) {
      // Show error but allow typing (they might be correcting)
      setFieldErrors((prev) => ({
        ...prev,
        contact: 'Phone number must start with 6, 7, 8, or 9',
      }));
    } else if (fieldErrors.contact) {
      setFieldErrors((prev) => ({ ...prev, contact: undefined }));
    }

    setFormData((prev) => ({ ...prev, contact: value }));
  };

  // Handle transaction ID input - only allow digits
  const handleTransactionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 12 digits
    if (value.length > 12) {
      value = value.slice(0, 12);
    }

    if (fieldErrors.transactionId) {
      setFieldErrors((prev) => ({ ...prev, transactionId: undefined }));
    }

    setFormData((prev) => ({ ...prev, transactionId: value }));
  };

  const handlePaymentModeChange = (mode: 'online' | 'cash') => {
    setFormData((prev) => ({
      ...prev,
      paymentMode: mode,
      transactionId: mode === 'cash' ? '' : prev.transactionId,
    }));
    if (mode === 'cash') {
      setScreenshot(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setErrorMessage('');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Strict Size Check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        const sizeMb = (file.size / 1024 / 1024).toFixed(2);
        setErrorMessage(`File size must be less than 5MB. Current: ${sizeMb} MB`);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
        return;
      }

      setScreenshot(file);
      // Clear any previous file-related errors
      if (errorMessage.includes('File')) setErrorMessage('');
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

    if (formData.paymentMode === 'online') {
      // Validate transaction ID - exactly 12 digits
      if (!formData.transactionId.trim()) {
        errors.transactionId = 'Transaction ID is required';
      } else if (formData.transactionId.length !== 12) {
        errors.transactionId = 'Transaction ID must be exactly 12 digits';
      } else if (!/^\d{12}$/.test(formData.transactionId)) {
        errors.transactionId = 'Transaction ID must contain only digits';
      }
    }

    // Track screenshot error separately (not part of FormData type)
    let screenshotError = '';
    if (formData.paymentMode === 'online' && !screenshot) {
      screenshotError = 'Payment screenshot is required';
    }

    // Check if there are validation errors
    if (Object.keys(errors).length > 0 || screenshotError) {
      setFieldErrors(errors);
      setSubmitStatus('error');
      // Build a descriptive error message listing all issues
      const errorMessages: string[] = [];
      if (errors.name) errorMessages.push(`Name: ${errors.name}`);
      if (errors.email) errorMessages.push(`Email: ${errors.email}`);
      if (errors.contact) errorMessages.push(`Contact: ${errors.contact}`);
      if (errors.college) errorMessages.push(`College: ${errors.college}`);
      if (errors.course) errorMessages.push(`Course: ${errors.course}`);
      if (errors.otherCourse) errorMessages.push(`Course Name: ${errors.otherCourse}`);
      if (errors.branch) errorMessages.push(`Branch: ${errors.branch}`);
      if (errors.otherBranch) errorMessages.push(`Branch Name: ${errors.otherBranch}`);
      if (errors.event) errorMessages.push(`Event: ${errors.event}`);
      if (errors.transactionId) errorMessages.push(`Transaction ID: ${errors.transactionId}`);
      if (screenshotError) errorMessages.push(`Screenshot: ${screenshotError}`);
      setErrorMessage(screenshotError || errorMessages.join(' | '));
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
    data.append('paymentMode', formData.paymentMode);
    if (formData.paymentMode === 'online') {
      data.append('transactionId', sanitizeInput(formData.transactionId));
      if (screenshot) {
        data.append('screenshot', screenshot);
      }
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
        setSubmittedPaymentMode(formData.paymentMode);
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
          paymentMode: 'online',
        });
        setScreenshot(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setSubmitStatus('error');
        // Parse meaningful error messages
        let friendlyMessage = 'Registration failed. Please try again.';

        if (res.status === 413) {
          friendlyMessage =
            'File too large. Please reduce your screenshot size to under 4MB and try again.';
        } else if (res.status === 409) {
          friendlyMessage =
            dataRes.message ||
            dataRes.error ||
            'This email is already registered. Please use a different email.';
        } else if (res.status === 429) {
          friendlyMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (res.status === 400) {
          // Bad request - validation errors from backend
          friendlyMessage = dataRes.message
            ? Array.isArray(dataRes.message)
              ? dataRes.message.join(', ')
              : dataRes.message
            : 'Invalid form data. Please check your inputs.';
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

  // Show loading state while checking registration status
  if (registrationStatus.loading) {
    return (
      <section
        className="min-h-screen pt-28 pb-20 flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 30%, #f0e8ff 100%)',
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  // Show closed message if registrations are closed
  if (!registrationStatus.isOpen) {
    return (
      <section
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
          }}
        />
        <div
          className="fixed bottom-20 right-10 w-96 h-96 rounded-full opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 mb-6 shadow-sm">
              <span className="text-2xl">🚫</span>
              <span className="text-sm font-semibold text-amber-700 uppercase tracking-wider">
                Closed
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-4">
              Registration{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-amber-600">Closed</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-amber-200/60 -rotate-1 -z-0" />
              </span>{' '}
              !
            </h1>

            <p className="text-lg text-gray-600 max-w-lg mx-auto my-2">
              Registrations are currently closed. Please check back later or contact us for more
              information.
            </p>
          </div>

          {/* Closed Info Card */}
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                We&apos;re Not Accepting Registrations
              </h2>
              <p className="text-gray-600 mb-8">
                The registration period has ended. Stay tuned for future events!
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
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
        }}
      />
      <div
        className="fixed bottom-20 right-10 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Badge Removed */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 mb-6 shadow-sm">
            <span className="text-2xl">📢</span>
            <span className="text-sm font-semibold text-primary-700 uppercase tracking-wider">
              Join Now
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-4">
            Register{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary-600">Now</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-primary-200/60 -rotate-1 -z-0" />
            </span>{' '}
            !
          </h1>

          <p className="text-lg text-gray-600 max-w-lg mx-auto my-2">
            Ensure team members register individually ahead of time and meet up on arrival.
          </p>

          <div className="flex flex-col items-center gap-2 mt-5">
            <span className="text-md text-green-500/90 font-medium flex items-center justify-center px-4 py-2 bg-green-50/50 border border-opacity-30 border-green-400 rounded-full shadow-lg shadow-green-500/30 ">
              <span className="h-2.5 w-2.5 bg-green-400 rounded-full inline-block mr-2 animate-pulse"></span>
              Spot Registration Available
            </span>
            <span className="text-sm text-gray-500 font-medium px-3 py-1 ">
              Lunch & Refreshment Included
            </span>
          </div>
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
                {submittedPaymentMode === 'cash'
                  ? 'Registration Confirmed! 🎉'
                  : 'Payment Submitted! 🎉'}
              </h3>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  {submittedPaymentMode === 'cash'
                    ? 'Cash Payment Pending'
                    : 'Verification in Progress'}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                {submittedPaymentMode === 'cash'
                  ? 'We’ve received your registration. Please pay the fee at the event venue to receive your event pass.'
                  : 'We&apos;ve received your registration and payment details. Our team will verify your payment within '}
                {submittedPaymentMode === 'cash' ? null : (
                  <strong className="text-primary-600">8 hours</strong>
                )}
                {submittedPaymentMode === 'cash' ? null : '.'}
              </p>

              {/* What&apos;s Next Card */}
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 mb-8 text-left border border-primary-100">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">📧</span> What happens next?
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>
                      Confirmation email sent to your inbox (if you don&apos;t see it, check Spam or
                      Promotions)
                    </span>
                  </li>
                  {submittedPaymentMode === 'cash' ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">💵</span>
                        <span>Pay the registration fee at the event venue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">🎟️</span>
                        <span>Receive your event pass after payment</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">⏳</span>
                        <span>Payment verification within 8 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">🎟️</span>
                        <span>Event pass with QR code will be emailed after verification</span>
                      </li>
                    </>
                  )}
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
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: Personal Details */}
              <div className="form-section-item bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-30">
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
                      onChange={handlePhoneChange}
                      inputMode="numeric"
                      maxLength={10}
                      required
                      className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.contact ? 'border-red-400' : 'border-gray-100'}`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.contact.length}/10 digits
                    </p>
                    {fieldErrors.contact && (
                      <p className="mt-1 text-sm text-red-500">{fieldErrors.contact}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Academic Details */}
              <div className="form-section-item bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-20">
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
                    <div>
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
                      <div>
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
                    <div>
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
              <div className="form-section-item bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Event Selection</h3>
                </div>

                <div>
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs sm:text-sm text-amber-800">
                    Please check the
                    <a href="/events" className="mx-1 font-semibold underline hover:text-amber-900">
                      Events page
                    </a>
                    before choosing your event.
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Choose an Event
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {eventsList.map((event) => {
                      const eventData =
                        events.find((e) => e.name === event) ||
                        events.find(
                          (e) =>
                            e.name.replace(/\s+/g, '').toLowerCase() ===
                            event.replace(/\s+/g, '').toLowerCase()
                        );

                      return (
                        <div
                          key={event}
                          onClick={() =>
                            handleChange({
                              target: { name: 'event', value: event },
                            } as unknown as React.ChangeEvent<HTMLInputElement>)
                          }
                          className={`relative group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                            formData.event === event
                              ? 'bg-primary-50 border-primary-500 shadow-md transform scale-[1.02]'
                              : 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-medium ${
                                formData.event === event ? 'text-primary-700' : 'text-gray-700'
                              }`}
                            >
                              {event}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                formData.event === event
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
                          {formData.event === event && eventData && (
                            <div className="mt-3 pt-3 border-t border-primary-100/50">
                              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                                {eventData.tagline}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {fieldErrors.event && (
                    <p className="mt-2 text-sm text-red-500">{fieldErrors.event}</p>
                  )}
                </div>
              </div>

              {/* SECTION 4: Payment Details */}
              <div className="form-section-item bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-md relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                    ₹
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Payment Details</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="inline-flex bg-gray-100 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handlePaymentModeChange('online')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                          formData.paymentMode === 'online'
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentModeChange('cash')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                          formData.paymentMode === 'cash'
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Cash
                      </button>
                    </div>
                  </div>

                  {formData.paymentMode === 'cash' && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-sm text-emerald-800 font-medium text-center">
                        You&asop;ve chosen to pay by cash. Please visit the registration desk at the
                        event venue to complete your payment and collect your event pass.
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="text-center text-sm text-primary-800 mb-2 font-medium">
                      Registration Fee: ₹100 per participant
                    </p>

                    {formData.paymentMode === 'online' && (
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        {/* Mobile Payment Section - Inline */}
                        <div className="lg:hidden w-full">
                          <div
                            className={`rounded-2xl border shadow-sm p-5 transition-colors duration-300 ${showAlternativeQR ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}
                          >
                            {/* Toggle between UPI ID and QR */}
                            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                              <button
                                type="button"
                                onClick={() => setShowQRMobile(false)}
                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                                  !showQRMobile
                                    ? 'bg-white text-primary-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                UPI ID
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowQRMobile(true)}
                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                                  showQRMobile
                                    ? 'bg-white text-primary-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                QR Code
                              </button>
                            </div>

                            {/* QR Code View */}
                            {showQRMobile && (
                              <div className="flex flex-col items-center mb-4">
                                <div
                                  className={`relative w-44 h-44 bg-white p-2 rounded-2xl shadow-md border mb-3 ${
                                    showAlternativeQR ? 'border-amber-200' : 'border-gray-200'
                                  }`}
                                >
                                  <NextImage
                                    src={showAlternativeQR ? '/qr2.png' : '/upi_qr.jpeg'}
                                    alt="Scan to Pay"
                                    fill
                                    className="object-contain rounded-xl"
                                  />
                                </div>
                                <div
                                  className={`px-3 py-1.5 rounded-full border ${
                                    showAlternativeQR
                                      ? 'bg-amber-100 border-amber-200'
                                      : 'bg-primary-50 border-primary-100'
                                  }`}
                                >
                                  <p
                                    className={`text-xs font-bold uppercase tracking-widest ${
                                      showAlternativeQR ? 'text-amber-800' : 'text-primary-700'
                                    }`}
                                  >
                                    Scan with any UPI App
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* UPI ID View */}
                            {!showQRMobile && (
                              <div className="mb-4">
                                <p className="text-xs text-gray-500 font-medium mb-2 text-center">
                                  Copy and pay via any UPI app
                                </p>
                                <div className="flex flex-col gap-2">
                                  <code
                                    className={`w-full px-3 py-3 rounded-xl text-xs font-mono border text-center break-all ${
                                      showAlternativeQR
                                        ? 'bg-amber-100 border-amber-200 text-amber-900'
                                        : 'bg-gray-100 border-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {showAlternativeQR ? upiId2 : upiId1}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        showAlternativeQR ? upiId2 : upiId1
                                      );
                                      setCopiedMobile(true);
                                      setTimeout(() => setCopiedMobile(false), 2000);
                                    }}
                                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                      copiedMobile
                                        ? 'bg-green-500 text-white'
                                        : showAlternativeQR
                                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                                          : 'bg-primary-600 text-white hover:bg-primary-700'
                                    }`}
                                  >
                                    {copiedMobile ? 'Copied!' : 'Copy UPI ID'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Alternative UPI Toggle */}
                            <button
                              type="button"
                              onClick={() => setShowAlternativeQR(!showAlternativeQR)}
                              className={`w-full p-3 rounded-xl transition-all active:scale-95 ${
                                showAlternativeQR
                                  ? 'bg-amber-100 hover:bg-amber-200 border-2 border-amber-300'
                                  : 'bg-orange-50 hover:bg-orange-100 border-2 border-orange-200'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <p
                                  className={`text-sm font-bold ${
                                    showAlternativeQR ? 'text-amber-900' : 'text-orange-900'
                                  }`}
                                >
                                  {showAlternativeQR
                                    ? 'Back to Primary UPI'
                                    : 'Payment Failing? Try Alternative'}
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Desktop QR - Clean Centered Layout */}
                        <div className="hidden lg:block w-full">
                          <div
                            className={`rounded-2xl border shadow-sm p-8 transition-colors duration-300 ${showAlternativeQR ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}
                          >
                            {/* Main Content - Two Column on XL */}
                            <div className="flex flex-col gap-8 ">
                              {/* QR Code Section */}
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div
                                  className={`relative w-48 h-48 bg-white p-3 rounded-2xl shadow-md border mb-4 transition-transform hover:scale-105 ${showAlternativeQR ? 'border-amber-200' : 'border-gray-200'}`}
                                >
                                  <NextImage
                                    src={showAlternativeQR ? '/qr2.png' : '/upi_qr.jpeg'}
                                    alt="Scan to Pay"
                                    fill
                                    className="object-contain rounded-xl"
                                  />
                                </div>
                                <div
                                  className={`px-4 py-2 rounded-full border ${showAlternativeQR ? 'bg-amber-100 border-amber-200' : 'bg-primary-50 border-primary-100'}`}
                                >
                                  <p
                                    className={`text-xs font-bold uppercase tracking-widest ${showAlternativeQR ? 'text-amber-800' : 'text-primary-700'}`}
                                  >
                                    Scan with any UPI App
                                  </p>
                                </div>
                              </div>

                              {/* Instructions Section */}
                              <div className="flex-1 w-full max-w-lg">
                                {/* UPI ID - Full Width */}
                                <div className="mb-6">
                                  <div className="flex items-center gap-3">
                                    <code
                                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-mono border ${showAlternativeQR ? 'bg-amber-100 border-amber-200 text-amber-900' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
                                    >
                                      {showAlternativeQR ? upiId2 : upiId1}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          showAlternativeQR ? upiId2 : upiId1
                                        );
                                        const btn = document.getElementById('copy-btn-desktop');
                                        if (btn) {
                                          const originalHTML = btn.innerHTML;
                                          btn.innerHTML =
                                            '<span class="text-green-600 font-bold">✓ Copied</span>';
                                          setTimeout(() => (btn.innerHTML = originalHTML), 2000);
                                        }
                                      }}
                                      id="copy-btn-desktop"
                                      className={`px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap ${
                                        showAlternativeQR
                                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                                          : 'bg-primary-600 text-white hover:bg-primary-700'
                                      }`}
                                    >
                                      Copy ID
                                    </button>
                                  </div>
                                </div>

                                {/* Toggle Button - Made More Prominent */}
                                <button
                                  type="button"
                                  onClick={() => setShowAlternativeQR(!showAlternativeQR)}
                                  className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                                    showAlternativeQR
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'
                                  }`}
                                >
                                  {showAlternativeQR
                                    ? 'Back to Primary UPI'
                                    : 'Payment Failing? Try Alternative'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.paymentMode === 'online' && (
                    <div className="grid grid-cols-1 gap-6">
                      {/* Transaction ID */}
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <label
                          htmlFor="transactionId"
                          className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
                        >
                          Transaction ID (UTR)
                        </label>
                        <input
                          id="transactionId"
                          type="text"
                          name="transactionId"
                          placeholder="e.g. 123456789012"
                          value={formData.transactionId}
                          onChange={handleTransactionIdChange}
                          maxLength={12}
                          pattern="\d{12}"
                          inputMode="numeric"
                          required
                          className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/10 focus:outline-none ${fieldErrors.transactionId ? 'border-red-400' : 'border-gray-200'}`}
                        />
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {formData.transactionId.length}/12 digits
                          </p>
                          {fieldErrors.transactionId && (
                            <p className="text-xs text-red-500">{fieldErrors.transactionId}</p>
                          )}
                        </div>
                      </div>

                      {/* Screenshot */}
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <label
                          htmlFor="screenshot"
                          className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
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
                              className={`w-full p-4 rounded-xl text-gray-800 bg-white border-2 border-dashed transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${
                                errorMessage && errorMessage.includes('File')
                                  ? 'border-red-400 bg-red-50'
                                  : 'border-gray-300 hover:border-primary-400'
                              }`}
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Max size: 5MB (any resolution). Formats: JPG, PNG.
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-white border border-primary-200 rounded-xl">
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
                          <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">⚠️</span>
                            <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="register-submit w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              {submitStatus === 'error' &&
                (errorMessage || Object.keys(fieldErrors).length > 0) && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mt-4">
                    <div className="flex items-start gap-3 mb-3">
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
                        <h4 className="font-semibold text-red-800 mb-1">
                          {Object.keys(fieldErrors).length > 0
                            ? 'Please complete the required fields'
                            : 'Registration Failed'}
                        </h4>
                        {/* Show field-specific errors as a list */}
                        {Object.keys(fieldErrors).length > 0 ? (
                          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                            {fieldErrors.name && <li>{fieldErrors.name}</li>}
                            {fieldErrors.email && <li>{fieldErrors.email}</li>}
                            {fieldErrors.contact && <li>{fieldErrors.contact}</li>}
                            {fieldErrors.college && <li>{fieldErrors.college}</li>}
                            {fieldErrors.course && <li>{fieldErrors.course}</li>}
                            {fieldErrors.otherCourse && <li>{fieldErrors.otherCourse}</li>}
                            {fieldErrors.branch && <li>{fieldErrors.branch}</li>}
                            {fieldErrors.otherBranch && <li>{fieldErrors.otherBranch}</li>}
                            {fieldErrors.event && <li>{fieldErrors.event}</li>}
                            {fieldErrors.transactionId && <li>{fieldErrors.transactionId}</li>}
                            {errorMessage && errorMessage.includes('screenshot') && (
                              <li>{errorMessage}</li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-red-700">{errorMessage}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSubmitStatus('idle');
                          setErrorMessage('');
                          setFieldErrors({});
                        }}
                        className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
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
