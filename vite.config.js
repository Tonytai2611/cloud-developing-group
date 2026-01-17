import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/(register|login|logout|me|user|confirm|confirmUser|verify-email|contact|upload|health|createBooking|updateBooking|deleteBooking|getBooking|createTable|updateTable|deleteTable|getTable|createMenuItem|updateMenuItem|deleteMenuItem|getMenu)': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})