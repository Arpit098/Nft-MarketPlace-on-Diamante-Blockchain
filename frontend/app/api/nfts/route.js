import { NextResponse } from "next/server"

// This is a mock database. In a real application, you'd use a actual database.
const nfts = [
  { id: 1, name: "Cool NFT", amount: 1 },
  { id: 2, name: "Awesome NFT", amount: 5 },
]

export async function GET() {
  // In a real application, you'd fetch this data from your database
  return NextResponse.json(nfts)
}

export async function POST(request) {
  const { name, amount } = await request.json()

  // In a real application, you'd save this to your database
  const newNft = { id: nfts.length + 1, name, amount: Number.parseInt(amount) }
  nfts.push(newNft)

  return NextResponse.json(newNft, { status: 201 })
}

