"use client"
import React, { useState, useEffect } from "react"
import NFTCard from "./NftCard"


const Marketplace = () => {
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

 
  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const response = await fetch("http://localhost:8000/nft/getMarketItems"); 
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch NFTs");
        }

        setNfts(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, []);


  if (loading) return <div className="text-white text-center mt-8">Loading marketplace...</div>
  if (error) return <div className="text-red-500 text-center mt-8">Error: {error}</div>

  return (
    <div className="container mx-auto mt-12 p-6 bg-gradient-to-rr bg-gray-900 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">NFT Marketplace</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {nfts.map((nft) => (
          <NFTCard key={nft.offerId} nft={nft} />
        ))}
      </div>
    </div>
  )
}

export default Marketplace

