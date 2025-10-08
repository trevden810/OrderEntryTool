import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewForm from '../ReviewForm.jsx';
import { createJobWithAuth } from '../../services/filemakerService.js';

vi.mock('../../services/filemakerService.js', () => ({
  createJobWithAuth: vi.fn()
}));

const mockCreateJobWithAuth = vi.mocked(createJobWithAuth);

const baseExtractedData = {
  jobType: 'Delivery',
  orderNumber: 'ORD-1001',
  trackingNumber: 'TRACK-1001',
  customerName: 'Acme Corp',
  address: '123 Main Street',
  suite: 'Suite 200',
  zipCode: '84119',
  city: 'West Valley City',
  state: 'UT',
  phone: '8015551212',
  productDescription: 'Test Equipment',
  serialNumber: 'SN-ABC123'
};

describe('ReviewForm', () => {
  beforeEach(() => {
    mockCreateJobWithAuth.mockReset();
  });

  it('submits normalized data including requested due date note', async () => {
    mockCreateJobWithAuth.mockResolvedValue({ recordId: '12345', jobNumber: '903109' });

    const user = userEvent.setup();
    render(<ReviewForm extractedData={baseExtractedData} onBack={() => {}} />);

    const dueDateInput = screen.getByLabelText(/Requested Due Date/i);
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2025-10-15');

    const submitButton = screen.getByRole('button', { name: /Create Job in FileMaker/i });
    await user.click(submitButton);

    await waitFor(() => expect(mockCreateJobWithAuth).toHaveBeenCalled());

    const submitted = mockCreateJobWithAuth.mock.calls[0][0];
    expect(submitted).not.toHaveProperty('job_date');
    expect(submitted).not.toHaveProperty('date_received');
    expect(submitted).not.toHaveProperty('due_date');
    expect(submitted).not.toHaveProperty('oneway_miles');
    expect(submitted.notes_schedule).toContain('Requested due date: 2025-10-15');
    expect(submitted.phone_C1).toBe('801-555-1212');

    await waitFor(() =>
      expect(
        screen.getByText(/Job created successfully! FileMaker Job ID: 903109/i)
      ).toBeInTheDocument()
    );
  });

  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<ReviewForm extractedData={baseExtractedData} onBack={() => {}} />);

    const orderInput = screen.getByLabelText(/Order Number/i);
    await user.clear(orderInput);

    const submitButton = screen.getByRole('button', { name: /Create Job in FileMaker/i });
    await user.click(submitButton);

    expect(await screen.findByText(/client_order_number is required/i)).toBeInTheDocument();
    expect(mockCreateJobWithAuth).not.toHaveBeenCalled();
  });
});
