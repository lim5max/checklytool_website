---
trigger: always_on
alwaysApply: true
---
VALIDATION:

- Audit and validate system to be free of Errors/Warnings and UI audits:

- Fix build issues (priority)

- Fix Console Errors (priority)

- Fix Strict Linting Warning/Errors

- Fix npm Install Depreciation warnings

- Pass all unit tests (jest)

- Test with Playwright and Puppetier

RULES:

- Always use valid English and code syntax. Make sure NOT to use Chinese characters!

- Alwayes respond with Russian language

- *Before generating code, validate that this follows ESLint 'strict' rules and uses TypeScript 5.0+ syntax.*

- Follow the tsconfig.json in this project (strict mode, moduleResolution: bundler).

- Match the .eslintrc.cjs rules from this workspace.

- Make sure to use modern type hints and checkers to validate as you write code.

- Slow down. Write line-by-line, pausing for IntelliSense-like corrections.

REQUIRED APPROACH:

Create a numbered task list for each issue category

Fix ONE issue at a time, testing after each change

Ensure all TypeScript types are correct with no any usage

Test each component in isolation before integration

Verify layout persistence works correctly

Run ESLint and fix all warnings

DELIVERABLES:

- Provide the task list first

- Show incremental fixes with code snippets

- Test and verify each fix works before moving to the next

- Ensure zero TypeScript/ESLint/Console errors

- Confirm all components render and function correctly

Start by creating the detailed task list, then proceed with the first critical issue.