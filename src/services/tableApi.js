// Table API Service
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://i0okfyvcq6.execute-api.us-east-1.amazonaws.com/production';

export const tableApi = {
    list: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getTable`);
            if (!response.ok) throw new Error('Failed to fetch tables');
            const result = await response.json();
            return { success: true, data: result.data || [] };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/createTable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create table');
            const result = await response.json();
            return { success: true, data: result.data };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    update: async (id, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/updateTable`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, id })
            });
            if (!response.ok) throw new Error('Failed to update table');
            const result = await response.json();
            return { success: true, data: result.data };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/deleteTable`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!response.ok) throw new Error('Failed to delete table');
            return { success: true };
        } catch (error) {
            throw new Error(error.message);
        }
    }
};
