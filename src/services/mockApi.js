// Mock API Service - Simulates API calls with setTimeout
// When Backend is ready, just edit this file!

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// MOCK DATA
// ============================================

const MOCK_MENU = [
    {
        id: "1",
        name: "Special Beef Pho",
        price: 65000,
        category: "Main Course",
        image: "https://placehold.co/400x300/teal/white?text=Beef+Pho",
        description: "Traditional Vietnamese beef noodle soup",
        available: true
    },
    {
        id: "2",
        name: "Hanoi Grilled Pork with Noodles",
        price: 55000,
        category: "Main Course",
        image: "https://placehold.co/400x300/orange/white?text=Bun+Cha",
        description: "Grilled pork with fresh rice noodles",
        available: true
    },
    {
        id: "3",
        name: "Peach Lemongrass Tea",
        price: 45000,
        category: "Beverages",
        image: "https://placehold.co/400x300/pink/white?text=Peach+Tea",
        description: "Refreshing and sweet",
        available: true
    },
    {
        id: "4",
        name: "Vietnamese Iced Coffee",
        price: 35000,
        category: "Beverages",
        image: "https://placehold.co/400x300/brown/white?text=Coffee",
        description: "Traditional strong coffee",
        available: true
    },
    {
        id: "5",
        name: "Caramel Flan",
        price: 25000,
        category: "Desserts",
        image: "https://placehold.co/400x300/yellow/white?text=Flan",
        description: "Smooth and sweet",
        available: true
    }
];

const MOCK_TABLES = [
    { id: "t1", tableNumber: "Table 01", seats: 4, status: "AVAILABLE" },
    { id: "t2", tableNumber: "Table 02", seats: 2, status: "OCCUPIED" },
    { id: "t3", tableNumber: "Table 03", seats: 6, status: "AVAILABLE" },
    { id: "t4", tableNumber: "Table 04", seats: 4, status: "RESERVED" },
    { id: "t5", tableNumber: "Table 05", seats: 2, status: "AVAILABLE" },
    { id: "t6", tableNumber: "Table 06", seats: 8, status: "AVAILABLE" },
    { id: "t7", tableNumber: "Table 07", seats: 4, status: "OCCUPIED" },
    { id: "t8", tableNumber: "Table 08", seats: 2, status: "AVAILABLE" }
];

const MOCK_BOOKINGS = [
    {
        id: "b1",
        customerName: "John Doe",
        phone: "0909123456",
        email: "johndoe@example.com",
        date: "2025-12-26",
        time: "19:00",
        guests: 4,
        tableId: null,
        status: "PENDING",
        selectedItems: [
            { id: "1", name: "Special Beef Pho", price: 65000, quantity: 2 },
            { id: "3", name: "Peach Lemongrass Tea", price: 45000, quantity: 2 }
        ],
        total: 220000,
        createdAt: "2025-12-25T10:30:00Z"
    },
    {
        id: "b2",
        customerName: "Jane Smith",
        phone: "0912345678",
        email: "janesmith@example.com",
        date: "2025-12-26",
        time: "20:00",
        guests: 2,
        tableId: "t2",
        status: "CONFIRMED",
        selectedItems: [
            { id: "2", name: "Hanoi Grilled Pork with Noodles", price: 55000, quantity: 2 }
        ],
        total: 110000,
        createdAt: "2025-12-24T15:20:00Z"
    }
];

// ============================================
// API MOCK FUNCTIONS
// ============================================

