# E2E Test Scenarios

This directory contains end-to-end test scenarios for the Tea Tree Golf Club Membership app.

## Testing Approach

Tests are executed using the **chrome-devtools MCP server** rather than Playwright. This provides:
- Real browser interaction via Chrome DevTools Protocol
- DOM snapshots with element UIDs for reliable targeting
- Console and network monitoring
- Screenshot capture

## Running Tests

### Prerequisites
1. Start the dev server: `npm run dev`
2. Ensure Chrome is available for DevTools connection

### Quick Start
Use the `/test-browser` slash command to set up a testing session:
```
/test-browser login
```

### Manual Execution
Each test file contains step-by-step instructions using MCP tools:
- `mcp__chrome-devtools__navigate_page` - Navigate to URLs
- `mcp__chrome-devtools__take_snapshot` - Get DOM with element UIDs
- `mcp__chrome-devtools__fill` - Enter text in inputs
- `mcp__chrome-devtools__click` - Click buttons/links
- `mcp__chrome-devtools__wait_for` - Wait for text to appear
- `mcp__chrome-devtools__list_console_messages` - Check for errors

## Test Files

| File | Coverage |
|------|----------|
| `login.test.md` | Authentication flow, error handling |
| `members.test.md` | Member CRUD operations |
| `payments.test.md` | Payment recording, balance updates |
| `dashboard.test.md` | Dashboard rendering, data display |

## Test Data

Tests use the following approach:
- **Login**: Use test credentials from `.env.test` or prompt user
- **Members**: Create test members with unique names (prefix: "E2E-Test-")
- **Payments**: Use small amounts ($1-$10) for easy identification
- **Cleanup**: Tests should clean up created data when possible

## Adding New Tests

1. Create a new `.test.md` file in this directory
2. Follow the template structure in existing tests
3. Include:
   - Prerequisites
   - Step-by-step MCP commands
   - Expected results
   - Cleanup steps
