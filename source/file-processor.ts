#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import clipboard from "clipboardy";
import { globby } from "globby";
import { encoding_for_model } from "tiktoken";

const encoding = encoding_for_model("gpt-4");

// List of text-based file extensions
const TEXT_FILE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".yml",
  ".yaml",
  ".xml",
  ".html",
  ".css",
  ".scss",
  ".less",
  ".sh",
  ".bash",
  ".conf",
  ".cfg",
  ".ini",
  ".log",
  ".csv",
  ".java",
  ".py",
  ".pyw",
  ".rs",
  ".go",
  ".mod",
  ".sum",
  ".gradle",
  ".properties",
  ".toml",
  ".env",
]);

type FormatType = "xml" | "markdown" | "bracket";

interface FileInfo {
  path: string;
  content: string;
  tokenCount: number;
}

function countTokens(text: string): number {
  return encoding.encode(text).length;
}

function isTextFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return TEXT_FILE_EXTENSIONS.has(ext);
}

function formatOutput(
  file: string,
  content: string,
  format: FormatType,
): string {
  switch (format) {
    case "xml":
      return `<file>\n<name>${file}</name>\n<content>${content}</content>\n</file>`;
    case "markdown":
      return `# File: ${file}\n\`\`\`\n${content}\n\`\`\``;
    case "bracket":
      return `[file name]: ${file}\n[file content begin]\n${content}\n[file content end]`;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function scanFiles(patterns: string[]): Promise<FileInfo[]> {
  const files = await globby(patterns, { gitignore: true });
  const fileInfos: FileInfo[] = [];

  for (const file of files) {
    if (isTextFile(file)) {
      const content = await readFile(file, "utf-8");
      const tokenCount = countTokens(content);
      fileInfos.push({ path: file, content, tokenCount });
    }
  }

  return fileInfos;
}

async function getUserConfirmation(
  fileCount: number,
  totalTokens: number,
  fileInfos: FileInfo[],
  largeFileThreshold: number,
): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  console.log(
    `\nFound ${fileCount} files with approximately ${totalTokens} tokens.`,
  );
  console.log(`This is roughly ${Math.round(totalTokens / 1000)}K tokens.`);

  const largeFiles = fileInfos.filter(
    (file) => file.tokenCount > largeFileThreshold,
  );
  if (largeFiles.length > 0) {
    console.log(`\nFiles exceeding ${largeFileThreshold} tokens:`);
    largeFiles.forEach((file) => {
      console.log(`  - ${file.path}: ${file.tokenCount} tokens`);
    });
  }
  console.log("");

  const answer = await rl.question("Do you want to proceed? (y/n): ");
  rl.close();

  return answer.toLowerCase().startsWith("y");
}

async function getOutputChoice(): Promise<
  { type: "clipboard" } | { type: "file"; filename: string }
> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  console.log("\nChoose output method:");
  console.log("1. Copy to clipboard");
  console.log("2. Save to file");

  const choice = await rl.question("Enter choice (1 or 2): ");

  if (choice === "1") {
    rl.close();
    return { type: "clipboard" };
  } else {
    const filename = await rl.question("Enter filename: ");
    rl.close();
    return { type: "file", filename };
  }
}

async function outputToClipboard(content: string) {
  await clipboard.write(content);
  console.log("✓ Content copied to clipboard");
}

async function outputToFile(content: string, filename: string) {
  await writeFile(filename, content, "utf-8");
  console.log(`✓ Content saved to ${filename}`);
}

export async function main() {
  const { values, positionals } = parseArgs({
    options: {
      format: {
        type: "string",
        short: "f",
      },
      "large-file-threshold": {
        type: "string",
        short: "t",
      },
    },
    allowPositionals: true,
  });

  const format = values.format as FormatType;
  if (!format || !["xml", "markdown", "bracket"].includes(format)) {
    console.error("Invalid format. Supported formats: xml, markdown, bracket");
    process.exit(1);
  }

  const largeFileThreshold = values["large-file-threshold"]
    ? parseInt(values["large-file-threshold"], 10)
    : 5000;

  if (isNaN(largeFileThreshold) || largeFileThreshold <= 0) {
    console.error("Invalid large file threshold. Must be a positive number.");
    process.exit(1);
  }

  const patterns = positionals;
  if (patterns.length === 0) {
    console.error("Please provide at least one glob pattern");
    console.error(
      'Usage: fileprompt -f <format> "glob/pattern/**/*.txt" [pattern2 ...]',
    );
    process.exit(1);
  }

  try {
    // Step 1: Scan files and get token count
    const fileInfos = await scanFiles(patterns);

    if (fileInfos.length === 0) {
      console.warn("No files found matching the provided patterns");
      return;
    }

    const totalTokens = fileInfos.reduce(
      (sum, file) => sum + file.tokenCount,
      0,
    );

    // Step 2: Get user confirmation
    const confirmed = await getUserConfirmation(
      fileInfos.length,
      totalTokens,
      fileInfos,
      largeFileThreshold,
    );
    if (!confirmed) {
      console.log("Operation cancelled by user");
      return;
    }

    // Step 3: Generate formatted output
    const formattedContent = fileInfos
      .map((file) => formatOutput(file.path, file.content, format))
      .join("\n\n");

    // Step 4: Get output choice and execute
    const outputChoice = await getOutputChoice();

    if (outputChoice.type === "clipboard") {
      await outputToClipboard(formattedContent);
    } else {
      await outputToFile(formattedContent, outputChoice.filename);
    }
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
