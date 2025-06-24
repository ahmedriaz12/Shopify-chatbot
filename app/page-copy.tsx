"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"

type Message = {
  type: "user" | "bot"
  content: string
}

export default function ProfessionalChatbot() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([{ type: "bot", content: "Hello! How can I help you today?" }])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { type: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: data.response || "I'm sorry, I couldn't process that request." },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "I'm sorry, there was an error processing your request." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessageContent = (content: string) => {
    const lines = content.split("\n")
    const formattedLines: React.ReactNode[] = []

    lines.forEach((line, index) => {
      const boldMatches = line.match(/\*\*(.*?)\*\*/g)

      if (boldMatches) {
        if (line.trim().startsWith("**") && line.trim().endsWith("**") && boldMatches.length === 1) {
          const headingText = boldMatches[0].slice(2, -2)
          formattedLines.push(
            <h3 key={`heading-${index}`} className="text-lg font-semibold mt-4 mb-2">
              {headingText}
            </h3>,
          )
          return
        }

        if (line.trim().startsWith("•") || line.trim().startsWith("*")) {
          const bulletContent = line.trim().substring(1).trim()
          const contentParts: React.ReactNode[] = []

          let lastIndex = 0
          for (const match of boldMatches) {
            const startIndex = bulletContent.indexOf(match, lastIndex)
            if (startIndex > lastIndex) {
              contentParts.push(<span key={`text-${lastIndex}`}>{bulletContent.substring(lastIndex, startIndex)}</span>)
            }
            const boldText = match.slice(2, -2)
            contentParts.push(
              <span key={`bold-${startIndex}`} className="font-semibold">
                {boldText}
              </span>,
            )
            lastIndex = startIndex + match.length
          }
          if (lastIndex < bulletContent.length) {
            contentParts.push(<span key={`text-${lastIndex}`}>{bulletContent.substring(lastIndex)}</span>)
          }

          formattedLines.push(
            <div key={`bullet-${index}`} className="ml-4 mb-1">
              <span className="mr-2">•</span>
              {contentParts}
            </div>,
          )
          return
        }

        const contentParts: React.ReactNode[] = []
        let lastIndex = 0
        for (const match of boldMatches) {
          const startIndex = line.indexOf(match, lastIndex)
          if (startIndex > lastIndex) {
            contentParts.push(<span key={`text-${lastIndex}`}>{line.substring(lastIndex, startIndex)}</span>)
          }
          const boldText = match.slice(2, -2)
          contentParts.push(
            <span key={`bold-${startIndex}`} className="font-semibold">
              {boldText}
            </span>,
          )
          lastIndex = startIndex + match.length
        }
        if (lastIndex < line.length) {
          contentParts.push(<span key={`text-${lastIndex}`}>{line.substring(lastIndex)}</span>)
        }

        formattedLines.push(
          <div key={`text-${index}`} className="mb-1">
            {contentParts}
          </div>,
        )
      } else if (line.trim().startsWith("•") || line.trim().startsWith("*")) {
        const bulletContent = line.trim().substring(1).trim()
        formattedLines.push(
          <div key={`bullet-${index}`} className="ml-4 mb-1">
            <span className="mr-2">•</span>
            <span>{bulletContent}</span>
          </div>,
        )
      } else {
        formattedLines.push(
          <p key={`text-${index}`} className="mb-1">
            {line}
          </p>,
        )
      }
    })

    return <>{formattedLines}</>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl h-[80vh] flex flex-col shadow-lg">
        <CardHeader className="bg-white border-b p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-full p-2">
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
                viewBox="0 0 24 24"
              >
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                <path d="M7 7h.01"></path>
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl">Product Assistant</CardTitle>
              <p className="text-sm text-gray-500">Ask me anything about our products</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} mb-4`}>
              {message.type === "bot" && (
                <Avatar className="h-8 w-8 bg-blue-600 mr-2">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                    <path d="M7 7h.01"></path>
                  </svg>
                </Avatar>
              )}

              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{formatMessageContent(message.content)}</div>
              </div>

              {message.type === "user" && (
                <Avatar className="h-8 w-8 bg-gray-400 ml-2">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <Avatar className="h-8 w-8 bg-blue-600 mr-2">
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                  <path d="M7 7h.01"></path>
                </svg>
              </Avatar>
              <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none p-3">
                <div className="flex space-x-1">
                  {[0, 150, 300].map((delay, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
