import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

export default function PDFUploader({ onFileSelected }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    validateAndProcess(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    validateAndProcess(file);
  };

  const validateAndProcess = (file) => {
    setError(null);
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    onFileSelected(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="pdf-upload"
          className="hidden"
          accept="application/pdf"
          onChange={handleChange}
        />
        
        <label htmlFor="pdf-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Upload className="w-12 h-12 text-blue-600" />
            </div>
            
            <div>
              <p className="text-xl font-semibold text-gray-900 mb-2">
                Upload Bill of Lading
              </p>
              <p className="text-gray-600">
                Drag and drop or click to select PDF file
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
