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

You will need an OpenRouter API key to use this tool. You can get one from [OpenRouter](https://openrouter.ai/).

```bash
# set API key
cba config set api_key <your-api-key>

# set model
cba config set model <your-model-id>
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
