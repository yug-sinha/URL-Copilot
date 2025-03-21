"use client";

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [isUrlExtracted, setIsUrlExtracted] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // 1) Extract context from URL
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

  // 2) Ask a question using the extracted context
  const handleAsk = async () => {
    if (!context) {
      alert("Please extract a URL context first.");
      return;
    }
    if (!userQuestion) return;
    setLoadingChat(true);

    // Add user question to chat
    const newChatHistory = [
      ...chatHistory,
      { sender: "user", text: userQuestion },
    ];
    setChatHistory(newChatHistory);
    setUserQuestion("");

    try {
      const res = await fetch("http://localhost:8002/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, question: userQuestion }),
      });
      const data = await res.json();
      if (data.error) {
        // Add error as a system message
        setChatHistory((prev) => [
          ...prev,
          { sender: "system", text: `Error: ${data.error}` },
        ]);
      } else {
        // Add Gemini's response as a system message
        setChatHistory((prev) => [
          ...prev,
          { sender: "system", text: data.response },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "system", text: "An error occurred while fetching response." },
      ]);
    }
    setLoadingChat(false);
  };

  // 3) Start new chat (reset everything)
  const handleNewChat = () => {
    setUrl("");
    setContext("");
    setChatHistory([]);
    setUserQuestion("");
    setIsUrlExtracted(false);
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Header / Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">URL Chatbot</h1>
      </div>

      {/* URL Input + Extract Button */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Enter a URL"
          value={url}
          disabled={isUrlExtracted}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleExtract}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loadingExtract || isUrlExtracted}
        >
          {loadingExtract ? "Extracting..." : "Extract Context"}
        </button>
        <button
          onClick={handleNewChat}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          New Chat
        </button>
      </div>

      {/* Chat Messages */}
      <div className="border rounded p-4 h-[400px] overflow-auto bg-white">
        {chatHistory.map((chat, idx) => {
          return (
            <div
              key={idx}
              className={`mb-3 flex ${
                chat.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  chat.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                <span>{chat.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Question Input + Ask Button */}
      <div className="flex gap-2">
        <textarea
          className="flex-1 border rounded p-2"
          placeholder="Ask a question"
          rows={3}
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
        />
        <button
          onClick={handleAsk}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loadingChat}
        >
          {loadingChat ? "Loading..." : "Ask Gemini"}
        </button>
      </div>
    </main>
  );
}
