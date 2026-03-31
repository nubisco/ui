# Contributing

Thanks for contributing to `@nubisco/ui`.

## Local Setup

```bash
git clone https://github.com/nubisco/ui.git
cd ui
pnpm install
```

## Development Commands

```bash
pnpm run lint
pnpm run format:check
pnpm test
pnpm run build
pnpm run docs:build
```

Notes:

- Minimum supported Node.js version is `20`
- Vue compatibility is `^3.5.0`

## Contributor License Agreement (CLA)

To keep Nubisco UI sustainable and legally consistent, all contributions are made under the Individual CLA:

- See `docs/CLA-INDIVIDUAL.md`
- You retain ownership of your work
- You grant Nubisco rights to use, distribute, and relicense contributions, including for commercial distributions

By opening a pull request, you must explicitly confirm you agree to the CLA in the pull request template.

## Branch and PR Expectations

- Create focused branches (one concern per PR)
- Keep pull requests small and reviewable
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`)
- Run lint, test, and build before opening a PR
- Confirm CLA agreement in the PR checklist

## Contribution Workflow

1. Fork and branch from `main`.
2. Implement focused changes and keep commits clear.
3. Run `pnpm run lint`, `pnpm test`, and `pnpm run build`.
4. Update docs/tests when behavior or APIs change.
5. Open a pull request and complete the template, including explicit CLA confirmation.
6. Address review feedback and keep scope limited to the original intent.

## Adding a New Component

1. Create `src/components/{Name}.vue` with props typed via TypeScript interfaces.
2. Export a default from the file and add a named re-export in `src/index.ts`.
3. Add the component to the supported components table in `README.md`.
4. Write tests in `tests/{Name}.test.ts`.
5. Document the component and its props in `docs/`.

## Coding Style

- Vue 3 component library with TypeScript strict mode
- 2-space indentation, LF line endings, no semicolons, single quotes
- Keep component APIs minimal and consistent with existing patterns

## Issue Routing

- Use **Bug report** for regressions and reproducible defects
- Use **Component request** for new components or missing functionality
- Include a minimal reproduction case in all bug reports

## Keep Changes Focused

- Avoid unrelated refactors in the same PR
- Update docs when component APIs, styles, or composables change
- Add or update tests for non-trivial logic changes
