Toggle browser testing mode (chrome-devtools MCP).

## Steps

1. Check current MCP status with `claude mcp list`
2. If chrome-devtools is listed and connected:
   - Run `claude mcp remove chrome-devtools`
   - Report: "Browser testing DISABLED - saving ~17k tokens"
3. If chrome-devtools is NOT listed:
   - Run `claude mcp add chrome-devtools`
   - Report: "Browser testing ENABLED - chrome-devtools tools available"

## Usage

Run `/browser-mode` to toggle between lightweight mode (faster, less context) and full browser testing mode.
