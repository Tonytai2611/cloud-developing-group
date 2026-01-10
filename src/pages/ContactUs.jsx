import React, { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = 'https://hn030bsgek.execute-api.us-east-1.amazonaws.com';
      const response = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send message');
      }

      toast.success("Message sent successfully!", {
        description: "We'll get back to you soon"
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (err) {
      toast.error("Failed to send message", {
        description: err.message || 'An error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'contact@brewcraft.com',
      href: 'mailto:contact@brewcraft.com'
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+1 (555) 123-4567',
      href: 'tel:+15551234567'
    },
    {
      icon: MapPin,
      label: 'Address',
      value: '123 Coffee Street, Brew City',
      href: null
    },
    {
      icon: Clock,
      label: 'Hours',
      value: 'Mon-Sun, 7am-10pm',
      href: null
    }
  ];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-[#0F4C4C]/10 text-[#0F4C4C] rounded-full text-sm font-medium mb-4">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F4C4C] mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Have questions or want to make a reservation? We'd love to hear from you. 
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-0">
            {/* Left Side - Contact Info */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] p-8 lg:p-12 text-white">
              {/* Logo/Avatar */}
              <div className="mb-8">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3127/3127393.png" 
                    alt="BrewCraft Logo" 
                    className="w-12 h-12"
                  />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold mb-3">BrewCraft</h2>
              <p className="text-white/70 mb-10 leading-relaxed">
                Your favorite coffee destination. We're here to serve you the best brews and create memorable experiences.
              </p>

              {/* Contact Details */}
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                      <item.icon className="w-5 h-5 text-[#FF9F1C]" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a 
                          href={item.href} 
                          className="text-white hover:text-[#FF9F1C] transition-colors font-medium"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-white font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-white/60 text-sm mb-4">Follow us on social media</p>
                <div className="flex gap-3">
                  {['facebook', 'instagram', 'twitter'].map((social) => (
                    <a
                      key={social}
                      href={`#${social}`}
                      className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-[#FF9F1C] transition-all duration-300 hover:scale-110"
                    >
                      <span className="text-white text-sm capitalize">{social[0].toUpperCase()}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:col-span-3 p-8 lg:p-12 bg-[#e8f5f5]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#0F4C4C]/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#0F4C4C]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Send us a message</h3>
                  <p className="text-gray-500 text-sm">We'll get back to you within 24 hours</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F4C4C] focus:border-transparent transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F4C4C] focus:border-transparent transition-all outline-none"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F4C4C] focus:border-transparent transition-all outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F4C4C] focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#14B8A6] text-white font-semibold py-4 rounded-xl hover:bg-[#0D9488] transition-all duration-300 shadow-lg shadow-[#14B8A6]/25 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Additional Info */}
              <p className="text-center text-gray-400 text-sm mt-6">
                By submitting this form, you agree to our{' '}
                <a href="#" className="text-[#0F4C4C] hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Map placeholder or additional info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            Prefer to visit us in person? Find us at{' '}
            <span className="text-[#0F4C4C] font-medium">123 Coffee Street, Brew City</span>
          </p>
        </div>
      </div>
    </div>
  );
}
