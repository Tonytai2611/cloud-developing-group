// Booking API Service
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com';

export const bookingApi = {
    list: async (userId = null) => {
        try {
            const url = userId
                ? `${API_BASE_URL}/getBooking?userId=${userId}`
                : `${API_BASE_URL}/getBooking`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch bookings');
            const result = await response.json();
            return { success: true, data: result.data || [] };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/createBooking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create booking');
            const result = await response.json();
            return { success: true, data: result.data };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    updateStatus: async (id, status, tableId = null) => {
        try {
            const payload = { id, status };
            if (tableId) payload.tableId = tableId;

            const response = await fetch(`${API_BASE_URL}/updateBooking`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to update booking');
            const result = await response.json();
            return { success: true, data: result.data, message: result.message };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/deleteBooking`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!response.ok) throw new Error('Failed to delete booking');
            return { success: true };
        } catch (error) {
            throw new Error(error.message);
        }
    }
};
