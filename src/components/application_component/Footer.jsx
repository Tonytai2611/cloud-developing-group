'use client';
import React from 'react';

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

  return (
    <footer className="bg-gradient-to-r from-[#0F4C4C] to-[#0F6F5F] text-white py-10">
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-[#E6D8C3]">{cafeInfo.name}</h2>
          <p className="text-sm text-white/80">{cafeInfo.address}</p>
        </div>

        <div>
          <h3 className="text-md font-medium mb-1">Contact</h3>
          <p className="text-sm text-white/80">Phone: {cafeInfo.phone}</p>
          <p className="text-sm text-white/80">Email: {cafeInfo.email}</p>
        </div>

        <div>
          <h3 className="text-md font-medium mb-1 text-[#E6D8C3]">Opening Hours</h3>
          <ul className="text-sm text-white/80 space-y-1">
            <li>Monday - Friday: {cafeInfo.hours.mondayToFriday}</li>
            <li>Saturday: {cafeInfo.hours.saturday}</li>
            <li>Sunday: {cafeInfo.hours.sunday}</li>
          </ul>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-white/60">© {new Date().getFullYear()} {cafeInfo.name}. All rights reserved.</div>
    </footer>
  );
};

export default Footer;
