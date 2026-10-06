# Change Guide

The detailed beginner-safe change recipes are:

[`docs/17-CHANGE-GUIDE.md`](docs/17-CHANGE-GUIDE.md)

After every meaningful change, run:

```bash
npm run typecheck
npm test
npm run build
```

Database entity changes also require a reviewed TypeORM migration.
