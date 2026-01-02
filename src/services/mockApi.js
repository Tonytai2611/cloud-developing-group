// API Service - Connects to AWS API Gateway
// Real API implementation matching sample project structure

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Gateway Base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com';



export const api = {
    // MENU APIs - Real API Gateway calls (matching sample implementation)
    menu: {
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



        // CREATE new menu category (matching sample structure)
        create: async (data) => {
            try {
                // Send data directly - API Gateway HTTP API handles httpMethod automatically
                const response = await fetch(`${API_BASE_URL}/createMenuItem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)  // Send data directly, not wrapped
                });


                if (!response.ok) {
                    const errorText = await response.text();

                    throw new Error(`Failed to create menu category: ${response.status}`);
                }

                const result = await response.json();
                console.log('✅ API response:', result);

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
                    throw new Error('Failed to update menu category');
                }

                const result = await response.json();


                return { success: true, data: result.data || requestData };
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
                    throw new Error('Failed to delete menu category');
                }

                const result = await response.json();


                return { success: true, message: 'Deleted successfully' };
            } catch (error) {
                console.error('Error deleting menu:', error);
                throw new Error(error.message);
            }
        }
    },

    // UPLOAD API
    upload: {
        // Upload image to S3
        image: async (file) => {
            try {
                console.log('📤 Uploading image:', file.name);

                // Convert file to base64
                const base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result.split(',')[1];
                        resolve(base64String);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const fileName = `${Date.now()}-${file.name}`;

                const response = await fetch(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file: base64Data,
                        fileName: fileName
                    })
                });

                console.log('📤 Upload response status:', response.status);

                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }

                const result = await response.json();
                console.log('✅ Upload result:', result);

                return {
                    success: true,
                    url: result.url
                };
            } catch (error) {
                console.error('❌ Error uploading image:', error);
                throw new Error(error.message);
            }
        }
    },
};


