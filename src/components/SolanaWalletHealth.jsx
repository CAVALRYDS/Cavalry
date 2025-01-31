import React, { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import "../App.css";

const SolanaWalletHealth = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSlot, setCurrentSlot] = useState(null);
  const [networkHealth, setNetworkHealth] = useState(null);
  const [walletScore, setWalletScore] = useState(null);

  useEffect(() => {
    const fetchCurrentSlot = async () => {
      try {
        const solana = new Connection("https://long-capable-season.solana-mainnet.quiknode.pro/ec90b275b32c8703f7115813d7dbd380c6732b53/");
        const slot = await solana.getSlot();
        setCurrentSlot(slot);
      } catch (err) {
        console.error("Failed to fetch current slot:", err);
      }
    };

    fetchCurrentSlot();
  }, []);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await fetch("https://long-capable-season.solana-mainnet.quiknode.pro/ec90b275b32c8703f7115813d7dbd380c6732b53/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: "1", method: "getHealth" }),
        });

        const data = await response.json();
        setNetworkHealth(data.result);
      } catch (err) {
        console.error("Failed to fetch network health:", err);
      }
    };

    fetchHealthData();
  }, []);

  const isValidSolanaAddress = (address) => {
    try {
      new PublicKey(address);
      return true;
    } catch (err) {
      return false;
    }
  };

  const fetchWalletData = async () => {
    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      setError("Please enter a valid Solana wallet address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const connection = new Connection("https://long-capable-season.solana-mainnet.quiknode.pro/ec90b275b32c8703f7115813d7dbd380c6732b53/");
      const publicKey = new PublicKey(walletAddress);

      const balance = await connection.getBalance(publicKey);
      const transactionCount = await connection.getTransactionCount(publicKey);
      const accountInfo = await connection.getAccountInfo(publicKey);

      let walletAge = 0;
      let lastTransactionSlot = 0;

      if (accountInfo) {
        walletAge = Math.floor(accountInfo.lamports / 1000); // Simüle edilmiş cüzdan yaşı
        lastTransactionSlot = Math.floor(accountInfo.lamports / 5000); // Simüle edilmiş son işlem slotu
      }

      const currentSlot = await connection.getSlot();
      const timeSinceLastTransaction = currentSlot - lastTransactionSlot;

      const score = calculateWalletScore(balance / 1e9, transactionCount, walletAge, timeSinceLastTransaction);
      setWalletScore(score);

      setWalletData({
        balance: balance / 1e9,
        transactionCount,
        walletAge,
        lastTransactionSlot,
        timeSinceLastTransaction,
      });
    } catch (err) {
      setError("Failed to fetch wallet data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateWalletScore = (balance, transactions, walletAge, timeSinceLastTransaction) => {
    let score = 0;

    if (balance >= 100) score += 40; // Büyük bakiyeler yüksek puan alır
    else if (balance >= 10) score += 30;
    else if (balance >= 1) score += 20;
    else score += 5; // Düşük bakiyelere düşük puan

    if (transactions >= 1000) score += 30; // Çok fazla işlem yapan cüzdanlar daha yüksek puan alır
    else if (transactions >= 100) score += 20;
    else if (transactions >= 10) score += 10;
    else score += 5;

    if (walletAge >= 100000) score += 20; // Eski cüzdanlara ekstra puan
    else if (walletAge >= 10000) score += 15;
    else if (walletAge >= 1000) score += 10;
    else score += 5;

    if (timeSinceLastTransaction < 1000) score += 10; // Son işlemi yakın olan cüzdanlara ek puan
    else if (timeSinceLastTransaction < 5000) score += 5;
    else score -= 10; // Uzun süredir işlem yapmayan cüzdanlara düşük puan

    return Math.min(100, Math.max(0, score)); // 0-100 arası bir puan döndür
  };

  return (
    <div className="container">
      <h1 className="title">CAVALRY</h1>

      <div className="card">
        <input
          type="text"
          placeholder="Enter your wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="input"
        />
        <button onClick={fetchWalletData} disabled={loading} className={`button ${loading ? "button-disabled" : ""}`}>
          {loading ? <span className="loader"></span> : "Check Health"}
        </button>
      </div>

      {currentSlot !== null && (
        <div className="card">
          <p>Current Slot: <span className="highlight">{currentSlot}</span></p>
        </div>
      )}

      {networkHealth && (
        <div className="card">
          <p>Network Health: <span className="highlight">{networkHealth}</span></p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {walletData && (
        <div className="card">
          <h2 className="subtitle">Wallet Health Details</h2>
          <p>Balance: <span className="highlight">{walletData.balance.toFixed(2)} SOL</span></p>
          <p>Transaction Count: <span className="highlight">{walletData.transactionCount}</span></p>
          <p>Wallet Age: <span className="highlight">{walletData.walletAge} slots</span></p>
          <p>Time Since Last Transaction: <span className="highlight">{walletData.timeSinceLastTransaction} slots</span></p>
          <p>
            Health Score: <span className="highlight">{walletScore}/100</span> 🏆
          </p>
        </div>
      )}
    </div>
  );
};

export default SolanaWalletHealth;
