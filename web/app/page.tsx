'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1
  });

  const handleSubmit = async () => {
    if (!file) return;

    setIsProcessing(true);
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
        setDownloadUrl(url);
      } else {
        throw new Error('Failed to process file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process the file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PowerPoint Notes Extractor</h1>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the PowerPoint file here...</p>
          ) : (
            <p>Drag and drop a PowerPoint file here, or click to select one</p>
          )}
        </div>

        {file && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Selected file: {file.name}</p>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isProcessing ? 'Processing...' : 'Extract Notes'}
            </button>
          </div>
        )}

        {downloadUrl && (
          <div className="mt-4">
            <a
              href={downloadUrl}
              download="speaker_notes.docx"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Download Notes
            </a>
          </div>
        )}
      </div>
    </main>
  );
} 