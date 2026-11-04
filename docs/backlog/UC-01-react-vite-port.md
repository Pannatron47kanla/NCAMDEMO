# UC-01 backlog

**Summary:** UC-01 Port the NCAM MVP mockup to React + Vite
**Epic:** NCAM MVP demo · **Component:** registry, circulation, maintenance, audit, disposal (proposed) · **Story points:** ?

As a stakeholder of the NCAM asset system,
I want the MVP mockup running as a React + Vite app on Vercel,
so that I can open and try it from a link, and the team has a maintainable base for later work.

Business rules and full acceptance criteria: `docs/usecases/UC-01-react-vite-port.md`. That file is the single source for AC text.

## Setup

- Setup: scaffold React, Vite, TypeScript, Vitest, ESLint boundaries, and CI
- Setup: replace the example context map with NCAM contexts, after approval

## Sub-tasks

There are no `Spec: openapi`, `DB:`, `Infra:` repository, or `HTTP:` tasks, because the story adds no endpoint or table.

| Sub-task | ACs |
|---|---|
| Spec: write use case and ACs | All |
| Review: review use case and context map | All |
| Seed: port the mockup seed, clock, and Thai date helpers | AC4, AC30 |
| Domain: shell, tokens, fonts, login, navigation, and Vercel build | AC1, AC2, AC3, AC4, AC5 |
| Domain: borrowing rules and counter screen | AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13, AC14 |
| Domain: returning, fines, loss, and payment | AC15, AC16, AC17, AC18, AC19, AC20 |
| Domain: repair tickets and screen | AC21, AC22, AC23 |
| Domain: asset register, detail, and add-asset wizard | AC24, AC25, AC30, AC39 |
| Domain: import and room scan | AC26, AC27, AC28, AC29 |
| Domain: audit rounds and screen | AC31, AC32 |
| Domain: disposal cases and screen | AC33, AC34, AC35, AC36, AC37, AC38 |
| App: dashboard, reports, and settings | AC43, AC44 |
| App: calendar and map | AC40, AC41 |
| App: printable documents | AC42 |
| E2E: borrow, return, repair, and dispose flow on the production build | AC1, AC13, AC19, AC23, AC38 |

## Proposed slices, if the story is split

Each slice can be demonstrated alone. The shell comes first, and the rest can follow in any order.

| Story | Delivers | ACs |
|---|---|---|
| UC-01a | Shell, seed, login, and Vercel deploy | AC1–AC5 |
| UC-01b | Borrow and return counter | AC6–AC20 |
| UC-01c | Repair | AC21–AC23 |
| UC-01d | Register, import, and room scan | AC24–AC30, AC39 |
| UC-01e | Audit and disposal | AC31–AC38 |
| UC-01f | Dashboard, reports, settings, calendar, map, and documents | AC40–AC44 |

## Definition of Ready

| Check | Status |
|---|---|
| ACs include failure cases | ✅ |
| Numbers in rules are clear | ✅ |
| Out of scope is listed | ✅ |
| Component is set | ❌ Waiting for context approval |
| Story points are set | ❌ Not provided |
| No open questions | ❌ 3 open in the use case |

## References

- `docs/usecases/UC-01-react-vite-port.md`
- `Mockup MVP NCAM_1.html` (source of behavior)
