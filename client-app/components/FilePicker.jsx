'use client'

import React, { useState } from 'react';

const FilePicker = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      console.log('Uploading file:', selectedFile.name);
      // Add your file upload logic here
    } else {
      alert('Please select a file first.');
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
      <div className="flex flex-col items-center">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt,.json,.srt"
          className="mb-4"
        />
        {selectedFile && (
          <p className="text-sm text-gray-600 mb-4">Selected File: {selectedFile.name}</p>
        )}
        <button 
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Upload
        </button>
      </div>
    </div>
  );
};

export default FilePicker;