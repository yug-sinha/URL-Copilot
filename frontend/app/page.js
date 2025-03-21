// page.js
"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Image from 'next/image';

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [isUrlExtracted, setIsUrlExtracted] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chatHistory]);

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
      alert("An error occurred while extracting context.");
    }
    setLoadingExtract(false);
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!userQuestion || !context) return;
    setLoadingChat(true);

    setChatHistory([...chatHistory, { sender: "user", text: userQuestion }]);
    setUserQuestion("");

    try {
      const res = await fetch("http://localhost:8002/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, question: userQuestion }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: data.response || `Error: ${data.error}` },
      ]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: "bot", text: "An error occurred." }]);
    }

    setLoadingChat(false);
  };

  const handleNewChat = () => {
    setUrl("");
    setContext("");
    setChatHistory([]);
    setUserQuestion("");
    setIsUrlExtracted(false);
  };

  return (
    <div className="chat-layout">
      {/* Header */}
      <div className="chat-header">
        <Image src="/logo.jpeg" alt="Logo" width={400} height={100} />
      </div>

      {/* Main Content */}
      <div className="chat-content">
        {/* URL Input */}
        <div className="chat-input">
          <div className="new-chat-button" onClick={handleNewChat}>+</div>
          <input
            type="text"
            className="flex-1"
            placeholder="Enter a URL"
            value={url}
            disabled={isUrlExtracted}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button onClick={handleExtract} disabled={loadingExtract || isUrlExtracted}>
            {loadingExtract ? "Extracting..." : "Extract"}
          </button>
        </div>

        {/* Loading animation */}
        {loadingExtract && <div className="loading-text">Processing URL...</div>}

        {/* Chat Messages */}
        <div className="chat-box" ref={chatRef}>
          {chatHistory.map((chat, idx) => (
            <div key={idx} className={`message ${chat.sender === "user" ? "user-message" : "bot-message"}`}>
              <ReactMarkdown>{chat.text}</ReactMarkdown>
            </div>
          ))}
        </div>

        {/* Question Input */}
        {isUrlExtracted && (
          <form className="chat-input" onSubmit={handleAsk}>
            <textarea
              className="flex-1"
              placeholder="Type your question..."
              rows={2}
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
            />
            <button type="submit" disabled={loadingChat}>
              {loadingChat ? "..." : "Send"}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="chat-footer">
        {/* You can add footer content here if needed */}
      </div>
    </div>
  );
}