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

  const chatBoxRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when chatHistory updates
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

  // Extract content from URL
  const handleExtract = async () => {
    if (!url) return;
    setLoadingExtract(true);
    try {
      const res = await fetch("http://localhost:8002/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`Extraction Error: ${data.error}`);
      } else {
        setContext(data.text);
        setIsUrlExtracted(true);
      }
    } catch (err) {
      console.error("Extract error:", err);
      alert("An error occurred while extracting context.");
    }
    setLoadingExtract(false);
  };

  // Send a question to the chatbot
  const handleAsk = async () => {
    if (!context) {
      alert("Please extract a URL context first.");
      return;
    }
    if (!userQuestion) return;
    setLoadingChat(true);

    // Add user message
    setChatHistory([...chatHistory, { sender: "user", text: userQuestion }]);
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

  // Start new chat
  const handleNewChat = () => {
    setUrl("");
    setContext("");
    setChatHistory([]);
    setUserQuestion("");
    setIsUrlExtracted(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="chat-header">
        URL Copilot
      </header>

      {/* URL input area */}
      <div className="url-input-area">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="url-input"
            placeholder="Enter a URL"
            value={url}
            disabled={isUrlExtracted}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={handleExtract}
            disabled={loadingExtract || isUrlExtracted}
          >
            {loadingExtract ? "Processing..." : "Extract"}
          </button>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="chat-box" ref={chatBoxRef}>
        {chatHistory.length === 0 ? (
          <p className="text-center text-gray-400">Start a conversation...</p>
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

      {/* Chat input pinned at bottom */}
      <div className="chat-input">
        {/* New Chat Button */}
        <div className="new-chat-button" onClick={handleNewChat}>
          +
        </div>

        {/* Textarea for user question */}
        <textarea
          className="flex-1"
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

        {/* Send button */}
        <button onClick={handleAsk} disabled={loadingChat}>
          {loadingChat ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
