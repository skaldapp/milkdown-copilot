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
import { copilotPlugin, copilotPluginCtx } from "@skaldapp/milkdown-copilot";

// Create Milkdown editor with copilot plugin
const editor = new Editor()
  .config((ctx) => {
    ctx.set(copilotPluginCtx, {
      apiKey: "your-mistral-ai-api-key",
      filename: "example.md",
    });
  })
  .create();

// Mount to DOM
editor.mount(document.querySelector("#editor"));
```

### Configuration Options

The plugin accepts the following configuration via `copilotPluginCtx`:

| Option     | Type     | Description                                           |
| ---------- | -------- | ----------------------------------------------------- |
| `apiKey`   | `string` | Your Mistral AI API key for authentication            |
| `filename` | `string` | Current filename (used for context-aware completions) |

### Default Settings

The plugin comes with sensible defaults:

- **Model**: `codestral` (Mistral's code-focused model)
- **Provider**: `mistral`
- **Language**: `markdown`
- **Debounce**: 1000ms (1 second)
- **Technologies**: `['vue', 'tailwindcss', 'comark']`

## How It Works

1. **Trigger**: Completions are triggered on:
   - Single character input
   - Pressing `Enter` key

2. **Context Collection**: The plugin gathers:
   - Text before cursor
   - Text after cursor
   - Current cursor position
   - Filename and language context

3. **AI Request**: Sends context to Mistral AI's Codestral model via `monacopilot`

4. **Display**: Completions appear as inline decorations (widgets) in the editor

5. **Accept**: Press `Tab` to insert the completion at cursor position

## API

### Exports

#### `copilotPlugin`

The main Milkdown plugin that provides AI completion functionality.

#### `copilotPluginCtx`

A Milkdown context slice for configuring the plugin:

```typescript
export const copilotPluginCtx = createSlice(
  {
    apiKey: "",
    filename: "",
  },
  "MilkdownCopilot",
);
```

## Dependencies

- [`@milkdown/ctx`](https://www.npmjs.com/package/@milkdown/ctx) - Milkdown context management
- [`@milkdown/kit`](https://www.npmjs.com/package/@milkdown/kit) - Core Milkdown editor kit
- [`monacopilot`](https://www.npmjs.com/package/monacopilot) - AI completion client
- [`quasar`](https://www.npmjs.com/package/quasar) - Utility functions (debounce)

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
└── README.md              # This file
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

---

Made with ❤️ by Jerry Bruwes
