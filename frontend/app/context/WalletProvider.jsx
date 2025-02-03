"use client";
import React, { createContext, useState, useContext } from "react";

// Create the WalletContext
const WalletContext = createContext();

// WalletProvider component
export const WalletProvider = ({ children }) => {
  const [publicKey, setPublicKey] = useState(null);


  // Function to disconnect wallet

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        setPublicKey
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook for using WalletContext
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
