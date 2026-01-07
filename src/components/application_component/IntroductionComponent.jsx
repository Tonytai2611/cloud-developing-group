import React from "react";

const Feature = ({ title, desc }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border">
    <h4 className="font-semibold text-lg text-[#0F4C4C]">{title}</h4>
    <p className="text-sm text-gray-600 mt-2">{desc}</p>
  </div>
);

const IntroductionComponent = () => {
  return (
    <section className="py-16">
      <div className="container flex flex-col lg:flex-row items-start gap-12">
        <div className="lg:w-1/2">
          <h2 className="text-3xl md:text-4xl font-serif text-[#0F4C4C] mb-4">Who Are We?</h2>
          <p className="text-gray-700 mb-6">The mission is to deliver artisan coffee with approachable prices — sourced responsibly and brewed carefully.</p>

          <h3 className="text-2xl font-semibold text-black mb-4">What makes us unique?</h3>
          <p className="text-gray-700 mb-6">Our menu is crafted by experienced baristas and chefs. We rotate single-origin beans and offer seasonal pairings to highlight flavors.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Feature title="Single-origin" desc="Beans sourced from trusted farms." />
            <Feature title="Careful Roast" desc="Small-batch roasts for clarity." />
            <Feature title="Slow Serve" desc="Mindful brewing; better aroma." />
          </div>
        </div>

        <div className="lg:w-1/2 flex justify-center lg:justify-end">
          <div className="w-[420px] bg-gradient-to-b from-white to-[#FBF8F3] rounded-2xl p-6 shadow-lg border">
            <img src={'/cafe.jpg'} alt={'Cafe'} className="w-full h-64 object-cover rounded-lg mb-4" />
            <div className="p-3 bg-[#0F4C4C] text-white rounded-lg">
              <h4 className="font-semibold">Seasonal Special</h4>
              <p className="text-sm text-white/90">Ethiopian pour-over — floral, bright, balanced.</p>
              <div className="mt-3 flex gap-2">
                <span className="px-3 py-1 bg-white text-[#0F4C4C] rounded-full text-xs">Pour-over</span>
                <span className="px-3 py-1 bg-white text-[#0F4C4C] rounded-full text-xs">Single-origin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroductionComponent;
