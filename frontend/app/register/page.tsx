'use client';
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
        className="
          w-full text-left p-2.5 border rounded-lg text-[15px] text-neutral-800 bg-white
          border-neutral-300 transition-all duration-300
          hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50
          focus:outline-none
        "
      >
        {selected || placeholder || `Select ${label}`}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-violet-200/40 rounded-2xl shadow-lg flex flex-col z-10 max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              className="px-4 py-2 text-neutral-800 hover:bg-violet-50 transition-colors text-left font-medium"
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
  const [buttonMessage, setButtonMessage] = useState('Register');

  const eventsList = [
    'BuildAThon',
    'Bug Smash',
    'Paper Presentation',
    'Ctrl+ Quiz',
    'Code Hunt: Word Edition',
    'Think & Link',
    'Gaming',
  ];

  const courses = {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === 'course') {
      setFormData((prev) => ({
        ...prev,
        branch: '',
        otherCourse: e.target.value === 'Others' ? '' : prev.otherCourse,
        otherBranch: '',
      }));
    }

    if (e.target.name === 'branch' && e.target.value !== 'Others') {
      setFormData((prev) => ({ ...prev, otherBranch: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setButtonMessage('Submitting...');

    if (!/^\d{10,}$/.test(formData.contact)) {
      setButtonMessage('Invalid Contact Number');
      setLoading(false);
      return;
    }

    const submittedData = {
      name: formData.name,
      email: formData.email,
      course: formData.course === 'Others' ? formData.otherCourse : formData.course,
      branch: formData.branch === 'Others' ? formData.otherBranch : formData.branch,
      college: formData.college,
      contact: formData.contact,
      event: formData.event,
    };

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submittedData),
      });

      const data = await res.json();

      if (res.ok) {
        setButtonMessage('Registered Successfully');
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
        setButtonMessage(data.error);
      }
    } catch (error) {
      setButtonMessage('Failed to submit. Try again.');
    }

    setLoading(false);
  };

  return (
    <section
      className="mt-10 flex justify-center items-center min-h-screen px-4
      bg-white bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.03),transparent_40%)]"
    >
      <div className="bg-white/70 backdrop-blur-xl p-11 rounded-2xl border border-violet-200/40  shadow-[0_20px_40px_rgba(124,58,237,0.25)] max-w-[500px] w-full animate-[fadeUp_0.8s_ease-out]">
        <h2 className="text-[32px] font-bold text-neutral-900 flex justify-center mb-[20px] tracking-tight">
          Event Registration
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
          <input
            className="p-2.5 border rounded-lg text-[15px] text-neutral-800 bg-white border-neutral-300 transition-all duration-300 placeholder:text-neutral-400 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            className="p-2.5 border rounded-lg text-[15px] text-neutral-800 bg-white border-neutral-300 transition-all duration-300 placeholder:text-neutral-400 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
            type="email"
            name="email"
            placeholder="Email ID"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* --- Course Dropdown --- */}
          <CustomDropdown
            label="Course"
            options={Object.keys(courses)}
            selected={formData.course}
            setSelected={(value) => setFormData((prev) => ({ ...prev, course: value }))}
            placeholder="Select Course"
          />

          {formData.course === 'Others' && (
            <input
              className="p-2.5 border rounded-lg text-[15px] text-neutral-800 bg-white border-neutral-300 transition-all duration-300 placeholder:text-neutral-400 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
              type="text"
              name="otherCourse"
              placeholder="Enter Course"
              value={formData.otherCourse}
              onChange={handleChange}
              required
            />
          )}

          {/* --- Branch Dropdown --- */}
          {formData.course !== 'Others' && (
            <CustomDropdown
              label="Branch"
              options={courses[formData.course as keyof typeof courses] || []}
              selected={formData.branch}
              setSelected={(value) => setFormData((prev) => ({ ...prev, branch: value }))}
              placeholder="Select Branch"
            />
          )}

          {(formData.course === 'Others' || formData.branch === 'Others') && (
            <input
              className="p-2.5 border rounded-lg text-[15px] text-neutral-800 bg-white border-neutral-300 transition-all duration-300 placeholder:text-neutral-400 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
              type="text"
              name="otherBranch"
              placeholder="Enter Branch"
              value={formData.otherBranch}
              onChange={handleChange}
              required
            />
          )}

          <input
            className="p-2.5 border rounded-lg text-[15px] text-neutral-800 bg-white border-neutral-300 transition-all duration-300 placeholder:text-neutral-400 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
            type="text"
            name="college"
            placeholder="College Name"
            value={formData.college}
            onChange={handleChange}
            required
          />

          <input
            className="p-2.5 border rounded-lg text-[15px] text-neutral-800 bg-white border-neutral-300 transition-all duration-300 placeholder:text-neutral-400 hover:border-violet-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-200/50 focus:outline-none"
            type="tel"
            name="contact"
            placeholder="Contact Number"
            value={formData.contact}
            onChange={handleChange}
            required
          />

          {/* --- Event Dropdown --- */}
          <CustomDropdown
            label="Event"
            options={eventsList}
            selected={formData.event}
            setSelected={(value) => setFormData((prev) => ({ ...prev, event: value }))}
            placeholder="Select Event"
          />

          <button
            type="submit"
            disabled={loading}
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
            {buttonMessage}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Register;
