// Menu API Service
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com';

export const menuApi = {
    // GET all menu categories
    list: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getMenu`);

            if (!response.ok) {
                throw new Error(`Failed to fetch menu: ${response.status}`);
            }

            const result = await response.json();

            // Handle different response formats
            let data;
            if (result.body) {
                // Response wrapped in body (Lambda proxy integration)
                const body = JSON.parse(result.body);
                data = body.data || [];
            } else if (result.data) {
                // Direct response
                data = result.data;
            } else if (Array.isArray(result)) {
                // Response is array directly
                data = result;
            } else {
                data = [];
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching menu:', error);
            throw new Error(error.message);
        }
    },

    // CREATE new menu category
    create: async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/createMenuItem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to create menu category: ${response.status}`);
            }

            const result = await response.json();

            // Parse response based on format
            let responseData;
            if (result.body) {
                const body = JSON.parse(result.body);
                responseData = body.data || data;
            } else if (result.data) {
                responseData = result.data;
            } else {
                responseData = data;
            }

            return { success: true, data: responseData };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // UPDATE menu category
    update: async (id, data) => {
        try {
            const requestData = { ...data, id };

            const response = await fetch(`${API_BASE_URL}/updateMenuItem`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update menu: ${response.status}`);
            }

            const result = await response.json();

            let responseData;
            if (result.body) {
                const body = JSON.parse(result.body);
                responseData = body.data || data;
            } else if (result.data) {
                responseData = result.data;
            } else {
                responseData = data;
            }

            return { success: true, data: responseData };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // DELETE menu category
    delete: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/deleteMenuItem`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (!response.ok) {
                throw new Error(`Failed to delete menu: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            throw new Error(error.message);
        }
    },

    // UPLOAD image
    uploadImage: async (file) => {
        try {
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const base64Data = await base64Promise;

            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: base64Data,
                    fileName: `${Date.now()}_${file.name}`
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload image');
            }

            const result = await response.json();

            return {
                success: true,
                url: result.url
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
};
