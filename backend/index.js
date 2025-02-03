const express = require("express")
const app = express()
const port = 8000;
const connectDB = require("./db_connect.js")
const nftRouter = require("./routes/nftRoutes")
const cors = require("cors")
connectDB();
const allowedOrigins = [
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/nft', nftRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
