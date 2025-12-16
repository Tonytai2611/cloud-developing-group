import React from 'react';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Verify Email</h1>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-center mb-4">Please check your email for verification code.</p>
          <form className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter code"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition-all shadow-md"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
