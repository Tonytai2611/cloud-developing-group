import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Calendar, Clock, Users, MapPin, CheckCircle } from 'lucide-react';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedItems = location.state?.selectedItems || [];

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: 2,
    tableId: '',
    specialRequests: ''
  });

  useEffect(() => {
    fetchAvailableTables();
  }, []);

  const fetchAvailableTables = async () => {
    try {
      const response = await api.tables.listAvailable();
      setTables(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        ...formData,
        selectedItems,
        total: getTotalPrice(),
        guests: parseInt(formData.guests)
      };

      const response = await api.bookings.create(bookingData);
      setSuccess(true);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Booking Successful!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Thank you for your reservation at our restaurant.
            </p>
            <div className="bg-teal-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold text-lg mb-3">Booking Information:</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>Name:</strong> {formData.customerName}</p>
                <p><strong>Date:</strong> {formData.date}</p>
                <p><strong>Time:</strong> {formData.time}</p>
                <p><strong>Guests:</strong> {formData.guests} people</p>
                <p><strong>Total:</strong> ${(getTotalPrice() / 1000).toFixed(2)}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-8">
              We have sent a confirmation email to <strong>{formData.email}</strong>
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-lg hover:bg-gray-300 transition-all"
              >
                Go Home
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="bg-teal-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-teal-600 transition-all"
              >
                View Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold text-center mb-8 text-teal-600">
          Book a Table
        </h1>

        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="0909123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Number of Guests *
                  </label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Select Table *
                  </label>
                  <select
                    name="tableId"
                    value={formData.tableId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Choose table</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        {table.tableNumber} ({table.seats} seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-2">Special Requests (optional)</label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="E.g., Need baby chair, near window..."
              />
            </div>

            {/* Order Summary */}
            {selectedItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Selected Items</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-3">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              ${(item.price / 1000).toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-teal-600">
                          ${((item.price * item.quantity) / 1000).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-2 border-gray-300 mt-4 pt-4 flex justify-between items-center">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-2xl font-bold text-teal-600">
                      ${(getTotalPrice() / 1000).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || tables.length === 0}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${loading || tables.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Checking available tables...
                </span>
              ) : tables.length === 0 ? (
                'No tables available'
              ) : (
                'Confirm Booking'
              )}
            </button>

            {tables.length === 0 && (
              <p className="text-center text-red-600 mt-4">
                Currently no tables available. Please try again later.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
