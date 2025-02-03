const mongoose = require('mongoose');

const marketItemSchema = new mongoose.Schema({
    offerId: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    quantityLeft: { type: Number, required: true },
    seller: { type: String, required: true },
    buyers: [
        {
            userId: { type: String, required: true },
            quantity: { type: Number, default: 1 }
        }
    ],
   
}, { timestamps: true });

const MarketItem = mongoose.model('MarketItem', marketItemSchema); // ✅ Correctly define model

module.exports = MarketItem;