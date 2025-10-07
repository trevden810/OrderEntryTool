import React, { useState } from 'react';
import PDFUploader from './components/PDFUploader';
import DataExtractor from './components/DataExtractor';
import ReviewForm from './components/ReviewForm';
import { FileText, Settings } from 'lucide-react';

function App() {
  const [step, setStep] = useState(1);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleFileSelected = (file) => {
    setPdfFile(file);
    setStep(2);
  };

  const handleDataExtracted = (data) => {
    setExtractedData(data);
    setStep(3);
  };

  const resetProcess = () => {
    setStep(1);
    setPdfFile(null);
    setExtractedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Entry Tool</h1>
                <p className="text-sm text-gray-600">Automated PDF to FileMaker processing</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-4">
          <Step number={1} label="Upload" active={step === 1} complete={step > 1} />
          <div className="w-12 h-1 bg-gray-300" />
          <Step number={2} label="Extract" active={step === 2} complete={step > 2} />
          <div className="w-12 h-1 bg-gray-300" />
          <Step number={3} label="Review" active={step === 3} complete={step > 3} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        {step === 1 && <PDFUploader onFileSelected={handleFileSelected} />}
        {step === 2 && pdfFile && (
          <DataExtractor
            file={pdfFile}
            onDataExtracted={handleDataExtracted}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && extractedData && (
          <ReviewForm
            extractedData={extractedData}
            onBack={() => setStep(2)}
          />
        )}
      </main>
    </div>
  );
}

function Step({ number, label, active, complete }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          complete
            ? 'bg-green-500 text-white'
            : active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {number}
      </div>
      <span className={`text-sm mt-1 ${active ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
}

export default App;
