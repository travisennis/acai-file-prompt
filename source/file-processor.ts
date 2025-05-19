#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { globby } from "globby";

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
    const files = await globby(patterns, {
      gitignore: true,
    });

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

export async function main() {
  const { values, positionals } = parseArgs({
    options: {
      format: {
        type: "string",
        short: "f",
      },
    },
    allowPositionals: true,
  });

  const format = values.format;
  if (!(format && ["xml", "markdown", "bracket"].includes(format))) {
    console.error("Invalid format. Supported formats: xml, markdown, bracket");
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

  processFiles(patterns, format as FormatType).catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
