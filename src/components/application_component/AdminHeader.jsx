import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';

function AdminHeader() {
    const navigate = useNavigate();

    const onLogout = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            
            if (token) {
                // Try to call logout API to invalidate token on server
                await fetch("/api/logout", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }).catch(() => {
                    // Ignore errors - we'll clear local storage anyway
                });
            }
            
            // Clear all auth data from localStorage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('idToken');
            localStorage.removeItem('username');
            localStorage.removeItem('email');
            localStorage.removeItem('name');
            localStorage.removeItem('role');
            
            toast.success("Logged out successfully");
            navigate("/");
            window.location.reload(); // Reload to clear user state
        } catch (err) {
            console.error("Logout error:", err);
            // Still clear local storage and redirect even if API fails
            localStorage.clear();
            toast.success("Logged out successfully");
            navigate("/");
            window.location.reload();
        }
    };

    return (
        <header className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 md:px-8 shadow-md mb-8">
            <div className="container mx-auto flex justify-between items-center">
                <h3 className="text-teal-600 text-3xl md:text-4xl font-extrabold">
                    Admin Dashboard
                </h3>
                <button
                    onClick={onLogout}
                    className="px-6 py-2 rounded-lg border-2 border-teal-500 bg-transparent text-teal-600 text-lg font-semibold flex items-center transition-all duration-200 hover:bg-teal-500 hover:text-white shadow-sm"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}

export default AdminHeader;
