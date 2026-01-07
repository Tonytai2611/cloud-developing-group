import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi } from '../../services/tableApi';
import { bookingApi } from '../../services/bookingApi';
import { CheckCircle, XCircle, Clock, DollarSign, Filter, ArrowLeft, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminManageOrderingFood() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await bookingApi.list();
      setBookings(bookingsRes.data || []);

      const tablesRes = await tableApi.list();
      setTables(tablesRes.data || []);
    } catch (err) {
      toast.error("Failed to load data", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    if (!window.confirm('Approve this booking?')) return;

    setLoading(true);
    try {
      const response = await bookingApi.updateStatus(bookingId, 'CONFIRMED');
      setBookings(bookings.map(b => b.id === bookingId ? response.data : b));
      toast.success("Booking confirmed successfully");
      fetchData(); // Refresh data
    } catch (err) {
      toast.error("Failed to confirm booking", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) return;

    setLoading(true);
    try {
      await bookingApi.updateStatus(bookingId, 'REJECTED');
      setBookings(bookings.filter(b => b.id !== bookingId));
      toast.success("Booking rejected");
      fetchData(); // Refresh to update table status
    } catch (err) {
      toast.error("Failed to reject booking", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    setLoading(true);
    try {
      await bookingApi.delete(bookingId);
      setBookings(bookings.filter(b => b.id !== bookingId));
      toast.success("Booking deleted successfully");
    } catch (err) {
      toast.error("Failed to delete booking", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = filter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.reduce((sum, b) => sum + b.total, 0),
    pending: bookings.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + b.total, 0),
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').reduce((sum, b) => sum + b.total, 0)
  };

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Manage Orders</h1>
          <p className="text-gray-600 mt-2">Review and manage bookings</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-8 h-8" />
              <div className="text-sm font-semibold">Total Revenue</div>
            </div>
            <div className="text-4xl font-bold">${(stats.total / 1000).toFixed(2)}</div>
            <div className="text-sm mt-2 opacity-90">{bookings.length} orders</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8" />
              <div className="text-sm font-semibold">Pending Approval</div>
            </div>
            <div className="text-4xl font-bold">${(stats.pending / 1000).toFixed(2)}</div>
            <div className="text-sm mt-2 opacity-90">
              {bookings.filter(b => b.status === 'PENDING').length} orders
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8" />
              <div className="text-sm font-semibold">Confirmed</div>
            </div>
            <div className="text-4xl font-bold">${(stats.confirmed / 1000).toFixed(2)}</div>
            <div className="text-sm mt-2 opacity-90">
              {bookings.filter(b => b.status === 'CONFIRMED').length} orders
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600" />
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === 'ALL'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === 'PENDING'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Pending ({bookings.filter(b => b.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === 'CONFIRMED'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Confirmed ({bookings.filter(b => b.status === 'CONFIRMED').length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              className={`bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl ${booking.status === 'PENDING' ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'
                }`}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{booking.customerName}</h3>
                  <p className="text-gray-600">{booking.email}</p>
                  <p className="text-gray-600">{booking.phone}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {booking.id}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${booking.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {booking.status === 'CONFIRMED' ? '✓ Confirmed' : '⏳ Pending'}
                  </span>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Date</p>
                  <p className="font-semibold">{booking.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Time</p>
                  <p className="font-semibold">{booking.time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Guests</p>
                  <p className="font-semibold">{booking.guests} people</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Table</p>
                  <p className="font-semibold">{booking.tableId || 'Not assigned'}</p>
                </div>
              </div>

              {/* Special Requests */}
              {booking.specialRequests && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-3 mb-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">📝 Special Requests:</p>
                  <p className="text-sm text-yellow-700">{booking.specialRequests}</p>
                </div>
              )}

              {/* Orders */}
              {booking.selectedItems && booking.selectedItems.length > 0 && (
                <div className="border-t pt-4 mb-4">
                  <h4 className="font-bold text-gray-800 mb-3">Order Details:</h4>
                  <div className="space-y-2">
                    {booking.selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <div>
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <span className="text-gray-600 text-sm ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-bold text-teal-600">
                          ${((item.price * item.quantity) / 1000).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-gray-200">
                    <span className="text-lg font-bold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-teal-600">
                      ${(booking.total / 1000).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {booking.status === 'PENDING' && (
                  <button
                    onClick={() => handleApprove(booking.id)}
                    className="flex-1 min-w-[150px] bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                )}

                {booking.status === 'PENDING' && (
                  <button
                    onClick={() => handleReject(booking.id)}
                    className="flex-1 min-w-[150px] bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                )}

                <button
                  onClick={() => handleDelete(booking.id)}
                  className="flex-1 min-w-[150px] bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-all font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
