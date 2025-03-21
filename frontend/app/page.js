"use client"; // Required for client-side interactivity in Next.js 13 app router

import { useState } from "react";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    try {
      // First: call /extract to get context from the URL
      const extractRes = await fetch("http://localhost:8002/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const extractData = await extractRes.json();
      if (extractData.error) {
        setResponse(`Extraction Error: ${extractData.error}`);
        setLoading(false);
        return;
      }
      const context = extractData.text;
      console.log("Extracted context length:", context.length);

      // Second: call /chat with the extracted context and the question
      const chatRes = await fetch("http://localhost:8002/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, question }),
      });
      const chatData = await chatRes.json();
      if (chatData.error) {
        setResponse(`Chat Error: ${chatData.error}`);
      } else {
        setResponse(chatData.response);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setResponse("An error occurred while fetching data from the server.");
    }
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-center mb-6">URL Chatbot</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">URL</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Enter a URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Question</label>
          <textarea
            className="w-full border rounded p-2"
            placeholder="Enter your question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            rows={4}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Loading..." : "Ask Gemini"}
        </button>
      </form>
      {response && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </main>
  );
}
