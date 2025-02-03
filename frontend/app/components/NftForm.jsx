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

const NftForm = () => {
  const { publicKey } = useWallet();
  const [nftName, setNftName] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  // async function uploadFileToIPFS(imageUrl) {
  //   console.log("Fetching image from URL:", imageUrl);
  //   try {
  //     // Fetch the image as a blob
  //     const response = await fetch(imageUrl);
  //     if (!response.ok) throw new Error("Failed to fetch the image from the provided URL");

  //     const fileBlob = await response.blob();

  //     // Create FormData for IPFS upload
  //     const formData = new FormData();
  //     formData.append("file", fileBlob, "file.jpg");

  //     console.log("Sending request to IPFS...");

  //     const ipfsResponse = await axios.post(
  //       "https://uploadipfs.diamcircle.io/api/v0/add",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //         maxContentLength: Infinity,
  //         maxBodyLength: Infinity,
  //       }
  //     );

  //     if (ipfsResponse.status === 200 && ipfsResponse.data && ipfsResponse.data.Hash) {
  //       console.log("File uploaded successfully to IPFS with hash:", ipfsResponse.data.Hash);
  //       return ipfsResponse.data.Hash;
  //     } else {
  //       throw new Error("Failed to upload file to IPFS");
  //     }
  //   } catch (error) {
  //     console.error("Error uploading file to IPFS:", error);
  //     throw error;
  //   }
  // }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if(!window.diam || !publicKey) window.diam.connect()
      const assetName = nftName;
      const filePath = link; 
    

      const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
      console.log("Aurora server initialized");

      
      console.log("Creating issuer keypair...");
      const issuerSecret = "SB7KNGUG3ZJA57LASL75JJ4QTCKMADLQY52HIFUO3I324PNIKEEUTVH3";
      const issuerKeypair = Keypair.fromSecret(issuerSecret);
      const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

      const asset = new Asset(assetName, issuerKeypair.publicKey());
      const setFlagsTx = new TransactionBuilder(issuerAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(
          Operation.setOptions({
              setFlags: 10, 
          })
      )
      .setTimeout(100)
      .build();
  
      setFlagsTx.sign(issuerKeypair);
      await server.submitTransaction(setFlagsTx);
      console.log("Issuer account flags set successfully");

      const receiverAccount = await server.loadAccount(publicKey);
      console.log("reciever account:", receiverAccount);
      const changeTrustTx = new TransactionBuilder(receiverAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.changeTrust({ 
            asset: asset,
            limit: "100",
          })
        )
        .setTimeout(100)
        .build();
      console.log("signing transaction:")

     try {
       if (!window.diam) {
         await window.diam.connect();
       }
       
       const signedTransaction = await window.diam.sign(
         changeTrustTx.toXDR(),
         false,
         "Diamante Testnet 2024"
       );
       
       if (!signedTransaction || !signedTransaction.message) {
         throw new Error("Failed to sign transaction with DIAM wallet");
       }
     
       const signedTx = TransactionBuilder.fromXDR(
         signedTransaction.message.data,
         Networks.TESTNET
       );
       
       const changeTrustResult = await server.submitTransaction(signedTx);
       console.log("Trust line created successfully");
     
     } catch (error) {
       console.error("Wallet signing error:", error);
       throw error;
     }
      const paymentTx = new TransactionBuilder(issuerAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: publicKey,
            asset: new Asset(assetName, issuerKeypair.publicKey()),
            amount: amount,
          })
        )
        .setTimeout(100)
        .build();

      paymentTx.sign(issuerKeypair);
      const paymentResult = await server.submitTransaction(paymentTx);
      console.log("NFT Payment transaction hash:", paymentResult.hash);
      
      const saveNFTResponse = await fetch("http://localhost:8000/nft/saveNft", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: assetName,
            description: description,
            imgUrl: filePath,
            quantity: amount, 
        }),
      });
  
      const saveNFTData = await saveNFTResponse.json();
  
      if (!saveNFTResponse.ok) {
          console.error("Failed to save NFT:", saveNFTData.message);
      } else {
          console.log("NFT saved successfully:", saveNFTData);
      }
      
      return {
        message: "Asset creation prepared successfully",
        // cid: ipfsCID,
        transactionHash: paymentResult.hash,
        issuerPublicKey: issuerKeypair.publicKey(),
        issuerSecretKey: issuerKeypair.secret(),
        assetName: assetName,
      };
    } catch (error) {
      console.error("Error creating NFT:", error);
      throw error;
    }
  };

  return (
    <>
    
    <h1 className="mt-20 text-3xl font-bold text-white mb-6 text-center">
        Create your NFT here on Diamante Blockchain
      </h1>
    <div className="container mx-auto mt-12 p-6 bg-gradient-to-r bg-gray-800 rounded-lg shadow-xl max-w-md">
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter description"
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
          <label htmlFor="link" className="block text-sm font-medium text-gray-300">
            Image Link
          </label>
          <input
            type="string"
            id="imagelink"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter Image url"
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

export default NftForm;
