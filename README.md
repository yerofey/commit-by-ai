# commit-by-ai

> Git commit message generator - write better commits with AI

![cba](https://i.imgur.com/Ca2k2Lp.png)

**commit-by-ai** is a powerful command-line tool that leverages advanced AI models to automatically generate meaningful, context-aware Git commit messages based on your staged changes. Say goodbye to generic commit messages like "fix bug" or "update file" and let AI help you write professional, descriptive commits that clearly communicate what changed and why.

## Key features

- **AI-powered**: Uses state-of-the-art language models to analyze your code changes and generate intelligent commit messages
- **Model flexibility**: Supports any text model from [OpenRouter](https://openrouter.ai/models), including free and paid options
- **Lightweight & fast**: Built with minimal dependencies for optimal performance
- **Persistent configuration**: Settings are stored in your home directory, surviving package updates
- **Context-aware**: Analyzes git diff output to understand the scope and nature of your changes
- **Rich CLI**: Beautiful terminal output with colors and loading indicators

## Quick start

### Installation

```bash
# npm
npm install -g commit-by-ai

# pnpm
pnpm install -g commit-by-ai

# bun
bun add -g commit-by-ai
```

### Configuration

**commit-by-ai** requires an OpenRouter API key to function. Even free models need authentication.

1. **Get your API key** from [OpenRouter](https://openrouter.ai/keys)
2. **Configure the tool**:

```bash
# Set your OpenRouter API key
cba config set api_key your-api-key-here

# Optional: Set a custom model (defaults to free DeepSeek)
cba config set model openai/gpt-5-mini
```

### Basic usage

After staging your changes, simply run:

```bash
# Generate commit message for staged changes
cba
```

That's it! The tool will analyze your changes and suggest a professional commit message.

## Configuration options

### View current settings

```bash
# Show all configuration
cba config get

# Show specific setting
cba config get model
```

### Recommended models

**Free models (Great for getting started):**
- `deepseek/deepseek-chat-v3.1:free` (Default - excellent quality)
- `z-ai/glm-4.5-air:free`

**Paid models (Best performance):**
- `openai/gpt-5-mini` (Best value for money)
- `openai/gpt-5` (Premium quality)
- `openai/gpt-4.1-nano` (Fast and affordable)
- `google/gemini-2.5-flash-lite` (Quick and capable)

**Pro tip**: Browse all available models at [OpenRouter models](https://openrouter.ai/models) and use any model ID you prefer.

## Advanced usage

### Configuration management

```bash
# Set API key
cba config set api_key sk-or-...

# Set preferred model
cba config set model deepseek/deepseek-chat-v3.1:free

# Check current model
cba config get model

# Verify API key is set
cba config get api_key
```

### Configuration storage

Your settings are stored in `~/.cba/.env` and persist across package updates. This means you only need to configure once!

## How it works

1. **Analyze changes**: The tool reads your staged changes using `git diff --cached`
2. **AI processing**: Sends the diff to your chosen AI model with context about generating good commit messages
3. **Message generation**: The AI analyzes the code changes and generates a clear, descriptive commit message
4. **Output**: Displays the suggested commit message for you to review and use

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## License

MIT © [Yerofey S.](https://github.com/yerofey)

## Show your support

If you find this tool helpful, please consider:
- Starring the repository on GitHub
- Reporting bugs or suggesting features
- Sharing with your developer friends

---

Created by [Yerofey S.](https://github.com/yerofey)
