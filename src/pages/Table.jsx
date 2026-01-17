import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi } from '../services/tableApi';
import { Users, Check, Clock, ArrowLeft } from 'lucide-react';

export default function Table() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [filterSeats, setFilterSeats] = useState('all');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await tableApi.list();
      setTables(response.data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    if (table.status === 'AVAILABLE') {
      setSelectedTable(table);
    }
  };

  const handleBookTable = () => {
    if (selectedTable) {
      // Navigate to booking page with selected table
      navigate('/booking', { state: { selectedTable } });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-50 border-green-500 hover:bg-green-100 cursor-pointer';
      case 'RESERVED':
        return 'bg-yellow-50 border-yellow-500 cursor-not-allowed opacity-60';
      default:
        return 'bg-gray-50 border-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <Check className="w-6 h-6 text-green-600" />;
      case 'RESERVED':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      default:
        return null;
    }
  };

  const filteredTables = tables.filter(table => {
    if (filterSeats === 'all') return true;
    const seats = parseInt(filterSeats);
    return table.seats === seats;
  });

  const availableTables = tables.filter(t => t.status === 'AVAILABLE');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            Choose Your Table
          </h1>
          <p className="text-xl text-gray-600">
            {availableTables.length} tables available
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Filter by Seats</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterSeats('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${filterSeats === 'all'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Tables
            </button>
            {[2, 4, 6, 8, 10, 12].map(seats => (
              <button
                key={seats}
                onClick={() => setFilterSeats(seats.toString())}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${filterSeats === seats.toString()
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {seats} Seats
              </button>
            ))}
          </div>
        </div>

        {/* Selected Table Info */}
        {selectedTable && (
          <div className="mb-8 bg-teal-500 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Selected: {selectedTable.tableNumber}
                </h3>
                <p className="text-teal-100">
                  <Users className="inline w-5 h-5 mr-2" />
                  {selectedTable.seats} seats
                </p>
              </div>
              <button
                onClick={handleBookTable}
                className="bg-white text-teal-600 font-bold py-3 px-8 rounded-lg hover:bg-teal-50 transition-all shadow-md"
              >
                Book This Table
              </button>
            </div>
          </div>
        )}

        {/* Tables Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-2xl font-semibold text-teal-600">Loading tables...</div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-600">No tables found with selected criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTables.map(table => (
              <div
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`
                  relative rounded-xl shadow-lg p-6 border-4 transition-all transform
                  ${getStatusColor(table.status)}
                  ${selectedTable?.id === table.id ? 'ring-4 ring-teal-400 scale-105' : ''}
                  ${table.status === 'AVAILABLE' ? 'hover:scale-105 hover:shadow-xl' : ''}
                `}
              >
                {/* Status Icon */}
                <div className="absolute top-3 right-3">
                  {getStatusIcon(table.status)}
                </div>

                {/* Table Info */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {table.tableNumber}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">{table.seats} seats</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="text-center">
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${table.status === 'AVAILABLE'
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                      }`}
                  >
                    {table.status === 'AVAILABLE' ? 'Available' : 'Reserved'}
                  </span>
                </div>

                {/* Selected Indicator */}
                {selectedTable?.id === table.id && (
                  <div className="absolute inset-0 bg-teal-500 bg-opacity-10 rounded-xl flex items-center justify-center">
                    <div className="bg-teal-500 text-white rounded-full p-3">
                      <Check className="w-8 h-8" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 border-4 border-green-500 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Available</p>
                <p className="text-sm text-gray-600">Click to select</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 border-4 border-yellow-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Reserved</p>
                <p className="text-sm text-gray-600">Not available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
