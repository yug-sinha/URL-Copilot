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
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
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
      console.error("Extract error:", err);
      alert("An error occurred while extracting context.");
    }
    setLoadingExtract(false);
  };

  const handleAsk = async () => {
    if (!context) {
      alert("Please extract a URL context first.");
      return;
    }
    if (!userQuestion) return;
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

  const handleNewChat = () => {
    setUrl("");
    setContext("");
    setChatHistory([]);
    setUserQuestion("");
    setIsUrlExtracted(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
    <header className="chat-header flex items-center justify-center bg-white shadow p-4" style={{ height: '20vh' }}>
        <div className="flex items-center">
            <img
                src="/logo.jpeg"
                alt="URL Copilot Logo"
                className="object-contain mr-4"
                style={{ maxHeight: '40%', maxWidth: '50%' }} // Adjusted logo size
            />
        </div>
    </header>

      <div className="url-input-area flex items-center justify-center p-4">
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

      <div className="chat-box flex-1 overflow-y-auto" ref={chatBoxRef}>
        {chatHistory.length === 0 ? (
          <p className="text-center text-gray-400 mt-4">Start a conversation...</p>
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

      <div className="chat-input">
        <div className="new-chat-button" onClick={handleNewChat}>
          +
        </div>

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

        <button onClick={handleAsk} disabled={loadingChat}>
          {loadingChat ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}