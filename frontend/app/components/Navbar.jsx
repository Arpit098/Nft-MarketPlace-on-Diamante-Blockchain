"use client";
import React,{useState} from 'react';
import Link from 'next/link';
import { useWallet } from '../context/WalletProvider';
const Navbar = () => {

    const {setPublicKey} = useWallet();
    const [buttonText, setButtonText] = useState("Connect Wallet")

    const handleClick = async() => {
        try {
            const res = await window.diam.connect(); 
            setPublicKey(res.message.data[0].diamPublicKey); 
            const key = res.message.data[0].diamPublicKey;
            setButtonText(`${key.substring(0, 6)}...${key.substring(key.length - 4)}`);
            console.log("Wallet connected:", res.message.data[0].diamPublicKey);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
     };

    return (
        <nav className="fixed top-0 w-full bg-gradient-to-r from-gray-950 via-gray-950 to-gray-900 text-white p-4 shadow-lg z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                    Diamante NftMarket
                </Link>
                <button
                    onClick={handleClick}
                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white py-2 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                    {buttonText}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
