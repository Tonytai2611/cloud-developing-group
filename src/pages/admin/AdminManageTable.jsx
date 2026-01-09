import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi } from '../../services/tableApi';
import { Plus, Edit2, Trash2, Users, ArrowLeft, Home, LayoutGrid, CheckCircle, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminManageTable() {
  const navigate = useNavigate();
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
      const response = await tableApi.list();
      setTables(response.data);
    } catch (err) {
      toast.error("Failed to load tables", {
        description: err.message
      });
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
        const response = await tableApi.update(editingTable.id, data);
        setTables(tables.map(t => t.id === editingTable.id ? response.data : t));
        toast.success("Table updated successfully");
      } else {
        const response = await tableApi.create(data);
        setTables([...tables, response.data]);
        toast.success("Table added successfully");
      }
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to save table", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    setLoading(true);
    try {
      await tableApi.delete(id);
      setTables(tables.filter(t => t.id !== id));
      toast.success("Table deleted successfully");
    } catch (err) {
      toast.error("Failed to delete table", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'border-emerald-300 bg-emerald-50';
      case 'RESERVED': return 'border-amber-300 bg-amber-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
            <CheckCircle className="w-3 h-3" />
            Available
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
            <Clock className="w-3 h-3" />
            Reserved
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
    totalSeats: tables.reduce((sum, t) => sum + t.seats, 0)
  };

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-teal-600">Loading tables...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Navigation */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Manage Tables</h1>
            <p className="text-gray-600">Configure your restaurant table layout</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 justify-center"
          >
            <Plus className="w-5 h-5" />
            Add New Table
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-gray-100 p-3 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Tables</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-emerald-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-emerald-600 text-sm font-medium mb-1">Available</h3>
            <p className="text-3xl font-bold text-emerald-700">{stats.available}</p>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-amber-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-amber-600 text-sm font-medium mb-1">Reserved</h3>
            <p className="text-3xl font-bold text-amber-700">{stats.reserved}</p>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 p-3 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-blue-600 text-sm font-medium mb-1">Total Seats</h3>
            <p className="text-3xl font-bold text-blue-700">{stats.totalSeats}</p>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map(table => (
            <div
              key={table.id}
              className={`rounded-2xl shadow-md border-2 transition-all hover:shadow-xl hover:scale-105 ${getStatusColor(table.status)}`}
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                    <LayoutGrid className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{table.tableNumber}</h3>
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-sm">{table.seats} seats</span>
                  </div>
                </div>

                <div className="text-center mb-4">
                  {getStatusBadge(table.status)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(table)}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 p-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 font-medium text-gray-700 hover:border-teal-400 hover:text-teal-600"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="flex-1 bg-white hover:bg-red-50 border border-gray-300 p-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 font-medium text-gray-700 hover:border-red-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-200">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-semibold">No tables yet</p>
            <p className="text-gray-400 text-sm mt-2 mb-4">Add your first table to get started</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-teal-500 text-white font-semibold py-2 px-6 rounded-xl hover:bg-teal-600 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Table
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingTable ? 'Edit Table' : 'Add New Table'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Table Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="e.g., Table 01, VIP Table A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Seats <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  >
                    {[2, 4, 6, 8, 10, 12].map(num => (
                      <option key={num} value={num}>{num} seats</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all disabled:from-gray-300 disabled:to-gray-300 shadow-md"
                >
                  {loading ? 'Processing...' : (editingTable ? 'Update Table' : 'Add Table')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
