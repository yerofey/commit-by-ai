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

**commit-by-ai** works out of the box with free models! You only need an API key if you want to use paid models.

### Free Models (No API Key Required)

The tool uses `z-ai/glm-4.5-air:free` by default - no setup needed! Other free models include:

- `z-ai/glm-4.5-air:free` (default)
- `google/gemma-7b-it:free`
- `mistralai/mistral-7b-instruct:free`

### Paid Models (API Key Required)

For paid models, you'll need an OpenRouter API key from [OpenRouter](https://openrouter.ai/):

```bash
# set API key
cba config set api_key <your-api-key>

# set a paid model
cba config set model openai/gpt-4o-mini
```

Popular paid models:
- `openai/gpt-4o-mini`
- `anthropic/claude-3-haiku`
- `openai/gpt-4o`

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
