import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Package, 
  Heart, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Star,
  MessageSquare
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('listings');

  const { data: userListings } = useQuery(
    ['userListings', user?.id],
    async () => {
      const response = await api.get('/listings?user=true');
      return response.data.data;
    },
    { enabled: !!user }
  );

  const { data: favorites } = useQuery(
    'favorites',
    async () => {
      const response = await api.get('/favorites');
      return response.data.data;
    },
    { enabled: !!user }
  );

  const deleteListingMutation = useMutation(
    (id) => api.delete(`/listings/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userListings');
      }
    }
  );

  const stats = [
    {
      label: 'Active Listings',
      value: userListings?.listings?.filter(l => l.status === 'APPROVED').length || 0,
      icon: Package,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Pending Approval',
      value: userListings?.listings?.filter(l => l.status === 'PENDING').length || 0,
      icon: Eye,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      label: 'Total Views',
      value: userListings?.listings?.reduce((acc, listing) => acc + listing.viewCount, 0) || 0,
      icon: Eye,
      color: 'text-green-600 bg-green-100'
    },
    {
      label: 'Favorites',
      value: favorites?.length || 0,
      icon: Heart,
      color: 'text-red-600 bg-red-100'
    }
  ];

  const handleDeleteListing = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      await deleteListingMutation.mutateAsync(id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please Login
          </h2>
          <p className="text-gray-600">
            You need to be logged in to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">
            Manage your listings, favorites, and account settings.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'listings', label: 'My Listings', icon: Package },
                { id: 'favorites', label: 'Favorites', icon: Heart },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'listings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    My Listings
                  </h2>
                  <a
                    href="/create-listing"
                    className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Listing</span>
                  </a>
                </div>

                <div className="space-y-4">
                  {userListings?.listings?.map((listing) => (
                    <div
                      key={listing.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex space-x-4 flex-1">
                          <img
                            src={listing.images[0] || '/placeholder-image.jpg'}
                            alt={listing.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {listing.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                                {listing.currency} {listing.price}
                              </span>
                              <span>{listing.city}, {listing.province}</span>
                              <span className={`px-2 py-1 rounded-full ${
                                listing.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-800'
                                  : listing.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {listing.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.location.href = `/listings/${listing.id}`}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/edit-listing/${listing.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {userListings?.listings?.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No listings yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start by creating your first listing to reach potential customers.
                      </p>
                      <a
                        href="/create-listing"
                        className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Create Your First Listing
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Favorite Listings
                </h2>
                {/* Favorites content would go here */}
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-gray-600">
                    Listings you mark as favorite will appear here.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Account Settings
                </h2>
                {/* Settings form would go here */}
                <div className="max-w-md">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={user.phone}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;