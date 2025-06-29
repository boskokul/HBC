import { Wallet, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatEther } from 'ethers';
import { Apartment, Booking } from '../../model/interfaces';
import { unixTimestampToDateString } from '../../helpers/dateTimeHelpers';

interface PageProps {
    apartments: Apartment[];
    bookings: Booking[];
    loading: boolean;
    connected: boolean;
    connectWallet: () => Promise<void>;
    handleCheckIn: (bookingId: number) => Promise<void>;
    handleCheckOut: (bookingId: number) => Promise<void>;
    handleCancelBooking: (bookingId: number) => Promise<void>;
}


const MyBookings = ({ 
  connected, 
  bookings, 
  loading, 
  apartments,
  connectWallet,
  handleCheckIn,
  handleCancelBooking,
  handleCheckOut,
}: PageProps) => {

const getStatusIcon = (status: Booking["status"]) => {
    switch (status) {
        case "Booked":
        return <Clock className="w-4 h-4" />;
        case "CheckedIn":
        return <CheckCircle className="w-4 h-4" />;
        case "CheckedOut":
        return <CheckCircle className="w-4 h-4" />;
        case "Cancelled":
        return <XCircle className="w-4 h-4" />;
        default:
        return <Clock className="w-4 h-4" />;
    }
};

const getStatusColor = (status: Booking["status"]): string => {
    switch (status) {
        case "Booked":
        return "text-blue-600";
        case "CheckedIn":
        return "text-green-600";
        case "CheckedOut":
        return "text-gray-600";
        case "Cancelled":
        return "text-red-600";
        default:
        return "text-gray-600";
    }
};

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        My Bookings
      </h2>
      {!connected && (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            Connect your wallet to view your bookings
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            disabled={loading}
          >
            Connect Wallet
          </button>
        </div>
      )}
      {connected && bookings.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            No bookings yet. Browse apartments to make your first booking!
          </p>
        </div>
      )}
      {connected && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.bookingId}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Apartment ID: {booking.apartmentId} -{" "}
                  {apartments.find((a) => a.id === booking.apartmentId)
                    ?.name || "Loading Name..."}
                </h3>
                <div
                  className={`flex items-center space-x-1 ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {getStatusIcon(booking.status)}
                  <span className="font-medium">{booking.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Check-in</p>
                  <p className="font-medium">
                    {unixTimestampToDateString(booking.checkInDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out</p>
                  <p className="font-medium">
                    {unixTimestampToDateString(booking.checkOutDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Price</p>
                  <p className="font-medium">
                    {formatEther(booking.totalPrice)} ETH
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Booking ID</p>
                  <p className="font-medium">#{booking.bookingId}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                {booking.status === "Booked" && (
                  <>
                    {Number(booking.checkInDate) * 1000 <= Date.now() &&
                      Number(booking.checkOutDate) * 1000 >=
                        Date.now() && (
                        <button
                          onClick={() => handleCheckIn(booking.bookingId)}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition text-sm"
                          disabled={loading}
                        >
                          Check In
                        </button>
                      )}
                    {Number(booking.checkInDate) * 1000 > Date.now() && (
                      <button
                        onClick={() =>
                          handleCancelBooking(booking.bookingId)
                        }
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm"
                        disabled={loading}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </>
                )}
                {booking.status === "CheckedIn" && (
                  <button
                    onClick={() => handleCheckOut(booking.bookingId)}
                    className="bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition text-sm"
                    disabled={loading}
                  >
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;