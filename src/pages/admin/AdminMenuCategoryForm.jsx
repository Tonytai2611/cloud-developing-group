import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { menuApi } from '../../services/menuApi';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function AdminMenuForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        dishes: []
    });
    const [dishes, setDishes] = useState([
        { name: '', description: '', price: '', image: '' }
    ]);
    const [isUploading, setIsUploading] = useState(false);

    // Handle image file upload
    const handleImageUpload = async (index, event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setIsUploading(true);
        try {
            console.log('📤 Uploading image for dish', index);
            const result = await menuApi.uploadImage(file);

            // Update dish image URL
            const newDishes = [...dishes];
            newDishes[index].image = result.url;
            setDishes(newDishes);

            console.log('✅ Image uploaded:', result.url);
        } catch (error) {
            console.error('❌ Upload error:', error);
            alert('Failed to upload image: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchMenuData();
        }
    }, [id]);

    const fetchMenuData = async () => {
        setLoading(true);
        try {
            const response = await menuApi.list();
            const menu = response.data.find(m => m.id === id);

            if (menu) {
                setFormData(menu);
                setDishes(menu.dishes || [{ name: '', description: '', price: '', image: '' }]);
                setIsEditMode(true);
            }
        } catch (error) {
            alert('Error fetching menu data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDishInputChange = (index, field, value) => {
        const newDishes = [...dishes];
        newDishes[index][field] = value;
        setDishes(newDishes);
    };

    const handleAddDish = () => {
        if (dishes.length < 6) {
            setDishes([...dishes, { name: '', description: '', price: '', image: '' }]);
        } else {
            alert('Cannot add more than 6 dishes per category');
        }
    };

    const handleDeleteDish = (index) => {
        if (dishes.length > 1) {
            const newDishes = [...dishes];
            newDishes.splice(index, 1);
            setDishes(newDishes);
        } else {
            alert('At least one dish is required');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.id || !formData.title) {
            alert('Please fill in Menu ID and Title');
            return;
        }

        const validDishes = dishes.filter(d => d.name && d.price);
        if (validDishes.length === 0) {
            alert('Please add at least one dish with name and price');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                id: formData.id,
                title: formData.title,
                dishes: validDishes
            };

            console.log('📤 Submitting data:', requestData);
            console.log('📤 Is Edit Mode:', isEditMode);

            if (isEditMode) {
                const result = await menuApi.update(formData.id, requestData);
                console.log('✅ Update result:', result);
                alert('Menu updated successfully!');
            } else {
                const result = await menuApi.create(requestData);
                console.log('✅ Create result:', result);
                alert('Menu created successfully!');
            }

            navigate('/admin/manage-menu');
        } catch (error) {
            console.error('❌ Submit error:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/manage-menu')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Menu List
                    </button>
                    <h1 className="text-4xl font-bold text-gray-800">
                        {isEditMode ? 'Edit Menu Category' : 'Create New Menu Category'}
                    </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
                    {/* Menu ID */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Menu ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            disabled={isEditMode}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="Enter Menu ID (e.g., 1, 2, 3)"
                            required
                        />
                    </div>

                    {/* Menu Title */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Menu Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Enter Menu Title (e.g., Main Course, Beverages)"
                            required
                        />
                    </div>

                    {/* Dishes */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Dishes <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAddDish}
                                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Dish
                            </button>
                        </div>

                        <div className="space-y-4">
                            {dishes.map((dish, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-700">Dish {index + 1}</h3>
                                        {dishes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDish(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Dish Name
                                            </label>
                                            <input
                                                type="text"
                                                value={dish.name || ''}
                                                onChange={(e) => handleDishInputChange(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                placeholder="e.g., Special Beef Pho"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Price
                                            </label>
                                            <input
                                                type="number"
                                                value={dish.price || ''}
                                                onChange={(e) => handleDishInputChange(index, 'price', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                placeholder="e.g., 65000"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                value={dish.description || ''}
                                                onChange={(e) => handleDishInputChange(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                placeholder="e.g., Traditional Vietnamese beef noodle soup"
                                                rows="2"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Dish Image
                                            </label>

                                            {/* File Upload Button */}
                                            <div className="flex gap-2 mb-2">
                                                <label className="flex-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(index, e)}
                                                        className="hidden"
                                                        disabled={isUploading}
                                                    />
                                                    <div className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 cursor-pointer text-center transition-colors">
                                                        {isUploading ? 'Uploading...' : '📤 Upload Image'}
                                                    </div>
                                                </label>
                                            </div>

                                            {/* Or enter URL manually */}
                                            <div className="text-xs text-gray-500 mb-1">Or enter image URL:</div>
                                            <input
                                                type="text"
                                                value={dish.image || ''}
                                                onChange={(e) => handleDishInputChange(index, 'image', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                                placeholder="https://example.com/image.jpg"
                                            />

                                            {/* Image Preview */}
                                            {dish.image && (
                                                <div className="mt-3">
                                                    <img
                                                        src={dish.image}
                                                        alt={dish.name || 'Dish preview'}
                                                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/400x300/gray/white?text=Image+Not+Found';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all shadow-md disabled:bg-gray-400"
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Menu' : 'Create Menu')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/manage-menu')}
                            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
