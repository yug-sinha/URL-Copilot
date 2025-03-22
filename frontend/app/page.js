"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [isUrlExtracted, setIsUrlExtracted] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState("");

  // Reference for the chat messages container
  const chatBoxRef = useRef(null);

  // Scroll to bottom whenever chatHistory updates
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Handle extracting the URL
  const handleExtract = async () => {
    if (!url) return;
    setLoadingExtract(true);

    // Start with first extraction message
    setExtractionMessage("Processing your URL...");

    // After 3 seconds, if still loading, update message
    const timerId = setTimeout(() => {
      setExtractionMessage("your website is getting extracted...");
    }, 3000);

    try {
      const res = await fetch("http://localhost:8002/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      clearTimeout(timerId);

      if (data.error) {
        alert(`Extraction Error: ${data.error}`);
        setExtractionMessage("");
      } else {
        setContext(data.text);
        setIsUrlExtracted(true);
        setExtractionMessage("Successfully extracted");
      }
    } catch (err) {
      clearTimeout(timerId);
      console.error("Extract error:", err);
      alert("An error occurred while extracting context.");
      setExtractionMessage("");
    }
    setLoadingExtract(false);
  };

  // Handle asking a question
  const handleAsk = async () => {
    if (!context) {
      alert("Please extract a URL context first.");
      return;
    }
    if (!userQuestion) return;

    setLoadingChat(true);
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", text: userQuestion },
    ]);
    setUserQuestion("");

    try {
      const res = await fetch("http://localhost:8002/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, question: userQuestion }),
      });
      const data = await res.json();
      if (data.error) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "bot", text: `Error: ${data.error}` },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { sender: "bot", text: data.response },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "An error occurred." },
      ]);
    }
    setLoadingChat(false);
  };

  // Start a new chat
  const handleNewChat = () => {
    setUrl("");
    setContext("");
    setChatHistory([]);
    setUserQuestion("");
    setIsUrlExtracted(false);
    setExtractionMessage("");
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Fixed Header (20% of viewport) */}
      <header
        className="chat-header bg-white shadow flex items-center"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "20vh",
          zIndex: 100,
          paddingLeft: "2rem",
          paddingRight: "2rem",
        }}
      >
        {/* Logo with variable margin to the right (in vw) */}
        <img
          src="/logo.jpeg"
          alt="URL Copilot Logo"
          style={{
            height: "70%",   // bigger in the 20vh header
            width: "auto",
            marginRight: "20vw", // 5% of viewport width for variable gap
          }}
        />

        {/* URL Input, Extract Button, and Extraction Message in a row,
            wrapping if the screen is too narrow. */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",    // allows wrapping on small screens
            alignItems: "center",
            gap: "1rem",
            whiteSpace: "normal", // allow line breaks if needed
          }}
        >
          <input
            type="text"
            className="url-input"
            placeholder="Enter a URL"
            value={url}
            disabled={isUrlExtracted}
            onChange={(e) => setUrl(e.target.value)}
            style={{ display: "inline-block" }}
          />
          <button
            onClick={handleExtract}
            disabled={loadingExtract || isUrlExtracted}
            style={{ display: "inline-block" }}
          >
            {loadingExtract ? "Processing..." : "Extract"}
          </button>
          {extractionMessage && (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.9rem",
                color: "#333",
              }}
            >
              {extractionMessage}
            </span>
          )}
        </div>
      </header>

      {/* Middle Content (60% of viewport, scrollable) */}
      <main
        style={{
          marginTop: "20vh",   // clear header
          marginBottom: "20vh", // clear footer
          height: "60vh",
          overflowY: "auto",
        }}
      >
        {/* Chat Messages */}
        <div
          className="chat-box px-4 pb-4 flex flex-col"
          ref={chatBoxRef}
          style={{ flex: 1 }}
        >
          {chatHistory.length === 0 ? (
            <p className="text-center text-gray-400 mt-4"></p>
          ) : (
            chatHistory.map((chat, idx) => (
              <div
                key={idx}
                className={`message ${
                  chat.sender === "user" ? "user-message" : "bot-message"
                }`}
              >
                <ReactMarkdown>{chat.text}</ReactMarkdown>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Fixed Footer (Chat Input, 20% of viewport) */}
      <footer
        className="chat-input bg-white flex items-center"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "20vh",
          zIndex: 100,
        }}
      >
        <div className="new-chat-button ml-4" onClick={handleNewChat}>
          +
        </div>
        <textarea
          className="flex-1 m-4"
          placeholder="Type your question..."
          rows={1}
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
        />
        <button className="mr-4" onClick={handleAsk} disabled={loadingChat}>
          {loadingChat ? "Sending..." : "Send"}
        </button>
      </footer>
    </div>
  );
}