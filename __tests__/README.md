# Test Suite Documentation

## Overview

This comprehensive test suite validates the functionality of the Insurance Workflow Management System. The tests cover all major features including policy management, claims processing, fraud detection, SLA tracking, and end-to-end workflows.

## Test Structure

### 1. Database Tests (`__tests__/database.test.ts`)
Tests the core database functionality:
- **Schema Creation**: Validates all required tables are created correctly
- **Constraints**: Tests role validation, email uniqueness, status enums
- **Data Integrity**: Ensures foreign key relationships work properly
- **User Authentication**: Tests password hashing and user creation

**Coverage:**
- 7 database tables (users, workflows, policies, claims, notifications, sla_tracking, audit_log)
- Role-based access control validation
- Database constraint enforcement

### 2. Policy Tests (`__tests__/policies.test.ts`)
Tests the complete policy lifecycle:
- **Policy Creation**: New policy applications with proper validation
- **Auto-Assignment**: Automatic assignment to underwriters
- **Approval Workflow**: Policy review and approval process
- **Notifications**: Customer and underwriter notifications
- **SLA Tracking**: Policy processing time monitoring
- **Policy Retrieval**: Filtering by customer, status, and role
- **Renewal System**: Policy expiration detection and reminders

**Coverage:**
- Policy application submission
- Underwriting and approval workflow
- Status transitions (pending → approved → active)
- SLA compliance tracking

### 3. Claims Tests (`__tests__/claims.test.ts`)
Tests the claims processing system:
- **Claim Submission**: Customer claim creation with validation
- **Eligibility Validation**: 
  - Policy status checking (must be active)
  - Coverage amount validation
  - Duplicate claim detection
- **Fraud Detection Algorithm**:
  - High claim amount scoring (+30 points)
  - Low document count scoring (+20 points)
  - Recent claim frequency scoring (+50 points)
  - Auto-flagging when score ≥ 50
- **Assignment Logic**:
  - Normal claims → Adjuster
  - Flagged claims → Fraud Analyst
- **Claim Processing**: Approval/rejection with notifications
- **SLA Tracking**: Claim resolution time monitoring

**Coverage:**
- Claim eligibility rules
- Automated fraud scoring
- Role-based claim assignment
- Status notifications

### 4. Integration Tests (`__tests__/integration.test.ts`)
Tests complete end-to-end workflows:

#### Policy Application Workflow
1. Customer submits application
2. Auto-assign to underwriter
3. Underwriter receives notification
4. SLA tracking begins
5. Underwriter approves policy
6. Customer receives approval notification
7. SLA tracking completed
8. Audit log created

#### Normal Claim Workflow
1. Customer submits claim (low fraud score)
2. Eligibility validation passes
3. Auto-assign to adjuster
4. Adjuster receives notification
5. SLA tracking begins
6. Adjuster approves claim
7. Customer receives approval notification
8. SLA tracking completed
9. Audit log created

#### Fraud Detection Workflow
1. Customer submits high-risk claim
2. Fraud score calculation (100 points)
3. Claim flagged automatically
4. Auto-assign to fraud analyst
5. Analyst receives high-risk notification
6. Investigation and rejection
7. Customer receives rejection notification
8. Detailed audit log created

#### SLA Monitoring
- Tracks completed, breached, and at-risk SLAs
- Separates policy and claim metrics
- Calculates compliance percentages

#### Notification System
- Multi-user notification delivery
- Read/unread status tracking
- Type-based filtering

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test database.test.ts
npm test policies.test.ts
npm test claims.test.ts
npm test integration.test.ts
```

## Test Database

Tests use an isolated SQLite database (`insurance.test.db`) that is:
- Created fresh before each test suite
- Automatically cleaned up after tests
- Independent from the development database

## Test Coverage

The test suite covers:

### Functional Requirements
- ✅ Policy application submission (Story 1.2)
- ✅ Underwriting and approval (Story 1.3)
- ✅ Renewal automation (Story 1.4)
- ✅ SLA monitoring (Story 1.5)
- ✅ Claim submission (Story 2.1)
- ✅ Eligibility validation (Story 2.2)
- ✅ Fraud detection and escalation (Story 2.3)
- ✅ Status notifications (Story 2.4)
- ✅ Audit logging (Story 2.5)

### Technical Components
- ✅ Database schema and constraints
- ✅ User authentication and roles
- ✅ Workflow state machines
- ✅ SLA tracking logic
- ✅ Notification system
- ✅ Fraud scoring algorithm

### Edge Cases
- ✅ Invalid policy/claim status
- ✅ Duplicate email registration
- ✅ Claim amount exceeding coverage
- ✅ Duplicate claim detection
- ✅ SLA breach detection
- ✅ Multiple role permissions

## Key Test Assertions

### Database Tests
- All tables created successfully
- Constraints enforced (roles, statuses, unique emails)
- Foreign key relationships maintained
- Password hashing works correctly

### Policy Tests
- Policies created with pending status
- Auto-assignment to underwriters
- Notifications sent to correct users
- SLA tracking initialized
- Status transitions work correctly
- Approval timestamps recorded

### Claims Tests
- Claims validated against active policies
- Fraud score calculated correctly:
  - High amount (>80% coverage) = +30
  - Low documents (<2) = +20
  - Frequent claims (>2 in 90 days) = +50
- Claims flagged when score ≥ 50
- Correct assignment (adjuster vs analyst)
- Duplicate claim detection
- Coverage limit enforcement

### Integration Tests
- Complete workflows execute correctly
- All database updates occur in proper order
- Notifications reach correct users
- SLA tracking follows entity lifecycle
- Audit logs capture all actions
- Multi-step processes maintain data integrity

## Test Metrics

Total test cases: **50+**
- Database tests: 8
- Policy tests: 12
- Claims tests: 18
- Integration tests: 12

Estimated coverage: **~85%** of core business logic

## Future Test Additions

Consider adding:
1. API endpoint tests (mocking Next.js request/response)
2. Component tests (React Testing Library)
3. Performance tests (large dataset handling)
4. Concurrent user tests (race conditions)
5. Security tests (SQL injection, XSS)
6. UI end-to-end tests (Playwright/Cypress)

## Troubleshooting

### Tests Fail with Database Lock
```bash
# Remove any lingering test databases
rm insurance.test.db*
npm test
```

### Coverage Report Not Generated
```bash
npm install --save-dev @types/jest
npm run test:coverage
```

### TypeScript Errors
```bash
npm install --save-dev @jest/globals ts-jest
```

## Continuous Integration

To integrate with CI/CD:
```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```
