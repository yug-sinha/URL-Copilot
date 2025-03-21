"use client";
import { useState, useRef, useEffect } from "react";

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
      console.error("Extract error:", err);
      alert("An error occurred while extracting context.");
    }
    setLoadingExtract(false);
  };

  const handleAsk = async () => {
    if (!userQuestion || !context) return;
    setLoadingChat(true);

    const newChatHistory = [...chatHistory, { sender: "user", text: userQuestion }];
    setChatHistory(newChatHistory);
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
        { sender: "system", text: data.response || `Error: ${data.error}` },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: "system", text: "An error occurred while fetching response." },
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="p-4 border-b border-gray-700 text-center">
        <h1 className="text-2xl font-bold tracking-wide">URL Copilot</h1>
      </header>

      {/* URL Input */}
      <div className="p-4 border-b border-gray-800 bg-gray-950 flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
          placeholder="Enter a URL"
          value={url}
          disabled={isUrlExtracted}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleExtract}
          disabled={loadingExtract || isUrlExtracted}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          {loadingExtract ? "Extracting..." : "Extract"}
        </button>
        <button
          onClick={handleNewChat}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
        >
          New Chat
        </button>
      </div>

      {/* Chat Section */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-black"
        ref={chatRef}
      >
        {chatHistory.map((chat, idx) => (
          <div
            key={idx}
            className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-lg ${
                chat.sender === "user"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {chat.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Section */}
      {isUrlExtracted && (
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex gap-2">
          <textarea
            className="flex-1 resize-none px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            placeholder="Type your question..."
            rows={2}
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
          />
          <button
            onClick={handleAsk}
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
            disabled={loadingChat}
          >
            {loadingChat ? "..." : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}
