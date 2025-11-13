import { checkClaimEligibility } from "@/lib/eligibility";
import { promises as fs } from "fs";
import path from "path";

// Mock dependencies
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
  },
}));
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
}));

const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
const mockReaddir = fs.readdir as jest.MockedFunction<typeof fs.readdir>;

describe("lib/eligibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkClaimEligibility", () => {
    const mockPolicies = [
      {
        policyNumber: "POL-1001",
        status: "active",
        coverageStart: "2024-01-01",
        coverageEnd: "2026-12-31",
        coveredClaimTypes: ["Auto", "Collision"],
        maxClaimsPerYear: 2,
      },
      {
        policyNumber: "POL-2099",
        status: "inactive",
        coverageStart: "2023-01-01",
        coverageEnd: "2024-01-01",
        coveredClaimTypes: ["Home", "Fire"],
        maxClaimsPerYear: 1,
      },
    ];

    beforeEach(() => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockPolicies));
      mockReaddir.mockResolvedValue([
        { name: "CLM-20241001000000-abcdef123456", isDirectory: () => true, isFile: () => false },
      ] as any);
    });

    it("should return eligible for valid claim", async () => {
      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "2024-10-01",
      });

      expect(result).toEqual({ eligible: true, reasons: [] });
    });

    it("should reject inactive policy", async () => {
      const result = await checkClaimEligibility({
        policyNumber: "POL-2099",
        claimType: "Home",
        incidentDate: "2024-06-01",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Policy is inactive or lapsed.");
    });

    it("should reject unknown policy", async () => {
      const result = await checkClaimEligibility({
        policyNumber: "POL-9999",
        claimType: "Auto",
        incidentDate: "2024-10-01",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Policy not found.");
    });

    it("should reject incident date outside coverage", async () => {
      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "2027-01-01",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Incident date is outside policy coverage window.");
    });

    it("should reject invalid incident date", async () => {
      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "invalid-date",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Incident date is invalid.");
    });

    it("should reject uncovered claim type", async () => {
      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Fire",
        incidentDate: "2024-10-01",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Claim type is not covered by this policy.");
    });

    it("should allow unlimited claims if no maxClaimsPerYear", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify([
        {
          ...mockPolicies[0],
          maxClaimsPerYear: undefined,
        },
      ]));

      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "2024-10-01",
      });

      expect(result).toEqual({ eligible: true, reasons: [] });
    });

    it("should reject when exceeding max claims per year", async () => {
      // Mock existing claims within the last year
      mockReaddir.mockResolvedValue([
        { name: "CLM-20241001000000-abcdef123456", isDirectory: () => true, isFile: () => false },
        { name: "CLM-20241201000000-fedcba654321", isDirectory: () => true, isFile: () => false },
      ] as any);

      // Mock claim records
      const mockClaimRecords = [
        {
          policyNumber: "POL-1001",
          claimType: "Auto",
          submittedAt: new Date().toISOString(), // Within last year
        },
        {
          policyNumber: "POL-1001",
          claimType: "Collision",
          submittedAt: new Date().toISOString(), // Within last year
        },
      ];

      mockReadFile
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify(mockPolicies))) // Policies
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify(mockClaimRecords[0]))) // First claim
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify(mockClaimRecords[1]))); // Second claim

      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "2024-10-01",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons[0]).toContain("Policy exceeds the maximum of 2 Auto claim(s)");
    });

    it("should flag potential duplicates", async () => {
      // Mock existing claim within last year for same type
      mockReaddir.mockResolvedValue([
        { name: "CLM-20241201000000-abcdef123456", isDirectory: () => true, isFile: () => false },
      ] as any);

      mockReadFile
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify(mockPolicies))) // Policies
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify({
          policyNumber: "POL-1001",
          claimType: "Auto",
          submittedAt: new Date().toISOString(),
        }))); // Existing claim

      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "2024-10-01",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Potential duplicate claim detected within the last 12 months.");
    });

    it("should ignore claims outside the 12-month window", async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);

      mockReaddir.mockResolvedValue([
        { name: "CLM-20201201000000-abcdef123456", isDirectory: () => true, isFile: () => false },
      ] as any);

      mockReadFile
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify(mockPolicies))) // Policies
        .mockImplementationOnce(() => Promise.resolve(JSON.stringify({
          policyNumber: "POL-1001",
          claimType: "Auto",
          submittedAt: oldDate.toISOString(),
        }))); // Old claim

      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "2024-10-01",
      });

      expect(result).toEqual({ eligible: true, reasons: [] });
    });

    it("should handle policy file read errors", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"));

      const result = await checkClaimEligibility({
        policyNumber: "POL-1001",
        claimType: "Auto",
        incidentDate: "2024-10-01",
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain("Eligibility check could not be completed. Please try again later.");
    });
  });
});
