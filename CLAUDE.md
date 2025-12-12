# CLAUDE.md

Core rules for Claude Code working with the Tea Tree Golf Club membership system.

**For detailed reference**: See `docs/REFERENCE.md` for data models, service functions, troubleshooting, and version history.

---

## Project Overview

React 18 + Firebase membership management system. SPA with role-based access control, payment processing, and member records.

**Tech Stack**: React 18, React Router v6, Tailwind CSS, Firebase (Auth + Firestore), Vite

**Version**: 2.0.0 (Production) | **Phase**: Fine-tuning

---

## Quick Commands

```bash
npm run dev          # Dev server at localhost:5173
npm run build        # Production build
npm run test         # Run 95 automated tests
npm run lint         # ESLint (must pass with 0 warnings)
npm run emulator     # Firebase emulators
npm run deploy       # Full deploy (build + hosting + rules)
```

---

## Architecture

```
src/
├── pages/          # Route components (fetch data, manage state)
├── components/     # Reusable UI (Layout, PrivateRoute, Forms)
├── contexts/       # Global state (AuthContext only)
├── services/       # Business logic & Firestore operations
├── hooks/          # React Query hooks
├── schemas/        # Zod validation schemas
└── firebase.js     # Firebase initialization
```

**Critical Rule**: Components never call Firestore directly. Always use service functions.

---

## Key Patterns

### Authentication & Authorization
```javascript
const { currentUser, userRole, checkPermission, ROLES } = useAuth()

// Role hierarchy: VIEW < EDIT < ADMIN < SUPER_ADMIN
if (!checkPermission(ROLES.EDIT)) {
  return <div>Access denied</div>
}
```

### Transaction-Based Payments
Payment operations use `runTransaction()` to update both payment doc AND member balance atomically.
- **Positive balance** = credit (paid ahead)
- **Negative balance** = owes money

### Client-Side Search
Firestore limitation: fetches all members, filters client-side. Acceptable for <1000 members.

---

## Frozen Files - DO NOT MODIFY

| File | Reason |
|------|--------|
| `firestore.rules` | Production security rules |
| `src/contexts/AuthContext.jsx` | Core auth logic |
| `src/services/paymentsService.js` | Transaction-based balance integrity |
| `functions/index.js` | Cloud Functions (deployed separately) |
| `src/firebase.js` | Firebase initialization |
| `src/schemas/*` | Must sync with Firestore rules |

---

## Before ANY Code Changes

1. **Check frozen files** - Is this file listed above?
2. **Run `npm run lint`** - Must pass with zero warnings
3. **Run `npm run test`** - All 95 tests must pass
4. **Run `npm run build`** - Must succeed

---

## Testing

**95 automated tests** across 4 files:
- `paymentsService.test.js` (27) - Payment validation, balance calculations
- `usersService.test.js` (40) - Role hierarchy, permissions
- `welcomeLetterService.test.js` (27) - PDF edge cases
- `membersService.test.js` (1) - Placeholder

---

## Session Workflow

1. **Start**: Run `/status` for project health
2. **Explore**: Use `/explore <query>` to search codebase (reduces context)
3. **Plan**: Use `/plan-feature <desc>` before multi-step features
4. **Track**: Use todo list for task progress
5. **Verify**: Run `npm run test && npm run lint && npm run build`
6. **End**: Run `/handoff` to generate session summary

---

## Agent Usage

| Situation | Use |
|-----------|-----|
| Exploring codebase | `/explore` command |
| Planning features | `/plan-feature` command |
| Quick status check | `/status` command |
| Deep validation | `/harness-check` command |
| View metrics trends | `/metrics` command |
| Session handoff | `/handoff` command |

---

## What's Safe to Change

- UI text, labels, formatting
- CSS/Tailwind styling
- Comments and documentation
- Adding React Query hooks (following patterns)
- Bug fixes not touching frozen files

## What Requires Approval

- Any frozen file modification
- New dependencies (`npm install`)
- Database schema changes
- Firebase rules changes
- New routes/pages
- Transaction logic changes

---

## Progress Tracking

See `claude-progress.json` for:
- Feature completion status
- Known issues with severity ratings
- Session history log
- Backlog items
- Metrics history

---

**Full Reference**: `docs/REFERENCE.md`
**Deployment Guide**: `DEPLOYMENT.md`
**MCP Workflows**: `MCP_WORKFLOWS.md`
