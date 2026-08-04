# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm start          # ng serve --proxy-config proxy.conf.json --host=127.0.0.1  → http://127.0.0.1:4200
npm run build      # production build → dist/updatetool
npm run watch      # development build, non-optimized, source maps
npm test           # Karma + Jasmine in Chrome (autoWatch, does not exit)

npx ng test --include="src/app/path/to/your.component.spec.ts"   # single spec
npx ng test --watch=false --browsers=ChromeHeadless              # one-shot / CI
```

`npm start` proxies `/UTool/*` → `http://localhost:64813` (`proxy.conf.json`), the local .NET API. Without that
backend running, the app stalls at the comms-check dialog during startup.

There is no lint script. Static analysis is JetBrains Qodana (`qodana.yaml`), run in CI/Docker, not via npm.
`tsconfig.json` is `strict` with `strictTemplates` — much existing code sidesteps this with `any`, `!`,
and a couple of `@ts-ignore`s (`app.module.ts:111`, `app.component.ts:116`).

Angular 15 / TypeScript 4.9, NgModule-based (no standalone components), single `AppModule`, no routes.

## Architecture

This is a SQL query-builder UI for MobCop/DAMPS SQL Server databases: the user picks a server + database,
picks a table, builds SELECT/WHERE/JOIN/ORDER BY through dialogs, and can edit returned cells in place.

### The three global singletons

Almost every component depends on these three services rather than on `@Input`/`@Output` chains:

- **`StorageService`** (`services/storage.service.ts`) — the app's global mutable state: `system` (config,
  server/database lists), `user` (identity, saved queries, stored column preferences), `tabsArr`,
  `selectedTab`/`selectedTabID`, plus shared constants (`operators`, `dbNumericals`, `maximumRowReturnCnt = 1000`)
  and string/array helpers used app-wide. It also holds the hardcoded `_passKey`/`_devKey` sent to the API and
  `_appVersion`.
- **`CommService`** (`services/comm.service.ts`) — a bus of ~30 bare `EventEmitter`s (`tableSelected`,
  `runQueryChange`, `columnBtnClicked`, `validatePrimKey`, …). This is the primary control flow. When adding a
  cross-component interaction, add an emitter here rather than wiring inputs.
- **`DataService`** (`services/data.service.ts`) — every API call. Each method POSTs a body containing
  `apikey` (`store.getPassKey()`) + `skey` (the user's session key) to `` `${this.getWSPath()}/<Endpoint>` ``.
  `getWSPath()` composes the base URL from `system.webservice` (`path` + `sapi` + `webcontrol`), so in dev it
  resolves to the proxied `/UTool`. `errorHandler` `alert()`s and rethrows; there is no central retry.

### Tab lifecycle — the guard you must not forget

`TabsComponent` owns a `Tab[]`; each tab renders its own `TabComponent` + `QueryResultComponent` instances, and
**all** of them subscribe to the same global `CommService` emitters. Every subscriber therefore guards with:

```ts
if (this.tabinfo === this.store.selectedTab) { ... }
```

Omitting this guard is the source of the "wrong tab updated" class of bugs that several commits in the history fix.
`Tab` (`models/Tab.model.ts`) is the per-tab state container — selected table, `colfilterarr`, `wherearrcomp`,
`joinarr`, `orderarr`, temp primary keys, stored-query fields, stored-proc fields, cached `sqlResults`.

### Query construction (`components/query-result/query-result.component.ts`, ~940 lines)

The core of the app. `constructSQLString()` builds **two strings in parallel** from the same `Tab` state:

- `tabinfo.rawquerystr` — real T-SQL, shown formatted via `applyHTMLFormat()`.
- `tabinfo.querystr` — a plain-English "sentence format" version (`constructWhereClauseSentence()`,
  `constructJoinSentence()`, …). Which one is displayed depends on the first character of `user.appdata`.

Any change to SQL generation must be mirrored in both, or the display and the executed query diverge.

`executeSQL()` does **not** send the SQL string. It sends the clauses as fragments to `GetQueryData`, and the API
reassembles them. Two encoding contracts must match the API exactly:

- Operators go over the wire as `{index}` placeholders — the index into `StorageService.operators`
  (see `constructWhereClause(false)`). Reordering that array silently changes query semantics.
- `%` is escaped to `{14}` and other characters are swapped by `store.customURLEncoder`/`customURLDecoder`
  (`'` → `^`, `\` → `` ` ``, `>` → `gt`, …). Stored queries are persisted encoded and decoded on load.

Results over `maximumRowReturnCnt` (1000) are truncated for the ag-Grid display with a toast; the true count is
kept in `totalRecCount`.

### In-place cell editing and primary keys

Clicking a grid cell opens `UpdaterDialogComponent` and issues an `UpdateRowInfo` `SET … WHERE …`. That requires a
unique row identifier, so tables without a real primary key make the user pick a **temporary primary key** through
`PrimkeyDialogComponent`; the selection is persisted per user/table/database via `UpdateUserColumnSelection`
(`rtype: "P"`, vs `"C"` for saved custom column sets) and reloaded by `preloadUserSelectedColumns()`. Multi-column
temp keys are supported and each adds an `AND` to the update's WHERE clause.

### Configuration and startup

`ConfigService` reads two XML files with **synchronous `XMLHttpRequest`** at startup:

- `src/assets/config/config.xml` — the active `<system>` element decides `type` (`development`/production),
  `network` (`nipr`/`sipr`), API `path`/`sapi`/`webcontrol`. Flipping `active="true"` between rows is how the
  environment is switched; `type == "development"` is what sets dev mode.
- `src/assets/config/serverconfig.xml` — the server and database lists. `<database altname>` maps a display id to
  the real DB name (`store.getSelectedDBName`). A SIPR variant of this file is kept commented out in place.

`src/environments/environment*.ts` are effectively unused — the XML is the real config mechanism.

Server ids are templates: `offName="{0}"` and `user.server = '{0}'`, resolved per call with
`server.replace('{0}', database)`.

`AppComponent.ngOnInit` sequences startup with a 300 ms `setInterval` poll until system/server/build config are all
loaded, then: comms-check dialog → `userAuthenticate()` → SIPR bridge token or NIPR `key` query param (or
`getLocalToken("sean.mcgill")` in dev) → `validateUserToken` → `getBearerToken` → `getUserInfo` →
`comm.userInfoLoaded.emit()`, which is what makes `TabsComponent` open the first tab. A page refresh invalidates
the entry key — the app is meant to be launched from DAMPS-Orders with `?key=`.

Note: `AuthInterceptorService` exists and would append the bearer token as a query param on POSTs, but it is only
listed in `providers` — it is **not** registered under the `HTTP_INTERCEPTORS` multi-token, so it never runs.
(WARP.md claims otherwise.) Verify before relying on, or "fixing", token transport.

### Conlog

`modules/conlog` is a self-contained in-app logging console. Services log through `ConlogService` instead of
`console.log`; **Ctrl+Y** opens the log dialog and **Ctrl+I** an API-check dialog, in production too. Prefer
`conlog.log()` over `console.log()` in new code, and `store.generateToast()` for non-fatal user-facing messages.

## Conventions

- Version lives in `StorageService._appVersion` (`'2.24.0822 (Doc: 1.7)'`, format `major.year.MMDD`) and is what
  the banner and What's New dialog compare against `user.lastversion`. `package.json`'s `version` is stale and
  unused — bump `_appVersion` and add a matching entry to `src/assets/whatsnew.json` (`BuildDate`,
  `BuildVersion`, `BuildChanges`), which is fetched at runtime as a local asset.
- Commit messages follow `YYMMDD:` followed by a `-`-prefixed change list, mirroring the whatsnew entry.
- Historic changes are annotated inline with `// headleyt: YYYYMMDD` / `// sam: YYYYMMDD` comments; existing code
  is left in place and commented out rather than deleted.
- Only one spec file exists (`app.component.spec.ts`); the project is not test-driven in practice.
- `src/assets/common.js` patches `String.prototype.replaceAt` and is relied on by string manipulation code.

`WARP.md` covers similar ground for the Warp agent; it is broadly accurate on layout and startup flow but predates
some details (see the interceptor note above).
