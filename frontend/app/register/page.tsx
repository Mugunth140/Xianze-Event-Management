'use client';
import { useState } from 'react';
// import {motion} from "motion/react"
// import "../../sass/pages/register.scss";

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

  type CourseType = keyof typeof courses;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
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
      setFormData((prev) => ({
        ...prev,
        otherBranch: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    //console.log(formData)
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submittedData),
      });

      const data = await res.json();

      if (res.ok) {
        setButtonMessage("Registered Successfully");
        setFormData({
          name: "",
          email: "",
          course: "",
          branch: "",
          college: "",
          contact: "",
          event: "",
          otherCourse: "",
          otherBranch: "",
        });
      } else {
        setButtonMessage(data.error);
      }
    } catch (error) {
      setButtonMessage("Failed to submit. Try again.");
    }

    console.log('Submitted Data:', submittedData);

    setLoading(false);
  };

  // return (
  //   <section
  //     className="registerSection flex justify-center items-center 
  //       min-h-screen "
  //   >
  //     <div
  //       className="registerContainer  bg-transparent 
  //     backdrop-blur-[15px] p-11 rounded-lg shadow-lg max-w-[500px] w-full"
  //     >
  //       <h2 className="text-[32px] font-semibold flex justify-center mb-[20px]  ">
  //         Event Registration
  //       </h2>
  //       <form onSubmit={handleSubmit} className=" flex flex-col gap-[16px]">
  //         <input
  //           className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //           type="text"
  //           name="name"
  //           placeholder="Full Name"
  //           value={formData.name}
  //           onChange={handleChange}
  //           required
  //         />
  //         <input
  //           className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //           type="email"
  //           name="email"
  //           placeholder="Email ID"
  //           value={formData.email}
  //           onChange={handleChange}
  //           required
  //         />

  //         <select
  //           className=" p-2  border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear relative scrollbar-hide"
  //           name="course"
  //           value={formData.course}
  //           onChange={handleChange}
  //           required
  //         >
  //           <option value="" className="absolute scrollbar-hide ">
  //             Select Course
  //           </option>
  //           {Object.keys(courses).map((course, index) => (
  //             <option key={index} value={course}>
  //               {course}
  //             </option>
  //           ))}
  //         </select>

  //         {formData.course === 'Others' && (
  //           <input
  //             className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //             type="text"
  //             name="otherCourse"
  //             placeholder="Enter Course"
  //             value={formData.otherCourse}
  //             onChange={handleChange}
  //             required
  //           />
  //         )}

  //         <select
  //           className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //           name="branch"
  //           value={formData.branch}
  //           onChange={handleChange}
  //           required
  //         >
  //           <option value="">Select Branch</option>
  //           {formData.course &&
  //             (courses as Record<string, string[]>)[formData.course]?.map(
  //               (branch: string, index: number) => (
  //                 <option key={index} value={branch}>
  //                   {branch}
  //                 </option>
  //               ),
  //             )}
  //         </select>

  //         {formData.branch === 'Others' && (
  //           <input
  //             className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //             type="text"
  //             name="otherBranch"
  //             placeholder="Enter Branch"
  //             value={formData.otherBranch}
  //             onChange={handleChange}
  //             required
  //           />
  //         )}

  //         <input
  //           className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //           type="text"
  //           name="college"
  //           placeholder="College Name"
  //           value={formData.college}
  //           onChange={handleChange}
  //           required
  //         />
  //         <input
  //           className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //           type="tel"
  //           name="contact"
  //           placeholder="Contact Number"
  //           value={formData.contact}
  //           onChange={handleChange}
  //           required
  //         />

  //         <select
  //           className=" p-2 border-2 rounded-lg text-[16px]
  //          text-neutral-800 transition duration-300 ease-linear"
  //           name="event"
  //           value={formData.event}
  //           onChange={handleChange}
  //           required
  //         >
  //           <option value="">Select an Event</option>
  //           {eventsList.map((event, index) => (
  //             <option key={index} value={event}>
  //               {event}
  //             </option>
  //           ))}
  //         </select>

  //         <button
  //           type="submit"
  //           disabled={loading}
  //           className="registerButton px-4 py-3 bg-neutral-800 text-white 
  //           rounded-lg text-base font-semibold font-sans cursor-pointer
  //           transition-colors duration-500 ease-in-out
  //           hover:bg-blue-800 hover:text-secondary
  //           disabled:bg-base disabled:cursor-not-allowed"
  //         >
  //           {buttonMessage}
  //         </button>
  //       </form>
  //     </div>
  //   </section>
  // );


