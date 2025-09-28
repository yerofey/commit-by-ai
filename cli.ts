#!/usr/bin/env node

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { homedir } from "node:os";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use ~/.cba/.env for config to persist across package updates
const configDir = join(homedir(), ".cba");
const configPath = join(configDir, ".env");

// Create config directory if it doesn't exist
if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
}

config({
    path: configPath,
    quiet: true,
});

const execAsync = promisify(exec);

// Read version from package.json (in root directory)
function getPackageJson() {
    const currentDir = join(__dirname, "package.json");
    const parentDir = join(__dirname, "..", "package.json");

    if (existsSync(currentDir)) {
        return JSON.parse(readFileSync(currentDir, "utf8"));
    } else if (existsSync(parentDir)) {
        return JSON.parse(readFileSync(parentDir, "utf8"));
    } else {
        throw new Error("Could not find package.json in current or parent directory");
    }
}

const packageJson = getPackageJson();

const program = new Command();

program
    .name("cba")
    .description(chalk.blue("AI-powered commit message generator"));

// Custom version handling with consistent formatting
program.version(packageJson.version, "-v, --version");
program.configureOutput({
    writeOut: (str) => {
        if (str.includes(packageJson.version)) {
            showInfo();
            console.log(chalk.gray(`version ${packageJson.version}`));
        } else {
            process.stdout.write(str);
        }
    }
});

function showInfo(showModel = false) {
    if (showModel) {
        const modelId = process.env.OPENROUTER_MODEL_ID || "deepseek/deepseek-chat-v3.1:free";
        console.log(chalk.gray(`cba: commit-by-ai (using ${modelId})`));
    } else {
        console.log(chalk.gray("cba: commit-by-ai"));
    }
}

program
    .command("config")
    .description(chalk.yellow("Manage configuration"))
    .argument("<action>", "Action to perform (get|set)")
    .argument("[key]", "Configuration key (api_key|model)")
    .argument("[value]", "Configuration value")
    .action(async (action: string, key?: string, value?: string) => {
        showInfo();

        let configData: Record<string, string> = {};
        if (existsSync(configPath)) {
            const envContent = readFileSync(configPath, "utf8");
            envContent.split("\n").forEach((line) => {
                if (line.trim() && !line.startsWith("#")) {
                    const [k, v] = line.split("=");
                    if (k && v) configData[k] = v;
                }
            });
        }

        const aliases: Record<string, string> = {
            api_key: "OPENROUTER_API_KEY",
            model: "OPENROUTER_MODEL_ID",
            key: "OPENROUTER_API_KEY",
            id: "OPENROUTER_MODEL_ID",
        };

        const fullKey = key ? aliases[key] || key : undefined;

        if (action === "get") {
            if (!key) {
                console.log(chalk.cyan("Current configuration:"));
                console.log(
                    chalk.green(
                        `OPENROUTER_API_KEY: ${
                            configData.OPENROUTER_API_KEY || "Not set"
                        }`
                    )
                );
                console.log(
                    chalk.green(
                        `OPENROUTER_MODEL_ID: ${
                            configData.OPENROUTER_MODEL_ID ||
                            "Not set (default: deepseek/deepseek-chat-v3.1:free)"
                        }`
                    )
                );
            } else {
                console.log(
                    chalk.green(
                        `${fullKey}: ${configData[fullKey!] || "Not set"}`
                    )
                );
            }
        } else if (action === "set") {
            if (!key || !value) {
                console.error(
                    chalk.red(
                        "Error: Both key and value are required for set action"
                    )
                );
                process.exit(1);
            }

            configData[fullKey!] = value;

            let envContent = "";
            Object.entries(configData).forEach(([k, v]) => {
                if (v) {
                    envContent += `${k}=${v}\n`;
                }
            });

            writeFileSync(configPath, envContent);
            console.log(chalk.green(`Set ${fullKey} successfully`));
        } else {
            console.error(chalk.red('Error: Action must be "get" or "set"'));
            process.exit(1);
        }
    });

program
    .command("commit")
    .description(chalk.yellow("Generate commit message for staged changes"))
    .action(async () => {
        showInfo(true);
        await generateCommit();
    });

// Main execution - default action
const args = process.argv.slice(2);
if (args.length === 0) {
    showInfo(true);
    generateCommit();
} else {
    program.parse();
}

async function getStagedDiff(): Promise<string> {
    try {
        const { stdout } = await execAsync("git diff --staged");
        return stdout.trim();
    } catch (error: any) {
        if (error.code === 128) {
            // Git error: no staged changes
            return "";
        }
        throw error;
    }
}

