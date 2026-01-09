import React from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Flame, Clock, Star, ArrowRight, Leaf, ChefHat } from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const IntroductionComponent = () => {
  const features = [
    { icon: Leaf, title: "Fresh Ingredients", desc: "Locally sourced, premium quality ingredients for every dish" },
    { icon: ChefHat, title: "Expert Chefs", desc: "Passionate culinary artists crafting memorable meals" },
    { icon: Clock, title: "Made to Order", desc: "Every dish prepared fresh, just the way you like it" }
  ];

  const menuItems = [
    { name: "Grilled Steak", price: "24.99", img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400" },
    { name: "Seafood Pasta", price: "18.99", img: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400" },
    { name: "Caesar Salad", price: "12.99", img: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400" },
    { name: "Craft Burger", price: "15.99", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" }
  ];

  const specialMenu = [
    { name: "BrewCraft Signature Steak", desc: "Premium ribeye with herb butter and seasonal vegetables", price: "32.99" },
    { name: "Truffle Mushroom Risotto", desc: "Creamy arborio rice with wild mushrooms and truffle oil", price: "22.99" },
    { name: "Grilled Salmon", desc: "Atlantic salmon with lemon dill sauce and asparagus", price: "26.99" },
    { name: "Lamb Chops", desc: "Herb-crusted lamb with mint sauce and roasted potatoes", price: "28.99" },
    { name: "Chef's Tasting Menu", desc: "5-course culinary journey curated by our head chef", price: "65.00" }
  ];

  return (
    <>
      {/* Quote Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="text-teal-500 mb-6">
              <UtensilsCrossed className="w-12 h-12 mx-auto" />
            </div>
            <blockquote className="text-2xl md:text-3xl text-gray-700 italic font-serif leading-relaxed">
              "Great food is the foundation of genuine happiness — crafted with passion, 
              served with love, and shared with those who matter most."
            </blockquote>
            <div className="mt-6">
              <div className="w-12 h-0.5 bg-teal-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 tracking-wider">— THE BREWCRAFT TEAM</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Image Side */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 relative"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600"
                  alt="Our Story"
                  className="w-full h-[500px] object-cover rounded-2xl shadow-xl"
                />
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-teal-500 rounded-2xl -z-10" />
                <div className="absolute -top-6 -left-6 w-32 h-32 border-4 border-teal-500 rounded-2xl -z-10" />
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <span className="text-teal-500 tracking-[0.2em] text-sm font-medium">WHO WE ARE</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
                Our <span className="text-teal-600">Story</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                BrewCraft began with a simple passion: creating unforgettable dining experiences. 
                Our restaurant combines exquisite cuisine with artisan beverages, 
                bringing together the best of both worlds.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Our team of talented chefs and mixologists brings together years of culinary 
                expertise and a genuine love for food. Every dish we serve is a testament 
                to our commitment to quality and your experience.
              </p>
              <a
                href="/contact-us"
                className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:gap-4 transition-all"
              >
                LEARN MORE <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0F4C4C]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-teal-500 tracking-[0.2em] text-sm font-medium">DISCOVER</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">
              Our <span className="text-teal-600">Menu</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-teal-600 text-2xl font-bold mb-4">${item.price}</p>
                  <a
                    href="/menu"
                    className="inline-block px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Order Now
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <a
              href="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0F4C4C] text-white font-semibold rounded-lg hover:bg-teal-700 transition-all"
            >
              View Full Menu <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Special Menu Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1"
            >
              <img
                src="https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
                alt="Special Menu"
                className="w-full h-full object-cover rounded-2xl shadow-xl"
              />
            </motion.div>

            {/* Menu List */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="flex-1"
            >
              <span className="text-teal-500 tracking-[0.2em] text-sm font-medium">CHEF'S PICK</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-8">
                Special <span className="text-teal-600">Menu</span>
              </h2>

              <div className="space-y-6">
                {specialMenu.map((item, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                    className="flex items-start gap-4 pb-6 border-b border-gray-200 last:border-0"
                  >
                    <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                        <span className="text-teal-600 font-bold text-lg">${item.price}</span>
                      </div>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reservation Section */}
      <section className="py-20 bg-[#0F4C4C] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-white rounded-full" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center"
          >
            <span className="text-teal-300 tracking-[0.2em] text-sm font-medium">BOOK A TABLE</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
              Make a Reservation
            </h2>
            <p className="text-white/70 mb-8">
              Book your table now and experience our exceptional service, 
              exquisite cuisine, and warm atmosphere.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-white"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-white"
                />
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white"
                />
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white"
                />
              </div>
              <select className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white mb-4">
                <option value="" className="text-gray-900">Number of Guests</option>
                <option value="1" className="text-gray-900">1 Person</option>
                <option value="2" className="text-gray-900">2 People</option>
                <option value="3" className="text-gray-900">3 People</option>
                <option value="4" className="text-gray-900">4 People</option>
                <option value="5+" className="text-gray-900">5+ People</option>
              </select>
              <a
                href="/booking"
                className="w-full inline-block px-8 py-4 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-400 transition-colors text-center"
              >
                Book Now
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Seasonal Special */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200"
              alt="Seasonal Special"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C4C]/90 to-transparent flex items-center">
              <div className="p-8 md:p-16 max-w-lg">
                <span className="inline-block px-4 py-1 bg-amber-500 text-gray-900 text-sm font-bold rounded-full mb-4">
                  LIMITED TIME
                </span>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Seasonal Special
                </h3>
                <p className="text-white/80 mb-6">
                  Try our exclusive seasonal menu — available for a limited time only. 
                  A unique culinary experience crafted by our head chef.
                </p>
                <a
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Explore Now <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default IntroductionComponent;
