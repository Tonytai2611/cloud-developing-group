'use client';
import React from 'react';
import { MapPin, Phone, Mail, Clock, UtensilsCrossed, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  const cafeInfo = {
    name: 'BrewCraft',
    address: '123 Main Street, Springfield',
    phone: '123-456-7890',
    email: 'contact@goldenspooncafe.com',
    hours: {
      mondayToFriday: '8:00 AM - 10:00 PM',
      saturday: '9:00 AM - 11:00 PM',
      sunday: '9:00 AM - 8:00 PM',
    },
  };

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/menu' },
    { name: 'Booking', href: '/booking' },
    { name: 'Contact Us', href: '/contact-us' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#' },
    { icon: Instagram, href: '#' },
    { icon: Twitter, href: '#' },
    { icon: Youtube, href: '#' },
  ];

  return (
    <footer className="bg-[#0a3636]">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{cafeInfo.name}</h2>
            </div>
            <p className="text-white/70 mb-6 leading-relaxed">
              Experience the perfect blend of exquisite cuisine and artisan beverages — 
              fresh ingredients, passionate cooking, and a warm atmosphere.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-teal-500 transition-colors"
                >
                  <social.icon className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative">
              Quick Links
              <span className="absolute bottom-0 left-0 w-10 h-0.5 bg-teal-500 -mb-2" />
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-teal-400 transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative">
              Contact Info
              <span className="absolute bottom-0 left-0 w-10 h-0.5 bg-teal-500 -mb-2" />
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/70">{cafeInfo.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <a href={`tel:${cafeInfo.phone}`} className="text-white/70 hover:text-teal-400 transition-colors">
                  {cafeInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <a href={`mailto:${cafeInfo.email}`} className="text-white/70 hover:text-teal-400 transition-colors">
                  {cafeInfo.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative">
              Opening Hours
              <span className="absolute bottom-0 left-0 w-10 h-0.5 bg-teal-500 -mb-2" />
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/70">
                <Clock className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Mon - Fri</p>
                  <p>{cafeInfo.hours.mondayToFriday}</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <Clock className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Saturday</p>
                  <p>{cafeInfo.hours.saturday}</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <Clock className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Sunday</p>
                  <p>{cafeInfo.hours.sunday}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} {cafeInfo.name}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-white/50">
              <a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
