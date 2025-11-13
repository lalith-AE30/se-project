# Mock Data Reference

This document describes the mock data populated by `npm run populate-db`.

## Overview
The script adds realistic test data to demonstrate all features of the insurance management system.

## Policies (5 total)

| Policy Number | Type   | Coverage    | Status  | Customer         | Notes                          |
|---------------|--------|-------------|---------|------------------|--------------------------------|
| POL-2025001   | Auto   | $50,000     | Active  | customer@test.com | Can be used for claims        |
| POL-2025002   | Home   | $250,000    | Active  | customer@test.com | Can be used for claims        |
| POL-2025003   | Health | $100,000    | Active  | customer@test.com | Expires soon - renewal reminder|
| POL-2025004   | Life   | $500,000    | Pending | customer@test.com | Needs underwriter approval     |
| POL-2024999   | Auto   | $40,000     | Expired | customer@test.com | Historical data                |

## Claims (6 total)

| Claim Number | Policy      | Type    | Amount    | Status        | Fraud Score | Flagged | Assignee  |
|--------------|-------------|---------|-----------|---------------|-------------|---------|-----------|
| CLM-2025001  | POL-2025001 | Accident| $8,000    | Approved      | 15          | No      | Adjuster  |
| CLM-2025002  | POL-2025002 | Damage  | $45,000   | Under Review  | 35          | No      | Adjuster  |
| CLM-2025003  | POL-2025003 | Medical | $15,000   | Paid          | 10          | No      | Adjuster  |
| CLM-2025004  | POL-2025001 | Theft   | $42,000   | Under Review  | 70          | **Yes** | Analyst   |
| CLM-2025005  | POL-2025002 | Damage  | $220,000  | Submitted     | 85          | **Yes** | Analyst   |
| CLM-2025006  | POL-2025003 | Medical | $3,500    | Rejected      | 5           | No      | Adjuster  |

### High-Risk Claims to Test Fraud Detection

**CLM-2025004** - Theft claim (70 fraud score)
- High amount relative to coverage: 84%
- Only one document (police report)
- Flagged for analyst review

**CLM-2025005** - Fire damage (85 fraud score)  
- Extremely high amount: 88% of coverage
- Only one document
- Flagged for investigation

## Notifications (8 total)

Each role has relevant notifications:

### Customer (4 notifications)
- ✅ Policy approved (read)
- ✅ Claim approved (read)
- 🔔 Policy renewal reminder (unread)
- 🔔 Claim rejected (unread)

### Underwriter (1 notification)
- 🔔 New policy application requiring review (unread)

### Claims Adjuster (1 notification)
- 🔔 New claim requiring review (unread)

### Fraud Analyst (2 notifications)
- 🔔 High-risk claim CLM-2025004 (unread)
- 🔔 High-risk claim CLM-2025005 (unread)

## SLA Tracking (12 records)

- **Policies**: 5 records (4 completed, 1 in progress)
  - SLA: 48 hours
  - 1 intentionally breached to show SLA monitoring
  
- **Claims**: 6 records (3 completed, 3 in progress)
  - SLA: 72 hours
  - 1 intentionally breached for testing

## Audit Log (4 entries)

Sample audit trail showing:
1. Customer applied for policy
2. Underwriter approved policy
3. Customer submitted claim
4. Adjuster approved claim

## Testing Scenarios

### As Customer
1. **View active policies** - See 3 active policies
2. **View pending policy** - POL-2025004 awaiting approval
3. **View claims** - 6 claims in various states
4. **Renewal reminder** - POL-2025003 expiring soon
5. **Submit new claim** - Can claim against active policies

### As Underwriter
1. **Approve pending policy** - POL-2025004 ready for review
2. **View approved policies** - Historical approvals

### As Claims Adjuster
1. **Review standard claim** - CLM-2025002 under review
2. **View completed claims** - See approved/rejected history

### As Fraud Analyst
1. **Investigate flagged claims**:
   - CLM-2025004 (theft, score 70)
   - CLM-2025005 (fire, score 85)
2. **Make decision** - Approve or reject after investigation

### As Manager
1. **Monitor SLA** - View breached and at-risk items
2. **Generate reports** - Download compliance data
3. **View workflows** - See all defined processes

### As Admin
1. **All manager features** - Full system access
2. **Define workflows** - Create new processes
3. **Export reports** - Compliance and regulatory data

## Fraud Score Calculations

### CLM-2025004 (Score: 70)
- High amount (84% of coverage): +30 points
- Low documents (1 only): +20 points
- Multiple recent claims: +20 points
- **Total: 70 → FLAGGED**

### CLM-2025005 (Score: 85)
- Very high amount (88% of coverage): +30 points
- Low documents (1 only): +20 points
- Multiple recent claims: +35 points
- **Total: 85 → FLAGGED**

## Data Relationships

```
customer@test.com
├── 5 Policies
│   ├── POL-2025001 (Active) → 2 Claims
│   ├── POL-2025002 (Active) → 2 Claims
│   ├── POL-2025003 (Active) → 2 Claims
│   ├── POL-2025004 (Pending) → 0 Claims
│   └── POL-2024999 (Expired) → 0 Claims
└── 8 Notifications
```

## Resetting Data

To clear all mock data and start fresh:
```bash
rm insurance.db
npm run dev  # Creates fresh database with users only
npm run populate-db  # Re-populate with mock data
```
