import React, { useState, useEffect, useCallback } from "react";
import {
  XCircle,
} from "lucide-react";
import {
  ethers,
  BrowserProvider,
  Signer,
  Contract,
  parseEther,
  formatEther,
} from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./blockchainConnection/constants";
import { Apartment } from "./model/interfaces";
import Header from "./layout/Header";
import BrowseApartments from "./layout/pages/BrowseApartments";
import ListProperty from "./layout/pages/ListProperty";
import ListingModal from "./layout/modals/ListingModal";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
    Web3?: typeof import("web3");
  }
}

const TouristAgencyApp: React.FC = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "bookings" | "list">(
    "browse"
  );
  const [showListingModal, setShowListingModal] = useState<boolean>(false);
  const [newListing, setNewListing] = useState<Omit<Apartment, "id" | "owner">>(
    {
      name: "",
      location: "",
      description: "",
      pricePerNight: BigInt(0), // Initialize as BigInt
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

  useEffect(() => {
    if (contract) {
      fetchApartments();
    }
  }, [contract, fetchApartments]);

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
        newListing.imageUrls.filter((url) => url.trim() !== "") // Filter empty strings
      );
      await tx.wait(); // Wait for transaction to be mined

      alert("Apartment listed successfully!");
      setShowListingModal(false);
      setNewListing({
        name: "",
        location: "",
        description: "",
        pricePerNight: BigInt(0),
        imageUrls: [""],
      });
      fetchApartments(); // Refresh apartment list
    } catch (err: any) {
      console.error("Listing failed:", err);
      setError(`Listing failed: ${err.message || err.toString()}`);
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
            setShowListingModal={setShowListingModal}
          />
        )}
      </main>
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
