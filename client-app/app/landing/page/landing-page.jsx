'use client'

import React, { useEffect, useRef, useState } from "react";
import FilePicker from "@/components/FilePicker";
import { v4 as uuidv4 } from "uuid";

const LandingPage = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const socketRef = useRef(null);
  const sessionIdRef = useRef(uuidv4()); // persistent session ID

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/file/ws/${sessionIdRef.current}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      const msg = event.data;
      console.log("📡 WebSocket:", msg);
      if (msg.includes("Progress:")) {
        const percent = parseFloat(msg.split("Progress:")[1]);
        setProgress(percent);
      } else if (msg.includes("complete")) {
        setProgress(100);
        setMessage("✅ Translation complete. Downloading file...");
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleFileSelect = async (file) => {
    setUploading(true);
    setMessage(null);
    setProgress(0);
    console.log("📂 Selected file:", file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_id", sessionIdRef.current); // send session ID

      const response = await fetch("http://localhost:8000/file/uploadfile/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "translated_output.srt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMessage("✅ File translated and downloaded successfully!");
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      setMessage("⚠️ Failed to upload or download. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3">🎬 SRT Translator App</h1>
        <p className="text-gray-600 mb-6">Upload a Turkish `.txt` transcript and get a translated `.srt` subtitle file.</p>
      </div>

      <div className="bg-white p-6 shadow-xl rounded-lg">
        <FilePicker onFileSelect={handleFileSelect} />

        {uploading && (
          <div className="mt-4">
            <p className="text-blue-500 mb-2">Uploading and translating... ⏳</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm mt-1 text-gray-700">{progress}%</p>
          </div>
        )}

        {message && (
          <p className={`mt-4 font-medium ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
