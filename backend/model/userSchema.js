const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true }, // Use walletAddress as _id
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        walletAddress: { type: String, required: true },
        name: { type: String },
        phone: { type: String },
        city: { type: String },
        nftsOwned: [
            {
                nftId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT' }, 
                quantity: { type: Number, default: 1 }, 
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
