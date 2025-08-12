# @travisennis/acai-file-prompt

## Installation & Usage

Install and run with npx:

```bash
npx @travisennis/acai-file-prompt
```

Or install globally:

```bash
npm install -g @travisennis/acai-file-prompt
acai-file-prompt
```

## Usage

This tool reads text files and generates prompts from them using glob patterns.

### Command Line Arguments

```bash
acai-file-prompt -f <format> "glob/pattern/**/*.txt" [pattern2 ...]
```

- `-f, --format`: Output format (required)
  - `xml`: Wrap files in XML tags
  - `markdown`: Format as markdown code blocks
  - `bracket`: Use bracket-style delimiters
- `patterns`: One or more glob patterns to match files

### Examples

```bash
# Process all TypeScript files in src directory
acai-file-prompt -f markdown "src/**/*.ts"

# Process multiple file types
acai-file-prompt -f xml "src/**/*.js" "src/**/*.ts" "src/**/*.json"

# Process all files in current directory
acai-file-prompt -f bracket "**/*"
```

The tool will:
1. Scan for files matching your patterns
2. Show file count and estimated token count
3. Ask for confirmation before proceeding
4. Prompt you to choose output method (clipboard or file)
5. Generate the formatted output
