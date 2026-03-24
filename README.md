# @skaldapp/milkdown-copilot

> AI-powered code completion plugin for Milkdown editor

[![License](https://img.shields.io/badge/license-AGPL--3.0--only-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@skaldapp/milkdown-copilot.svg)](https://www.npmjs.com/package/@skaldapp/milkdown-copilot)

## Description

`@skaldapp/milkdown-copilot` is a Milkdown plugin that provides AI-powered code completion suggestions directly within your Markdown editor. It integrates with Mistral AI's Codestral model to offer intelligent, context-aware completions as you type.

## Features

- 🤖 **AI-Powered Completions**: Get intelligent code suggestions powered by Mistral AI's Codestral model
- ⚡ **Debounced Requests**: Automatic debouncing (1 second) to optimize API calls and performance
- 📝 **Markdown Support**: Seamlessly works with Markdown syntax and Milkdown's editor state
- 🎯 **Context-Aware**: Analyzes text before and after cursor for relevant completions
- 🔌 **Easy Integration**: Simple plugin setup with Milkdown's plugin system
- 💡 **Tab to Accept**: Press `Tab` to accept completion suggestions
- 🔄 **Reactive**: Automatically updates suggestions based on editor changes

## Installation

```bash
npm install @skaldapp/milkdown-copilot
```

## Requirements

- Node.js >= 18
- Milkdown >= 7.19.2
- A valid Mistral AI API key

## Usage

### Basic Setup

```typescript
import { Editor, rootCtx } from "@milkdown/kit/core";
import {
  copilotPlugin,
  apiKeySlice,
  filenameSlice,
} from "@skaldapp/milkdown-copilot";

// Create Milkdown editor with copilot plugin
const editor = new Editor()
  .config((ctx) => {
    ctx.set(apiKeySlice, "your-mistral-ai-api-key");
    ctx.set(filenameSlice, "example.md");
  })
  .create();

// Mount to DOM
editor.mount(document.querySelector("#editor"));
```

### Configuration Options

The plugin uses two separate context slices for configuration:

| Slice           | Type     | Description                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `apiKeySlice`   | `string` | Your Mistral AI API key for authentication            |
| `filenameSlice` | `string` | Current filename (used for context-aware completions) |

### Default Settings

The plugin comes with sensible defaults:

| Setting          | Value                              | Description                             |
| ---------------- | ---------------------------------- | --------------------------------------- |
| **Model**        | `codestral`                        | Mistral's code-focused model            |
| **Provider**     | `mistral`                          | AI provider                             |
| **Language**     | `markdown`                         | Target language for completions         |
| **Debounce**     | `1000ms`                           | Delay before sending completion request |
| **Technologies** | `['vue', 'tailwindcss', 'comark']` | Technology stack context                |

## How It Works

1. **Trigger**: Completions are triggered on:
   - Single character input
   - Pressing `Enter` key

2. **Context Collection**: The plugin gathers:
   - Text before cursor (serialized to Markdown)
   - Text after cursor (serialized to Markdown)
   - Current cursor position
   - Filename and language context

3. **AI Request**: Sends context to Mistral AI's Codestral model via `monacopilot`

4. **Display**: Completions appear as inline decorations (widgets) in a `<pre>` element

5. **Accept**: Press `Tab` to insert the completion at cursor position

### Trigger Conditions

| Key                                   | Action                       |
| ------------------------------------- | ---------------------------- |
| Any single character (a-z, 0-9, etc.) | Trigger completion request   |
| `Enter`                               | Trigger completion request   |
| `Tab` (with active completion)        | Accept and insert completion |
| Any other key                         | Cancel pending request       |

## API

### Exports

#### `copilotPlugin`

The main Milkdown plugin array that provides AI completion functionality. It consists of:

1. A setup function that injects the required context slices
2. A ProseMirror plugin that handles completions

#### `apiKeySlice`

A Milkdown context slice for storing the API key:

```typescript
export const apiKeySlice = createSlice("", "apiKey");
```

#### `filenameSlice`

A Milkdown context slice for storing the current filename:

```typescript
export const filenameSlice = createSlice("", "filename");
```

### Plugin Internals

The plugin uses a ProseMirror `Plugin` with:

- **State**: Manages completion message and decoration set
- **Props**:
  - `decorations`: Renders completion hints as widgets
  - `handleKeyDown`: Intercepts keyboard events for triggers
- **Debouncing**: 1 second delay to prevent excessive API calls

## Dependencies

| Package         | Version | Purpose                      |
| --------------- | ------- | ---------------------------- |
| `@milkdown/ctx` | ^7.19.2 | Context management           |
| `@milkdown/kit` | ^7.19.2 | Core Milkdown editor         |
| `monacopilot`   | ^1.2.12 | AI completion client         |
| `quasar`        | ^2.19.1 | Utility functions (debounce) |

## Development

### Prerequisites

- Node.js >= 18
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Lint code
npm run lint
```

### Project Structure

```
milkdown-copilot/
├── src/
│   └── index.ts          # Main plugin implementation
├── dist/                  # Built output
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
├── eslint.config.ts       # ESLint configuration
└── README.md              # This file
```

### Build Output

The package exports as an ES module:

```json
{
  "type": "module",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

## License

This project is licensed under the [AGPL-3.0-only License](LICENSE).

## Author

**Jerry Bruwes**  
Email: [jbruwes@gmail.com](mailto:jbruwes@gmail.com)  
GitHub: [jbruwes](https://github.com/jbruwes)

## Repository

- **GitHub**: [https://github.com/skaldapp/milkdown-copilot](https://github.com/skaldapp/milkdown-copilot)
- **npm**: [https://www.npmjs.com/package/@skaldapp/milkdown-copilot](https://www.npmjs.com/package/@skaldapp/milkdown-copilot)

## Issues & Contributions

- Report bugs: [GitHub Issues](https://github.com/skaldapp/milkdown-copilot/issues)
- Contributions are welcome! Please open an issue or submit a PR.

## Related Projects

- [Milkdown](https://milkdown.dev/) - A plugin-driven Markdown editor
- [MonacoPilot](https://www.npmjs.com/package/monacopilot) - AI completion library
- [Mistral AI](https://mistral.ai/) - AI models provider
- [ProseMirror](https://prosemirror.net/) - Underlying editor framework

---

Made with ❤️ by Jerry Bruwes
