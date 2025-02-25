"use client"
import React,{useState, useEffect} from "react"
import { useWallet } from "../context/WalletProvider";
import {
    Keypair,
    BASE_FEE,
    TransactionBuilder,
    Aurora,
    Networks,
    Operation,
    Asset,
  } from "diamnet-sdk";
  
const NFTCard = ({ nft }) => {
    const {publicKey} = useWallet();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (!nft.name) {
                throw new Error("NFT name is required");
            }
    
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
    
            const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
    
            // Load buyer's account
            let account;
            try {
                account = await server.loadAccount(publicKey);
                console.log("Account loaded successfully");
            } catch (accountError) {
                console.error("Failed to load account:", accountError);
                throw new Error("Failed to load account. Please check your connection and account status.");
            }
    
            // Fetch the specific offer to get current details
            const offer = await server.offers()
                .offer(nft.offerId.toString())
                .call();
                
            if (!offer) {
                throw new Error("Offer no longer exists");
            }
    
            console.log("Found offer:", offer);
    
            // Get the seller and asset details from the offer
            const sellerPublicKey = offer.seller;
            const assetIssuer = offer.selling.asset_issuer;
            const assetCode = offer.selling.asset_code;
            const offerAmount = offer.amount;
            const offerPrice = offer.price;
    
            // Create trust line if needed
            console.log("Building trust transaction...");
            const trustTransaction = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET
            })
            .addOperation(Operation.changeTrust({ 
                asset: new Asset(assetCode, assetIssuer)
            }))
            .setTimeout(30)
            .build();
    
            console.log("Requesting trust line signature...");
            const signedTrustTx = await window.diam.sign(
                trustTransaction.toXDR(),
                false,
                "Diamante Testnet 2024"
            );
    
            if (!signedTrustTx?.message?.data) {
                throw new Error("Trust transaction signing failed");
            }
    
            const signedTrustTransaction = TransactionBuilder.fromXDR(
                signedTrustTx.message.data,
                Networks.TESTNET
            );
    
            try {
                await server.submitTransaction(signedTrustTransaction);
                console.log("Trust line established");
            } catch (trustError) {
                if (trustError.response?.data?.extras?.result_codes?.operations?.[0] === 'op_low_reserve') {
                    console.log("Trust line already exists or low reserve, continuing with buy offer");
                } else {
                    throw trustError;
                }
            }
    
            account = await server.loadAccount(publicKey);
    
            console.log("Creating buy offer for specific sell offer:", nft.offerId);
            const buyTransaction = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET
            })
            .addOperation(Operation.manageBuyOffer({
                selling: Asset.native(), 
                buying: new Asset(assetCode, assetIssuer),
                buyAmount: nft.quantityToBuy || "1", // Amount to buy
                price: offerPrice.toString(),
                offerId: 0
            }))
            .setTimeout(30)
            .build();
    
            console.log("Requesting buy offer signature...");
            const signedBuyTx = await window.diam.sign(
                buyTransaction.toXDR(),
                false,
                "Diamante Testnet 2024"
            );
    
            if (!signedBuyTx?.message?.data) {
                throw new Error("Buy offer signing failed");
            }
    
            const signedBuyTransaction = TransactionBuilder.fromXDR(
                signedBuyTx.message.data,
                Networks.TESTNET
            );
            
            const result = await server.submitTransaction(signedBuyTransaction);
            console.log("Transaction successful! Hash:", result.hash);
    
            // Record the purchase in your database
            const response = await fetch("http://localhost:8000/nft/buyNft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    offerId: nft.offerId,
                    name: assetCode,
                    buyerId: publicKey,
                    sellerId: sellerPublicKey,
                    quantity: 1,
                    price: offerPrice
                }),
            });
    
            const data = await response.json();
            if (data.success) {
                console.log("NFT purchase recorded successfully:", data);
                alert("NFT purchased successfully!");
            } else {
                console.error("Failed to record NFT purchase:", data.message);
                alert("Transaction successful but error updating marketplace: " + data.message);
            }
    
        } catch (error) {
            console.error("Detailed error:", error);
            
            let userMessage = "Failed to create buy offer: ";
            
            if (error.response?.data?.extras?.result_codes?.operations) {
                userMessage += error.response.data.extras.result_codes.operations[0];
            } else if (error.response?.data?.extras?.result_codes?.transaction) {
                userMessage += error.response.data.extras.result_codes.transaction;
            } else if (error.message) {
                userMessage += error.message;
            } else {
                userMessage += "Unknown error occurred";
            }
            
            alert(userMessage);
            console.error("Full error details:", {
                response: error.response?.data,
                message: error.message,
                stack: error.stack
            });
        }
    };

   return(
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden w-full max-w-xs mx-auto">
        <img src={nft.imageUrl || "/placeholder.svg"} alt={nft.name} className="w-full h-32 object-cover" />
        <div className="p-3">
          <h3 className="text-lg font-semibold text-white mb-1 truncate">{nft.name}</h3>
          <p className="text-gray-300 text-xs mb-2 h-8 overflow-hidden">{nft.description}</p>
          <div className="flex justify-between items-center mb-1">
            <span className="text-green-400 font-bold text-sm">{nft.price} DIAM</span>
            <span className="text-gray-400 text-xs">{nft.quantityLeft} left</span>
          </div>
          <p className="text-gray-400 text-xs mb-2 truncate">Seller: {nft.seller}</p>
          <p className="text-gray-400 text-xs mb-2 truncate">Offer Id: {nft.offerId} </p>

          <button onClick={(e) => handleSubmit(e)} className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white py-1 px-2 rounded-md text-sm transition-all duration-300 ease-in-out transform hover:scale-105">
            Buy Now
          </button>
        </div>
      </div>
    )
}

export default NFTCard;