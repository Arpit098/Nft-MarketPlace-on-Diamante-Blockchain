// routes/courses.js
const express = require('express');
const { saveNFT, sellNft, getAllMarketItems, buyNft } = require('../controller/nft');
const nftRouter = express.Router();

nftRouter.post('/saveNft', saveNFT);
nftRouter.post('/sellNft', sellNft);
nftRouter.post('/buyNft', buyNft)
nftRouter.get('/getMarketItems', getAllMarketItems);
// nftRouter.post('/cancelSell', );
// nftRouter.post('/updateSell', );

module.exports = nftRouter;