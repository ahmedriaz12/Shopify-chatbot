"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type Message = {
  type: "user" | "bot"
  content: string
  timestamp: number
}

const suggestionChips = [
  "What's popular here?",
  "Need help finding something?",
  "How's my order doing?",
  "What is your shipping policy?",
]

const baseColor = '#0D1321';
const adjustBrightness = (color: string, amount: number) => {
  return `#${color.replace(/^#/, '').replace(/../g, (color) =>
    ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).slice(-2)
  )}`;
};

const isColorDark = (color: string) => {
  const rgb = parseInt(color.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 128;
};

const theme = {
  headerGradient: `linear-gradient(135deg, ${adjustBrightness(baseColor, 50)} 0%, ${adjustBrightness(baseColor, -50)} 100%)`,
  userChatBubble: `bg-[${baseColor}] text-white`,
  botChatBubble: 'bg-gray-100 text-gray-800',
  cartButton: `bg-[${baseColor}] text-white hover:bg-orange-600`,
  sendButton: `bg-[${baseColor}] hover:bg-orange-600`,
};

const chipHoverStyle = {
  backgroundColor: adjustBrightness(baseColor, 20),
};

const popupAnimation = `
  @keyframes popup {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;



export default function ProfessionalChatbot() {

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userDefinedQuantity = 1;
  const [quantity, setQuantity] = useState(userDefinedQuantity);
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(popupAnimation, styleSheet.cssRules.length);
  }, []);

  const generateSessionId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    return `${year}${month}${day}${hours}${minutes}${seconds}_${randomDigits}`;
  };

  const shouldEndSession = (lastMessageTimestamp: number) => {
    const currentTime = Date.now();
    const timeDifference = currentTime - lastMessageTimestamp;
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference >= 24;
  };

  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true);
      const existingSessionId = localStorage.getItem('userSessionId');
      let lastMessageTimestamp = 0;

      if (existingSessionId) {
        const storedMessages = localStorage.getItem(`chat_messages_${existingSessionId}`);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
          lastMessageTimestamp = parsedMessages[parsedMessages.length - 1]?.timestamp || 0;
        }
      }

      if (!existingSessionId || shouldEndSession(lastMessageTimestamp)) {
        if (existingSessionId) {
          localStorage.removeItem(`chat_messages_${existingSessionId}`);
        }
        const sessionId = generateSessionId();
        localStorage.setItem('userSessionId', sessionId);
        localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify([{ type: "bot", content: "Hello! How can I help you today?", timestamp: Date.now() }]));
        setMessages([{ type: "bot", content: "Hello! How can I help you today?", timestamp: Date.now() }]);
      } else {
        const timeLeft = 24 - ((Date.now() - lastMessageTimestamp) / (1000 * 60 * 60));
        console.log(`Time left: ${timeLeft.toFixed(2)} hours`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsCheckingSession(false);
    };

    checkSession();
  }, []);

  useEffect(() => {
    const sessionId = localStorage.getItem('userSessionId');
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages]);

  const increment = () => setQuantity((prev) => prev + 1);
  const decrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (messages.length > 1) {
      setShowSuggestions(false)
    }
  }, [messages.length])

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    setInput(suggestion)
    handleSubmit(null, suggestion)
  }

  const handleSubmit = async (e: React.FormEvent | null, suggestedQuestion?: string) => {
    if (e) e.preventDefault()

    const questionToAsk = suggestedQuestion || input
    if ((!questionToAsk.trim() || isLoading) && !suggestedQuestion) return

    const userMessage: Message = { type: "user" as const, content: questionToAsk, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const sessionId = localStorage.getItem('userSessionId');
      const storedMessages = localStorage.getItem(`chat_messages_${sessionId}`);
      let lastFiveMessages: Message[] = [];

      if (storedMessages) {
        const parsedMessages: Message[] = JSON.parse(storedMessages);
        lastFiveMessages = parsedMessages.slice(-8);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId || ""
        },
        body: JSON.stringify({
          question: questionToAsk,
          order_name: "",
          session_id: sessionId,
          store_id: 58690928726,
          last_five_messages: lastFiveMessages
        }),
      })

      const data = await res.json()

      if (data.imagespreview_data) {
        const imageUrls = data.imagespreview_data.map((item: { src: string }) => item.src)
        const formattedContent = JSON.stringify({ imagespreview_data: data.imagespreview_data })
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: formattedContent, timestamp: Date.now() },
        ])
      } else {
        const botResponse = data.response || "I'm sorry, I couldn't process that request."
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: botResponse, timestamp: Date.now() },
        ])
      }

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "I'm sorry, there was an error processing your request.", timestamp: Date.now() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessageContent = (content: string, parentKey: string): React.ReactNode => {
    const formattedLines: React.ReactNode[] = [];

    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = jsonRegex.exec(content)) !== null) {
      const jsonString = match[1].trim();
      let jsonData: any;
      try {
        jsonData = JSON.parse(jsonString);
      } catch (e) {
        jsonData = null;
      }

      const textBeforeJson = content.slice(lastIndex, match.index);
      formattedLines.push(...formatTextContent(textBeforeJson, `${parentKey}-beforeJson-${lastIndex}`));

      if (jsonData && jsonData.imagespreview_data && Array.isArray(jsonData.imagespreview_data)) {
        formattedLines.push(
          <div key={`img-wrap-${parentKey}-${lastIndex}`} className="flex flex-wrap gap-2 my-2">
            {jsonData.imagespreview_data
              .filter((item: any) => item && item.src)
              .map((item: any, index: number) => (
                <div key={`img-${parentKey}-${lastIndex}-${index}-${item.src}`} className="my-2">
                  <img
                    src={item.src || "/placeholder.svg"}
                    alt={`Product image ${index + 1}`}
                    className="max-w-full rounded-md shadow-sm cursor-pointer"
                    style={{ maxHeight: "80px" }}
                    onClick={() => setModalImage(item.src || "/placeholder.svg")}
                  />
                </div>
              ))}
          </div>
        );
      } else if (jsonData && jsonData.checkout_data && jsonData.checkout_data.link) {
        formattedLines.push(
          <div key={`checkout-${parentKey}-${lastIndex}`} className="my-2 flex items-center space-x-2">
            {(() => {
              const [baseUrl, productInfo] = jsonData.checkout_data.link.split('/cart/');
              const [productId] = productInfo.split(':');
              const updatedLink = `${baseUrl}/cart/${productId}:${quantity}`;
              return (
                <a href={updatedLink} target="_blank" rel="noopener noreferrer">
                  <button
                    className="text-white px-4 py-2 rounded-md hover:bg-orange-600 transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                    style={{ backgroundColor: baseColor }}
                  >
                    Add to Cart
                  </button>
                </a>
              );
            })()}
            <div className="flex items-center space-x-2">
              <button
                onClick={decrement}
                className="text-white px-2 py-1 rounded-md hover:bg-orange-400 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                style={{ backgroundColor: baseColor }}
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                onClick={increment}
                className="text-white px-2 py-1 rounded-md hover:bg-orange-400 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                style={{ backgroundColor: baseColor }}
              >
                +
              </button>
            </div>
          </div>
        );
      } else {
        formattedLines.push(
          <pre key={`json-${parentKey}-${lastIndex}`} className="bg-gray-100 p-2 rounded-md overflow-x-auto">
            {`{\n${jsonString}\n}`}
          </pre>
        );
      }

      lastIndex = jsonRegex.lastIndex;
    }

    const textAfterLastJson = content.slice(lastIndex);
    formattedLines.push(...formatTextContent(textAfterLastJson, `${parentKey}-afterJson`));

    return <>{formattedLines}</>;
  };

  const formatTextContent = (text: string, parentKey: string): React.ReactNode[] => {
    const lines = text.split("\n");
    const formattedLines: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const boldMatches = line.match(/\*\*(.*?)\*\*/g);

      if (boldMatches) {
        if (line.trim().startsWith("**") && line.trim().endsWith("**") && boldMatches.length === 1) {
          const headingText = boldMatches[0].slice(2, -2);
          formattedLines.push(
            <h3 key={`heading-${parentKey}-${index}`} className="text-lg font-semibold mt-4 mb-2">
              {headingText}
            </h3>,
          );
          return;
        }

        if (line.trim().startsWith("•") || line.trim().startsWith("*")) {
          const bulletContent = line.trim().substring(1).trim();
          const contentParts: React.ReactNode[] = [];

          let lastIndex = 0;
          for (const match of boldMatches) {
            const startIndex = bulletContent.indexOf(match, lastIndex);
            if (startIndex > lastIndex) {
              contentParts.push(<span key={`text-${parentKey}-${lastIndex}`}>{bulletContent.substring(lastIndex, startIndex)}</span>);
            }
            const boldText = match.slice(2, -2);
            contentParts.push(
              <span key={`bold-${parentKey}-${startIndex}`} className="font-semibold">
                {boldText}
              </span>,
            );
            lastIndex = startIndex + match.length;
          }
          if (lastIndex < bulletContent.length) {
            contentParts.push(<span key={`text-${parentKey}-${lastIndex}`}>{bulletContent.substring(lastIndex)}</span>);
          }

          formattedLines.push(
            <div key={`bullet-${parentKey}-${index}`} className="ml-4 mb-1">
              <span className="mr-2">•</span>
              {contentParts}
            </div>,
          );
          return;
        }

        const contentParts: React.ReactNode[] = [];
        let lastIndex = 0;
        for (const match of boldMatches) {
          const startIndex = line.indexOf(match, lastIndex);
          if (startIndex > lastIndex) {
            contentParts.push(<span key={`text-${parentKey}-${lastIndex}`}>{line.substring(lastIndex, startIndex)}</span>);
          }
          const boldText = match.slice(2, -2);
          contentParts.push(
            <span key={`bold-${parentKey}-${startIndex}`} className="font-semibold">
              {boldText}
            </span>,
          );
          lastIndex = startIndex + match.length;
        }
        if (lastIndex < line.length) {
          contentParts.push(<span key={`text-${parentKey}-${lastIndex}`}>{line.substring(lastIndex)}</span>);
        }

        formattedLines.push(
          <div key={`text-${parentKey}-${index}`} className="mb-1">
            {contentParts}
          </div>,
        );
      } else if (line.trim().startsWith("•") || line.trim().startsWith("*")) {
        const bulletContent = line.trim().substring(1).trim();
        formattedLines.push(
          <div key={`bullet-${parentKey}-${index}`} className="ml-4 mb-1">
            <span className="mr-2">•</span>
            <span>{bulletContent}</span>
          </div>,
        );
      } else {
        formattedLines.push(
          <p key={`text-${parentKey}-${index}`} className="mb-1">
            {line}
          </p>,
        );
      }
    });

    return formattedLines;
  };

  const handlePopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !trackingNumber) return;

    const trackingMessageContent = `email: ${email} tracking: ${trackingNumber}`;

    const trackingMessage: Message = {
      type: "user",
      content: trackingMessageContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, trackingMessage]);
    setEmail("");
    setTrackingNumber("");
    setShowPopup(false);

    handleSubmit(null, trackingMessageContent);
  };

  return (
    <div className="fixed inset-0 bg-gray-50" >
      <Card className="w-full h-full flex flex-col shadow-lg rounded-none" style={{ border: 'none' }} >
        <CardHeader className="bg-white border-b p-4" style={{ background: theme.headerGradient, minHeight: '80px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-full p-2">
                <svg
                  width="20"
                  height="20"
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
                <CardTitle className="text-lg text-white">Product Assistant</CardTitle>
              </div>
            </div>
            <div className="relative">
              <svg
                id="dropdownIcon"
                className="w-6 h-6 text-white cursor-pointer hover:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                onClick={() => window.parent.postMessage({ type: 'CLOSE_CHATBOT' }, '*')}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4" style={{ marginTop: '-10px', backgroundColor: 'white', borderRadius: '15px' }}>
          {messages.map((message, msgIdx) => {

            const isUser = message.type === "user";
            const displayName = isUser ? "Me" : "FreeRange";
            const timeString = message.timestamp
              ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
              : "";
            return (
              <div key={msgIdx} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 flex-col items-${isUser ? "end" : "start"}`}>
                <div className={`text-xs text-gray-500 mb-1 ${isUser ? "text-right" : "text-left"}`}>
                  <span className="font-semibold">{displayName}</span>
                  <span className="ml-2">{timeString}</span>
                </div>
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm border text-base ${isUser ? 'text-white rounded-br-none' : theme.botChatBubble
                    }`}
                  style={{ backgroundColor: isUser ? baseColor : undefined }}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {formatMessageContent(message.content, `msg${msgIdx}`)}
                  </div>
                </div>
              </div>
            );
          })}

          {isCheckingSession && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none p-3 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[0, 150, 300].map((delay, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && !isCheckingSession && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none p-3 shadow-sm border">
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

          {showSuggestions && !isCheckingSession && (
            <div style={{ display: "flex", flexDirection: "row-reverse" }} className="flex flex-wrap gap-2 mt-4">
              {suggestionChips.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="inline-flex items-center py-2 px-3 text-sm md:py-3 md:px-4 md:text-base rounded-full border transition-colors duration-200"
                  style={{ borderColor: baseColor, color: baseColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = chipHoverStyle.backgroundColor;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = baseColor;
                  }}
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="p-4 pb-0">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-center bg-[#f8f7f6] rounded-2xl px-4 py-2 shadow-sm">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message"
                className="flex-grow bg-transparent border-none outline-none text-base px-0 py-2 placeholder-gray-500"
                disabled={isLoading || isCheckingSession}
                style={{ boxShadow: 'none' }}
              />
              <button
                type="submit"
                disabled={isLoading || isCheckingSession || !input.trim()}
                className="ml-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-none"
                style={{ backgroundColor: baseColor, border: 'none' }}
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            </div>
          </form>
        </CardFooter>
        <div className="flex mt-2 mb-2 ml-5" >
          <svg
            onClick={() => setShowPopup(true)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 108.97 122.88"
            className="w-6 h-6 text-gray-600 cursor-pointer hover:text-black"
            fill="currentColor"
          >
            <g>
              <path d="M91.36,103.58l11.21,12.23l-7.74,7.07l-10.81-11.9c-4.11,2.73-9.06,4.34-14.37,4.34c-7.16,0-13.64-2.9-18.32-7.58 c-4.7-4.7-7.58-11.18-7.58-18.32c0-7.16,2.9-13.64,7.58-18.32c4.7-4.7,11.18-7.58,18.32-7.58c7.16,0,13.64,2.9,18.32,7.58 c4.7,4.7,7.58,11.18,7.58,18.32c0,5.23-1.55,10.11-4.22,14.2L91.36,103.58L91.36,103.58z M105.23,8.54c0.6-0.12,1.22,0,1.73,0.31 c0.88,0.36,1.5,1.22,1.5,2.23l0.51,70.57c0.04,0.87-0.38,1.73-1.18,2.2l-3.05,1.82c-0.09-0.88-1.26-4.9-0.63-5.28l-0.47-65.32 l-23.7,14.94v0v25.3c-1.58-0.5-3.56-0.89-5.22-1.17V30.71l-31.54-4.07l-1.05,30.49l-11.2-7.63l-11.2,6.33l2.31-31.88L5.34,22.46 v66.13l28.03,3.04c0.11,1.65,0.33,3.51,0.65,5.09L2.31,93.2C1.02,93.13,0,92.07,0,90.76V18.99c-0.03-0.96,0.52-1.89,1.45-2.3 L38.98,0.2c0.39-0.17,0.84-0.24,1.29-0.19L105.23,8.54z M70.02,8.82L46.97,21.7l30.6,3.91l20.98-13.05L70.02,8.82z M25.03,19.43 L47.84,5.91l-7.52-0.99L11.3,17.68L25.03,19.43z M84.71,74.36c-3.85-3.85-9.16-6.23-15.03-6.23c-5.88,0-11.19,2.38-15.03,6.23 c-3.85,3.85-6.23,9.16-6.23,15.03c0,5.88,2.38,11.19,6.23,15.03c3.85,3.85,9.16,6.23,15.03,6.23c5.88,0,11.19-2.38,15.03-6.23 c3.85-3.85,6.23-9.16,6.23-15.03C90.94,83.51,88.55,78.2,84.71,74.36z" />
            </g>
          </svg>
        </div>
      </Card>

      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={() => setModalImage(null)}
        >
          <div
            className="bg-white rounded-lg p-4 shadow-lg relative max-w-[90vw] max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
              onClick={() => setModalImage(null)}
            >
              &times;
            </button>
            <img
              src={modalImage}
              alt="Large preview"
              className="max-h-[80vh] max-w-full rounded object-contain"
            />
          </div>
        </div>
      )}


      {showPopup && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-60 popup-enter popup-enter-active`}
          onClick={() => setShowPopup(false)}
          style={{ animation: 'popup 0.5s ease-out', width: '100%' }}
        >
          <div
            className="bg-white rounded-lg p-4 shadow-lg relative w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
              onClick={() => setShowPopup(false)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Track order</h2>
            <form className="space-y-4" onSubmit={handlePopupSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email:</label>
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-[${baseColor}]"
                  placeholder="Please Enter Email."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order number:</label>
                <input
                  placeholder="eg. FRGSXXXXXXXXX"
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-[${baseColor}]"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white"
                style={{ backgroundColor: baseColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = adjustBrightness(baseColor, -20)}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = baseColor}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
