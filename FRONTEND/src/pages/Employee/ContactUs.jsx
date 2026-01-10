import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../../url/base";
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCity,
  FaRegEdit,
} from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { IoChevronDown } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContactForm = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [otherSubject, setOtherSubject] = useState("");

  const [formData, setFormData] = useState({
    from_name: "",
    city: "",
    phone_number: "",
    from_email: "",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const dropdownRef = useRef(null);

  const subjectOptions = ["Complaint", "Suggestion", "Business Query", "Others"];

  const filteredOptions = subjectOptions.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (value) => {
    setFormData(prev => ({ ...prev, subject: value }));
    setDropdownOpen(false);
    setSearchTerm("");
    if (value !== "Others") {
      setOtherSubject("");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* Close dropdown when click outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Auto-hide status messages */
  useEffect(() => {
    if (submitStatus === "success" || submitStatus === "error") {
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const finalSubject = formData.subject === "Others" ? otherSubject : formData.subject;

    // Frontend validation
    if (
      !formData.from_name ||
      !formData.city ||
      !formData.phone_number ||
      !formData.from_email ||
      !finalSubject ||
      !formData.message
    ) {
      toast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.phone_number.replace(/\s/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      setIsSubmitting(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.from_email)) {
      toast.error("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      // Replace with your actual backend URL
      const res = await fetch(`${API_URL}/contact/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.from_name,
          city: formData.city,
          phone: formData.phone_number,
          email: formData.from_email,
          subject: finalSubject,
          message: formData.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send message");
        setSubmitStatus("error");
        setIsSubmitting(false);
        return;
      }

      // Success
      toast.success("Message sent successfully!");
      setSubmitStatus("success");

      // Reset form
      setFormData({
        from_name: "",
        city: "",
        phone_number: "",
        from_email: "",
        subject: "",
        message: "",
      });
      setOtherSubject("");

    } catch (err) {
      console.error("CONTACT API ERROR:", err);
      toast.error("Something went wrong. Try again later.");
      setSubmitStatus("error");
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <section className="min-h-screen bg-[#171717] pt-6 pb-16">
        <h2 className="text-3xl font-bold mb-8 text-[#E4002B] ml-3">Need Help?</h2>
        <div className="mx-auto space-y-10">

          {/* INFO SECTION */}
          <div className="bg-[#E4002B] text-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold mb-6">INFO</h3>

            <div className="space-y-5 text-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <FiMail size={16} />
                </div>
                <p className="font-semibold">manager@conceptpromotions.in</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <FiPhone size={16} />
                </div>
                <p className="font-semibold">+91 9718779049</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <FiMapPin size={16} />
                </div>
                <p className="font-semibold">
                  Communication Address: 40-41, WC-5,<br /> Bakshi House, Nehru Place,  <br /> New Delhi - 110019
                </p>
              </div>
            </div>
          </div>

          {/* CONTACT FORM SECTION */}
          <div className="p-8 rounded-xl shadow-md border bg-[#EDEDED]">
            <h2 className="text-3xl font-bold mb-2">
              Get in <span className="text-[#E4002B]">Touch</span>
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              We'd love to hear from you!
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name + City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs mb-1 font-semibold text-gray-700">
                    Full Name <span className="text-[#E4002B]">*</span>
                  </label>
                  <div className="relative">
                    <FaUser
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="from_name"
                      value={formData.from_name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-400 
                               focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1 font-semibold text-gray-700">
                    City <span className="text-[#E4002B]">*</span>
                  </label>
                  <div className="relative">
                    <FaCity
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-400 
                               focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs mb-1 font-semibold text-gray-700">
                  Phone Number <span className="text-[#E4002B]">*</span>
                </label>
                <div className="relative">
                  <FaPhoneAlt
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-400 
                             focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs mb-1 font-semibold text-gray-700">
                  Email Address <span className="text-[#E4002B]">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    name="from_email"
                    value={formData.from_email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-400 
                             focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                    required
                  />
                </div>
              </div>

              {/* Subject Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs mb-1 font-semibold text-gray-700">
                  Subject <span className="text-[#E4002B]">*</span>
                </label>

                <div
                  className="relative cursor-pointer"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <FaRegEdit
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Select or search subject"
                    value={dropdownOpen ? searchTerm : formData.subject}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    readOnly={!dropdownOpen}
                    className="w-full pl-9 pr-8 py-2 rounded-md border border-gray-400 
                             focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                    required
                  />
                  <IoChevronDown
                    size={16}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </div>

                {dropdownOpen && (
                  <div className="absolute z-20 w-full bg-[#EDEDED] border border-gray-400 
                                rounded-md mt-1 max-h-40 overflow-y-auto shadow-md">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((option, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelect(option)}
                          className="px-3 py-2 text-sm hover:bg-[#E4002B] hover:text-white cursor-pointer"
                        >
                          {option}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-400 text-sm">
                        No match found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Other Subject Input */}
              {formData.subject === "Others" && (
                <div>
                  <label className="block text-xs mb-1 font-semibold text-gray-700">
                    Please Specify <span className="text-[#E4002B]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your subject"
                    value={otherSubject}
                    onChange={(e) => setOtherSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-400 
                             focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                    required
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-xs mb-1 font-semibold text-gray-700">
                  Message <span className="text-[#E4002B]">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Write your message..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-md border border-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition resize-none text-sm"
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-semibold py-2 rounded-md transition text-sm ${isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#E4002B] hover:bg-[#C00026]"
                  } text-white`}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="text-green-600 text-sm text-center font-semibold">
                  ✓ Message sent successfully!
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="text-red-600 text-sm text-center font-semibold">
                  ✗ Failed to send. Please try again.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactForm;