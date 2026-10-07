# Code Map

The detailed code and import catalogue is:

[`docs/16-CODE-MAP-AND-IMPORT-CATALOG.md`](docs/16-CODE-MAP-AND-IMPORT-CATALOG.md)

Fast request path:

```text
src/server.ts
-> src/app.ts
-> src/routes/v1.ts
-> src/modules/<feature>/<feature>.routes.ts
-> <feature>.controller.ts
-> <feature>.schema.ts + <feature>.service.ts
-> TypeORM entity/repository
-> MySQL
```

Current feature routers are registered in `src/routes/v1.ts`.
