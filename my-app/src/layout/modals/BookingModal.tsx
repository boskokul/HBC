import { Apartment } from '../../model/interfaces';
import { dateToUnixTimestamp } from '../../helpers/dateTimeHelpers';
import { formatEther } from 'ethers';
import { SECONDS_PER_DAY } from '../../constants';

interface ModalProps{
    showModal: boolean;
    selectedApartment: Apartment | null;
    loading: boolean;
    checkInDateStr: string;
    checkOutDateStr: string;
    setCheckInDateStr: (value: string) => void
    setCheckOutDateStr: (value: string) => void
    onClose: () => void;
    onConfirmBooking: () => Promise<void>;
}

const BookingModal = ({
  showModal,
  selectedApartment,
  checkInDateStr,
  setCheckInDateStr,
  checkOutDateStr,
  setCheckOutDateStr,
  loading,
  onClose,
  onConfirmBooking
}: ModalProps) => {
  if (!showModal || !selectedApartment) return null;

  const displayNights =
    selectedApartment && checkInDateStr && checkOutDateStr
      ? Number(
          (dateToUnixTimestamp(checkOutDateStr) -
            dateToUnixTimestamp(checkInDateStr)) /
            BigInt(SECONDS_PER_DAY)
        )
      : 0;

  const displayTotalPrice =
    selectedApartment && displayNights > 0
      ? formatEther(selectedApartment.pricePerNight * BigInt(displayNights))
      : "0";


  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Book {selectedApartment.name}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="check-in-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Check-in Date
            </label>
            <input
              id="check-in-date"
              type="date"
              value={checkInDateStr}
              onChange={(e) => setCheckInDateStr(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="check-out-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Check-out Date
            </label>
            <input
              id="check-out-date"
              type="date"
              value={checkOutDateStr}
              onChange={(e) => setCheckOutDateStr(e.target.value)}
              min={checkInDateStr || new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {checkInDateStr && checkOutDateStr && displayNights > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Nights:</span>
                <span className="font-medium">{displayNights}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Price:</span>
                <span className="font-bold text-blue-600">
                  {displayTotalPrice} ETH
                </span>
              </div>
            </div>
          )}
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
            onClick={onConfirmBooking}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled={loading || displayNights <= 0}
          >
            {loading ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;