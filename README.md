# commit-by-ai

> AI-powered commit message generator

![cba](https://i.imgur.com/Ca2k2Lp.png)

## Installation

```bash
# via npm
npm i -g commit-by-ai

# via pnpm
pnpm i -g commit-by-ai

# via bun
bun add -g commit-by-ai
```

## Configuration

**commit-by-ai** supports **any text model from OpenRouter**. You can find all available models and their IDs at [OpenRouter Models](https://openrouter.ai/models).

The tool requires an OpenRouter API key for all models, including free ones.

### Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Choose a model from [OpenRouter Models](https://openrouter.ai/models)
3. Configure the tool:

```bash
# set API key
cba config set api_key <your-api-key>

# set model (optional - defaults to deepseek/deepseek-chat-v3.1:free)
cba config set model <model-id>
```

### Recommended Models

**Free models:**
- `deepseek/deepseek-chat-v3.1:free` (default)
- `z-ai/glm-4.5-air:free`

**Paid models:**
- `openai/gpt-5-mini` (best value)
- `openai/gpt-5`
- `openai/gpt-4.1-nano`
- `google/gemini-2.5-flash-lite`

**Any model** from the [OpenRouter Models page](https://openrouter.ai/models) can be used by copying its model ID.

### View Current Configuration

```bash
# show all settings
cba config get

# show specific setting
cba config get model
```

## Usage

```bash
# generate commit message for staged changes
cba
```

## Author

[Yerofey S.](https://github.com/yerofey)

## License

[MIT](https://github.com/yerofey/commit-by-ai/blob/master/LICENSE)
