## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: eslint, tailwindcss, ai-tools

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Agent skills

### Issue tracker

Issues are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The repository uses the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses the single-context layout. See `docs/agents/domain.md`.

## shadcn-svelte Automation Rules

You are working on a SvelteKit project using Tailwind CSS v4 and shadcn-svelte.
Whenever the user asks you to build a UI feature, create a page, or use a component that is not yet installed in `src/lib/components/ui/`, you MUST automatically run the installation command first.

### Installation Instructions:
- Always use `bun x shadcn-svelte add <component-name>` to install components.
- Do NOT try to manually recreate shadcn components from scratch.
- If you need multiple components, install them in one go or sequentially (e.g., `bun x shadcn-svelte add dialog button input`).

### Example Workflow:
If the user asks: "Buat form login pakai card dan button"
Your action:
1. Run terminal command: `bun x shadcn-svelte add card button input`
2. Create/modify the Svelte file using those components.
