import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Add timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch("https://88qk09xt-8004.inc1.devtunnels.ms/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: message }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error("Error fetching from external API:", fetchError)

      // Check if it's a timeout error
      if (fetchError.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out" }, { status: 504 })
      }

      return NextResponse.json({ error: "Failed to get response from external API" }, { status: 502 })
    }
  } catch (error) {
    console.error("Error in route handler:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
