import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../services/menuApi';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight } from 'lucide-react';

export default function Menu() {
    const navigate = useNavigate();
    const [menuCategories, setMenuCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const response = await menuApi.list();
            setMenuCategories(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Flatten dishes from all categories
    const allDishes = menuCategories.flatMap(category =>
        category.dishes?.map(dish => ({
            ...dish,
            category: category.title,
            id: `${category.id}-${dish.name}`
        })) || []
    );

    // Get unique categories from data
    const categories = ['All', ...new Set(menuCategories.map(cat => cat.title))];

    const addToCart = (item) => {
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            setCart(cart.map(i =>
                i.id === item.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity === 0) {
            removeFromCart(itemId);
        } else {
            setCart(cart.map(i =>
                i.id === itemId
                    ? { ...i, quantity: newQuantity }
                    : i
            ));
        }
    };

    const getTotalPrice = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const goToBooking = () => {
        navigate('/booking', { state: { selectedItems: cart } });
    };

    // Filter dishes
    const filteredMenu = allDishes.filter(item => {
        const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    // Get featured images for left panel
    const featuredImages = filteredMenu.slice(0, 5).map(item => item.image).filter(Boolean);

    // Auto rotate featured images
    useEffect(() => {
        if (featuredImages.length > 1) {
            const interval = setInterval(() => {
                setActiveImageIndex((prev) => (prev + 1) % featuredImages.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [featuredImages.length]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-teal-600">Loading menu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-2xl font-semibold text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#0F4C4C] to-teal-600 py-12">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <span className="text-teal-200 text-sm tracking-[0.3em] uppercase">Explore Menu Option</span>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mt-2">
                            Our Delicious Menu
                        </h1>
                    </motion.div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.map((category, index) => (
                            <motion.button
                                key={category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === category
                                    ? 'bg-white text-teal-600 shadow-lg'
                                    : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                                    }`}
                            >
                                {category}
                            </motion.button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto mt-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search dishes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border-0 rounded-full text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 shadow-lg transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Panel - Featured Images */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:w-2/5"
                    >
                        <div className="sticky top-24">
                            {/* Main Featured Image */}
                            <div className="relative rounded-3xl overflow-hidden h-[500px] bg-gray-200 shadow-xl">
                                <AnimatePresence mode="wait">
                                    {featuredImages.length > 0 && (
                                        <motion.img
                                            key={activeImageIndex}
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.5 }}
                                            src={featuredImages[activeImageIndex]}
                                            alt="Featured dish"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                                {/* Image Indicators */}
                                {featuredImages.length > 1 && (
                                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                                        {featuredImages.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImageIndex(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex
                                                    ? 'bg-white w-6'
                                                    : 'bg-white/50 hover:bg-white/70'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Grid */}
                            <div className="grid grid-cols-4 gap-3 mt-4">
                                {featuredImages.slice(0, 4).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all shadow-md ${idx === activeImageIndex
                                            ? 'border-teal-500 scale-95'
                                            : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Dish ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Panel - Menu List */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:w-3/5"
                    >
                        {filteredMenu.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-xl text-gray-500">No dishes found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {filteredMenu.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-teal-200 transition-all overflow-hidden"
                                        >
                                            <div className="p-4">
                                                <div className="flex gap-4">
                                                    {/* Dish Image */}
                                                    <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                                        <img
                                                            src={item.image || 'https://placehold.co/200/f3f4f6/0F4C4C?text=No+Image'}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                        />

                                                    </div>

                                                    {/* Dish Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                                                                    {item.name}
                                                                </h3>
                                                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                                                    {item.description || 'Món ngon từ thực đơn của chúng tôi'}
                                                                </p>


                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="text-xl font-bold text-teal-600">
                                                                    {item.price?.toLocaleString('vi-VN')}₫
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Add to Cart Button */}
                                                        <div className="flex items-center justify-end mt-3">
                                                            {cart.find(i => i.id === item.id) ? (
                                                                <div className="flex items-center gap-2 bg-teal-50 rounded-full p-1">
                                                                    <button
                                                                        onClick={() => updateQuantity(item.id, cart.find(i => i.id === item.id).quantity - 1)}
                                                                        className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors flex items-center justify-center"
                                                                    >
                                                                        <Minus className="w-4 h-4" />
                                                                    </button>
                                                                    <span className="w-8 text-center text-teal-700 font-semibold">
                                                                        {cart.find(i => i.id === item.id).quantity}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => updateQuantity(item.id, cart.find(i => i.id === item.id).quantity + 1)}
                                                                        className="w-8 h-8 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors flex items-center justify-center"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => addToCart(item)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-500 hover:text-white transition-all text-sm font-medium border border-teal-200 hover:border-teal-500"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Make orders
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>


                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Floating Cart */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50"
                    >
                        <div className="bg-white border-t-4 border-teal-500 shadow-2xl">
                            <div className="container mx-auto p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                                            <ShoppingCart className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-gray-700 font-medium">
                                                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                                            </p>
                                            <p className="text-teal-600 font-bold text-xl">
                                                {getTotalPrice().toLocaleString('vi-VN')}₫
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={goToBooking}
                                        className="flex items-center gap-2 bg-teal-500 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
                                    >
                                        Book Now
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Cart Items Preview */}
                                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {cart.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex-shrink-0 flex items-center gap-3 bg-gray-50 rounded-xl p-2 pr-4 border border-gray-100"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-gray-800 text-sm font-medium truncate max-w-[120px]">
                                                    {item.name}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    x{item.quantity}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="ml-2 w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
