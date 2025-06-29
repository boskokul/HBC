import React from 'react';
import { formatEther, parseEther } from 'ethers';
import { Apartment } from '../../model/interfaces';

interface ModalProps{
    showModal: boolean;
    newListing: Omit<Apartment, "id" | "owner">;
    setNewListing: (value: React.SetStateAction<Omit<Apartment, "id" | "owner">>) => void;
    loading: boolean;
    onClose: () => void;
    onListProperty: () => Promise<void>
}

const ListingModal = ({
  showModal,
  newListing,
  setNewListing,
  loading,
  onClose,
  onListProperty
}: ModalProps) => {
  if (!showModal) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          List New Property
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="new-property-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Property Name *
            </label>
            <input
              id="new-property-name"
              type="text"
              value={newListing.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewListing({ ...newListing, name: e.target.value })
               }
              placeholder="e.g., Cozy Downtown Apartment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="new-location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location *
            </label>
            <input
              id="new-location"
              type="text"
              value={newListing.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewListing({ ...newListing, location: e.target.value })
              }
              placeholder="e.g., New York, NY"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="new-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="new-description"
              value={newListing.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewListing({
                ...newListing,
                description: e.target.value,
                })
              }
              placeholder="Describe your property..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="new-price-per-night"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price per Night (ETH) *
            </label>
            <input
              id="new-price-per-night"
              type="number"
              step="0.001"
              value={
                newListing.pricePerNight === BigInt(0)
                  ? ""
                  : formatEther(newListing.pricePerNight)
              }
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                try {
                setNewListing({
                    ...newListing,
                    pricePerNight: parseEther(e.target.value || "0"),
                });
                } catch (err) {
                console.error("Invalid ETH input:", e.target.value);
                setNewListing({
                    ...newListing,
                    pricePerNight: BigInt(0),
                }); // Reset to 0 or handle error
                }
              }}
              placeholder="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="new-image-url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Image URL
            </label>
            <input
              id="new-image-url"
              type="url"
              value={newListing.imageUrls[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewListing({
                ...newListing,
                imageUrls: [
                    e.target.value,
                    ...newListing.imageUrls.slice(1),
                ],
                })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onListProperty}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Listing..." : "List Property"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingModal;