import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';

function AdminHeader() {
    const navigate = useNavigate();

    const onLogout = async () => {
        try {
            const response = await fetch("/api/logout", {
                method: "POST",
            });

            if (response.ok) {
                toast.success("Logged out successfully");
                navigate("/");
                window.location.reload(); // Reload to clear user state
            } else {
                throw new Error("Failed to log out");
            }
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Logout failed", {
                description: err.message || "An error occurred"
            });
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
