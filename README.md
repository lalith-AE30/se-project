# Insurance Workflow Management System

A comprehensive Next.js application for automated policy and claims management with role-based access control.

## Features

### Policy Management (Stories 1.1-1.4)
- ✅ **Workflow Definitions**: Admins can define workflows for policy issuance, renewals, endorsements, and claims
- ✅ **Policy Application**: Customers submit insurance applications online with automatic assignment to underwriters
- ✅ **Underwriting & Approval**: Underwriters review and approve/reject applications with automatic notifications
- ✅ **Renewal Automation**: Automatic reminders sent to customers 30 days before policy expiration
- ✅ **SLA Monitoring**: Managers track SLA performance across all workflows

### Claims Management (Stories 2.1-2.4)
- ✅ **Claim Submission**: Customers submit claims with supporting documents online
- ✅ **Eligibility Validation**: Automatic validation of policy status, coverage limits, and duplicate detection
- ✅ **Fraud Detection**: Automated fraud scoring and flagging of high-risk claims for analyst review
- ✅ **Status Notifications**: Real-time notifications for claim approvals/rejections
- ✅ **Compliance Reporting**: Automated regulatory report generation for IRDAI/GDPR compliance

## User Roles

1. **Customer**: Submit policy applications and claims, view notifications
2. **Underwriter**: Review and approve/reject policy applications
3. **Claims Adjuster**: Review and process standard claims
4. **Fraud Analyst**: Investigate flagged high-risk claims
5. **Manager**: Monitor SLA performance across workflows
6. **Admin**: Define workflows and generate compliance reports

## Demo Accounts

All accounts use password: `password123`

- customer@test.com - Customer
- underwriter@insurance.com - Underwriter
- adjuster@insurance.com - Claims Adjuster
- analyst@insurance.com - Fraud Analyst
- manager@insurance.com - Manager
- admin@insurance.com - Admin

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (better-sqlite3)
- **Authentication**: bcryptjs
- **Styling**: Tailwind CSS with pastel light theme
- **Language**: TypeScript

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Populate the database with mock data (optional):
```bash
npm run populate-db
```
This will add:
- 5 sample policies (pending, active, expired states)
- 6 sample claims (approved, rejected, under review, flagged)
- 8 notifications across all users
- SLA tracking records
- Audit log entries

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

5. Login with any demo account above

## Database Schema

The SQLite database (`insurance.db`) includes:

- **users**: Authentication and role management
- **workflows**: Workflow definitions with SLA hours
- **policies**: Policy applications and status tracking
- **claims**: Claims with fraud scoring and assignment
- **notifications**: Real-time user notifications
- **sla_tracking**: SLA compliance monitoring
- **audit_log**: Compliance and audit trail

## Key Workflows

### Policy Application Flow
1. Customer submits application → 2. Auto-assigned to underwriter → 3. Underwriter reviews → 4. Status notification sent → 5. SLA tracked

### Claims Processing Flow
1. Customer submits claim → 2. Eligibility validation → 3. Fraud scoring → 4. Assignment (adjuster or analyst) → 5. Review & decision → 6. Customer notification → 7. SLA tracking

### Fraud Detection
Automatic scoring based on:
- Claim amount vs coverage (high % = +30 points)
- Number of supporting documents (low count = +20 points)
- Recent claim frequency (>2 in 90 days = +50 points)
- Score ≥50 → Flagged for analyst review

## Color Scheme

Light pastel theme:
- Background: #fef9f3 (warm cream)
- Primary: Blue pastels (#a8d5e2)
- Secondary: Peach pastels (#ffd5cd)
- Success: Green pastels
- Warning: Yellow pastels

## Database Management

### Reset Database
To reset the database and start fresh:
```bash
rm insurance.db
npm run dev  # Will recreate with just users and workflows
```

### Repopulate with Mock Data
To add comprehensive test data:
```bash
npm run populate-db
```

## License

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
