import React, { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import {
  ethers,
  BrowserProvider,
  Signer,
  Contract,
  parseEther,
  formatEther,
} from "ethers";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
} from "./blockchainConnection/constants";
import { Booking, BookingStatus, Apartment } from "./model/interfaces";
import Header from "./layout/Header";
import BrowseApartments from "./layout/pages/BrowseApartments";
import { dateToUnixTimestamp } from "./helpers/dateTimeHelpers";
import MyBookings from "./layout/pages/MyBookings";
import ListProperty from "./layout/pages/ListProperty";
import ListingModal from "./layout/modals/ListingModal";
import { SECONDS_PER_DAY } from "./constants";
import BookingModal from "./layout/modals/BookingModal";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
    Web3?: typeof import("web3");
  }
}

const getBookingStatusString = (status: number): BookingStatus => {
  status = Number(status);
  switch (status) {
    case 0:
      return "Booked";
    case 1:
      return "CheckedIn";
    case 2:
      return "CheckedOut";
    case 3:
      return "Cancelled";
    case 4:
      return "Refunded";
    default:
      return "Booked";
  }
};

const TouristAgencyApp: React.FC = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "bookings" | "list">(
    "browse"
  );
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(
    null
  );
  const [checkInDateStr, setCheckInDateStr] = useState<string>("");
  const [checkOutDateStr, setCheckOutDateStr] = useState<string>("");
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [showListingModal, setShowListingModal] = useState<boolean>(false);
  const [newListing, setNewListing] = useState<Omit<Apartment, "id" | "owner">>(
    {
      name: "",
      location: "",
      description: "",
      pricePerNight: BigInt(0),
      imageUrls: [""],
    }
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      if (window.ethereum == null) {
        throw new Error(
          "MetaMask (or other EVM wallet) not detected. Please install it."
        );
      }

      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);

      const newSigner = await newProvider.getSigner();
      setSigner(newSigner);
      setAccount(await newSigner.getAddress());
      setConnected(true);

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        newSigner
      );
      setContract(contractInstance);

      alert("Wallet connected successfully!");
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setError(`Failed to connect wallet: ${err.message || err.toString()}`);
      setConnected(false);
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchApartments = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const contractApartments: any[] = await contract.getAllApartments();
      const formattedApartments: Apartment[] = contractApartments.map(
        (apt) => ({
          id: Number(apt.id),
          owner: apt.owner,
          name: apt.name,
          location: apt.location,
          description: apt.description,
          pricePerNight: apt.pricePerNight,
          imageUrls: apt.imageUrls,
        })
      );
      setApartments(formattedApartments);
    } catch (err: any) {
      console.error("Failed to fetch apartments:", err);
      setError(`Failed to fetch apartments: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const fetchMyBookings = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    setError(null);
    try {
      const bookingIds: bigint[] = await contract.getGuestBookings(account);
      const fetchedBookings: Booking[] = [];
      for (const id of bookingIds) {
        const bookingData: any = await contract.getBooking(id);
        console.log(bookingData);
        fetchedBookings.push({
          bookingId: Number(bookingData.bookingId),
          apartmentId: Number(bookingData.apartmentId),
          guest: bookingData.guest,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          totalPrice: bookingData.totalPrice,
          status: getBookingStatusString(bookingData.status),
          timestamp: bookingData.timestamp,
        });
      }
      //console.log(fetchedBookings);
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err);
      setError(`Failed to fetch bookings: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (contract) {
      fetchApartments();
    }
  }, [contract, fetchApartments]);

  useEffect(() => {
    if (activeTab === "bookings" && contract && account) {
      fetchMyBookings();
    }
  }, [activeTab, contract, account, fetchMyBookings]);

  const handleListApartment = async (): Promise<void> => {
    if (!contract || !signer || !account) {
      alert("Please connect your wallet first.");
      return;
    }
    if (
      !newListing.name ||
      !newListing.location ||
      newListing.pricePerNight <= 0
    ) {
      alert(
        "Please fill in all required fields and ensure price is greater than 0."
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tx = await contract.listApartment(
        newListing.name,
        newListing.location,
        newListing.description,
        newListing.pricePerNight,
        newListing.imageUrls.filter((url) => url.trim() !== "")
      );
      await tx.wait();

      alert("Apartment listed successfully!");
      setShowListingModal(false);
      setNewListing({
        name: "",
        location: "",
        description: "",
        pricePerNight: BigInt(0),
        imageUrls: [""],
      });
      fetchApartments();
    } catch (err: any) {
      console.error("Listing failed:", err);
      setError(`Listing failed: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBookApartment = async (): Promise<void> => {
    if (!selectedApartment || !checkInDateStr || !checkOutDateStr) {
      alert("Please select an apartment and fill in check-in/check-out dates.");
      return;
    }
    if (!contract || !signer || !account) {
      alert("Please connect your wallet to book.");
      return;
    }

    const checkInTimestamp = dateToUnixTimestamp(checkInDateStr);
    const checkOutTimestamp = dateToUnixTimestamp(checkOutDateStr);

    if (checkOutTimestamp <= checkInTimestamp) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    const nights =
      (checkOutTimestamp - checkInTimestamp) / BigInt(SECONDS_PER_DAY);
    const totalPriceWei = nights * selectedApartment.pricePerNight;

    setLoading(true);
    setError(null);
    try {
      const tx = await contract.bookApartment(
        selectedApartment.id,
        checkInTimestamp,
        checkOutTimestamp,
        { value: totalPriceWei }
      );
      await tx.wait();

      alert("Booking successful!");
      setShowBookingModal(false);
      setSelectedApartment(null);
      setCheckInDateStr("");
      setCheckOutDateStr("");
      fetchApartments();
      fetchMyBookings();
    } catch (err: any) {
      console.error("Booking failed:", err);
      setError(`Booking failed: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: number): Promise<void> => {
    if (!contract || !signer || !account) {
      alert("Please connect your wallet.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to check-in to booking ID ${bookingId}?`
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const tx = await contract.checkIn(bookingId);
      await tx.wait();
      alert("Checked in successfully!");
      fetchMyBookings();
    } catch (err: any) {
      console.error("Check-in failed:", err);
      setError(`Check-in failed: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (bookingId: number): Promise<void> => {
    if (!contract || !signer || !account) {
      alert("Please connect your wallet.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to check-out from booking ID ${bookingId}?`
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const tx = await contract.checkOut(bookingId);
      await tx.wait();
      alert("Checked out successfully!");
      fetchMyBookings();
    } catch (err: any) {
      console.error("Check-out failed:", err);
      setError(`Check-out failed: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number): Promise<void> => {
    if (!contract || !signer || !account) {
      alert("Please connect your wallet.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to cancel booking ID ${bookingId}? This action is irreversible.`
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const tx = await contract.cancelBooking(bookingId);
      await tx.wait();
      alert("Booking cancelled successfully! Refund processed.");
      fetchMyBookings();
      fetchApartments();
    } catch (err: any) {
      console.error("Cancellation failed:", err);
      setError(`Cancellation failed: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApartmentPrice = async (
    apartmentId: number,
    currentPrice: bigint
  ): Promise<void> => {
    if (!contract || !signer || !account) {
      alert("Please connect your wallet.");
      return;
    }

    const newPriceStr = prompt(
      `Enter new price in ETH for apartment ID ${apartmentId}: (Current: ${formatEther(
        currentPrice
      )} ETH)`
    );
    if (newPriceStr === null || newPriceStr.trim() === "") {
      return;
    }

    let newPriceWei: bigint;
    try {
      newPriceWei = parseEther(newPriceStr);
      if (newPriceWei <= 0) {
        alert("New price must be greater than 0.");
        return;
      }
    } catch (e) {
      alert("Invalid price format. Please enter a number (e.g., 0.1, 0.05).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tx = await contract.updateApartmentPrice(apartmentId, newPriceWei);
      await tx.wait();
      alert(`Apartment ${apartmentId} price updated to ${newPriceStr} ETH.`);
      fetchApartments();
    } catch (err: any) {
      console.error("Price update failed:", err);
      setError(`Price update failed: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApartment = async (apartmentId: number): Promise<void> => {
    if (!contract || !signer || !account) {
      alert("Please connect your wallet.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tx = await contract.deleteApartment(apartmentId);
      await tx.wait();
      alert(`Apartment ${apartmentId} deleted.`);
      fetchApartments();
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError(`Delete failed: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListingClose = () => {
    setShowListingModal(false);
    setNewListing({
      name: "",
      location: "",
      description: "",
      pricePerNight: BigInt(0),
      imageUrls: [""],
    });
  };

  const handleBookingClose = () => {
    setShowBookingModal(false);
    setSelectedApartment(null);
    setCheckInDateStr("");
    setCheckOutDateStr("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header
        connected={connected}
        account={account}
        activeTab={activeTab}
        connectWallet={connectWallet}
        loading={loading}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-700">Loading...</p>
            </div>
          </div>
        )}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <XCircle
                className="w-5 h-5 text-red-500 cursor-pointer"
                onClick={() => setError(null)}
              />
            </span>
          </div>
        )}
        {activeTab === "browse" && (
          <BrowseApartments
            apartments={apartments}
            connected={connected}
            loading={loading}
            setSelectedApartment={setSelectedApartment}
            setShowBookingModal={setShowBookingModal}
          />
        )}
        {activeTab === "bookings" && (
          <MyBookings
            apartments={apartments}
            bookings={bookings}
            connectWallet={connectWallet}
            connected={connected}
            handleCancelBooking={handleCancelBooking}
            handleCheckIn={handleCheckIn}
            handleCheckOut={handleCheckOut}
            loading={loading}
          />
        )}
        {activeTab === "list" && (
          <ListProperty
            account={account}
            apartments={apartments}
            connectWallet={connectWallet}
            connected={connected}
            loading={loading}
            handleUpdateApartmentPrice={handleUpdateApartmentPrice}
            handleDeleteApartment={handleDeleteApartment}
            setShowListingModal={setShowListingModal}
          />
        )}
      </main>
      <BookingModal
        showModal={showBookingModal}
        selectedApartment={selectedApartment}
        checkInDateStr={checkInDateStr}
        setCheckInDateStr={setCheckInDateStr}
        checkOutDateStr={checkOutDateStr}
        setCheckOutDateStr={setCheckOutDateStr}
        loading={loading}
        onClose={handleBookingClose}
        onConfirmBooking={handleBookApartment}
      />

      <ListingModal
        showModal={showListingModal}
        newListing={newListing}
        setNewListing={setNewListing}
        loading={loading}
        onClose={handleListingClose}
        onListProperty={handleListApartment}
      />
    </div>
  );
};

export default TouristAgencyApp;
