# Fetch Library Documentation

Look up current documentation for: $ARGUMENTS

## Instructions

1. Use `mcp__context7__resolve-library-id` to find the Context7-compatible library ID for the requested library
2. Use `mcp__context7__get-library-docs` to fetch the documentation
   - Use `mode: "code"` for API references and code examples (default)
   - Use `mode: "info"` for conceptual guides and architecture
   - Use the `topic` parameter if a specific topic was mentioned
3. Summarize the relevant documentation for the user's needs
4. If the documentation doesn't fully answer the question, try `page=2`, `page=3`, etc.

## Examples

- `/docs react hooks` - Get React hooks documentation
- `/docs firebase authentication` - Get Firebase auth docs
- `/docs tailwind flexbox` - Get Tailwind flexbox utilities
