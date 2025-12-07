# Security Policy

## Overview

This document outlines the security measures, policies, and best practices implemented in the Tea Tree Golf Club Membership Management System.

## Reporting Security Vulnerabilities

### How to Report

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: [security@teatreegolfclub.com.au]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution Target**: Within 30 days for critical issues

## Security Contacts

- **Primary**: Club Administrator
- **Technical**: Development Team Lead

## Security Measures Implemented

### 1. Authentication & Authorization

- **Firebase Authentication**: Secure user authentication with email/password
- **Role-Based Access Control (RBAC)**: Four-tier permission system
  - `VIEW`: Read-only access
  - `EDIT`: Can modify members and payments
  - `ADMIN`: User management capabilities
  - `SUPER_ADMIN`: Full system access

### 2. Input Validation

All user inputs are validated at multiple layers:

#### Client-Side (Zod Schemas)
- `src/schemas/` - Comprehensive validation schemas
- `src/lib/validation/schemas.js` - Security-focused base schemas
- Type checking, length limits, pattern validation

#### Server-Side (Firebase Rules)
- `firestore.rules` - Enforces data structure and constraints
- String length limits match Zod schemas
- Required field validation
- Role hierarchy enforcement

### 3. XSS Prevention

- **HTML Sanitization**: `src/lib/security/sanitize.js`
- **Safe String Schemas**: Strip HTML tags from user input
- **Dangerous Pattern Detection**: Block script injection attempts
- **No `dangerouslySetInnerHTML`** without sanitization wrapper

### 4. Data Protection

#### Firestore Security Rules
- Authentication required for all operations
- Active user status required
- Role-based read/write permissions
- Privilege escalation prevention (users cannot set own role)

#### Environment Variables
- Validated at build time (`src/lib/validation/env.js`)
- Only `VITE_*` variables exposed to client
- Server secrets stored securely in Firebase Functions config

### 5. Secure Firestore Operations

- **Wrapper Functions**: `src/lib/firebase/secure-write.js`
- All writes validated before reaching Firestore
- Security event logging for audit trail
- Transaction support with validation

## Validation Strategy

```
User Input → Zod Schema (client) → Firebase Rules (server) → Firestore
                    ↓
            Secure Write Wrapper
                    ↓
            Security Log (failures)
```

### String Length Limits

| Field Type | Max Length | Constant |
|------------|------------|----------|
| Short      | 100        | Names, titles |
| Medium     | 255        | Emails, addresses |
| Long       | 1000       | Notes, descriptions |
| Text       | 5000       | Large text fields |

These limits are enforced in both Zod schemas and Firebase rules.

## Security Scanning

### Automated Scanning

1. **Semgrep**: Static analysis for vulnerabilities
   ```bash
   npm run security:scan
   ```

2. **npm audit**: Dependency vulnerability check
   ```bash
   npm run security:deps
   ```

3. **Combined scan**:
   ```bash
   npm run security:all
   ```

### CI/CD Security

- GitHub Actions workflow runs on every PR
- Semgrep scans for OWASP Top 10 vulnerabilities
- TruffleHog scans for exposed secrets
- Dependabot monitors for dependency updates

### Pre-commit Hooks

Husky runs on every commit:
- ESLint for code quality
- Semgrep for security issues

## Best Practices for Developers

### DO

- Use Zod schemas for all user input validation
- Use secure write wrappers for Firestore operations
- Keep Firebase rules in sync with Zod schemas
- Run `npm run security:all` before deploying
- Use environment variables for secrets
- Review Dependabot PRs promptly

### DON'T

- Never use `dangerouslySetInnerHTML` without sanitization
- Never trust client-side data without server validation
- Never commit `.env` files or secrets
- Never disable security rules in production
- Never expose API keys in client-side code
- Never skip pre-commit hooks

## Incident Response

### If a Security Breach is Suspected

1. **Immediate**: Disable affected user accounts
2. **Assessment**: Review audit logs and security logs
3. **Containment**: Rotate affected credentials
4. **Communication**: Notify affected users if required
5. **Resolution**: Patch vulnerability and deploy fix
6. **Review**: Post-incident analysis and documentation

### Audit Logging

Security events are logged:
- Validation failures (potential attack attempts)
- Authentication failures
- Permission denied events
- Data deletion events

Access logs via `getSecurityLog()` from `secure-write.js` or Firebase Console.

## Compliance

### Data Protection

- User data stored in Firestore with encryption at rest
- HTTPS enforced for all connections
- Minimal data collection (only necessary fields)
- Soft delete for data retention requirements

### Access Control

- Principle of least privilege
- Regular access reviews recommended
- Super admin actions logged

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial security policy |

## Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Zod Documentation](https://zod.dev/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Semgrep Rules](https://semgrep.dev/explore)
