// Main API Service - Re-exports all API modules
// Import individual API modules
import { menuApi } from './menuApi';
import { tableApi } from './tableApi';
import { bookingApi } from './bookingApi';

// Re-export for backward compatibility
export const api = {
    menu: menuApi,
    tables: tableApi,
    bookings: bookingApi
};

// Also export individual APIs for direct import
export { menuApi, tableApi, bookingApi };
