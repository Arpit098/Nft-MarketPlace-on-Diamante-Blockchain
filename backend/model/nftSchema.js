const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    quantity: Number,
    buyers: [
        {
            userId: { type: String, required: true },
            quantity: { type: Number, default: 1 }
        }
    ],
    
}, { timestamps: true });

module.exports = mongoose.model('NFT', nftSchema);