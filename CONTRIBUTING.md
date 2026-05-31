# Contributing to HELIOS

Thank you for your interest in contributing to HELIOS!

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker (optional, for local stack)

### Getting Started

```bash
git clone https://github.com/vignesh2027/helios-cloud
cd helios-cloud
pnpm install
pnpm build
pnpm test
```

### Project Structure

| Package | Description |
|---------|-------------|
| `packages/core` | Resource graph, state, events, config schemas |
| `packages/providers/aws` | AWS SDK v3 provider adapters |
| `packages/optimizer` | Cost analysis and rightsizing engine |
| `packages/drift` | Infrastructure drift detection |
| `packages/api` | Fastify REST API server |
| `packages/cli` | Commander.js CLI |
| `packages/sdk` | Public TypeScript SDK |
| `packages/dashboard` | Next.js web dashboard |

### Development Workflow

```bash
# Build a specific package
pnpm --filter @helios-cloud/core build

# Run tests for a package
pnpm --filter @helios-cloud/optimizer test

# Watch mode for development
pnpm --filter @helios-cloud/api dev

# Run the full stack locally
docker compose up -d
```

### Coding Standards

- TypeScript strict mode — no `any`, no implicit returns
- Prefer `exactOptionalPropertyTypes` — don't assign `undefined` to optional fields
- Tests required for new features (vitest)
- No comments unless the WHY is non-obvious
- Keep functions small (< 50 lines ideally)

### Commit Convention

```
feat(package): short description

- Bullet points of what changed
- Why it changed
```

Types: `feat`, `fix`, `perf`, `refactor`, `test`, `ci`, `docs`, `chore`

### Testing

```bash
pnpm test                    # All packages
pnpm --filter @helios-cloud/core test --coverage
```

Coverage targets: 80% minimum for `packages/core`, `packages/optimizer`, `packages/drift`.

### Pull Requests

1. Fork the repo and create a feature branch
2. Write tests for new functionality
3. Ensure `pnpm lint && pnpm typecheck && pnpm test` pass
4. Open a PR with the PR template filled out

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
