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
      if(!window.diam || !publicKey) {
        await window.diam.connect();
      }
      const assetName = nftName;
      const filePath = link; 
    
      const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
      console.log("Aurora server initialized");

      const userAccount = await server.loadAccount(publicKey);
      console.log("User account loaded:", publicKey);

      console.log("Creating random issuer keypair...");
      const issuerKeypair = Keypair.random();
      console.log("Issuer public key:", issuerKeypair.publicKey());

      const combinedTx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(
        Operation.createAccount({
          destination: issuerKeypair.publicKey(),
          startingBalance: "2",
        })
      )
      .addOperation(
        Operation.setOptions({
          source: issuerKeypair.publicKey(),
          setFlags: 10,
        })
      )
      .addOperation(
        Operation.changeTrust({ 
          asset: new Asset(assetName, issuerKeypair.publicKey()),
          source: publicKey
        })
      )
      .addOperation(
        Operation.payment({
          source: issuerKeypair.publicKey(),
          destination: publicKey,
          asset: new Asset(assetName, issuerKeypair.publicKey()),
          amount: amount,
        })
      )
      .addOperation(
        Operation.setOptions({
          source: issuerKeypair.publicKey(),
          masterWeight: 0,
        })
      )
      .setTimeout(180)
      .build();

      combinedTx.sign(issuerKeypair);

      console.log("Requesting wallet signature...");
      const signedTransaction = await window.diam.sign(
        combinedTx.toXDR(),
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
      
      // Submit the combined transaction
      console.log("Submitting combined transaction...");
      const result = await server.submitTransaction(signedTx);
      console.log("Combined transaction successful:", result.hash);
      
      // Save NFT metadata
      console.log("Saving NFT metadata...");
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
            issuerPublicKey: issuerKeypair.publicKey(),
        }),
      });
  
      const saveNFTData = await saveNFTResponse.json();
  
      if (!saveNFTResponse.ok) {
          console.error("Failed to save NFT:", saveNFTData.message);
          throw new Error(saveNFTData.message);
      }
      console.log("NFT saved successfully:", saveNFTData);
      
      return {
        message: "Asset created successfully",
        transactionHash: result.hash,
        issuerPublicKey: issuerKeypair.publicKey(),
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
