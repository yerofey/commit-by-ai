#!/usr/bin/env node

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Command } from "commander";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({
    path: join(__dirname, ".env"),
    quiet: true,
});

const execAsync = promisify(exec);

const program = new Command();

program
    .name("cba")
    .description(chalk.blue("AI-powered commit message generator"))
    .version("1.0.0");

program
    .command("config")
    .description(chalk.yellow("Manage configuration"))
    .argument("<action>", "Action to perform (get|set)")
    .argument("[key]", "Configuration key (api_key|model)")
    .argument("[value]", "Configuration value")
    .action(async (action: string, key?: string, value?: string) => {
        const configPath = join(__dirname, ".env");

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
                            "Not set (default: z-ai/glm-4.5-air:free)"
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
        await generateCommit();
    });

// Main execution - default action
const args = process.argv.slice(2);
if (args.length === 0) {
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

async function generateCommitMessage(diff: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelId = process.env.OPENROUTER_MODEL_ID || "z-ai/glm-4.5-air:free";
    if (!apiKey || !modelId) {
        throw new Error(
            "OPENROUTER_API_KEY and OPENROUTER_MODEL_ID environment variables are required."
        );
    }

    const openrouter = createOpenRouter({
        apiKey,
    });

    const prompt = `Generate a concise, imperative-style Git commit message (under 72 characters for the subject) based on the following staged changes diff. Do not include any additional information, such as file names or file paths. If the diff is empty, return "No changes". Focus on what changed and why, without unnecessary details:\n\n${diff}`;
    const system = `You are a helpful Git assistant. Always respond with just the commit message, no explanations.`;

    const { text } = await generateText({
        model: openrouter.chat(modelId),
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

    return text.trim();
}

async function generateCommit(): Promise<void> {
    try {
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

        const message = await generateCommitMessage(diff);
        console.log(chalk.cyan("\nSuggested commit message:\n"));
        console.log(chalk.green(message));
        console.log(
            chalk.gray(
                '\nUse it with: git commit -m "' +
                    message.replace(/"/g, '\\"') +
                    '"'
            )
        );

        if (autoAdded) {
            console.log(
                chalk.yellow(
                    "\nNote: All files were automatically staged for this commit."
                )
            );
        }
    } catch (error: any) {
        console.error(chalk.red("Error:", error.message));
        process.exit(1);
    }
}
