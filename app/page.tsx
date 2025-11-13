"use client";

import { useState, useEffect } from "react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  policyType: string;
  coverageAmount: string;
  existingConditions: string;
  additionalInfo: string;
}

interface SLAMetric {
  id: string;
  workflowType: string;
  slaTarget: number;
  actualTime: number;
  status: 'compliant' | 'warning' | 'breached';
  date: string;
  assignedTo: string;
}

interface FraudCase {
  id: string;
  claimId: string;
  customerName: string;
  claimAmount: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flaggedReasons: string[];
  dateFlagged: string;
  status: 'pending' | 'under_review' | 'investigated' | 'cleared' | 'confirmed_fraud';
  assignedAnalyst: string;
}

interface ComplianceReport {
  id: string;
  reportType: 'irdai_monthly' | 'irdai_quarterly' | 'gdpr_data_breach' | 'gdpr_privacy_impact' | 'audit_trail';
  reportName: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'on_demand' | 'real_time';
  lastGenerated: string;
  nextDue: string;
  status: 'generated' | 'pending' | 'overdue' | 'scheduled';
  complianceFramework: 'IRDAI' | 'GDPR' | 'ISO 27001';
  dataFields: string[];
  generatedBy: string;
  fileSize: string;
  downloadUrl?: string;
}
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'policy' | 'sla' | 'fraud' | 'compliance'>('dashboard');
  
  // Policy Application State
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    policyType: "",
    coverageAmount: "",
    existingConditions: "",
    additionalInfo: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // SLA Monitoring State
  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [loadingSLA, setLoadingSLA] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fraud Detection State
  const [fraudCases, setFraudCases] = useState<FraudCase[]>([]);
  const [loadingFraud, setLoadingFraud] = useState(true);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');

  // Compliance State
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [selectedFrameworkFilter, setSelectedFrameworkFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  useEffect(() => {
    // Initialize SLA data
    const mockSLAData: SLAMetric[] = [
      {
        id: '1',
        workflowType: 'Policy Application',
        slaTarget: 24,
        actualTime: 18,
        status: 'compliant',
        date: '2025-01-13',
        assignedTo: 'John Smith'
      },
      {
        id: '2',
        workflowType: 'Claim Processing',
        slaTarget: 48,
        actualTime: 52,
        status: 'breached',
        date: '2025-01-13',
        assignedTo: 'Sarah Johnson'
      },
      {
        id: '3',
        workflowType: 'Policy Underwriting',
        slaTarget: 72,
        actualTime: 68,
        status: 'compliant',
        date: '2025-01-12',
        assignedTo: 'Mike Wilson'
      },
      {
        id: '4',
        workflowType: 'Claim Investigation',
        slaTarget: 120,
        actualTime: 115,
        status: 'compliant',
        date: '2025-01-12',
        assignedTo: 'Emily Davis'
      },
      {
        id: '5',
        workflowType: 'Policy Application',
        slaTarget: 24,
        actualTime: 22,
        status: 'warning',
        date: '2025-01-13',
        assignedTo: 'Robert Brown'
      }
    ];
    setMetrics(mockSLAData);
    setLoadingSLA(false);

    // Initialize Fraud data
    const mockFraudData: FraudCase[] = [
      {
        id: '1',
        claimId: 'CLM-001',
        customerName: 'John Anderson',
        claimAmount: 25000,
        riskScore: 85,
        riskLevel: 'critical',
        flaggedReasons: ['Unusual claim pattern', 'Recent policy purchase', 'Inconsistent documentation'],
        dateFlagged: '2025-01-13',
        status: 'pending',
        assignedAnalyst: 'Unassigned'
      },
      {
        id: '2',
        claimId: 'CLM-002',
        customerName: 'Sarah Mitchell',
        claimAmount: 15000,
        riskScore: 72,
        riskLevel: 'high',
        flaggedReasons: ['Multiple claims in short period', 'High claim amount'],
        dateFlagged: '2025-01-12',
        status: 'under_review',
        assignedAnalyst: 'David Chen'
      },
      {
        id: '3',
        claimId: 'CLM-003',
        customerName: 'Michael Roberts',
        claimAmount: 8000,
        riskScore: 45,
        riskLevel: 'medium',
        flaggedReasons: ['Suspicious timing'],
        dateFlagged: '2025-01-11',
        status: 'investigated',
        assignedAnalyst: 'Lisa Wong'
      },
      {
        id: '4',
        claimId: 'CLM-004',
        customerName: 'Emma Thompson',
        claimAmount: 5000,
        riskScore: 25,
        riskLevel: 'low',
        flaggedReasons: ['Minor inconsistencies'],
        dateFlagged: '2025-01-10',
        status: 'cleared',
        assignedAnalyst: 'James Wilson'
      }
    ];
    setFraudCases(mockFraudData);
    setLoadingFraud(false);

    // Initialize Compliance data
    const mockComplianceData: ComplianceReport[] = [
      {
        id: '1',
        reportType: 'irdai_monthly',
        reportName: 'IRDAI Monthly Business Report',
        description: 'Monthly business performance and policy issuance statistics as required by IRDAI',
        frequency: 'monthly',
        lastGenerated: '2025-01-01',
        nextDue: '2025-02-01',
        status: 'generated',
        complianceFramework: 'IRDAI',
        dataFields: ['Policy count', 'Premium collected', 'Claims settled', 'Solvency ratio'],
        generatedBy: 'System Automation',
        fileSize: '2.4 MB',
        downloadUrl: '#'
      },
      {
        id: '2',
        reportType: 'irdai_quarterly',
        reportName: 'IRDAI Quarterly Financial Report',
        description: 'Quarterly financial statements and compliance metrics for regulatory submission',
        frequency: 'quarterly',
        lastGenerated: '2024-12-31',
        nextDue: '2025-03-31',
        status: 'pending',
        complianceFramework: 'IRDAI',
        dataFields: ['Balance sheet', 'Income statement', 'Cash flow', 'Capital adequacy'],
        generatedBy: 'System Automation',
        fileSize: '5.1 MB'
      },
      {
        id: '3',
        reportType: 'gdpr_data_breach',
        reportName: 'GDPR Data Breach Register',
        description: 'Real-time tracking and reporting of data breaches as per GDPR Article 33',
        frequency: 'real_time',
        lastGenerated: '2025-01-13',
        nextDue: 'Immediate upon breach',
        status: 'generated',
        complianceFramework: 'GDPR',
        dataFields: ['Breach incidents', 'Affected users', 'Mitigation steps', 'Notification timeline'],
        generatedBy: 'System Automation',
        fileSize: '1.2 MB',
        downloadUrl: '#'
      },
      {
        id: '4',
        reportType: 'gdpr_privacy_impact',
        reportName: 'GDPR Privacy Impact Assessment',
        description: 'Annual privacy impact assessment and data processing activities report',
        frequency: 'on_demand',
        lastGenerated: '2024-12-15',
        nextDue: '2025-12-15',
        status: 'scheduled',
        complianceFramework: 'GDPR',
        dataFields: ['Data inventory', 'Processing purposes', 'Legal basis', 'Data retention policies'],
        generatedBy: 'System Automation',
        fileSize: '3.8 MB'
      },
      {
        id: '5',
        reportType: 'audit_trail',
        reportName: 'System Audit Trail Report',
        description: 'Comprehensive audit log of all system activities for compliance verification',
        frequency: 'real_time',
        lastGenerated: '2025-01-13',
        nextDue: 'Continuous',
        status: 'generated',
        complianceFramework: 'ISO 27001',
        dataFields: ['User access logs', 'Data modifications', 'System changes', 'Failed login attempts'],
        generatedBy: 'System Automation',
        fileSize: '8.7 MB',
        downloadUrl: '#'
      },
      {
        id: '6',
        reportType: 'irdai_quarterly',
        reportName: 'IRDAI Claims Settlement Report',
        description: 'Detailed claims processing and settlement metrics for regulatory compliance',
        frequency: 'quarterly',
        lastGenerated: '2024-12-31',
        nextDue: '2025-01-31',
        status: 'overdue',
        complianceFramework: 'IRDAI',
        dataFields: ['Claims received', 'Claims processed', 'Settlement ratio', 'Average processing time'],
        generatedBy: 'Manual',
        fileSize: '4.2 MB'
      }
    ];
    setComplianceReports(mockComplianceData);
    setLoadingCompliance(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const filteredMetrics = metrics.filter(metric => {
    if (selectedFilter === 'all') return true;
    return metric.status === selectedFilter;
  });

  const filteredFraudCases = fraudCases.filter(case_ => {
    if (selectedRiskFilter === 'all') return true;
    return case_.riskLevel === selectedRiskFilter;
  });

  const filteredComplianceReports = complianceReports.filter(report => {
    const frameworkMatch = selectedFrameworkFilter === 'all' || report.complianceFramework === selectedFrameworkFilter;
    const statusMatch = selectedStatusFilter === 'all' || report.status === selectedStatusFilter;
    return frameworkMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'breached': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceRate = () => {
    const compliant = metrics.filter(m => m.status === 'compliant').length;
    return metrics.length > 0 ? Math.round((compliant / metrics.length) * 100) : 0;
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'IRDAI': return 'bg-orange-100 text-orange-800';
      case 'GDPR': return 'bg-purple-100 text-purple-800';
      case 'ISO 27001': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReport = async (reportId: string) => {
    setIsGeneratingReport(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setComplianceReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'generated', lastGenerated: new Date().toISOString().split('T')[0], generatedBy: 'System Automation' }
        : report
    ));
    
    setIsGeneratingReport(false);
  };

  const exportReport = (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    const report = complianceReports.find(r => r.id === reportId);
    if (report) {
      console.log(`Exporting ${report.reportName} as ${format.toUpperCase()}`);
      alert(`Report ${report.reportName} exported as ${format.toUpperCase()} successfully!`);
    }
  };

  const scheduleReport = (reportId: string, frequency: string) => {
    setComplianceReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, frequency: frequency as any, status: 'scheduled' }
        : report
    ));
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-16">
      <main className="mx-auto flex max-w-4xl flex-col gap-16 px-6">
        <section className="rounded-3xl bg-white p-12 shadow-xl shadow-zinc-200/60">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Insurance Self-Service
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
              Manage claims and renewals without visiting a branch.
            </h1>
            <p className="max-w-2xl text-lg text-zinc-600">
              Start a new claim, leverage automated eligibility checks, upload supporting documents, and
              keep coverage active with renewal reminders—all from a single, secure portal.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/claims/submit"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                File a claim
              </Link>
              <Link
                href="/renewals"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                Schedule renewals
              </Link>
              <div className="flex flex-col text-sm text-zinc-500">
                <span>Eligibility screening • Secure uploads • Renewal reminders</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Eligibility screening",
              description:
                "Automatically validate policy status, coverage windows, and duplicate history before a claim is created.",
            },
            {
              title: "Document uploads",
              description:
                "Attach photos, invoices, or reports with instant validation, upload progress, and secure storage.",
            },
            {
              title: "Renewal automation",
              description:
                "Configure lead times and track reminder status so renewals go out before coverage lapses.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-zinc-900">{card.title}</h2>
              <p className="mt-3 text-sm text-zinc-600">{card.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
