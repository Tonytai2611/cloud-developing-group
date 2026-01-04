import React from "react";

const Hero = () => {
  return (
    <section
      className="w-full"
      style={{ background: 'linear-gradient(180deg, var(--bg) 0%, #f7f5f2 100%)' }}
    >
      <div className="container py-20 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#0F4C4C] leading-tight font-serif">BrewCraft</h1>
          <p className="mt-4 text-lg text-gray-700 max-w-xl">
            Artisan coffee, thoughtfully brewed — single-origin beans, careful roasting, and a calm place to slow down.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/menu"
              className="inline-block px-6 py-3 rounded-lg font-medium shadow-sm"
              style={{ background: 'var(--accent-amber)', color: '#081018' }}
            >
              Order Now
            </a>
            <a
              href="/booking"
              className="inline-block px-6 py-3 rounded-lg border border-[#0F4C4C] font-medium text-[#0F4C4C] bg-white"
            >
              Reserve a Table
            </a>
          </div>
        </div>

        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="w-72 h-72 rounded-2xl shadow-lg bg-white flex items-center justify-center p-8">
            <img src="/brewcraft.png" alt="BrewCraft Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
