Run a comprehensive security audit of this codebase:

## Security Audit Checklist

### 1. Static Analysis with Semgrep
Scan the `src/` and `lib/` directories for common vulnerabilities:
- XSS vulnerabilities
- SQL/NoSQL injection patterns
- Insecure configurations
- Hardcoded secrets

Run: `npm run security:scan` or `npx semgrep --config auto src/`

### 2. Secrets and Credentials Check
Search for potential hardcoded secrets:
- API keys in source files
- Credentials in config files
- Private keys or tokens
- Database connection strings

Check these patterns:
- `apiKey`, `api_key`, `API_KEY`
- `password`, `secret`, `token`
- `firebase`, `sendgrid`, `stripe`
- Base64 encoded strings that look like secrets

### 3. Firebase Security Rules Validation
Review `firestore.rules`:
- Verify all writes validate data structure and types
- Ensure authentication required on non-public paths
- Check string length limits match Zod schemas
- Verify privilege escalation prevention (users can't set own role to admin)
- Check rate limiting considerations

Run: `npm run security:firebase` (dry-run rules deployment)

### 4. XSS Prevention Audit
Review all uses of:
- `dangerouslySetInnerHTML` - should use `createSafeHtml()` wrapper
- Direct HTML rendering from user input
- URL parameters rendered without sanitization
- DOM manipulation with user data

### 5. Input Validation Coverage
Verify all user inputs are validated with Zod before database writes:
- Form submissions in `src/pages/`
- Service functions in `src/services/`
- API calls and data transformations

Check that all service write functions use:
- Zod schema validation
- Secure write wrappers from `lib/firebase/secure-write.js`

### 6. Authentication Check Points
Review for missing authentication checks:
- All routes in `App.jsx` use `PrivateRoute` where needed
- Service functions verify user permissions
- Firebase rules match client-side permission checks

### 7. Dependency Vulnerabilities
Run: `npm audit` and `npm run security:deps`

Check for:
- High/critical severity vulnerabilities
- Outdated packages with known issues
- Unnecessary dependencies

### 8. Client-Side Data Exposure
Check for sensitive data exposed to client:
- Environment variables (only VITE_* should be public)
- User data in Redux/Context state
- API responses containing unnecessary fields
- Console.log statements with sensitive data

## Output Format

Generate a security report with:

### Critical Issues (Fix Immediately)
- List any vulnerabilities that could lead to data breach or system compromise

### Warnings (Fix Soon)
- Security weaknesses that should be addressed

### Recommendations (Best Practices)
- Suggestions for improving security posture

### Files Reviewed
- List of files examined during the audit

### Commands Run
- List security commands executed and their results
