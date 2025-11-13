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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Insurance Workflow Management System
            </h1>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-t">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('policy')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'policy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Policy Application
              </button>
              <button
                onClick={() => setActiveTab('sla')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sla'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                SLA Monitoring
              </button>
              <button
                onClick={() => setActiveTab('fraud')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'fraud'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Fraud Detection
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'compliance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Compliance & Reports
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('policy')}>
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-xl font-semibold text-gray-900">Policy Application</h2>
                </div>
                <p className="text-gray-600 mb-4">Submit insurance applications online with all necessary details for quick processing.</p>
                <div className="flex items-center text-blue-600 font-medium">
                  Apply Now
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('sla')}>
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-xl font-semibold text-gray-900">SLA Monitoring</h2>
                </div>
                <p className="text-gray-600 mb-4">Track SLA performance for policy workflows and identify delays requiring corrective action.</p>
                <div className="flex items-center text-green-600 font-medium">
                  Monitor SLA
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('fraud')}>
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-xl font-semibold text-gray-900">Fraud Detection</h2>
                </div>
                <p className="text-gray-600 mb-4">Automatically flag high-risk claims for review and investigation before settlement.</p>
                <div className="flex items-center text-red-600 font-medium">
                  Analyze Fraud
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('compliance')}>
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-xl font-semibold text-gray-900">Compliance & Reports</h2>
                </div>
                <p className="text-gray-600 mb-4">Automated IRDAI and GDPR compliance reporting with real-time monitoring and alerts.</p>
                <div className="flex items-center text-purple-600 font-medium">
                  Manage Compliance
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                  <p className="text-gray-600">Application Processing</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{getComplianceRate()}%</div>
                  <p className="text-gray-600">SLA Compliance Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{fraudCases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length}</div>
                  <p className="text-gray-600">High-Risk Cases</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{loadingCompliance ? 0 : complianceReports.filter(r => r.status === 'overdue').length}</div>
                  <p className="text-gray-600">Overdue Reports</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Policy Application View */}
        {activeTab === 'policy' && (
          <div className="max-w-4xl mx-auto">
            {submitSuccess ? (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted Successfully!</h2>
                  <p className="text-gray-600 mb-6">Your insurance application has been received and is being processed.</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">Application ID: <span className="font-mono font-semibold">APP-{Date.now()}</span></p>
                  </div>
                  <button 
                    onClick={() => {
                      setSubmitSuccess(false);
                      setFormData({
                        firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "",
                        address: "", city: "", state: "", zipCode: "", policyType: "",
                        coverageAmount: "", existingConditions: "", additionalInfo: ""
                      });
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Insurance Application Form</h2>
                  <p className="text-gray-600">Please fill out all required fields to submit your insurance application.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                        <input type="date" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                        <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <input type="text" name="state" required value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                        <input type="text" name="zipCode" required value={formData.zipCode} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Policy Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Policy Type *</label>
                        <select name="policyType" required value={formData.policyType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Select a policy type</option>
                          <option value="life">Life Insurance</option>
                          <option value="health">Health Insurance</option>
                          <option value="auto">Auto Insurance</option>
                          <option value="home">Home Insurance</option>
                          <option value="travel">Travel Insurance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Amount *</label>
                        <select name="coverageAmount" required value={formData.coverageAmount} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Select coverage amount</option>
                          <option value="100k">$100,000</option>
                          <option value="250k">$250,000</option>
                          <option value="500k">$500,000</option>
                          <option value="1m">$1,000,000</option>
                          <option value="2m">$2,000,000+</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pre-existing Medical Conditions</label>
                        <textarea name="existingConditions" rows={3} value={formData.existingConditions} onChange={handleInputChange} placeholder="Please describe any pre-existing conditions (if applicable)" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                        <textarea name="additionalInfo" rows={3} value={formData.additionalInfo} onChange={handleInputChange} placeholder="Any additional information you'd like to provide" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => setActiveTab('dashboard')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* SLA Monitoring View */}
        {activeTab === 'sla' && (
          <div className="space-y-8">
            {loadingSLA ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
                <div className="text-gray-500">Loading SLA data...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                        <p className="text-2xl font-semibold text-gray-900">{metrics.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                        <p className="text-2xl font-semibold text-gray-900">{getComplianceRate()}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Math.round(metrics.reduce((sum, m) => sum + m.actualTime, 0) / metrics.length)}h
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-red-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Breached SLAs</p>
                        <p className="text-2xl font-semibold text-gray-900">{metrics.filter(m => m.status === 'breached').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setSelectedFilter('all')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>All ({metrics.length})</button>
                      <button onClick={() => setSelectedFilter('compliant')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedFilter === 'compliant' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>Compliant ({metrics.filter(m => m.status === 'compliant').length})</button>
                      <button onClick={() => setSelectedFilter('warning')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedFilter === 'warning' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>Warning ({metrics.filter(m => m.status === 'warning').length})</button>
                      <button onClick={() => setSelectedFilter('breached')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedFilter === 'breached' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>Breached ({metrics.filter(m => m.status === 'breached').length})</button>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Export Report</button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Workflow SLA Performance</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Target</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMetrics.map((metric) => (
                          <tr key={metric.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{metric.workflowType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.assignedTo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.slaTarget}h</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.actualTime}h</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metric.status)}`}>
                                {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {metric.status !== 'compliant' && <button className="text-blue-600 hover:text-blue-900 mr-3">Escalate</button>}
                              <button className="text-gray-600 hover:text-gray-900">Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {metrics.filter(m => m.status === 'breached').length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ SLA Breaches Detected</h3>
                    <p className="text-red-700 mb-4">{metrics.filter(m => m.status === 'breached').length} workflow(s) have breached their SLA targets. Immediate action recommended.</p>
                    <div className="flex space-x-4">
                      <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Review Breached Workflows</button>
                      <button className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">Send Escalation Notifications</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Fraud Detection View */}
        {activeTab === 'fraud' && (
          <div className="space-y-8">
            {loadingFraud ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
                <div className="text-gray-500">Loading fraud detection data...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-red-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Flagged Cases</p>
                        <p className="text-2xl font-semibold text-gray-900">{fraudCases.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-orange-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">High Risk</p>
                        <p className="text-2xl font-semibold text-gray-900">{fraudCases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Review</p>
                        <p className="text-2xl font-semibold text-gray-900">{fraudCases.filter(c => c.status === 'pending').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Cleared</p>
                        <p className="text-2xl font-semibold text-gray-900">{fraudCases.filter(c => c.status === 'cleared').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setSelectedRiskFilter('all')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedRiskFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>All ({fraudCases.length})</button>
                      <button onClick={() => setSelectedRiskFilter('critical')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedRiskFilter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>Critical ({fraudCases.filter(c => c.riskLevel === 'critical').length})</button>
                      <button onClick={() => setSelectedRiskFilter('high')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedRiskFilter === 'high' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>High ({fraudCases.filter(c => c.riskLevel === 'high').length})</button>
                      <button onClick={() => setSelectedRiskFilter('medium')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedRiskFilter === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>Medium ({fraudCases.filter(c => c.riskLevel === 'medium').length})</button>
                      <button onClick={() => setSelectedRiskFilter('low')} className={`px-4 py-2 rounded-md transition-colors ${
                        selectedRiskFilter === 'low' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>Low ({fraudCases.filter(c => c.riskLevel === 'low').length})</button>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Run Fraud Analysis</button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Flagged Fraud Cases</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged Reasons</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFraudCases.map((case_) => (
                          <tr key={case_.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{case_.claimId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{case_.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${case_.claimAmount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{case_.riskScore}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(case_.riskLevel)}`}>
                                {case_.riskLevel.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="max-w-xs">
                                {case_.flaggedReasons.slice(0, 2).map((reason, index) => (
                                  <div key={index} className="text-xs">• {reason}</div>
                                ))}
                                {case_.flaggedReasons.length > 2 && (
                                  <div className="text-xs text-gray-400">+{case_.flaggedReasons.length - 2} more</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                case_.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                case_.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                                case_.status === 'investigated' ? 'bg-purple-100 text-purple-800' :
                                case_.status === 'cleared' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {case_.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">Review</button>
                              <button className="text-gray-600 hover:text-gray-900">Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {fraudCases.filter(c => c.riskLevel === 'critical').length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">🚨 Critical Risk Cases Detected</h3>
                    <p className="text-red-700 mb-4">{fraudCases.filter(c => c.riskLevel === 'critical').length} critical risk case(s) require immediate investigation.</p>
                    <div className="flex space-x-4">
                      <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Investigate Critical Cases</button>
                      <button className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">Escalate to Senior Analyst</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Compliance & Reports View */}
        {activeTab === 'compliance' && (
          <div className="space-y-8">
            {loadingCompliance ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
                <div className="text-gray-500">Loading compliance data...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-purple-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Reports</p>
                        <p className="text-2xl font-semibold text-gray-900">{loadingCompliance ? 0 : complianceReports.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Generated</p>
                        <p className="text-2xl font-semibold text-gray-900">{loadingCompliance ? 0 : complianceReports.filter(r => r.status === 'generated').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-semibold text-gray-900">{loadingCompliance ? 0 : complianceReports.filter(r => r.status === 'pending').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="bg-red-100 rounded-full p-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Overdue</p>
                        <p className="text-2xl font-semibold text-gray-900">{loadingCompliance ? 0 : complianceReports.filter(r => r.status === 'overdue').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center space-x-2 mr-4">
                        <label className="text-sm font-medium text-gray-700">Framework:</label>
                        <select 
                          value={selectedFrameworkFilter} 
                          onChange={(e) => setSelectedFrameworkFilter(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Frameworks</option>
                          <option value="IRDAI">IRDAI</option>
                          <option value="GDPR">GDPR</option>
                          <option value="ISO 27001">ISO 27001</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Status:</label>
                        <select 
                          value={selectedStatusFilter} 
                          onChange={(e) => setSelectedStatusFilter(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="generated">Generated</option>
                          <option value="pending">Pending</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          const pendingReports = complianceReports.filter(r => r.status === 'pending' || r.status === 'overdue');
                          pendingReports.forEach(report => generateReport(report.id));
                        }}
                        disabled={isGeneratingReport}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors"
                      >
                        {isGeneratingReport ? "Generating..." : "Generate All Pending"}
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Schedule Automation
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Compliance Reports</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Generated</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Size</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredComplianceReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{report.reportName}</div>
                                <div className="text-xs text-gray-500">{report.description}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFrameworkColor(report.complianceFramework)}`}>
                                {report.complianceFramework}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="capitalize">{report.frequency.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.lastGenerated}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.nextDue}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplianceStatusColor(report.status)}`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.fileSize}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {report.status === 'pending' || report.status === 'overdue' ? (
                                  <button 
                                    onClick={() => generateReport(report.id)}
                                    disabled={isGeneratingReport}
                                    className="text-green-600 hover:text-green-900 disabled:text-green-300"
                                  >
                                    Generate
                                  </button>
                                ) : report.status === 'generated' ? (
                                  <>
                                    <button 
                                      onClick={() => exportReport(report.id, 'pdf')}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      PDF
                                    </button>
                                    <button 
                                      onClick={() => exportReport(report.id, 'excel')}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Excel
                                    </button>
                                    <button 
                                      onClick={() => exportReport(report.id, 'csv')}
                                      className="text-purple-600 hover:text-purple-900"
                                    >
                                      CSV
                                    </button>
                                  </>
                                ) : null}
                                <button className="text-gray-600 hover:text-gray-900">Details</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {complianceReports.filter(r => r.status === 'overdue').length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Overdue Compliance Reports</h3>
                    <p className="text-red-700 mb-4">{complianceReports.filter(r => r.status === 'overdue').length} report(s) are overdue and require immediate attention to maintain compliance.</p>
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => {
                          const overdueReports = complianceReports.filter(r => r.status === 'overdue');
                          overdueReports.forEach(report => generateReport(report.id));
                        }}
                        disabled={isGeneratingReport}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
                      >
                        {isGeneratingReport ? "Generating..." : "Generate Overdue Reports"}
                      </button>
                      <button className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                        Send Compliance Alerts
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Automation Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">IRDAI Reports</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">Auto-generate Monthly Business Report</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">Auto-generate Quarterly Financial Report</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">Email notifications on generation</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">GDPR Reports</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">Real-time Data Breach Register</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">Annual Privacy Impact Assessment</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">Immediate breach notifications</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Save Automation Settings
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
