#!/usr/bin/env node

import { globby } from "globby";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

// List of text-based file extensions
const TEXT_FILE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".js",
  ".ts",
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
]);

type FormatType = "xml" | "markdown" | "bracket";

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

async function processFiles(
  patterns: string[],
  format: FormatType,
): Promise<void> {
  try {
    // Get all files matching the glob patterns
    const files = await globby(patterns);

    if (files.length === 0) {
      console.warn("No files found matching the provided patterns");
      return;
    }

    for (const file of files) {
      try {
        // Check if it's a text file
        if (isTextFile(file)) {
          // Read file content
          const content = await readFile(file, "utf-8");

          // Output in the specified format
          console.info(formatOutput(file, content, format));
          console.info(); // Empty line between files
        }
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
      }
    }
  } catch (err) {
    console.error("Error processing glob patterns:", err);
    process.exit(1);
  }
}

function parseArgs(): { format: FormatType; patterns: string[] } {
  const args = process.argv.slice(2);
  let format: FormatType = "bracket"; // default format
  const patterns: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-f" || args[i] === "--format") {
      i++;
      const formatArg = args[i]?.toLowerCase();
      if (!(formatArg && ["xml", "markdown", "bracket"].includes(formatArg))) {
        console.error(
          "Invalid format. Supported formats: xml, markdown, bracket",
        );
        process.exit(1);
      }
      format = formatArg as FormatType;
    } else {
      const arg = args[i];
      if (arg) {
        patterns.push(arg);
      }
    }
  }

  if (patterns.length === 0) {
    console.error("Please provide at least one glob pattern");
    console.error(
      'Usage: node file-processor.ts -f <format> "glob/pattern/**/*.txt" [pattern2 ...]',
    );
    process.exit(1);
  }

  return { format, patterns };
}

// Parse command line arguments and run the processor
const { format, patterns } = parseArgs();
processFiles(patterns, format).catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
