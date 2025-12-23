import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const Header = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("login");
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('customer'); // Default role
    const [user, setUser] = useState(null);

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
            alert("Login successful!");
            fetchUserInfo();
            if (result.isAdmin) {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error("Login failure:", err);
            alert(err.message || "An error occurred during login.");
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
            alert("User registered successfully!");

            // persist registration info so verify page can include email/name/role
            localStorage.setItem('username', username);
            localStorage.setItem('email', email);
            localStorage.setItem('name', name);
            localStorage.setItem('role', role); // Save role to localStorage
            navigate('/verify-email');
        } catch (err) {
            console.error("Error during sign-up:", err);
            alert(err.message || "Error during sign-up");
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
                alert("Logout successful!");
                navigate("/");
            } else {
                throw new Error("Failed to log out");
            }
        } catch (err) {
            console.error("Logout error:", err);
            alert(err.message || "An error occurred during logout.");
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
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="text-white text-sm">
                                <div className="text-xs text-white/80">Welcome</div>
                                <div onClick={onUserProfile} className="font-medium hover:underline cursor-pointer">{user.username}</div>
                            </div>
                            <Button
                                onClick={onLogout}
                                className="bg-white text-teal-600 hover:bg-yellow-200 transition px-4 py-2 rounded-lg font-medium shadow-sm"
                            >
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-white text-teal-600 hover:bg-yellow-200 transition px-4 py-2 rounded-lg font-medium shadow-sm">
                                    Login
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
                                <DialogHeader>
                                    <DialogTitle>
                                        {activeTab === "login" ? "Login" : "Register"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {activeTab === "login"
                                            ? "Please enter your credentials to login."
                                            : "Create a new account by filling out the details below."}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="flex space-x-4 mb-4">
                                    <button
                                        className={`px-4 py-2 font-medium transition-all rounded-md ${activeTab === "login" ? "bg-teal-500 text-white" : "bg-gray-200"
                                            }`}
                                        onClick={() => setActiveTab("login")}
                                    >
                                        Login
                                    </button>
                                    <button
                                        className={`px-4 py-2 font-medium transition-all rounded-md ${activeTab === "register" ? "bg-teal-500 text-white" : "bg-gray-200"
                                            }`}
                                        onClick={() => setActiveTab("register")}
                                    >
                                        Register
                                    </button>
                                </div>

                                {activeTab === "login" && (
                                    <form className="space-y-4">
                                        <div>
                                            <label htmlFor="username" className="block font-medium">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                id="username"
                                                className="w-full p-2 border rounded-md"
                                                placeholder="Enter your username"
                                                onChange={(event) => setUsername(event.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="password" className="block font-medium">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                className="w-full p-2 border rounded-md"
                                                placeholder="Enter your password"
                                                onChange={(event) => setPassword(event.target.value)}
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={onSubmitLogin}
                                                className="bg-teal-500 text-white hover:bg-teal-600 transition-all px-4 py-2 rounded-md"
                                            >
                                                Login
                                            </Button>
                                        </div>
                                    </form>
                                )}
                                {activeTab === "register" && (
                                    <form className="space-y-4" onSubmit={onSubmit}>
                                        <div>
                                            <label htmlFor="name" className="block font-medium">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                className="w-full p-2 border rounded-md"
                                                placeholder="Enter your name"
                                                onChange={(event) => setName(event.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block font-medium">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                className="w-full p-2 border rounded-md"
                                                placeholder="Enter your email"
                                                onChange={(event) => setEmail(event.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="role" className="block font-medium">
                                                Role
                                            </label>
                                            <select
                                                id="role"
                                                className="w-full p-2 border rounded-md"
                                                value={role}
                                                onChange={(event) => setRole(event.target.value)}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="username" className="block font-medium">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                id="username"
                                                className="w-full p-2 border rounded-md"
                                                placeholder="Enter your username"
                                                onChange={(event) => setUsername(event.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="password" className="block font-medium">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                className="w-full p-2 border rounded-md"
                                                placeholder="Enter your password"
                                                onChange={(event) => setPassword(event.target.value)}
                                            />
                                            <div className="text-sm text-gray-600 mt-2">
                                                <div>Password needs to have:</div>
                                                <div>• At least one uppercase character</div>
                                                <div>• At least one special character</div>
                                                <div>• At least one number character</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="submit"
                                                className="bg-teal-500 text-white hover:bg-teal-600 transition-all px-4 py-2 rounded-md"
                                            >
                                                Register
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
