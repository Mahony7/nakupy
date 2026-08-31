---
name: OpenAPI integer compatibility
description: OpenAPI integer schemas can generate zod.int(), which is unavailable in the workspace's Zod version.
---

When adding OpenAPI fields or path parameters, prefer `type: number` unless integer-specific validation is essential; the current code generator can emit `zod.int()` for `type: integer`, while the installed Zod version does not expose that API.

**Why:** Code generation succeeds, but the subsequent shared-library typecheck fails when generated Zod code references `zod.int()`.

**How to apply:** After every OpenAPI change, run codegen and the shared typecheck before implementing routes.