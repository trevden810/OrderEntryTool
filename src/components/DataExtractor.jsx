/**
 * DataExtractor
 * Handles PDF processing and exposes a debug view before advancing to the Review step.
 */

import React, { useState, useEffect } from 'react';
import { FileText, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { processPDF } from '../services/pdfService';
import { extractDataFromText } from '../services/extractionService';

export default function DataExtractor({ file, onDataExtracted, onBack }) {
  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [debugText, setDebugText] = useState('');
  const [autoAdvanced, setAutoAdvanced] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

  useEffect(() => {
    processFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const processFile = async () => {
    try {
      setStatus('processing');

      const pdfData = await processPDF(file, 'auto', (update) => {
        setProgress(update.progress || 50);
      });

      setStatus('extracting');

      console.log('=== RAW PDF TEXT ===');
      console.log(pdfData.fullText);
      setDebugText(pdfData.fullText.substring(0, 1500));

      const originMatch = pdfData.fullText.match(/ORIGIN:\s*([\s\S]{0,400}?)(?:DESTINATION:|Asset)/i);
      console.log('=== ORIGIN MATCH ===');
      console.log(originMatch ? originMatch[0] : 'NOT FOUND');

      const addressMatch = pdfData.fullText.match(/1325[^\n]*/);
      console.log('=== ADDRESS MATCH ===');
      console.log(addressMatch ? addressMatch[0] : 'NOT FOUND');

      const data = extractDataFromText(pdfData.fullText);
      data.pdfMethod = pdfData.method;
      data.pdfConfidence = pdfData.confidence;
      data.rawText = pdfData.fullText;

      setExtractedData(data);
      setStatus('complete');
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (status === 'complete' && extractedData && autoAdvanceEnabled && !autoAdvanced) {
      setAutoAdvanced(true);
      onDataExtracted(extractedData);
    }
  }, [status, extractedData, autoAdvanceEnabled, autoAdvanced, onDataExtracted]);

  const handleContinue = () => {
    if (extractedData) {
      setAutoAdvanced(true);
      onDataExtracted(extractedData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Processing PDF</h2>
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            &lt; Back
          </button>
        </div>

        {status === 'processing' && (
          <div className="text-center py-8">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-700">Extracting text from PDF...</p>
            {progress > 0 && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'extracting' && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-lg text-gray-700">Extracting data fields...</p>
          </div>
        )}

        {status === 'complete' && extractedData && (
          <div>
            <div className="flex items-center gap-2 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="font-semibold text-green-900">Extraction Complete</p>
                <p className="text-sm text-green-700">
                  Confidence: {extractedData.confidence}% - Method: {extractedData.pdfMethod}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Auto-advance to Review</p>
                <p className="text-xs text-gray-600">Toggle off to inspect extracted data before continuing.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700" id="auto-advance-label">
                  {autoAdvanceEnabled ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAdvanceEnabled}
                  aria-labelledby="auto-advance-label"
                  onClick={() => setAutoAdvanceEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoAdvanceEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoAdvanceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <details className="mb-6 p-4 bg-gray-50 rounded-lg">
              <summary className="cursor-pointer font-semibold">Debug: Raw Text Preview</summary>
              <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap break-words">{debugText}</pre>
            </details>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <DataField label="Order Number" value={extractedData.orderNumber} />
              <DataField label="Tracking Number" value={extractedData.trackingNumber} />
              <DataField label="Customer" value={extractedData.customerName} />
              <DataField label="Serial Number" value={extractedData.serialNumber} />
              <DataField label="Address" value={extractedData.address} />
              <DataField label="Suite" value={extractedData.suite} />
              <DataField label="City" value={extractedData.city} />
              <DataField label="State" value={extractedData.state} />
              <DataField label="ZIP Code" value={extractedData.zipCode} />
              <DataField label="Phone" value={extractedData.phone} />
              <DataField label="Job Type" value={extractedData.jobType} />
              <DataField label="Product" value={extractedData.productDescription} />
              <DataField label="Scheduling Info" value={extractedData.schedulingInfo} />
              <DataField label="Origin Contacts" value={extractedData.originContacts} />
              <DataField label="Origin Notes" value={extractedData.originNotes} />
              <DataField label="Pricing" value={extractedData.pricing} />
              <DataField label="Service Requirements" value={extractedData.serviceRequirements} />
              <DataField label="Location Instructions" value={extractedData.locationInstructions} />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleContinue}
                disabled={autoAdvanceEnabled}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  autoAdvanceEnabled
                    ? 'bg-blue-300 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Continue to Review
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-lg text-gray-900 font-semibold mb-2">Processing Failed</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DataField({ label, value }) {
  const hasValue = value && value.trim() !== '' && value !== 'undefined, undefined';

  return (
    <div
      className={`p-3 rounded-lg border ${
        hasValue ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`font-medium ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
        {hasValue ? value : 'Not found'}
      </p>
    </div>
  );
}
