import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Eye, EyeOff, Mail, Lock, User, Check, X, UserCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import AWS from 'aws-sdk';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';

const Header = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("login");
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('customer'); // Default role
    const [user, setUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Password requirements
    const passwordRequirements = [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
        { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
        { label: 'One number', test: (p) => /\d/.test(p) },
        { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    // Generate SECRET_HASH for Cognito using crypto-js
    const generateSecretHash = (username, clientId, clientSecret) => {
        const message = username + clientId;
        const hash = CryptoJS.HmacSHA256(message, clientSecret);
        return CryptoJS.enc.Base64.stringify(hash);
    };

    // Fetch user info
    const fetchUserInfo = async () => {
        try {
            const response = await fetch("/api/me");
            if (response.ok) {
                const data = await response.json();
                setUser(data.userInfo);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    // Handle login
    const onSubmitLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Login failed");
            }

            const result = await response.json();
            toast.success("Welcome back!", {
                description: result.isAdmin ? "Redirecting to admin panel..." : "Login successful"
            });
            fetchUserInfo();
            if (result.isAdmin) {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error("Login failure:", err);
            toast.error("Login failed", {
                description: err.message || "Invalid credentials"
            });
        }
    };

    // Handle register
    const onSubmit = async (event) => {
        event.preventDefault();

        const clientId = "10g093m0qo9fj9hsar5ngtp8ej";
        const clientSecret = "1vo0m75h340fhfd828uovmr3nqdeeq3okg559nv85hp2mqvrjvf";
        const region = "us-east-1";

        const secretHash = generateSecretHash(username, clientId, clientSecret);

        const cognito = new AWS.CognitoIdentityServiceProvider({ region });

        const params = {
            ClientId: clientId,
            SecretHash: secretHash,
            Username: username,
            Password: password,
            UserAttributes: [
                {
                    Name: "email",
                    Value: email,
                },
                {
                    Name: "name",
                    Value: name,
                },
            ],
        };

        try {
            const data = await cognito.signUp(params).promise();
            console.log("Sign-up successful:", data);
            toast.success("Registration successful!", {
                description: "Please check your email for verification code"
            });

            // persist registration info so verify page can include email/name/role
            localStorage.setItem('username', username);
            localStorage.setItem('email', email);
            localStorage.setItem('name', name);
            localStorage.setItem('role', role); // Save role to localStorage

            // Close dialog before navigating
            setDialogOpen(false);

            // Small delay to allow dialog to close smoothly
            setTimeout(() => {
                navigate('/verify-email');
            }, 100);
        } catch (err) {
            console.error("Error during sign-up:", err);
            toast.error("Registration failed", {
                description: err.message || "Error during sign-up"
            });
        }
    };

    // Handle logout
    const onLogout = async () => {
        try {
            const response = await fetch("/api/logout", {
                method: "POST",
            });

            if (response.ok) {
                setUser(null);
                toast.success("Logged out successfully");
                navigate("/");
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

    const onUserProfile = () => {
        navigate("/user-profile");
    };

    return (
        <header className="fixed top-0 w-full bg-gradient-to-r from-[#0F4C4C] via-[#0B6B6B] to-[#0F6F5F] shadow z-50">
            <nav className="container flex items-center justify-between h-20">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="BrewCraft" className="w-12 h-12 rounded-md object-cover shadow-sm" />
                        <span className="text-white text-xl font-semibold">BrewCraft</span>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-10">
                    <Link to="/" className="text-white hover:text-yellow-200 transition font-medium">
                        Home
                    </Link>
                    <Link to="/menu" className="text-white hover:text-yellow-200 transition font-medium">
                        Menu
                    </Link>
                    <Link to="/table" className="text-white hover:text-yellow-200 transition font-medium">
                        Table
                    </Link>
                    <Link to="/contact-us" className="text-white hover:text-yellow-200 transition font-medium">
                        Contact Us
                    </Link>
                    {user && (
                        <Link to="/chat" className="text-white hover:text-yellow-200 transition font-medium flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Chat
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                                <div className="text-xs text-white/80 font-medium">Welcome back</div>
                                <div
                                    onClick={onUserProfile}
                                    className="font-semibold text-white hover:text-yellow-200 cursor-pointer transition-colors flex items-center gap-1.5"
                                >
                                    <UserCircle className="w-4 h-4" />
                                    {user.username}
                                </div>
                            </div>
                            <Button
                                onClick={onLogout}
                                className="bg-white/90 backdrop-blur-sm text-teal-700 hover:bg-white hover:scale-105 transition-all px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl border border-white/50"
                            >
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-white/90 backdrop-blur-sm text-teal-700 hover:bg-white hover:scale-105 transition-all px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl border border-white/50">
                                    Login
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="bg-white p-0 rounded-xl shadow-2xl max-w-md mx-auto overflow-hidden max-h-[90vh] overflow-y-auto">
                                {/* Header with gradient */}
                                <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white sticky top-0 z-10">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold text-white">
                                            {activeTab === "login" ? "Welcome Back!" : "Create Account"}
                                        </DialogTitle>
                                        <DialogDescription className="text-teal-100 text-sm">
                                            {activeTab === "login"
                                                ? "Sign in to access your account"
                                                : "Fill in the details to get started"}
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>

                                <div className="p-4">
                                    {/* Tab Buttons */}
                                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                                        <button
                                            className={`flex-1 px-4 py-2 font-medium transition-all rounded-md text-sm ${activeTab === "login"
                                                    ? "bg-white text-teal-600 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                }`}
                                            onClick={() => setActiveTab("login")}
                                        >
                                            Login
                                        </button>
                                        <button
                                            className={`flex-1 px-4 py-2 font-medium transition-all rounded-md text-sm ${activeTab === "register"
                                                    ? "bg-white text-teal-600 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                }`}
                                            onClick={() => setActiveTab("register")}
                                        >
                                            Register
                                        </button>
                                    </div>

                                    {activeTab === "login" && (
                                        <form className="space-y-3">
                                            {/* Username Field */}
                                            <div>
                                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Username
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        id="username"
                                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white text-sm"
                                                        placeholder="Enter your username"
                                                        onChange={(event) => setUsername(event.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Password Field */}
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Lock className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        id="password"
                                                        className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white text-sm"
                                                        placeholder="Enter your password"
                                                        onChange={(event) => setPassword(event.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Forgot Password */}
                                            <div className="flex justify-end">
                                                <a href="#" className="text-xs text-teal-600 hover:text-teal-500 font-medium">
                                                    Forgot password?
                                                </a>
                                            </div>

                                            <Button
                                                onClick={onSubmitLogin}
                                                disabled={loading}
                                                className="w-full bg-teal-500 text-white hover:bg-teal-600 transition-all py-2 rounded-lg font-medium shadow-sm disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Signing in...
                                                    </span>
                                                ) : "Sign In"}
                                            </Button>
                                        </form>
                                    )}

                                    {activeTab === "register" && (
                                        <form className="space-y-3" onSubmit={onSubmit}>
                                            {/* Name and Email in 2 columns */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Name Field */}
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Full Name
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                                            <User className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            id="name"
                                                            className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white text-sm"
                                                            placeholder="Your name"
                                                            onChange={(event) => setName(event.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Username Field */}
                                                <div>
                                                    <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Username
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                                            <User className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            id="reg-username"
                                                            className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white text-sm"
                                                            placeholder="Username"
                                                            onChange={(event) => setUsername(event.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email Field */}
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white text-sm"
                                                        placeholder="Enter your email"
                                                        onChange={(event) => setEmail(event.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Role and Password in 2 columns */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Role Field */}
                                                <div>
                                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Role
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            id="role"
                                                            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white appearance-none cursor-pointer text-sm"
                                                            value={role}
                                                            onChange={(event) => setRole(event.target.value)}
                                                        >
                                                            <option value="customer">Customer</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Password Field */}
                                                <div>
                                                    <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Password
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                                            <Lock className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            id="reg-password"
                                                            className="w-full pl-8 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-gray-50 focus:bg-white text-sm"
                                                            placeholder="Password"
                                                            onChange={(event) => setPassword(event.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Password Requirements - Compact 2 columns */}
                                            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                                                <p className="text-xs font-medium text-gray-600 mb-1.5">Password requirements:</p>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                                    {passwordRequirements.map((req, index) => {
                                                        const isValid = req.test(password);
                                                        return (
                                                            <div key={index} className="flex items-center gap-1.5">
                                                                {isValid ? (
                                                                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <X className="h-3 w-3 text-gray-300 flex-shrink-0" />
                                                                )}
                                                                <span className={`text-xs ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {req.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-teal-500 text-white hover:bg-teal-600 transition-all py-2 rounded-lg font-medium shadow-sm disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Creating...
                                                    </span>
                                                ) : "Create Account"}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
