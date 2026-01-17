import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi } from '../../services/tableApi';
import { bookingApi } from '../../services/bookingApi';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  ArrowLeft,
  Home,
  Calendar,
  Users,
  Phone,
  Mail,
  MessageSquare,
  UtensilsCrossed,
  TrendingUp
} from 'lucide-react';
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
      fetchData();
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
      fetchData();
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

  // Separate bookings by type - check both 'total' and 'totalPrice'
  const tableOnlyBookings = bookings.filter(b => {
    const price = b.totalPrice || b.total || 0;
    return price === 0;
  });

  const foodBookings = bookings.filter(b => {
    const price = b.totalPrice || b.total || 0;
    return price > 0;
  });

  const stats = {
    total: bookings.reduce((sum, b) => sum + (b.totalPrice || b.total || 0), 0),
    pending: bookings.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + (b.totalPrice || b.total || 0), 0),
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').reduce((sum, b) => sum + (b.totalPrice || b.total || 0), 0),
    count: bookings.length,
    pendingCount: bookings.filter(b => b.status === 'PENDING').length,
    confirmedCount: bookings.filter(b => b.status === 'CONFIRMED').length,
    // New: Separate counts
    tableOnlyCount: tableOnlyBookings.length,
    foodBookingsCount: foodBookings.length,
    tableOnlyConfirmed: tableOnlyBookings.filter(b => b.status === 'CONFIRMED').length,
    foodBookingsConfirmed: foodBookings.filter(b => b.status === 'CONFIRMED').length
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-teal-600">Loading orders...</div>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Manage Orders</h1>
          <p className="text-gray-600">Review and manage customer bookings</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-emerald-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.total.toLocaleString()}₫</p>
            <p className="text-sm text-gray-500 mt-2">{stats.count} total orders</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-amber-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Approval</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.pending.toLocaleString()}₫</p>
            <p className="text-sm text-gray-500 mt-2">{stats.pendingCount} pending orders</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Confirmed</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.confirmed.toLocaleString()}₫</p>
            <p className="text-sm text-gray-500 mt-2">{stats.confirmedCount} confirmed orders</p>
          </div>
        </div>

        {/* Booking Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-white px-3 py-1 rounded-full">Table Only</span>
            </div>
            <h3 className="text-purple-900 text-sm font-medium mb-1">Table Reservations</h3>
            <p className="text-3xl font-bold text-purple-900">{stats.tableOnlyCount}</p>
            <p className="text-sm text-purple-700 mt-2">{stats.tableOnlyConfirmed} confirmed reservations</p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <UtensilsCrossed className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-xs font-semibold text-teal-600 bg-white px-3 py-1 rounded-full">Food + Table</span>
            </div>
            <h3 className="text-teal-900 text-sm font-medium mb-1">Food Orders</h3>
            <p className="text-3xl font-bold text-teal-900">{stats.foodBookingsCount}</p>
            <p className="text-sm text-teal-700 mt-2">{stats.foodBookingsConfirmed} confirmed with food</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <Filter className="w-5 h-5 text-teal-600" />
              Filter:
            </div>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${filter === 'ALL'
                ? 'bg-teal-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All <span className="ml-1 opacity-75">({stats.count})</span>
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${filter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Pending <span className="ml-1 opacity-75">({stats.pendingCount})</span>
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${filter === 'CONFIRMED'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Confirmed <span className="ml-1 opacity-75">({stats.confirmedCount})</span>
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl shadow-md border-2 border-gray-200 hover:border-teal-300 hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Status Bar */}
              <div className={`h-2 ${booking.status === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>

              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-teal-50 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{booking.customerName}</h3>
                        <div className="flex flex-col gap-1 mt-2">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Mail className="w-4 h-4" />
                            {booking.email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Phone className="w-4 h-4" />
                            {booking.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">ID: {booking.id}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${booking.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-2 border-amber-200'
                      }`}>
                      {booking.status === 'CONFIRMED' ? (
                        <><CheckCircle className="w-4 h-4" /> Confirmed</>
                      ) : (
                        <><Clock className="w-4 h-4" /> Pending</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 rounded-xl p-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Calendar className="w-3 h-3" />
                      Date
                    </div>
                    <p className="font-bold text-gray-800">{booking.date}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      Time
                    </div>
                    <p className="font-bold text-gray-800">{booking.time}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Guests
                    </div>
                    <p className="font-bold text-gray-800">{booking.guests} people</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <UtensilsCrossed className="w-3 h-3" />
                      Table
                    </div>
                    <p className="font-bold text-gray-800">{booking.tableId || 'Not assigned'}</p>
                  </div>
                </div>

                {/* Special Requests */}
                {booking.specialRequests && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Special Requests
                    </div>
                    <p className="text-sm text-amber-700">{booking.specialRequests}</p>
                  </div>
                )}

                {/* Orders */}
                {booking.selectedItems && booking.selectedItems.length > 0 && (
                  <div className="border-t-2 border-gray-100 pt-6 mb-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-teal-600" />
                      Order Details
                    </h4>
                    <div className="space-y-3">
                      {booking.selectedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="bg-teal-100 text-teal-700 font-bold px-3 py-1 rounded-lg text-sm">
                              x{item.quantity}
                            </div>
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </div>
                          <span className="font-bold text-teal-600">
                            {(item.price * item.quantity).toLocaleString()}₫
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-gray-200">
                      <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                      <span className="text-3xl font-bold text-teal-600">
                        {booking.total.toLocaleString()}₫
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-100">
                  {booking.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={loading}
                        className="flex-1 min-w-[150px] bg-emerald-500 text-white py-3 px-6 rounded-xl hover:bg-emerald-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:bg-gray-400"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={loading}
                        className="flex-1 min-w-[150px] bg-amber-500 text-white py-3 px-6 rounded-xl hover:bg-amber-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:bg-gray-400"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(booking.id)}
                    disabled={loading}
                    className="flex-1 min-w-[150px] bg-red-500 text-white py-3 px-6 rounded-xl hover:bg-red-600 transition-all font-semibold shadow-md hover:shadow-lg disabled:bg-gray-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-200">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-semibold">No orders found</p>
            <p className="text-gray-400 text-sm mt-2">Orders will appear here when customers make bookings</p>
          </div>
        )}
      </div>
    </div>
  );
}
