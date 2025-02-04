"use client";
import React, { useState } from "react";
import axios from "axios";
import FormData from "form-data";
import {
  Keypair,
  BASE_FEE,
  TransactionBuilder,
  Aurora,
  
  Networks,
  Operation,
  Asset,
} from "diamnet-sdk";

import { useWallet } from "../context/WalletProvider";

const SellNft = () => {
    const { publicKey } = useWallet();
    const [nftName, setNftName] = useState("");
    const [amount, setAmount] = useState("");
    const [price, setPrice] = useState("");
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (!window.diam) {
                console.log("DIAM wallet not detected, attempting to connect...");
                try {
                    await window.diam.connect();
                } catch (connError) {
                    console.error("Failed to connect to DIAM wallet:", connError);
                    throw new Error("Please install and unlock DIAM wallet");
                }
            }
    
            if (!publicKey) {
                throw new Error("Public key not available. Please connect wallet first.");
            }
            console.log("Loading account from Diamante testnet...");
            const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
            let account;
            try {
                account = await server.loadAccount(publicKey);
                console.log("Account loaded successfully");
            } catch (accountError) {
                console.error("Failed to load account:", accountError);
                throw new Error("Failed to load account. Please check your connection and account status.");
            }
    
            const nftAsset = account.balances.find(
                balance => balance.asset_code === nftName && balance.asset_type !== 'native'
            );
            
            if (!nftAsset) {
                throw new Error(`NFT ${nftName} not found in account`);
            }
            
            if (parseFloat(nftAsset.balance) < parseFloat(amount)) {
                throw new Error(`Insufficient NFT balance. Available: ${nftAsset.balance}, Requested: ${amount}`);
            }
            const sellingAsset = new Asset(nftName, nftAsset.asset_issuer);
            const buyingAsset = Asset.native(); // Selling for XDM
            const existingOffers = await server.offers()
             .selling(sellingAsset)
             .forAccount(publicKey)
             .call();
            console.log("Building transaction...");
            
    
            const tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET
            })
            .addOperation(Operation.manageSellOffer({
                selling: sellingAsset,
                buying: buyingAsset,
                amount: amount.toString(), 
                price: price.toString(), 
                offerId: 0
            }))
            .setTimeout(100)
            .build();
    
            console.log("Requesting signature from DIAM wallet...");
            const signedTx = await window.diam.sign(
                tx.toXDR(),
                false,
                "Diamante Testnet 2024"
            );
    
            if (!signedTx?.message?.data) {
                console.error("Signing response:", signedTx);
                throw new Error("Transaction signing failed - no signature data received");
            }
            console.log("Converting signed transaction from XDR...");
            const signedTransaction = TransactionBuilder.fromXDR(
                signedTx.message.data,
                Networks.TESTNET
            );
    
            console.log("Submitting transaction to network...");
            const result = await server.submitTransaction(signedTransaction);
            console.log("Transaction successful! Hash:", result.hash);
            await new Promise(resolve => setTimeout(resolve, 5000));

            let attempts = 0;
            let newOffer = null;
            while (attempts < 3 && !newOffer) {
                console.log(`Attempt ${attempts + 1} to fetch new offer...`);
                const newOffers = await server.offers()
                    .selling(sellingAsset)
                    .forAccount(publicKey)
                    .limit(50)
                    .call();

                console.log("New offers count:", newOffers.records.length);

                newOffer = newOffers.records.find(offer => {
                    const isNew = !existingOffers.records.some(existing => existing.id === offer.id);
                    const matchesAmount = parseFloat(offer.amount) === parseFloat(amount);
                    const matchesPrice = parseFloat(offer.price) === parseFloat(price);
                    return isNew && matchesAmount && matchesPrice;
                });

                if (!newOffer) {
                    attempts++;
                    if (attempts < 3) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }

            if (!newOffer) {
                throw new Error("Could not find the new offer ID after 3 attempts. Transaction succeeded but offer details could not be retrieved.");
            }

            console.log("New offer found:", newOffer.id);

            // Store offer in MongoDB
            const response = await fetch('http://localhost:8000/nft/sellNft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    offerId: Number(newOffer.id),
                    name: nftName,
                    price: Number(price),
                    quantity: Number(amount),
                    seller: publicKey
                })
            });
            
            const data = await response.json(); 
            console.log(data); 
            setNftName("");
            setAmount("");
            setPrice("");
       
            alert('Sell offer created successfully!');

    
        } catch (error) {
            console.error("Detailed error:", error);
            
            let userMessage = "Failed to create sell offer: ";
            if (error.response?.data?.extras?.result_codes) {
                userMessage += `${error.response.data.extras.result_codes.operations.join(", ")}`;
            } else {
                userMessage += error.message || "Unknown error occurred";
            }
            
            alert(userMessage);
        }
    };



  return (
    <>
    
    <h1 className="mt-20 text-3xl font-bold text-white mb-6 text-center">
        Sell your NFT here on Diamante Blockchain
      </h1>
    <div className="container mx-auto mt-12 p-6 bg-gradient-to-r bg-gray-800 rounded-lg shadow-xl max-w-md">
      
      <form className="space-y-4">
        <div>
          <label htmlFor="nftName" className="block text-sm font-medium text-gray-300">
            NFT Name
          </label>
          <input
            type="text"
            id="nftName"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter NFT name"
            required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter amount"
            required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
            Price
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter price"
            required
          />
        </div>
       

        <button
          type="submit"
          onClick = {handleSubmit}
          className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Submit
        </button>
      </form>
    </div>
    </>
  );
};

export default SellNft;
