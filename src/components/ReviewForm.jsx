import React, { useState } from 'react';
import { Edit2, Save, Database, AlertCircle } from 'lucide-react';
import { mapToFileMakerFields, validateJobData, normalizeJobData } from '../utils/fieldMappings';
import { createJobWithAuth } from '../services/filemakerService';

export default function ReviewForm({ extractedData, onBack }) {
  const [jobData, setJobData] = useState(() => mapToFileMakerFields(extractedData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [requestedDueDate, setRequestedDueDate] = useState('');

  const handleChange = (field, value) => {
    setJobData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const handleSubmit = async () => {
    // Validate
    const validation = validateJobData(jobData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const normalizedData = normalizeJobData(jobData);
      const response = await createJobWithAuth(normalizedData);
      const jobNumber = response.jobNumber ?? response.jobDetails?._kp_job_id ?? null;
      
      setResult({
        success: true,
        recordId: response.recordId,
        jobNumber,
        message: jobNumber
          ? `Job created successfully! FileMaker Job ID: ${jobNumber}`
          : 'Job created successfully!'
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestedDueDate = (value) => {
    setRequestedDueDate(value);
    // Merge requested due date as a line in notes_schedule without duplicating
    setJobData(prev => {
      const existing = prev.notes_schedule || '';
      const cleaned = existing.replace(/(^|\n)Requested due date:\s?.*$/mi, '').trim();
      const line = value ? `Requested due date: ${value}` : '';
      const merged = [cleaned, line].filter(Boolean).join(cleaned ? '\n' : '');
      return { ...prev, notes_schedule: merged };
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            ← Back
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-red-600" size={20} />
              <p className="font-semibold text-red-900">Please fix the following errors:</p>
            </div>
            <ul className="list-disc list-inside text-red-700 text-sm">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <FormField
            label="Order Number *"
            name="client_order_number"
            value={jobData.client_order_number}
            onChange={(v) => handleChange('client_order_number', v)}
          />
          <FormField
            label="Tracking Number"
            name="client_order_number_2"
            value={jobData.client_order_number_2}
            onChange={(v) => handleChange('client_order_number_2', v)}
          />
          <FormField
            label="Customer Name *"
            name="Customer_C1"
            value={jobData.Customer_C1}
            onChange={(v) => handleChange('Customer_C1', v)}
          />
          <FormField
            label="Job Type *"
            name="job_type"
            value={jobData.job_type}
            onChange={(v) => handleChange('job_type', v)}
            type="select"
            options={['Delivery', 'Pickup']}
          />
          <FormField
            label="Address *"
            name="address_C1"
            value={jobData.address_C1}
            onChange={(v) => handleChange('address_C1', v)}
            className="col-span-2"
          />
          <FormField
            label="Address Line 2"
            name="address2_C1"
            value={jobData.address2_C1}
            onChange={(v) => handleChange('address2_C1', v)}
          />
          <FormField
            label="ZIP Code *"
            name="zip_C1"
            value={jobData.zip_C1}
            onChange={(v) => handleChange('zip_C1', v)}
          />
          <FormField
            label="Contact Info"
            name="contact_C1"
            value={jobData.contact_C1}
            onChange={(v) => handleChange('contact_C1', v)}
            className="col-span-2"
            placeholder="Name Phone Email"
          />
          <FormField
            label="Serial Number"
            name="product_serial_number"
            value={jobData.product_serial_number}
            onChange={(v) => handleChange('product_serial_number', v)}
          />
          <FormField
            label="Product Description"
            name="description_product"
            value={jobData.description_product}
            onChange={(v) => handleChange('description_product', v)}
          />
          <FormField
            label="Requested Due Date (note)"
            name="requested_due_date"
            value={requestedDueDate}
            onChange={handleRequestedDueDate}
            type="date"
          />
          <FormField
            label="People Required"
            name="people_required"
            value={jobData.people_required}
            onChange={(v) => handleChange('people_required', v)}
            type="number"
          />
          <FormField
            label="Call Ahead Notes"
            name="notes_call_ahead"
            value={jobData.notes_call_ahead}
            onChange={(v) => handleChange('notes_call_ahead', v)}
            className="col-span-2"
          />
          <FormField
            label="Driver Notes"
            name="notes_driver"
            value={jobData.notes_driver}
            onChange={(v) => handleChange('notes_driver', v)}
            className="col-span-2"
            multiline
          />
          <FormField
            label="Scheduling Info"
            name="scheduling_info"
            value={jobData.scheduling_info}
            onChange={(v) => handleChange('scheduling_info', v)}
            className="col-span-2"
          />
          <FormField
            label="Origin Contacts"
            name="origin_contacts"
            value={jobData.origin_contacts}
            onChange={(v) => handleChange('origin_contacts', v)}
            className="col-span-2"
          />
          <FormField
            label="Origin Notes"
            name="origin_notes"
            value={jobData.origin_notes}
            onChange={(v) => handleChange('origin_notes', v)}
            className="col-span-2"
            multiline
          />
          <FormField
            label="Pricing Amount"
            name="pricing_amount"
            value={jobData.pricing_amount}
            onChange={(v) => handleChange('pricing_amount', v)}
          />
          <FormField
            label="Service Requirements"
            name="service_requirements"
            value={jobData.service_requirements}
            onChange={(v) => handleChange('service_requirements', v)}
            className="col-span-2"
            multiline
          />
          <FormField
            label="Location Instructions"
            name="location_instructions"
            value={jobData.location_instructions}
            onChange={(v) => handleChange('location_instructions', v)}
            className="col-span-2"
            multiline
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Database size={20} />
            {isSubmitting ? 'Creating Job...' : 'Create Job in FileMaker'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <p className="font-semibold mb-1">{result.message}</p>
            {result.recordId && (
              <p className="text-sm">Record ID: {result.recordId}</p>
            )}
            {result.jobNumber && (
              <p className="text-sm">FileMaker Job ID: {result.jobNumber}</p>
            )}
            {result.success && (
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Process Another PDF
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, type = 'text', options, multiline, className, placeholder }) {
  const inputId = name || label.replace(/\s+/g, '_').toLowerCase();

  if (type === 'select') {
    return (
      <div className={className}>
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (multiline) {
    return (
      <div className={className}>
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
}
