import React from 'react';

export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/admin/manage-menu" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
            <h2 className="text-2xl font-bold mb-2">Manage Menu</h2>
            <p className="text-gray-600">Add, edit, or delete menu items</p>
          </a>
          <a href="/admin/manage-table" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
            <h2 className="text-2xl font-bold mb-2">Manage Tables</h2>
            <p className="text-gray-600">Manage restaurant tables</p>
          </a>
          <a href="/admin/manage-ordering-food" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
            <h2 className="text-2xl font-bold mb-2">Orders</h2>
            <p className="text-gray-600">View and manage orders</p>
          </a>
          <a href="/admin/chat-with-users" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
            <h2 className="text-2xl font-bold mb-2">Chat with Users</h2>
            <p className="text-gray-600">Communicate with customers</p>
          </a>
        </div>
      </div>
    </div>
  );
}