async function generateCommitMessage(diff: string): Promise<{ message: string; usage?: any; providerMetadata?: any }> {
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    const modelId = process.env.OPENROUTER_MODEL_ID || "deepseek/deepseek-chat-v3.1:free";

    // API key is required for all models
    if (!apiKey) {
        throw new Error(
            "OPENROUTER_API_KEY is required for all models. Get your API key from https://openrouter.ai/ and set it with: cba config set api_key <your-api-key>"
        );
    }

    const openrouter = createOpenRouter({
        apiKey,
    });

    const prompt = `Generate a concise, imperative-style Git commit message (under 72 characters for the subject) based on the following staged changes diff. Do not include any additional information, such as file names or file paths. If the diff is empty, return "No changes". Use prefixes to describe the type of change (e.g., "feat: ", "fix: ", "docs: ", etc.). Focus on what changed and why, without unnecessary details:\n\n${diff}`;
    const system = `You are a helpful Git assistant. Always respond with just the commit message, no explanations.`;

    const response = await generateText({
        model: openrouter.chat(modelId, {
            usage: {
                include: true,
            },
        }),
        messages: [
            {
                role: "system",
                content: system,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    return {
        message: response.text.trim(),
        usage: response.usage,
        providerMetadata: response.providerMetadata
    };
}

async function generateCommit(): Promise<void> {
    try {
        // Check API key configuration first
        const apiKey = process.env.OPENROUTER_API_KEY || "";

        if (!apiKey) {
            console.error(chalk.red("Error: API key required for all models"));
            console.log(chalk.cyan("\nTo use commit-by-ai, you need an OpenRouter API key:"));
            console.log(chalk.yellow("1. Get an API key from https://openrouter.ai/"));
            console.log(chalk.yellow("2. Set up your configuration:"));
            console.log(chalk.gray("\nSet API key:"));
            console.log(chalk.green("  cba config set api_key <your-api-key>"));
            console.log(chalk.gray("\nSet model (optional):"));
            console.log(chalk.green("  cba config set model <your-model-id>"));
            console.log(chalk.gray("\nPopular models:"));
            console.log(chalk.gray("  - deepseek/deepseek-chat-v3.1:free (default)"));
            console.log(chalk.gray("  - openai/gpt-5-mini"));
            process.exit(1);
        }

        let diff = await getStagedDiff();
        let autoAdded = false;

        if (!diff) {
            console.log(
                chalk.yellow(
                    "No staged changes. Automatically staging all files with `git add .`..."
                )
            );
            await execAsync("git add .");
            autoAdded = true;

            // Check again after adding files
            diff = await getStagedDiff();
            if (!diff) {
                console.log(
                    chalk.blue("No changes to commit. Working tree is clean.")
                );
                process.exit(0);
            }
        }

        const spinner = ora({
            text: chalk.cyan("Generating commit message..."),
            color: "blue",
            spinner: "dots"
        }).start();

        const result = await generateCommitMessage(diff);
        spinner.succeed(chalk.gray("Commit message generated!"));

        console.log(chalk.cyan("\nSuggested commit message:\n"));
        console.log(chalk.green(result.message));
        console.log(
            chalk.gray(
                `\nUse it with: ${chalk.blue(`git commit -m "${result.message.replace(/"/g, '\\"')}"`)}`
            )
        );

        if (autoAdded) {
            console.log(
                chalk.yellow(
                    "\nNote: All files were automatically staged for this commit."
                )
            );
        }

        // Display cost information if available
        const modelId = process.env.OPENROUTER_MODEL_ID || "deepseek/deepseek-chat-v3.1:free";

        if (result.providerMetadata?.openrouter?.usage) {
            const openrouterUsage = result.providerMetadata.openrouter.usage;
            const { cost, totalTokens } = openrouterUsage;

            console.log(chalk.gray(`\nTokens used: ${totalTokens} total (${modelId})`));

            // Only show cost if model is not free (doesn't contain :free in name)
            if (!modelId.includes(':free') && cost !== undefined && cost !== null && Number(cost) > 0) {
                console.log(chalk.gray(`Cost: $${Number(cost).toFixed(6)}`));
            }
        } else if (result.usage) {
            // Fallback to basic token usage if providerMetadata is not available
            const { totalTokens } = result.usage;

            console.log(chalk.gray(`\nTokens used: ${totalTokens} total (${modelId})`));

            // Only show cost if model is not free (doesn't contain :free in name)
            if (!modelId.includes(':free')) {
                console.log(chalk.gray(`Cost: Unknown (usage accounting not available)`));
            }
        }
    } catch (error: any) {
        console.error(chalk.red("Error:", error.message));
        process.exit(1);
    }
}
