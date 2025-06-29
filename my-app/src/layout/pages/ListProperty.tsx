import React from 'react';
import { Wallet, DollarSign } from 'lucide-react';
import { formatEther } from 'ethers';
import { Apartment } from '../../model/interfaces';

interface PageProps {
    apartments: Apartment[];
    loading: boolean;
    connected: boolean;
    connectWallet: () => Promise<void>;
    account: string | null;
    setShowListingModal: (value: boolean) => void;
    handleUpdateApartmentPrice: (apartmentId: number, currentPrice: bigint) => Promise<void>;
}

const ListProperty = ({ 
  connected, 
  loading, 
  connectWallet,
  setShowListingModal,
  apartments,
  account,
  handleUpdateApartmentPrice
}: PageProps) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        List Your Property
      </h2>
      {!connected ? (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            Connect your wallet to list a property
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            disabled={loading}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={() => setShowListingModal(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            disabled={loading}
          >
            + List New Property
          </button>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Listed Properties
            </h3>
            {apartments.filter(
              (apt) =>
                apt.owner.toLowerCase() ===
                (account ? account.toLowerCase() : "")
            ).length === 0 && !loading ? (
              <p className="text-gray-500">No properties listed yet.</p>
            ) : (
              <div className="space-y-4">
                {apartments
                  .filter(
                    (apt) =>
                      apt.owner.toLowerCase() ===
                      (account ? account.toLowerCase() : "")
                  )
                  .map((apartment) => (
                    <div
                      key={apartment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {apartment.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {apartment.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">
                            {formatEther(apartment.pricePerNight)}{" "}
                            ETH/night
                          </p>
                          <p className="text-sm text-gray-500">Active</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() =>
                            handleUpdateApartmentPrice(
                              apartment.id,
                              apartment.pricePerNight
                            )
                          }
                          className="bg-indigo-500 text-white px-3 py-1 rounded-lg hover:bg-indigo-600 transition text-sm flex items-center space-x-1"
                          disabled={loading}
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Update Price</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProperty;