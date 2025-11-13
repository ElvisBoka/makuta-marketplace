import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../utils/api';
import { Search, Home, Car, Wrench, Heart, Shield, Star, Users } from 'lucide-react';

const Home = () => {
  const { data: featuredListings } = useQuery('featuredListings', async () => {
    const response = await api.get('/listings?featured=true&limit=6');
    return response.data.data;
  });

  const { data: categories } = useQuery('categories', async () => {
    const response = await api.get('/categories');
    return response.data.data;
  });

  const stats = [
    { number: '50,000+', label: 'Active Listings' },
    { number: '100,000+', label: 'Monthly Users' },
    { number: '10,000+', label: 'Verified Vendors' },
    { number: '$500K+', label: 'Transaction Volume' }
  ];

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Verified Profiles',
      description: 'All service providers are thoroughly verified for your safety and trust.'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Ratings & Reviews',
      description: 'Make informed decisions with genuine user reviews and ratings.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Local Community',
      description: 'Connect with trusted local businesses and service providers in your area.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Everything You Need in{' '}
            <span className="text-accent-200">DR Congo</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
            The largest online marketplace for real estate, vehicles, services, and more. 
            Connect, trade, and grow with MakutaPlace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/listings"
              className="bg-white text-primary-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Browse Listings
            </Link>
            <Link
              to="/create-listing"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary-600 transition-colors"
            >
              Post Your Ad
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Popular Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/listings?category=${category.slug}`}
                className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all card-hover border border-gray-200"
              >
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">
                  {category._count?.listings || 0} listings
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Featured Listings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredListings?.listings?.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl shadow-md overflow-hidden card-hover"
              >
                <img
                  src={listing.images[0] || '/placeholder-image.jpg'}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                      {listing.title}
                    </h3>
                    <span className="bg-primary-100 text-primary-800 text-sm px-2 py-1 rounded-full">
                      {listing.currency} {listing.price}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{listing.city}, {listing.province}</span>
                    <span className="flex items-center">
                      <Star className="w-4 h-4 fill-current text-yellow-400 mr-1" />
                      {listing.reviews.length > 0
                        ? (listing.reviews.reduce((acc, review) => acc + review.rating, 0) / listing.reviews.length).toFixed(1)
                        : 'New'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/listings"
              className="bg-primary-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 transition-colors"
            >
              View All Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Why Choose MakutaPlace?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 text-center shadow-sm card-hover"
              >
                <div className="text-primary-500 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
            Join thousands of users who are already buying, selling, and connecting on MakutaPlace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/listings"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary-600 transition-colors"
            >
              Explore Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;