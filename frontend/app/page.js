import Marketplace from "./components/Market"
import Navbar from "./components/Navbar"
import NftForm from "./components/NftForm"
import SellNft from "./components/SellNft"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="pt-16">
        <NftForm />
        <SellNft/>
        <Marketplace/>
      </main>
    </div>
  )
}

