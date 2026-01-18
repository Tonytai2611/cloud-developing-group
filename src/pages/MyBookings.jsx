import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { bookingApi } from '../services/bookingApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, Users, MapPin, UtensilsCrossed, AlertCircle,
    CheckCircle, XCircle, Ban, Loader2, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        PENDING: {
            bg: 'bg-amber-100',
            text: 'text-amber-700',
            border: 'border-amber-300',
            icon: Clock,
            label: 'Pending'
        },
        CONFIRMED: {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-300',
            icon: CheckCircle,
            label: 'Confirmed'
        },
        REJECTED: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-300',
            icon: XCircle,
            label: 'Rejected'
        },
        CANCELLED: {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
            border: 'border-gray-300',
            icon: Ban,
            label: 'Cancelled'
        }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} font-medium text-sm`}>
            <Icon className="w-4 h-4" />
            {config.label}
        </span>
    );
};

// Booking Card Component
const BookingCard = ({ booking, onCancel, isCancelling }) => {
    const navigate = useNavigate();
    const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Booking #{booking.id}</h3>
                    <p className="text-sm text-gray-500 mt-1">Created: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-semibold">{formatDate(booking.date)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-semibold">{booking.time}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Guests</p>
                        <p className="font-semibold">{booking.guests} {booking.guests === 1 ? 'person' : 'people'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Table</p>
                        <p className="font-semibold">{booking.tableNumber || 'TBA'}</p>
                    </div>
                </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Special Requests</p>
                    <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                </div>
            )}

            {/* Pre-ordered Items */}
            {booking.selectedItems && booking.selectedItems.length > 0 && (
                <div className="bg-teal-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <UtensilsCrossed className="w-4 h-4 text-teal-600" />
                        <p className="text-sm font-semibold text-teal-800">Pre-ordered Items</p>
                    </div>
                    <div className="space-y-1">
                        {booking.selectedItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                                <span className="text-teal-600 font-medium">${((item.price * item.quantity) / 1000).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    {booking.total > 0 && (
                        <div className="border-t border-teal-200 mt-2 pt-2 flex justify-between">
                            <span className="text-sm font-semibold text-teal-800">Total</span>
                            <span className="text-sm font-bold text-teal-600">${(booking.total / 1000).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            {canCancel && (
                <button
                    onClick={() => onCancel(booking.id)}
                    disabled={isCancelling}
                    className="w-full py-2.5 px-4 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isCancelling ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cancelling...
                        </>
                    ) : (
                        <>
                            <Ban className="w-4 h-4" />
                            Cancel Booking
                        </>
                    )}
                </button>
            )}
        </motion.div>
    );
};

// Main Component
export default function MyBookings() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        if (user) {
            fetchUserBookings();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchUserBookings = async () => {
        try {
            setLoading(true);

            // Get user email from useAuth hook
            const email = user?.email || user?.username || '';

            console.log('🔍 Debug - User object:', user);
            console.log('🔍 Debug - Email to search:', email);

            if (!email) {
                toast.error('User not authenticated');
                setLoading(false);
                return;
            }

            // Fetch bookings by user email (using email as userId)
            const response = await bookingApi.list(email);

            console.log('🔍 Debug - API Response:', response);
            console.log('🔍 Debug - Bookings data:', response.data);

            // Sort bookings by date (newest first)
            const sortedBookings = (response.data || []).sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            console.log('🔍 Debug - Sorted bookings:', sortedBookings);

            setBookings(sortedBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings', {
                description: error.message || 'Please try again later'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        // Confirmation dialog
        const confirmed = window.confirm(
            'Are you sure you want to cancel this booking? This action cannot be undone.'
        );

        if (!confirmed) return;

        try {
            setCancellingId(bookingId);

            // Update booking status to CANCELLED
            await bookingApi.updateStatus(bookingId, 'CANCELLED');

            toast.success('Booking cancelled successfully', {
                description: 'Your table has been released'
            });

            // Refresh bookings list
            await fetchUserBookings();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('Failed to cancel booking', {
                description: error.message || 'Please try again'
            });
        } finally {
            setCancellingId(null);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading your bookings...</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md mx-auto px-4"
                >
                    <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-teal-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">Please Login</h2>
                    <p className="text-gray-600 mb-8">
                        You need to be logged in to view your bookings.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
                    >
                        Go to Home
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        );
    }

    // Empty State
    if (bookings.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md mx-auto px-4"
                >
                    <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-12 h-12 text-teal-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">No Bookings Yet</h2>
                    <p className="text-gray-600 mb-8">
                        You haven't made any reservations yet. Start by booking a table at BrewCraft!
                    </p>
                    <button
                        onClick={() => navigate('/booking')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
                    >
                        Make a Booking
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        );
    }

    // Bookings List
    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">My Bookings</h1>
                    <p className="text-gray-600">
                        Manage your reservations at BrewCraft Restaurant
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].map((status) => {
                        const count = bookings.filter(b => b.status === status).length;
                        return (
                            <div key={status} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-2xl font-bold text-gray-800">{count}</p>
                                <p className="text-sm text-gray-500 capitalize">{status.toLowerCase()}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Bookings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {bookings.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onCancel={handleCancelBooking}
                                isCancelling={cancellingId === booking.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Footer CTA */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate('/booking')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
                    >
                        Make Another Booking
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