return (
  <section
    className=" mt-10
      flex justify-center items-center min-h-screen px-4
      bg-white
      bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.08),transparent_40%)]
    "
  >
    <div
      className="
        bg-white/70 backdrop-blur-xl
        p-11 rounded-2xl
        border border-violet-200/40
        shadow-[0_20px_40px_rgba(124,58,237,0.25)]
        max-w-[500px] w-full
        animate-[fadeUp_0.8s_ease-out]
      "
    >
      <h2
        className="
          text-[32px] font-bold text-neutral-900
          flex justify-center mb-[20px]
          tracking-tight
        "
      >
        Event Registration
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
        <input
          className="
            p-2.5 border rounded-lg text-[15px]
            text-neutral-800 bg-white
            border-neutral-300
            transition-all duration-300
            placeholder:text-neutral-400
            hover:border-violet-400
            focus:border-violet-600
            focus:ring-4 focus:ring-violet-200/50
            focus:outline-none
          "
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          className="
            p-2.5 border rounded-lg text-[15px]
            text-neutral-800 bg-white
            border-neutral-300
            transition-all duration-300
            placeholder:text-neutral-400
            hover:border-violet-400
            focus:border-violet-600
            focus:ring-4 focus:ring-violet-200/50
            focus:outline-none
          "
          type="email"
          name="email"
          placeholder="Email ID"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <select
          className="
            p-2.5 border rounded-lg text-[15px]
            text-neutral-800 bg-white
            border-neutral-300
            transition-all duration-300
            hover:border-violet-400
            focus:border-violet-600
            focus:ring-4 focus:ring-violet-200/50
            focus:outline-none
          "
          name="course"
          value={formData.course}
          onChange={handleChange}
          required
        >
          <option value="">Select Course</option>
          {Object.keys(courses).map((course, index) => (
            <option key={index} value={course}>
              {course}
            </option>
          ))}
        </select>

        {formData.course === "Others" && (
          <input
            className="
              p-2.5 border rounded-lg text-[15px]
              text-neutral-800 bg-white
              border-neutral-300
              transition-all duration-300
              placeholder:text-neutral-400
              hover:border-violet-400
              focus:border-violet-600
              focus:ring-4 focus:ring-violet-200/50
              focus:outline-none
            "
            type="text"
            name="otherCourse"
            placeholder="Enter Course"
            value={formData.otherCourse}
            onChange={handleChange}
            required
          />
        )}
        { formData.course !== "Others"&&
        <select
          className="
            p-2.5 border rounded-lg text-[15px]
            text-neutral-800 bg-white
            border-neutral-300
            transition-all duration-300
            hover:border-violet-400
            focus:border-violet-600
            focus:ring-4 focus:ring-violet-200/50
            focus:outline-none
          "
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          required
        >
          <option value="">Select Branch</option>
          {formData.course &&
            (courses as Record<string, string[]>)[formData.course]?.map(
              (branch: string, index: number) => (
                <option key={index} value={branch}>
                  {branch}
                </option>
              )
            )}
        </select>
          }
        {(formData.course=== "Others" || formData.branch=== "Others")  && (
          <input
            className="
              p-2.5 border rounded-lg text-[15px]
              text-neutral-800 bg-white
              border-neutral-300
              transition-all duration-300
              placeholder:text-neutral-400
              hover:border-violet-400
              focus:border-violet-600
              focus:ring-4 focus:ring-violet-200/50
              focus:outline-none
            "
            type="text"
            name="otherBranch"
            placeholder="Enter Branch"
            value={formData.otherBranch}
            onChange={handleChange}
            required
          />
        )}

        <input
          className="
            p-2.5 border rounded-lg text-[15px]
            text-neutral-800 bg-white
            border-neutral-300
            transition-all duration-300
            placeholder:text-neutral-400
            hover:border-violet-400
            focus:border-violet-600
            focus:ring-4 focus:ring-violet-200/50
            focus:outline-none
          "
          type="text"
          name="college"
          placeholder="College Name"
          value={formData.college}
          onChange={handleChange}
          required
        />

        <input
          className="
            p-2.5 border rounded-lg text-[15px]
            text-neutral-800 bg-white
            border-neutral-300
            transition-all duration-300
            placeholder:text-neutral-400
            hover:border-violet-400
            focus:border-violet-600
            focus:ring-4 focus:ring-violet-200/50
            focus:outline-none
          "
          type="tel"
          name="contact"
          placeholder="Contact Number"
          value={formData.contact}
          onChange={handleChange}
          required
        />

        <select
          className="
            p-2.5 border rounded-lg text-[15px]
            text-neutral-800 bg-white
            border-neutral-300
            transition-all duration-300
            hover:border-violet-400
            focus:border-violet-600
            focus:ring-4 focus:ring-violet-200/50
            focus:outline-none
          "
          name="event"
          value={formData.event}
          onChange={handleChange}
          required
        >
          <option value="">Select an Event</option>
          {eventsList.map((event, index) => (
            <option key={index} value={event}>
              {event}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="
            mt-2 px-4 py-3 rounded-lg
            text-base font-semibold text-white
            bg-gradient-to-r from-violet-600 to-violet-700
            shadow-[0_12px_25px_rgba(124,58,237,0.45)]
            transition-all duration-300
            hover:translate-y-[-2px]
            hover:shadow-[0_18px_35px_rgba(124,58,237,0.55)]
            active:translate-y-0
            disabled:opacity-60 disabled:cursor-not-allowed
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
