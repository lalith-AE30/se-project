# Quick Start Guide

## 0. Setup (Optional)

### Populate Database with Mock Data
For a fully-featured demo experience with sample policies and claims:
```bash
npm run populate-db
```

This adds 5 policies, 6 claims, notifications, and more. See `MOCK_DATA.md` for details.

## 1. Login
Visit http://localhost:3000 and login with any demo account:
- **Customer**: customer@test.com
- **Underwriter**: underwriter@insurance.com
- **Adjuster**: adjuster@insurance.com
- **Analyst**: analyst@insurance.com
- **Manager**: manager@insurance.com
- **Admin**: admin@insurance.com

Password for all: `password123`

## 2. Customer Workflow

### Apply for Policy
1. Login as customer
2. Click "Policies" tab
3. Click "Apply for Policy" button
4. Fill form (type, coverage, premium, dates)
5. Submit - policy auto-assigned to underwriter

### Submit Claim
1. Login as customer
2. Click "Claims" tab
3. Click "Submit Claim" button
4. Select active policy
5. Fill claim details (type, amount, description)
6. Submit - claim auto-validated and assigned

### View Notifications
1. Click "Notifications" tab
2. See renewal reminders and claim/policy status updates

## 3. Underwriter Workflow

1. Login as underwriter
2. View pending policy applications in "Policies" tab
3. Review policy details
4. Click "Approve" to approve policy
5. Customer receives automatic notification

## 4. Claims Adjuster Workflow

1. Login as adjuster
2. View claims under review in "Claims" tab
3. Review non-flagged claims
4. Click "Approve" or "Reject"
5. Customer receives automatic notification

## 5. Fraud Analyst Workflow

1. Login as analyst
2. View flagged high-risk claims in "Claims" tab
3. Review fraud score and details
4. Investigate suspicious claims
5. Approve or reject after investigation

## 6. Manager Workflow

### Monitor SLA
1. Login as manager
2. Click "SLA" tab
3. View metrics:
   - Total policies/claims processed
   - SLA breaches
   - At-risk items
   - Average completion time
4. Identify bottlenecks

### View Workflows
1. Click "Workflows" tab
2. See all defined workflows with steps and SLA hours
3. Review process definitions

## 7. Admin Workflow

### Download Compliance Report
1. Login as admin
2. Go to "Workflows" tab
3. Click "Download Compliance Report"
4. Report includes:
   - Policy statistics
   - Claims statistics
   - SLA metrics
   - Audit log

### Define Workflows
1. Use API to create new workflows
2. Set workflow type, steps, and SLA hours

## Key Features to Test

### Automatic Renewal Reminders
- Policies expiring in 30 days trigger notifications
- Check "Notifications" tab as customer

### Fraud Detection
- Submit claim for >80% of coverage → +30 fraud score
- Submit claim with no documents → +20 fraud score
- Submit 3+ claims in 90 days → +50 fraud score
- Score ≥50 → Auto-flagged for analyst

### Eligibility Validation
- Try submitting claim on inactive policy → Error
- Try claim amount > coverage → Error
- Try duplicate claim (same type, last 30 days) → Error

### SLA Tracking
- All policies/claims tracked against SLA hours
- Policy SLA: 48 hours
- Claim SLA: 72 hours
- View breached items in SLA tab (manager/admin)

## Database Location
SQLite database created at: `/home/lalith/sem5/se-project/insurance.db`

## Resetting Data
To reset database, delete `insurance.db` and restart server. It will recreate with fresh demo data.
