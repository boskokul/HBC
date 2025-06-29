import { MapPin } from 'lucide-react';
import { formatEther } from 'ethers';
import { Apartment } from '../../model/interfaces';

interface PageProps {
    apartments: Apartment[];
    loading: boolean;
    connected: boolean;
}

const BrowseApartments = ({ 
  apartments, 
  loading, 
  connected,
}: PageProps) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Available Apartments
      </h2>
      {apartments.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No apartments listed yet.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apartments.map((apartment) => (
          <div
            key={apartment.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <img
              src={
                apartment.imageUrls[0] ||
                "https://via.placeholder.com/400x300.png?text=Apartment+Image"
              }
              alt={apartment.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {apartment.name}
              </h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{apartment.location}</span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {apartment.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatEther(apartment.pricePerNight)} ETH
                  </span>
                  <span className="text-gray-500 text-sm ml-1">
                    /night
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!connected) {
                      alert("Please connect your wallet first");
                      return;
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseApartments;