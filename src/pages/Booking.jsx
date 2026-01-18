import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { tableApi } from '../services/tableApi';
import { bookingApi } from '../services/bookingApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Users, MapPin, CheckCircle, ChevronLeft, ChevronRight,
  UtensilsCrossed, User, Phone, Mail, MessageSquare, ArrowLeft, ArrowRight,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

// Calendar Component
const BookingCalendar = ({ selectedDate, onSelectDate, currentMonth, setCurrentMonth }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week for the first day (0 = Sunday, we want Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const isDateAvailable = (date) => {
    if (!date) return false;
    return date >= today;
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const canGoPrev = () => {
    const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    return prevMonthDate >= new Date(today.getFullYear(), today.getMonth(), 1);
  };

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev()}
          className={`p-2 rounded-full transition-colors ${canGoPrev() ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
            }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800 min-w-[160px] text-center">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div key={index} className="aspect-square p-1">
            {date && (
              <button
                onClick={() => isDateAvailable(date) && onSelectDate(date)}
                disabled={!isDateAvailable(date)}
                className={`w-full h-full rounded-full flex items-center justify-center text-sm font-medium transition-all ${isSelected(date)
                  ? 'bg-teal-500 text-white shadow-lg'
                  : isDateAvailable(date)
                    ? 'text-teal-600 hover:bg-teal-50 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                  } ${isToday(date) && !isSelected(date) ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Time Slots Component
const TimeSlots = ({ selectedTime, onSelectTime, selectedDate }) => {
  // Vietnam restaurant hours: Lunch (10:00-14:00) & Dinner (17:00-22:00)
  const timeSlots = [
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getDayName = (date) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {getDayName(selectedDate)}
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {timeSlots.map((time) => (
          <button
            key={time}
            onClick={() => onSelectTime(time)}
            className={`w-full py-3 px-4 rounded-lg border-2 text-center font-medium transition-all ${selectedTime === time
              ? 'border-teal-500 bg-teal-500 text-white'
              : 'border-gray-200 hover:border-teal-500 text-teal-600'
              }`}
          >
            {formatTime(time)}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedItems = location.state?.selectedItems || [];
  const selectedTable = location.state?.selectedTable;

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Details
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: user?.email || user?.username || '',
    guests: selectedTable?.seats || 2,
    tableId: selectedTable?.id || '',
    specialRequests: ''
  });

  useEffect(() => {
    if (user) {
      const email = user.email || user.username || '';
      setFormData(prev => ({ ...prev, email }));
    }
  }, [user]);

  useEffect(() => {
    fetchAvailableTables();
  }, []);

  const fetchAvailableTables = async () => {
    try {
      const response = await tableApi.list();
      const availableTables = response.data.filter(t => t.status === 'AVAILABLE');
      setTables(availableTables);
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

  // Format date to YYYY-MM-DD in local timezone (Vietnam)
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get user email for userId
      const userId = user?.email || user?.username || formData.email || 'guest';

      const bookingData = {
        ...formData,
        userId, // Add userId to booking data
        date: formatDateLocal(selectedDate), // Use local timezone format
        time: selectedTime,
        selectedItems,
        total: getTotalPrice(),
        guests: parseInt(formData.guests)
      };

      console.log('🔍 Creating booking with userId:', userId);
      console.log('🔍 Booking data:', bookingData);

      await bookingApi.create(bookingData);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error("Booking failed", {
        description: err.message || "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceedToDetails = selectedDate && selectedTime;

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl mx-auto px-4"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Thank you for your reservation at BrewCraft.
            </p>
            <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-2xl p-6 mb-6 text-left">
              <h3 className="font-bold text-lg mb-4 text-teal-700">Reservation Details:</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-teal-500" />
                  <span>{formData.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-teal-500" />
                  <span>{selectedDate?.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-teal-500" />
                  <span>{selectedTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-teal-500" />
                  <span>{formData.guests} guests</span>
                </div>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="w-5 h-5 text-teal-500" />
                    <span>Total: ${(getTotalPrice() / 1000).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-600 mb-8">
              A confirmation email has been sent to <strong className="text-teal-600">{formData.email}</strong>
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                Go Home
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="px-8 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
              >
                View Menu
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Book a Table</h1>
          <p className="text-gray-600">Select your preferred date and time</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Panel - Restaurant Info */}
            <div className="lg:w-1/3 bg-gradient-to-br from-teal-600 to-teal-700 p-8 text-white">
              <div className="sticky top-8">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                  <UtensilsCrossed className="w-10 h-10 text-white" />
                </div>
                <p className="text-teal-200 text-sm mb-1">BrewCraft Restaurant</p>
                <h2 className="text-2xl font-bold mb-4">Table Reservation</h2>

                <div className="flex items-center gap-2 text-teal-100 mb-6">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Duration: ~2 hours</span>
                </div>

                <p className="text-teal-100 text-sm leading-relaxed mb-8">
                  Reserve your perfect dining experience at BrewCraft.
                  Enjoy our exquisite cuisine and warm atmosphere.
                </p>

                {/* Selected Summary */}
                {(selectedDate || selectedTime || selectedItems.length > 0) && (
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <h4 className="font-semibold mb-3">Your Selection</h4>
                    {selectedDate && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedDate.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{selectedTime}</span>
                      </div>
                    )}
                    {selectedItems.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>{selectedItems.length} items · ${(getTotalPrice() / 1000).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Timezone */}
                <div className="mt-8 flex items-center gap-2 text-teal-200 text-sm">
                  <Globe className="w-4 h-4" />
                  <span>Vietnam Time (GMT+7)</span>
                </div>
              </div>
            </div>

            {/* Right Panel - Booking Form */}
            <div className="lg:w-2/3 p-8">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Select a Date & Time</h3>

                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Calendar */}
                      <div className="flex-1">
                        <BookingCalendar
                          selectedDate={selectedDate}
                          onSelectDate={setSelectedDate}
                          currentMonth={currentMonth}
                          setCurrentMonth={setCurrentMonth}
                        />
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div className="md:w-48">
                          <TimeSlots
                            selectedTime={selectedTime}
                            onSelectTime={setSelectedTime}
                            selectedDate={selectedDate}
                          />
                        </div>
                      )}
                    </div>

                    {/* Next Button */}
                    {selectedTime && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex justify-end"
                      >
                        <button
                          onClick={() => setStep(2)}
                          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
                        >
                          Next <ArrowRight className="w-5 h-5" />
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Back Button */}
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to calendar</span>
                    </button>

                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Enter Your Details</h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name & Phone */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="customerName"
                              value={formData.customerName}
                              onChange={handleChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                              placeholder="John Doe"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                              placeholder="0909 123 456"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!!user}
                            required
                            className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${user ? 'bg-gray-50 cursor-not-allowed' : ''
                              }`}
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      {/* Guests & Table */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Guests *
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                              name="guests"
                              value={formData.guests}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Table *
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                              name="tableId"
                              value={formData.tableId}
                              onChange={handleChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none bg-white"
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

                      {/* Capacity Warning */}
                      {(() => {
                        const selectedTableData = tables.find(t => t.id === formData.tableId);
                        const guests = parseInt(formData.guests);
                        const capacity = selectedTableData?.seats || 0;

                        if (selectedTableData && guests > capacity) {
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-amber-800 mb-1">
                                    Table Capacity Notice
                                  </h4>
                                  <p className="text-sm text-amber-700">
                                    You've selected <span className="font-bold">{guests} guests</span> for a table with <span className="font-bold">{capacity} seats</span>.
                                    {guests - capacity === 1 ? (
                                      <span> Consider selecting a larger table or we can arrange additional seating.</span>
                                    ) : (
                                      <span> We recommend choosing a larger table or booking multiple tables for your party.</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-amber-600 mt-2 italic">
                                    💡 Tip: You can still proceed with this booking, and our staff will assist with seating arrangements.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        }

                        if (selectedTableData && guests < capacity - 1) {
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-blue-700">
                                    This table has <span className="font-bold">{capacity} seats</span> but you've selected <span className="font-bold">{guests} {guests === 1 ? 'guest' : 'guests'}</span>.
                                    You might want to choose a smaller table for a more intimate setting.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        }

                        return null;
                      })()}

                      {/* Special Requests */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Requests (optional)
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <textarea
                            name="specialRequests"
                            value={formData.specialRequests}
                            onChange={handleChange}
                            rows="3"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                            placeholder="E.g., Birthday celebration, dietary requirements, window seat preference..."
                          />
                        </div>
                      </div>

                      {/* Selected Items */}
                      {selectedItems.length > 0 && (
                        <div className="bg-gray-50 rounded-2xl p-6">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <UtensilsCrossed className="w-5 h-5 text-teal-500" />
                            Pre-ordered Items
                          </h4>
                          <div className="space-y-3">
                            {selectedItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                  <div>
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <p className="text-sm text-gray-500">${(item.price / 1000).toFixed(2)} × {item.quantity}</p>
                                  </div>
                                </div>
                                <p className="font-semibold text-teal-600">
                                  ${((item.price * item.quantity) / 1000).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
                            <span className="font-semibold text-gray-800">Total:</span>
                            <span className="text-xl font-bold text-teal-600">
                              ${(getTotalPrice() / 1000).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading || tables.length === 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${loading || tables.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-teal-500/30'
                          }`}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </span>
                        ) : (
                          'Confirm Booking'
                        )}
                      </button>

                      {tables.length === 0 && (
                        <p className="text-center text-red-500 text-sm">
                          No tables available. Please try again later.
                        </p>
                      )}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
      `}</style>
    </div>
  );
}
