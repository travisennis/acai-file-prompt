# Agent Guidelines for acai-file-prompt

## Build & Test Commands
- `npm run build` - Compile TypeScript and prepare distribution
- `npm run compile` - Clean build TypeScript to dist/
- `npm test` - Run tests (uses Node.js built-in test runner)
- `npm run format` - Format code with Biome (auto-fix imports/formatting)
- `npm run lint:fix` - Fix linting issues with Biome

## Code Style
- **Formatting**: 2 spaces, 80 char lines, double quotes, trailing commas everywhere
- **Imports**: Use Node.js built-in imports (`node:fs/promises`), organize imports automatically
- **Types**: Strict TypeScript - explicit types, no any, handle undefined/null cases
- **Naming**: camelCase variables/functions, PascalCase types, SCREAMING_SNAKE_CASE constants
- **Files**: Use `.ts` extension, ES modules only (`import/export`)
- **Error Handling**: Use explicit error types, handle all Promise rejections

## Architecture
- CLI tool using Node.js built-ins and minimal dependencies
- Single source file pattern, strict TypeScript configuration
- Use Biome for all formatting/linting (not ESLint/Prettier)
- Modern ES module syntax throughout, target ESNext