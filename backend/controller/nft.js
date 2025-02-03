const  User = require('../model/userSchema');
const NFT = require('../model/nftSchema')
const MarketItem = require('../model/marketSchema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Import bcrypt
const axios = require("axios");
const fs = require("fs");
const mongoose = require('mongoose');

exports.saveNFT = async (req, res) => {
    try {
        const { name, description, imgUrl, quantity } = req.body;
        const existingNFT = await NFT.findOne({ name });
        if (existingNFT) {
            return res.status(400).json({ message: "NFT with this name already exists." });
        }

        const nft = new NFT({ name, description, imageUrl: imgUrl, quantity });
        await nft.save();

        return res.status(201).json({ message: "NFT saved successfully!", nft });
    } catch (error) {
        console.error("Error saving NFT:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

exports.sellNft = async (req, res) => {
    try {
        const { name, price, seller, offerId, quantity } = req.body;
        const nft = await NFT.findOne({ name });

        if (!nft) {
            return res.status(404).json({ success: false, message: "NFT not found in collection" });
        }
        let offerIdObjectId;
        if (mongoose.Types.ObjectId.isValid(offerId)) {
            offerIdObjectId = new mongoose.Types.ObjectId(offerId); // Convert string to ObjectId
        } else {
            // Handle case if offerId is not valid ObjectId
            return res.status(400).send({ message: 'Invalid offerId' });
        }

        const marketItem = new MarketItem({
            _id: offerIdObjectId,
            offerId,
            name,
            description: nft.description,
            price,
            seller,
            quantityLeft: quantity,
            imageUrl: nft.imageUrl
        });
        await marketItem.save();

        return res.status(201).json({ success: true, message: "NFT listed for sale successfully", marketItem });
    } catch (error) {
        console.error("Error selling NFT:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};    


exports.buyNft = async (req, res) => {
    try {
        const { offerId, name, buyerId, quantity } = req.body;
        const marketItem = await MarketItem.findOne({ offerId });

        if (!marketItem) {
            return res.status(404).json({ success: false, message: "NFT not found in marketplace" });
        }
        if (marketItem.quantityLeft < quantity) {
            return res.status(400).json({ success: false, message: "Not enough NFTs available for purchase" });
        }

        marketItem.quantityLeft -= quantity;
        marketItem.buyers.push({ userId: buyerId, quantity });

        await marketItem.save();
        const nft = await NFT.findOne({ name });
        if (nft) {
            nft.buyers.push({ userId: buyerId, quantity });
            await nft.save();
        }

        return res.status(200).json({ success: true, message: "NFT purchased successfully", marketItem });
    } catch (error) {
        console.error("Error buying NFT:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.getAllMarketItems = async (req, res) => {
    try {
        const marketItems = await MarketItem.find();
        
        if (!marketItems.length) {
            return res.status(404).json({ success: false, message: "No NFTs found in the marketplace" });
        }

        return res.status(200).json({ success: true, data: marketItems });
    } catch (error) {
        console.error("Error fetching market items:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};