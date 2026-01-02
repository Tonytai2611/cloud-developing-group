import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Home } from 'lucide-react';

export default function AdminManageMenu() {
    const navigate = useNavigate();
    const [menuCategories, setMenuCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const response = await api.menu.list();
            setMenuCategories(response.data || []);
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        setLoading(true);
        try {
            await api.menu.delete(id);
            setMenuCategories(menuCategories.filter(cat => cat.id !== id));
            alert('Deleted successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (category) => {
        navigate(`/admin/manage-menu/form?id=${category.id}`);
    };

    const filteredMenu = menuCategories.filter(category =>
        category.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Navigation */}
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Home
                    </button>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">Manage Menu</h1>
                        <p className="text-gray-600 mt-2">Total: {menuCategories.length} categories</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/manage-menu/form')}
                        className="bg-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Category
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-teal-500 text-white">
                            <tr>
                                <th className="px-6 py-4 text-left">Menu Title</th>
                                <th className="px-6 py-4 text-left">Dishes (with Images & Prices)</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMenu.map((category, index) => (
                                <tr key={category.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800">{category.title}</p>
                                        <p className="text-sm text-gray-600">{category.dishes?.length || 0} dishes</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            {category.dishes?.map((dish, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-teal-300 transition-all">
                                                    {/* Dish Image */}
                                                    <div className="flex-shrink-0">
                                                        {dish.image ? (
                                                            <img
                                                                src={dish.image}
                                                                alt={dish.name}
                                                                className="w-20 h-20 object-cover rounded-lg shadow-md border-2 border-white"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://placehold.co/80x80/teal/white?text=No+Img';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                                                No Image
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Dish Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-800 text-base truncate">{dish.name}</p>
                                                        <p className="text-sm text-gray-600 line-clamp-1">{dish.description || 'No description'}</p>
                                                    </div>

                                                    {/* Dish Price */}
                                                    <div className="flex-shrink-0 text-right">
                                                        <p className="text-xs text-gray-500 mb-1">Price</p>
                                                        <p className="font-bold text-teal-600 text-lg whitespace-nowrap">
                                                            {dish.price ? `${dish.price.toLocaleString('vi-VN')}\u20ab` : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!category.dishes || category.dishes.length === 0) && (
                                                <p className="text-gray-400 italic text-sm">No dishes in this category</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleUpdate(category)}
                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredMenu.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {loading ? 'Loading...' : 'No categories found'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
