// components/Header.tsx
import React from "react";
import { Home, Wallet } from "lucide-react";

interface HeaderProps {
  connected: boolean;
  account: string | null;
  activeTab: "browse" | "bookings" | "list";
  setActiveTab: (tab: "browse" | "bookings" | "list") => void;
  connectWallet: () => Promise<void>;
  loading: boolean;
}

const Header: React.FC<HeaderProps> = ({
  connected,
  account,
  activeTab,
  setActiveTab,
  connectWallet,
  loading,
}) => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Home className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Crypto Booking</h1>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab("browse")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === "browse"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === "bookings"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Bookings
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === "list"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                List Property
              </button>
            </nav>

            {!connected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                disabled={loading}
              >
                <Wallet className="w-4 h-4" />
                <span>{loading ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">
                  {account
                    ? `${account.slice(0, 6)}...${account.slice(-4)}`
                    : "Connected"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;