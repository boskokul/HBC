import React, { useState } from 'react';
import './App.css';
import Web3 from 'web3';

declare global {
  interface Window {
    ethereum?: import('ethers').Eip1193Provider;
    Web3?: typeof import('web3');
  }
}

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState<any>(null);
  const [web3, setWeb3] = useState<any>(null);
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const contractABI = [
    {
      "inputs": [
        {"internalType": "uint256", "name": "a", "type": "uint256"},
        {"internalType": "uint256", "name": "b", "type": "uint256"}
      ],
      "name": "addNumbers",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getResult",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "result",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const contractAddress = "0xC8d360977bfA7340a6D7A6AfBF1D6F7034E26254";

  //IMPORTANT FUNCION
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        setAccount(accounts[0]);

        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // contract initialization
        const contractInstance = new web3Instance.eth.Contract(
          contractABI,
          contractAddress
        );
        setContract(contractInstance);
        
        console.log('Connected to:', accounts[0]);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const addNumbers = async () => {
    if (!contract || !num1 || !num2) {
      alert('Please connect wallet and enter both numbers');
      return;
    }

    try {
      setLoading(true);
      
      await contract.methods.addNumbers(num1, num2).send({
        from: account,
        gas: 100000
      });
      
      const contractResult = await contract.methods.getResult().call();
      setResult(contractResult);
      
      console.log('Addition completed!');
    } catch (error) {
      console.error('Error calling contract:', error);
      alert('Transaction failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentResult = async () => {
    if (!contract) {
      alert('Please connect wallet first');
      return;
    }

    try {
      const contractResult = await contract.methods.getResult().call();
      setResult(contractResult);
    } catch (error) {
      console.error('Error getting result:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Simple Contract Adder
        </h1>
        
        <div className="mb-6">
          {account ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="text-sm">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Connect MetaMask
            </button>
          )}
        </div>

        {account && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Number:
              </label>
              <input
                type="number"
                value={num1}
                onChange={(e) => setNum1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Second Number:
              </label>
              <input
                type="number"
                value={num2}
                onChange={(e) => setNum2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter second number"
              />
            </div>
            
            <button
              onClick={addNumbers}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Add Numbers'}
            </button>
            
            <button
              onClick={getCurrentResult}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Get Current Result
            </button>
            
            {result && (
              <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                <p className="text-lg font-semibold">Result: {result}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
