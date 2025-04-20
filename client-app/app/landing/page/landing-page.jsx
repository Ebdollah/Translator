'use client'

import React, { useState } from "react";
import FilePicker from "@/components/FilePicker";

const LandingPage = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileSelect = async (file) => {
    setUploading(true);
    setMessage(null);
    console.log("📂 Selected file:", file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/file/uploadfile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const blob = await response.blob();

      // Create a downloadable link
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
          <p className="mt-4 text-blue-500">Uploading and translating... ⏳</p>
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
