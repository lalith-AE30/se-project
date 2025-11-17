# Quick Test Reference

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📁 Test Files

| File | Tests | Focus |
|------|-------|-------|
| `database.test.ts` | 8 | Schema, constraints, authentication |
| `policies.test.ts` | 13 | Policy lifecycle, approvals, renewals |
| `claims.test.ts` | 18 | Claims processing, fraud detection |
| `integration.test.ts` | 12 | End-to-end workflows |

## ✅ What's Tested

### Database Layer
- Schema creation and validation
- Role enforcement (6 roles)
- Status constraints
- Unique email validation
- Foreign key relationships
- Password hashing (bcrypt)

### Policy Features
- Application submission
- Auto-assignment to underwriters
- Approval workflow
- Status transitions
- Renewal detection (30 days before expiry)
- SLA tracking (48 hours)
- Notifications

### Claims Features
- Submission with validation
- Eligibility checks (policy active, coverage limits)
- Duplicate detection (30-day window)
- Fraud scoring:
  - High amount: +30 points
  - Low documents: +20 points
  - Frequent claims: +50 points
- Auto-flagging (score ≥ 50)
- Assignment (adjuster vs analyst)
- Approval/rejection workflow
- SLA tracking (72 hours)
- Notifications

### Integration Workflows
1. **Policy Flow**: Submit → Assign → Review → Approve → Notify
2. **Normal Claim**: Submit → Validate → Assign → Review → Approve → Notify
3. **Fraud Flow**: Submit → Score → Flag → Investigate → Reject → Log
4. **SLA Monitoring**: Track completion, breaches, at-risk items
5. **Notifications**: Multi-user, read/unread tracking

## 🧪 Test Examples

### Run Single Test File
```bash
npm test database.test.ts
npm test policies.test.ts
npm test claims.test.ts
npm test integration.test.ts
```

### Run Specific Test
```bash
npm test -- -t "should create all required tables"
npm test -- -t "fraud detection"
npm test -- -t "End-to-End"
```

### Watch Mode (Auto-rerun)
```bash
npm run test:watch
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📊 Expected Results

```
✓ Database Tests: 8/8 passed
✓ Policy Tests: 13/13 passed  
✓ Claims Tests: 18/18 passed
✓ Integration Tests: 12/12 passed

Total: 51/51 tests passing
Time: ~12 seconds
```

## 🔍 Key Test Scenarios

### Fraud Detection
```typescript
// High amount + Low docs + Frequent = 100 points (FLAGGED)
Claim: $45,000 on $50,000 policy + 1 doc + 3 recent claims
Score: 30 + 20 + 50 = 100 ✅ Auto-flagged for analyst

// Normal claim = 0 points (NORMAL)
Claim: $5,000 on $50,000 policy + 3 docs + 0 recent claims  
Score: 0 + 0 + 0 = 0 ✅ Assigned to adjuster
```

### Validation Rules
```typescript
✅ Policy must be 'active' for claim submission
✅ Claim amount ≤ coverage amount
✅ No duplicate claims (same type, 30 days)
✅ Email must be unique per user
✅ Only valid roles: customer, underwriter, adjuster, analyst, manager, admin
```

### SLA Tracking
```typescript
Policy SLA: 48 hours (Application → Approval)
Claim SLA: 72 hours (Submission → Resolution)

Metrics:
- Total count
- Breached count
- At-risk count
- Average completion time
```

## 🐛 Troubleshooting

### Database Lock Errors
```bash
# Remove test database and retry
rm -f insurance.test.db
npm test
```

### Tests Hanging
```bash
# Tests run serially (maxWorkers: 1)
# Check for unclosed database connections
```

### Import Errors
```bash
# Reinstall dependencies
npm install
npm test
```

## 📝 Test Data

### Sample Users (Created in tests)
- Customer: customer@test.com
- Underwriter: underwriter@test.com
- Adjuster: adjuster@test.com
- Analyst: analyst@test.com
- Manager: manager@test.com
- Admin: admin@test.com

Password: `password123` (hashed with bcrypt)

### Sample Data Patterns
- Policy Numbers: `POL-{timestamp}`
- Claim Numbers: `CLM-{timestamp}`
- Coverage Amounts: $50,000 - $500,000
- Premium Amounts: $800 - $2,000

## 🎯 Coverage Goals

Current testing focuses on:
✅ Business logic (100%)
✅ Database operations (100%)
✅ Workflow state machines (100%)
✅ Validation rules (100%)

Future additions:
⚪ API routes (Next.js handlers)
⚪ React components
⚪ End-to-end browser tests
⚪ Performance/load tests

## 📚 Further Reading

- Full documentation: `__tests__/README.md`
- Test summary: `TEST_SUMMARY.md`
- Implementation details: `IMPLEMENTATION.md`
- Usage guide: `USAGE_GUIDE.md`

---

**Quick Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
npm test <filename>   # Single file
```

**Status: 51/51 tests passing ✅**
