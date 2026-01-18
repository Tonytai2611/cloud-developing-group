import React from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, ChevronDown } from "lucide-react";

const Hero = () => {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight - 80, behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920"
          alt="Restaurant background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Logo Badge - Center Top */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-teal-500">
          <div className="text-center">
            <UtensilsCrossed className="w-10 h-10 text-teal-600 mx-auto" />
            <span className="text-xs font-bold text-teal-700 block mt-1">RESTAURANT</span>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-teal-400 tracking-[0.3em] text-sm font-medium mb-4"
            >
              MEMORABLE EXPERIENCE
            </motion.p>
            
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
            >
              YOUR FAVORITE
              <br />
              <span className="text-teal-400">FOOD & DRINKS</span>
            </motion.h1>

            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-white/80 text-lg mb-8 max-w-lg"
            >
              Experience the perfect blend of exquisite cuisine and artisan beverages — 
              fresh ingredients, passionate cooking, and a warm atmosphere.
            </motion.p>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="/menu"
                className="px-8 py-4 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30 hover:-translate-y-1"
              >
                View Menu
              </a>
              <a
                href="/booking"
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-teal-600 transition-all"
              >
                Reserve Table
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center gap-2 cursor-pointer hover:text-teal-400 transition-colors"
      >
        <span className="text-sm tracking-wider">SCROLL DOWN</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </section>
  );
};

export default Hero;
