import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../../services/menuApi';
import { Plus, Edit2, Trash2, Search, X, ArrowLeft, Home, Grid, List, Coffee } from 'lucide-react';
import AnimatedList from '../../components/ui/AnimatedList';

export default function AdminManageMenu() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Main Course',
    description: '',
    image: '',
    available: true
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await menuApi.list();
      setMenu(response.data);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: '',
        category: 'Main Course',
        description: '',
        image: 'https://placehold.co/400x300/teal/white?text=New+Dish',
        available: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        price: parseInt(formData.price)
      };

      if (editingItem) {
        const response = await menuApi.update(editingItem.id, data);
        setMenu(menu.map(item => item.id === editingItem.id ? response.data : item));
        alert('Updated successfully!');
      } else {
        const response = await menuApi.create(data);
        setMenu([...menu, response.data]);
        alert('Dish added successfully!');
      }
      handleCloseModal();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dish?')) return;

    setLoading(true);
    try {
      await menuApi.delete(id);
      setMenu(menu.filter(item => item.id !== id));
      alert('Deleted successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <p className="text-gray-600 mt-2">Total: {menu.length} items</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Dish
          </button>
        </div>

        {/* Search and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Animated Menu Items */}
        {filteredMenu.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No dishes found</h3>
            <p className="text-gray-400">Try adjusting your search or add a new dish</p>
          </div>
        ) : (
          <AnimatedList
            items={filteredMenu}
            onItemSelect={(item) => handleOpenModal(item)}
            showGradients={true}
            enableArrowNavigation={true}
            displayScrollbar={true}
            maxHeight="calc(100vh - 350px)"
            gradientColors={{ from: '#f9fafb', to: 'transparent' }}
            renderItem={(item, index, isSelected) => (
              <div 
                className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isSelected 
                    ? 'border-teal-500 shadow-xl shadow-teal-500/10' 
                    : 'border-gray-100 hover:border-teal-300 shadow-sm hover:shadow-md'
                }`}
              >
                {viewMode === 'grid' ? (
                  // Grid View - Card Style
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        item.available 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.available ? 'Available' : 'Out of Stock'}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                            <span className="inline-block bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium mt-1">
                              {item.category}
                            </span>
                          </div>
                          <span className="text-xl font-bold text-teal-600">
                            ${(item.price / 1000).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(item);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // List View - Compact Style
                  <div className="flex items-center p-3 gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          item.available 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.available ? 'Available' : 'Out'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <span className="text-lg font-bold text-teal-600 flex-shrink-0">
                      ${(item.price / 1000).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(item);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? 'Edit Dish' : 'Add New Dish'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dish Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Special Beef Pho"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (VND) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="Main Course">Main Course</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Dish description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="mt-2 w-32 h-32 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="available"
                    checked={formData.available}
                    onChange={handleChange}
                    className="w-5 h-5 text-teal-500 rounded focus:ring-2 focus:ring-teal-500"
                  />
                  <label className="text-sm font-medium">Available</label>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-500 text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition-all disabled:bg-gray-300"
                >
                  {loading ? 'Processing...' : (editingItem ? 'Update' : 'Add Dish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