export const api = {
    // MENU APIs
    menu: {
        // GET all menu items
        list: async () => {
            await delay(800);
            return { success: true, data: MOCK_MENU };
        },

        // GET menu by category
        listByCategory: async (category) => {
            await delay(600);
            const filtered = MOCK_MENU.filter(item => item.category === category);
            return { success: true, data: filtered };
        },

        // CREATE new menu item
        create: async (data) => {
            await delay(1000);
            const newItem = {
                ...data,
                id: Date.now().toString(),
                available: true
            };
            MOCK_MENU.push(newItem);
            return { success: true, data: newItem };
        },

        // UPDATE menu item
        update: async (id, data) => {
            await delay(800);
            const index = MOCK_MENU.findIndex(item => item.id === id);
            if (index === -1) {
                throw new Error("Menu item not found");
            }
            MOCK_MENU[index] = { ...MOCK_MENU[index], ...data };
            return { success: true, data: MOCK_MENU[index] };
        },

        // DELETE menu item
        delete: async (id) => {
            await delay(800);
            const index = MOCK_MENU.findIndex(item => item.id === id);
            if (index === -1) {
                throw new Error("Menu item not found");
            }
            MOCK_MENU.splice(index, 1);
            return { success: true, message: "Deleted successfully" };
        }
    },

    // TABLE APIs
    tables: {
        // GET all tables
        list: async () => {
            await delay(600);
            return { success: true, data: MOCK_TABLES };
        },

        // GET available tables only
        listAvailable: async () => {
            await delay(500);
            const available = MOCK_TABLES.filter(t => t.status === "AVAILABLE");
            return { success: true, data: available };
        },

        // CREATE new table
        create: async (data) => {
            await delay(800);
            const newTable = {
                ...data,
                id: `t${MOCK_TABLES.length + 1}`,
                status: "AVAILABLE"
            };
            MOCK_TABLES.push(newTable);
            return { success: true, data: newTable };
        },

        // UPDATE table
        update: async (id, data) => {
            await delay(700);
            const index = MOCK_TABLES.findIndex(t => t.id === id);
            if (index === -1) {
                throw new Error("Table not found");
            }
            MOCK_TABLES[index] = { ...MOCK_TABLES[index], ...data };
            return { success: true, data: MOCK_TABLES[index] };
        },

        // DELETE table
        delete: async (id) => {
            await delay(700);
            const table = MOCK_TABLES.find(t => t.id === id);
            if (!table) {
                throw new Error("Table not found");
            }
            if (table.status === "OCCUPIED") {
                throw new Error("Cannot delete table that is currently occupied!");
            }
            const index = MOCK_TABLES.findIndex(t => t.id === id);
            MOCK_TABLES.splice(index, 1);
            return { success: true, message: "Deleted successfully" };
        }
    },

    // BOOKING APIs
    bookings: {
        // GET all bookings
        list: async () => {
            await delay(800);
            return { success: true, data: MOCK_BOOKINGS };
        },

        // GET bookings by status
        listByStatus: async (status) => {
            await delay(600);
            const filtered = MOCK_BOOKINGS.filter(b => b.status === status);
            return { success: true, data: filtered };
        },

        // CREATE new booking (Simulates Step Function)
        create: async (data) => {
            await delay(2000); // Simulate Step Function delay

            // Random 20% fail for error handling testing
            if (Math.random() < 0.2) {
                throw new Error("Table has been reserved! Please choose another table.");
            }

            const newBooking = {
                ...data,
                id: `b${MOCK_BOOKINGS.length + 1}`,
                status: "PENDING",
                createdAt: new Date().toISOString()
            };
            MOCK_BOOKINGS.push(newBooking);

            return {
                success: true,
                data: newBooking,
                message: "Booking successful! We will confirm via email."
            };
        },

        // UPDATE booking status (Admin approve/reject)
        updateStatus: async (id, status, tableId = null) => {
            await delay(1000);
            const index = MOCK_BOOKINGS.findIndex(b => b.id === id);
            if (index === -1) {
                throw new Error("Booking not found");
            }

            MOCK_BOOKINGS[index].status = status;
            if (tableId) {
                MOCK_BOOKINGS[index].tableId = tableId;
                // Update table status
                const tableIndex = MOCK_TABLES.findIndex(t => t.id === tableId);
                if (tableIndex !== -1) {
                    MOCK_TABLES[tableIndex].status = "RESERVED";
                }
            }

            return {
                success: true,
                data: MOCK_BOOKINGS[index],
                message: status === "CONFIRMED" ? "Booking approved" : "Booking rejected"
            };
        },

        // DELETE booking
        delete: async (id) => {
            await delay(800);
            const index = MOCK_BOOKINGS.findIndex(b => b.id === id);
            if (index === -1) {
                throw new Error("Booking not found");
            }
            MOCK_BOOKINGS.splice(index, 1);
            return { success: true, message: "Deleted successfully" };
        }
    }
};

// Export mock data for direct access if needed
export { MOCK_MENU, MOCK_TABLES, MOCK_BOOKINGS };
