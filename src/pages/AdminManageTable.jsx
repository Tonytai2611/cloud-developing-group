import React, { useState, useEffect } from 'react';
import { api } from '../services/mockApi';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

export default function AdminManageTable() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    seats: 4,
    status: 'AVAILABLE'
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await api.tables.list();
      setTables(response.data);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        tableNumber: table.tableNumber,
        seats: table.seats,
        status: table.status
      });
    } else {
      setEditingTable(null);
      setFormData({
        tableNumber: `Table ${tables.length + 1}`,
        seats: 4,
        status: 'AVAILABLE'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        seats: parseInt(formData.seats)
      };

      if (editingTable) {
        const response = await api.tables.update(editingTable.id, data);
        setTables(tables.map(t => t.id === editingTable.id ? response.data : t));
        alert('Updated successfully!');
      } else {
        const response = await api.tables.create(data);
        setTables([...tables, response.data]);
        alert('Table added successfully!');
      }
      setShowModal(false);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    setLoading(true);
    try {
      await api.tables.delete(id);
      setTables(tables.filter(t => t.id !== id));
      alert('Deleted successfully!');
    } catch (err) {
      alert(err.message); // Will show "Cannot delete table that is currently occupied!"
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 border-green-500 text-green-800';
      case 'OCCUPIED': return 'bg-red-100 border-red-500 text-red-800';
      case 'RESERVED': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'OCCUPIED': return 'Occupied';
      case 'RESERVED': return 'Reserved';
      default: return status;
    }
  };

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Manage Tables</h1>
            <p className="text-gray-600 mt-2">Table Layout</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Table
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-gray-600 mt-2">Total Tables</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 text-center border-2 border-green-200">
            <div className="text-4xl font-bold text-green-600">{stats.available}</div>
            <div className="text-green-700 mt-2">Available</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6 text-center border-2 border-red-200">
            <div className="text-4xl font-bold text-red-600">{stats.occupied}</div>
            <div className="text-red-700 mt-2">Occupied</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 text-center border-2 border-yellow-200">
            <div className="text-4xl font-bold text-yellow-600">{stats.reserved}</div>
            <div className="text-yellow-700 mt-2">Reserved</div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map(table => (
            <div
              key={table.id}
              className={`rounded-lg shadow-lg p-6 border-4 transition-all hover:shadow-xl ${getStatusColor(table.status)}`}
            >
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold">{table.tableNumber}</h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">{table.seats} seats</span>
                </div>
              </div>

              <div className="text-center mb-4">
                <span className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-white bg-opacity-70">
                  {getStatusText(table.status)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(table)}
                  className="flex-1 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-lg transition-all flex items-center justify-center gap-1"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(table.id)}
                  className="flex-1 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-lg transition-all flex items-center justify-center gap-1"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Table Name *</label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Table 01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Number of Seats *</label>
                  <select
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {[2, 4, 6, 8, 10].map(num => (
                      <option key={num} value={num}>{num} seats</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-500 text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition-all disabled:bg-gray-300"
                >
                  {loading ? 'Processing...' : (editingTable ? 'Update' : 'Add Table')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
