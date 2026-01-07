import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../../services/menuApi';
import { Plus, Edit2, Trash2, Search, X, ArrowLeft, Home } from 'lucide-react';

export default function AdminManageMenu() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-teal-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left">Image</th>
                <th className="px-6 py-4 text-left">Dish Name</th>
                <th className="px-6 py-4 text-left">Price</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenu.map((item, index) => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-teal-600">
                      ${(item.price / 1000).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {item.available ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
              No dishes found
            </div>
          )}
        </div>
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
