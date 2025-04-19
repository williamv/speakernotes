'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'speaker_notes.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to process file');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to process the file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    noClick: true
  });

  return (
    <main {...getRootProps()} className="min-h-screen p-8 flex flex-col">
      <input {...getInputProps()} />
      <div className={`flex-1 flex flex-col justify-center transition-all duration-200 ${
        isDragActive ? 'scale-105' : ''
      }`}>
        <h1 className="text-3xl font-bold mb-8 text-center">PowerPoint Notes Extractor</h1>
        
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors h-[80vh] flex flex-col justify-center
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
          {isProcessing ? (
            <p className="text-lg">Processing your file...</p>
          ) : isDragActive ? (
            <p className="text-lg">Drop the PowerPoint file here...</p>
          ) : (
            <div>
              <p className="text-lg mb-4">Drag and drop a PowerPoint file anywhere on this page</p>
              <p className="text-sm text-gray-600">Only .pptx files are supported</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </main>
  );
} 