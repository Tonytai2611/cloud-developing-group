import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../services/menuApi';
import { ShoppingCart, Search } from 'lucide-react';

export default function Menu() {
    const navigate = useNavigate();
    const [menuCategories, setMenuCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);

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
            // Generate unique ID for cart
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-2xl font-semibold text-teal-600">Loading menu...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-2xl font-semibold text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20">
            <div className="container mx-auto px-4">
                <h1 className="text-5xl font-bold text-center mb-8 text-teal-600">
                    Our Menu
                </h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar - Filters */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                            {/* Search */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search dishes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Categories</label>
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${selectedCategory === category
                                                ? 'bg-teal-500 text-white font-semibold'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Grid */}
                    <div className="flex-1">
                        {filteredMenu.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-xl text-gray-600">No dishes found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredMenu.map(item => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        {/* Image */}
                                        <div className="relative h-56 overflow-hidden bg-gray-100">
                                            <img
                                                src={item.image || 'https://placehold.co/400x300/teal/white?text=No+Image'}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = 'https://placehold.co/400x300/gray/white?text=Image+Not+Available';
                                                }}
                                            />
                                            {/* Category Badge */}
                                            <div className="absolute top-3 right-3">
                                                <span className="bg-white/90 backdrop-blur-sm text-teal-600 font-semibold px-3 py-1 rounded-full text-xs shadow-md">
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            {/* Title */}
                                            <h3 className="text-xl font-bold mb-2 text-gray-800">
                                                {item.name}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-gray-600 text-sm mb-4">
                                                {item.description || 'Delicious dish from our menu'}
                                            </p>

                                            {/* Price & Add to Cart */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 mb-1">Price</p>
                                                    <p className="text-2xl font-bold text-teal-600">
                                                        {item.price ? `${item.price.toLocaleString('vi-VN')}₫` : 'N/A'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="bg-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Cart */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-teal-500 shadow-2xl p-4 z-50">
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ShoppingCart className="w-8 h-8 text-teal-600" />
                                <div>
                                    <p className="font-bold text-lg">
                                        {cart.length} items selected
                                    </p>
                                    <p className="text-teal-600 font-semibold text-xl">
                                        Total: {getTotalPrice().toLocaleString('vi-VN')}₫
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={goToBooking}
                                className="bg-teal-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-600 transition-all shadow-lg"
                            >
                                Book Now
                            </button>
                        </div>

                        {/* Cart Items Preview */}
                        <div className="mt-4 max-h-40 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b">
                                    <div className="flex items-center gap-3">
                                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-gray-600">{item.price?.toLocaleString('vi-VN')}₫</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
