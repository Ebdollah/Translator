// app/landing/page/landing-page.jsx

'use client'

import React, { useState, useEffect } from "react";
import FilePicker from "@/components/FilePicker";

const LandingPage = () => {
  const [serverData, setServerData] = useState(null);

  const handleFileSelect = async (file) => {
    console.log("Selected file:", file.name);

    try {
      // Create a FormData object and append the file
      const formData = new FormData();
      formData.append("file", file);

      // Send the file to the server using a POST request
      const response = await fetch("http://localhost:8000/uploadfile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("🚀 ~ File upload response ~ data:", data);

      setServerData(data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Fetch data from the server
  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("🚀 ~ fetchData ~ data:", data)
      
      setServerData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Translator App</h1>
      <p className="text-lg mb-6">Translate text into multiple languages with ease.</p>
      <FilePicker onFileSelect={handleFileSelect} />
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Server Data:</h2>
        {serverData ? (
          <pre className="bg-gray-900 p-4 rounded">{JSON.stringify(serverData, null, 2)}</pre>
        ) : (
          <p>Loading data from the server...</p>
        )}
      </div>
    </div> 
  );
};

export default LandingPage;