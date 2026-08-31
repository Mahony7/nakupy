# Spolu — domáci rozpočet

Webová aplikácia pre dvojicu na zapisovanie spoločných nákupov a automatické mesačné vyrovnanie.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/shared-expenses/src/App.tsx` — hlavná obrazovka, formuláre a interakcie
- `artifacts/shared-expenses/src/index.css` — vizuálny štýl aplikácie
- `lib/api-spec/openapi.yaml` — zdroj pravdy pre API rozhranie
- `artifacts/api-server/src/routes/expenses.ts` — API pre výdavky a mesačné vyrovnanie
- `lib/db/src/schema/expenses.ts` — databázová tabuľka výdavkov

## Architecture decisions

- Výdavok patrí vždy jednej z dvoch osôb: používateľovi alebo manželke.
- Mesačné vyrovnanie sa počíta ako rozdiel medzi skutočne zaplatenou sumou a polovicou mesačných výdavkov.
- Dátum nákupu sa ukladá ako kalendárny dátum bez časového posunu.
- Zoznam výdavkov aj súhrn sa filtrujú podľa vybraného mesiaca.

## Product

- Pridávanie výdavku so sumou, platiteľom, dátumom a poznámkou
- Úprava a odstránenie existujúceho výdavku
- Filtrovanie výdavkov podľa platiteľa
- Prehľad mesačnej sumy, polovice pre každého a dlžnej sumy
- Responzívne rozhranie použiteľné na mobile aj počítači

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Po zmene `lib/api-spec/openapi.yaml` treba spustiť `pnpm --filter @workspace/api-spec run codegen`.
- Po zmenách databázovej schémy treba spustiť `pnpm --filter @workspace/db run push`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
