# Firestore Security Rules Testing Guide

This guide explains how to test Firestore security rules locally before deploying to production.

---

## Why Test Security Rules?

Testing security rules prevents:
- Accidentally locking out legitimate users
- Creating security vulnerabilities
- Production downtime from rule errors
- Data breaches from misconfigured permissions

---

## Option 1: Firebase Emulator Suite (Recommended)

### Setup

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Emulators**:
   ```bash
   firebase init emulators
   ```

   Select:
   - [x] Firestore Emulator
   - [x] Authentication Emulator (optional but helpful)

3. **Start Emulators**:
   ```bash
   firebase emulators:start --only firestore
   ```

   The emulator will start at:
   - Firestore: http://localhost:8080
   - Emulator UI: http://localhost:4000

### Testing with Emulator UI

1. Open http://localhost:4000
2. Navigate to Firestore tab
3. Add test data (users, members, payments)
4. Use the "Rules Playground" to test queries
5. Simulate different user roles and permissions

### Connect Your App to Emulator

Modify `src/firebase.js` to use emulator in development:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db };
```

---

## Option 2: Rules Unit Testing

### Setup Test Environment

1. **Install testing dependencies**:
   ```bash
   npm install --save-dev @firebase/rules-unit-testing
   ```

2. **Create test file** `tests/firestore.rules.test.js`:

```javascript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tea-tree-golf-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {

  describe('Members Collection', () => {
    test('VIEW role can read members', async () => {
      const context = testEnv.authenticatedContext('user1', {
        uid: 'user1',
      });

      // Create user document with VIEW role
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          email: 'view@test.com',
          role: 'view',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Try to read members
      const members = context.firestore().collection('members');
      await expect(members.get()).resolves.toBeDefined();
    });

    test('Unauthenticated users cannot read members', async () => {
      const context = testEnv.unauthenticatedContext();
      const members = context.firestore().collection('members');
      await expect(members.get()).rejects.toThrow();
    });

    test('EDIT role can create members', async () => {
      const context = testEnv.authenticatedContext('user2', {
        uid: 'user2',
      });

      // Create user document with EDIT role
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user2').set({
          email: 'edit@test.com',
          role: 'edit',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Try to create member
      const memberData = {
        fullName: 'Test Member',
        email: 'test@test.com',
        phone: '1234567890',
        address: '123 Test St',
        dateOfBirth: '1990-01-01',
        golfAustraliaId: 'GA123',
        membershipCategory: 'Full Membership',
        accountBalance: 0,
        status: 'active',
        dateJoined: '2025-01-01',
        emergencyContact: 'Emergency Contact',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(
        context.firestore().collection('members').add(memberData)
      ).resolves.toBeDefined();
    });

    test('VIEW role cannot create members', async () => {
      const context = testEnv.authenticatedContext('user3', {
        uid: 'user3',
      });

      // Create user document with VIEW role
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user3').set({
          email: 'view@test.com',
          role: 'view',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const memberData = {
        fullName: 'Test Member',
        // ... other fields
      };

      await expect(
        context.firestore().collection('members').add(memberData)
      ).rejects.toThrow();
    });
  });

  describe('Payments Collection', () => {
    test('User can only edit payments they recorded', async () => {
      const user1 = testEnv.authenticatedContext('user1', { uid: 'user1' });
      const user2 = testEnv.authenticatedContext('user2', { uid: 'user2' });

      // Setup users with EDIT role
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          email: 'user1@test.com',
          role: 'edit',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await context.firestore().collection('users').doc('user2').set({
          email: 'user2@test.com',
          role: 'edit',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // User1 creates a payment
      const paymentData = {
        memberId: 'member1',
        memberName: 'Test Member',
        amount: 100,
        paymentDate: '2025-01-01',
        paymentMethod: 'cash',
        reference: 'REF123',
        notes: 'Test payment',
        receiptNumber: 'R2025-001',
        recordedBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const paymentRef = await user1.firestore().collection('payments').add(paymentData);

      // User2 tries to edit user1's payment (should fail)
      await expect(
        user2.firestore().collection('payments').doc(paymentRef.id).update({
          amount: 200,
        })
      ).rejects.toThrow();

      // User1 can edit their own payment (should succeed)
      await expect(
        user1.firestore().collection('payments').doc(paymentRef.id).update({
          amount: 200,
          updatedAt: new Date(),
        })
      ).resolves.toBeDefined();
    });

    test('ADMIN can edit any payment', async () => {
      const user1 = testEnv.authenticatedContext('user1', { uid: 'user1' });
      const admin = testEnv.authenticatedContext('admin', { uid: 'admin' });

      // Setup users
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          email: 'user1@test.com',
          role: 'edit',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await context.firestore().collection('users').doc('admin').set({
          email: 'admin@test.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // User1 creates a payment
      const paymentData = {
        memberId: 'member1',
        memberName: 'Test Member',
        amount: 100,
        paymentDate: '2025-01-01',
        paymentMethod: 'cash',
        reference: 'REF123',
        notes: 'Test payment',
        receiptNumber: 'R2025-001',
        recordedBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const paymentRef = await user1.firestore().collection('payments').add(paymentData);

      // Admin can edit user1's payment (should succeed)
      await expect(
        admin.firestore().collection('payments').doc(paymentRef.id).update({
          amount: 200,
          updatedAt: new Date(),
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Users Collection', () => {
    test('Users can read their own document', async () => {
      const context = testEnv.authenticatedContext('user1', { uid: 'user1' });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          email: 'user1@test.com',
          role: 'view',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await expect(
        context.firestore().collection('users').doc('user1').get()
      ).resolves.toBeDefined();
    });

    test('Users cannot read other user documents', async () => {
      const context = testEnv.authenticatedContext('user1', { uid: 'user1' });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          email: 'user1@test.com',
          role: 'view',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await context.firestore().collection('users').doc('user2').set({
          email: 'user2@test.com',
          role: 'view',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await expect(
        context.firestore().collection('users').doc('user2').get()
      ).rejects.toThrow();
    });

    test('ADMIN cannot modify SUPER_ADMIN users', async () => {
      const admin = testEnv.authenticatedContext('admin', { uid: 'admin' });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin').set({
          email: 'admin@test.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await context.firestore().collection('users').doc('superadmin').set({
          email: 'super@test.com',
          role: 'super_admin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Admin tries to change super admin's role (should fail)
      await expect(
        admin.firestore().collection('users').doc('superadmin').update({
          role: 'view',
          updatedAt: new Date(),
        })
      ).rejects.toThrow();
    });
  });
});
```

3. **Run tests**:
   ```bash
   npm test
   ```

---

## Manual Testing Checklist

Test these scenarios manually before deploying:

### Authentication Tests
- [ ] Unauthenticated users redirected to login
- [ ] Pending users see "awaiting approval" message
- [ ] Inactive users cannot login
- [ ] Active users can login successfully

### VIEW Role Tests
- [ ] Can view Dashboard
- [ ] Can view Members list
- [ ] Can view Member details
- [ ] Can view Payments list
- [ ] Cannot add/edit members
- [ ] Cannot record payments
- [ ] Cannot access Users page

### EDIT Role Tests
- [ ] All VIEW permissions work
- [ ] Can add new members
- [ ] Can edit members
- [ ] Can delete members (soft delete)
- [ ] Can record payments
- [ ] Can delete own payments
- [ ] Cannot edit other users' payments
- [ ] Cannot access Users page

### ADMIN Role Tests
- [ ] All EDIT permissions work
- [ ] Can access Users page
- [ ] Can approve pending users
- [ ] Can change user roles (except SUPER_ADMIN)
- [ ] Can deactivate users
- [ ] Can edit any payment
- [ ] Can delete any payment
- [ ] Cannot modify SUPER_ADMIN users

### SUPER_ADMIN Role Tests
- [ ] All ADMIN permissions work
- [ ] Can modify ADMIN users
- [ ] Can modify SUPER_ADMIN users
- [ ] Can delete users (hard delete)
- [ ] Can promote users to SUPER_ADMIN

### Data Validation Tests
- [ ] Cannot create member without required fields
- [ ] Cannot set invalid member status (not 'active' or 'inactive')
- [ ] Cannot create payment with negative amount
- [ ] Cannot set invalid payment method
- [ ] Cannot create user with invalid role
- [ ] Cannot create user with invalid status

---

## Common Test Scenarios

### Test 1: Role Hierarchy

```javascript
// VIEW (level 1) cannot access EDIT (level 2) operations
// EDIT (level 2) cannot access ADMIN (level 3) operations
// ADMIN (level 3) cannot access SUPER_ADMIN (level 4) operations
```

**Expected**: Each role can only perform operations at or below their level.

### Test 2: Payment Ownership

```javascript
// User A records payment
// User B (same role) tries to edit
```

**Expected**: User B cannot edit. Only User A or ADMIN+ can edit.

### Test 3: User Status Check

```javascript
// User with status 'pending' or 'inactive' tries to access data
```

**Expected**: Access denied. Only 'active' users can access data.

### Test 4: Data Structure Validation

```javascript
// Try to create member with missing required field
// Try to create payment with string amount instead of number
```

**Expected**: Write operation denied due to validation failure.

---

## Debugging Failed Rules

### Enable Debug Mode

In Firebase Console:
1. Go to Firestore Database > Rules
2. Add logging statements:

```javascript
function logDebug(message) {
  return debug(message);
}

// Use in rules
allow read: if logDebug('Reading members') && canRead();
```

### Check Security Rules Logs

1. Firebase Console > Firestore Database
2. Click "View logs" in Rules tab
3. Filter by "permission denied" errors
4. Review which rules are failing and why

### Use Firestore Emulator Logs

When running `firebase emulators:start`:
- Watch terminal output for rule evaluation logs
- Shows which rules were evaluated and results
- Displays exact reason for permission denied

---

## Best Practices

1. **Test before deploying**: Always test rules in emulator or separate project first
2. **Write unit tests**: Automate testing with @firebase/rules-unit-testing
3. **Test all roles**: Verify each role level has correct permissions
4. **Test edge cases**: Try invalid data, missing fields, wrong types
5. **Test performance**: Ensure rules don't create excessive document reads
6. **Document exceptions**: If rules allow special cases, document why
7. **Version control**: Commit rules with code changes that require them
8. **Gradual rollout**: Deploy rules to staging environment first

---

## Troubleshooting

### Issue: Rules Work in Emulator but Fail in Production

**Cause**: User documents may not exist in production

**Solution**:
- Verify all users have documents in `users` collection
- Check user document structure matches rules expectations
- Ensure timestamps are Firestore timestamps, not strings

### Issue: Getting Permission Denied for Valid Operations

**Cause**: Rules may be too restrictive or user role incorrect

**Solution**:
1. Check user role in Firestore Console
2. Verify user status is 'active'
3. Review rule conditions step by step
4. Check console logs for specific error
5. Test same operation in emulator with same data

### Issue: Rules Syntax Error

**Cause**: Invalid syntax in firestore.rules file

**Solution**:
1. Check for missing semicolons or braces
2. Verify all function names are correct
3. Test syntax: `firebase deploy --only firestore:rules --dry-run`
4. Review error message for line number

---

## Next Steps

After testing:
1. ✓ Verify all test scenarios pass
2. ✓ Document any exceptions or special cases
3. ✓ Commit rules to version control
4. ✓ Deploy to staging (if available)
5. ✓ Deploy to production
6. ✓ Monitor for permission errors in first 24 hours

---

**Last Updated**: November 2025
**Project**: Tea Tree Golf Club Membership Management
