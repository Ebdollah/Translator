'use client'

import React, { useEffect, useRef, useState } from "react";
import FilePicker from "@/components/FilePicker";
import { v4 as uuidv4 } from "uuid";

const LandingPage = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const socketRef = useRef(null);
  const sessionIdRef = useRef(uuidv4());

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/file/ws/${sessionIdRef.current}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected!");
    };

    ws.onmessage = (event) => {
      const msg = event.data;
      // console.log("📡 WebSocket:", msg);
      
      if (msg.includes("Progress:")) {
        // Extract just the number from "Progress: X.X%"
        const percentText = msg.split("Progress:")[1].trim().replace('%', '');
        const percent = parseFloat(percentText);
        // console.log("Setting progress to:", percent); // Debug log
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

  const waitForSocketReady = () => {
    return new Promise((resolve, reject) => {
      const ws = socketRef.current;
      if (!ws) return reject("WebSocket not initialized.");
      if (ws.readyState === WebSocket.OPEN) return resolve();

      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        reject("WebSocket timeout.");
      }, 3000);
    });
  };

  const handleFileSelect = async (file) => {
    setUploading(true);
    setMessage("Starting upload and translation...");
    setProgress(0);

    try {
      await waitForSocketReady();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_id", sessionIdRef.current);

      const response = await fetch("http://localhost:8000/file/uploadfile/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

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
      console.error("❌ Upload error:", error);
      setMessage(`⚠️ Upload or download failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Always render the progress bar when uploading
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3">🎬 SRT Translator App</h1>
        <p className="text-gray-600 mb-6">Upload a Turkish `.txt` transcript and get a translated `.srt` file with progress feedback.</p>
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
            <p className="text-sm mt-1 text-gray-700">Progress: {progress.toFixed(1)}%</p>
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