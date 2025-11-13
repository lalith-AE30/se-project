import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClaimSubmissionPage from "@/app/claims/submit/page";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe("ClaimSubmissionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the claim submission form", () => {
    render(<ClaimSubmissionPage />);

    expect(screen.getByText("Claim Submission")).toBeInTheDocument();
    expect(screen.getByLabelText("Policy Number *")).toBeInTheDocument();
    expect(screen.getByLabelText("Claim Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Incident Date *")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address *")).toBeInTheDocument();
    expect(screen.getByLabelText("Describe the incident *")).toBeInTheDocument();
    expect(screen.getByText("Submit claim")).toBeInTheDocument();
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionPage />);

    const submitButton = screen.getByText("Submit claim");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("This field is required.")).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionPage />);

    const emailInput = screen.getByLabelText("Email Address *");
    await user.type(emailInput, "invalid-email");

    const submitButton = screen.getByText("Submit claim");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    });
  });

  it("displays success message on successful submission", async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionPage />);

    // Fill out the form
    await user.type(screen.getByLabelText("Policy Number *"), "POL-1001");
    await user.type(screen.getByLabelText("Claim Type *"), "Auto");
    await user.type(screen.getByLabelText("Incident Date *"), "2024-10-01");
    await user.type(screen.getByLabelText("Incident Time *"), "14:30");
    await user.type(screen.getByLabelText("Incident Location *"), "New York");
    await user.type(screen.getByLabelText("Full Name *"), "John Doe");
    await user.type(screen.getByLabelText("Email Address *"), "john@example.com");
    await user.type(screen.getByLabelText("Describe the incident *"), "Car accident");

    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ referenceId: "CLM-20241001000000-abcdef123456" }),
    });

    const submitButton = screen.getByText("Submit claim");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Claim submitted successfully!")).toBeInTheDocument();
      expect(screen.getByText(/CLM-20241001000000-abcdef123456/)).toBeInTheDocument();
    });
  });

  it("displays eligibility errors from API", async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionPage />);

    // Fill out the form
    await user.type(screen.getByLabelText("Policy Number *"), "POL-1001");
    await user.type(screen.getByLabelText("Claim Type *"), "Auto");
    await user.type(screen.getByLabelText("Incident Date *"), "2024-10-01");
    await user.type(screen.getByLabelText("Incident Time *"), "14:30");
    await user.type(screen.getByLabelText("Incident Location *"), "New York");
    await user.type(screen.getByLabelText("Full Name *"), "John Doe");
    await user.type(screen.getByLabelText("Email Address *"), "john@example.com");
    await user.type(screen.getByLabelText("Describe the incident *"), "Car accident");

    // Mock API response with eligibility error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({
        message: "Claim is not eligible for submission.",
        reasons: ["Policy is inactive.", "Claim type is not covered."],
      }),
    });

    const submitButton = screen.getByText("Submit claim");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Unable to submit claim")).toBeInTheDocument();
      expect(screen.getByText("Policy is inactive.")).toBeInTheDocument();
      expect(screen.getByText("Claim type is not covered.")).toBeInTheDocument();
    });
  });

  it("displays file validation errors", async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionPage />);

    // Fill out the form
    await user.type(screen.getByLabelText("Policy Number *"), "POL-1001");
    await user.type(screen.getByLabelText("Claim Type *"), "Auto");
    await user.type(screen.getByLabelText("Incident Date *"), "2024-10-01");
    await user.type(screen.getByLabelText("Incident Time *"), "14:30");
    await user.type(screen.getByLabelText("Incident Location *"), "New York");
    await user.type(screen.getByLabelText("Full Name *"), "John Doe");
    await user.type(screen.getByLabelText("Email Address *"), "john@example.com");
    await user.type(screen.getByLabelText("Describe the incident *"), "Car accident");

    // Add invalid file
    const fileInput = screen.getByLabelText("Upload files") as HTMLInputElement;
    const invalidFile = new File(["test"], "test.exe", { type: "application/x-msdownload" });
    
    // Mock the file upload
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: true
    });
    
    fireEvent.change(fileInput);

    // Mock API response with file validation error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        message: "File validation failed.",
        errors: {
          invalidTypes: ["test.exe"],
        },
      }),
    });

    const submitButton = screen.getByText("Submit claim");
    await user.click(submitButton);

    // Check for the error message in the document
    const errorMessage = await screen.findByText(/unsupported file type/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it("clears form on reset", async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionPage />);

    const policyInput = screen.getByLabelText("Policy Number *");
    await user.type(policyInput, "POL-1001");

    const clearButton = screen.getByText("Clear form");
    await user.click(clearButton);

    expect(policyInput).toHaveValue("");
  });
});
