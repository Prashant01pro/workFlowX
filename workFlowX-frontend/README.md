# WorkFlowX

WorkFlowX is a responsive workspace interface for bringing projects, tasks, notes, and personal finances together. The repository contains a Next.js frontend prototype: the public landing page and application screens are implemented, while authentication and persistent workspace data are not connected to a backend yet.

The app is designed to show a calm, focused workspace with a warm neutral palette, charcoal surfaces, and orange accents. It includes desktop and mobile layouts, navigation, forms, empty states, and error recovery screens. Pages that need account or finance data intentionally explain when that data is unavailable rather than presenting placeholder values as real records.

> **Current implementation status:** this is a frontend project. There is no API server, database, authentication provider, or environment-variable configuration in this repository. Creating an account, signing in, password recovery, and saving most workspace records are not operational yet.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Running the app](#running-the-app)
- [Available routes](#available-routes)
- [How data works today](#how-data-works-today)
- [Project structure](#project-structure)
- [Styling and UI conventions](#styling-and-ui-conventions)
- [Configuration notes](#configuration-notes)
- [Build and deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Future integration points](#future-integration-points)

## Features

### Public landing page

- Responsive navigation with a mobile menu.
- Product overview and feature sections for projects, tasks, notes, and finances.
- Static dashboard and feature previews built from React components and CSS.
- Links into the account and workspace routes.

### Workspace interface

- Dashboard overview with workspace metrics, projects, tasks, deadlines, notes, and finance sections.
- Projects list with local search and status filtering over the sample entries in the page source.
- Tasks, notes, and finance screens with intentional empty or unavailable-data states.
- New, detail, and edit route layouts for projects, tasks, notes, and transactions.
- Accessible form labels, validation messages, focus styles, and responsive navigation patterns.

### Account and recovery screens

- Sign-in and account registration forms with client-side input checks.
- Forgot-password and reset-password screens with client-side validation.
- Dedicated unauthorized, forbidden, network, not-found, and generic error pages.

## Technology

- **Next.js 16** using the App Router.
- **React 19** and TypeScript.
- **Tailwind CSS 4** through the PostCSS integration, alongside project-specific CSS in `app/globals.css`.
- **Lucide React** for icons.
- **Base UI**, **shadcn**, `class-variance-authority`, `clsx`, and `tailwind-merge` for UI primitives and class composition.
- **Vercel Analytics**, rendered only in production.
- **pnpm 12.3.4**, declared in `package.json` as the project package manager.

The dependency lockfile is `pnpm-lock.yaml`. Use pnpm to install dependencies so the lockfile remains authoritative.

## Requirements

- Node.js. Node.js 22 LTS is a suitable choice for this project.
- pnpm 12.3.4 (the version declared by the project).
- Git, if you are cloning the repository.

Check the installed runtimes:

```sh
node --version
pnpm --version
```

## Getting started

### 1. Get the source

If you already have this folder, open a terminal in the project root. Otherwise, clone the repository and enter its directory:

```sh
git clone <repository-url>
cd <repository-directory>
```

### 2. Install pnpm

The project requests pnpm 12.3.4. On Windows, one straightforward option is a global npm install:

```powershell
npm install --global pnpm@12.3.4
```

Close and reopen PowerShell so it reloads the command path, then confirm the version:

```powershell
pnpm --version
```

On macOS or Linux, the same npm installation command works when Node.js and npm are installed:

```sh
npm install --global pnpm@12.3.4
```

If you use Corepack to manage package managers, enable it and activate the requested pnpm version:

```sh
corepack enable
corepack prepare pnpm@12.3.4 --activate
```

Then verify with `pnpm --version`. On Windows, if PowerShell says script execution is disabled when invoking `pnpm`, use `pnpm.cmd` in that terminal or configure the PowerShell execution policy for your user. If the command starts but reports that a pnpm executable is “not recognized,” remove or repair the stale pnpm launcher on your `PATH`; reinstalling pnpm with `npm install --global pnpm@12.3.4` usually replaces the npm-installed launcher.

### 3. Install project dependencies

From the project root:

```sh
pnpm install
```

This reads `package.json` and `pnpm-lock.yaml` and creates the local `node_modules` dependencies. It does not create or connect a backend.

## Running the app

Start the development server:

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The development server supports hot reload as source files change. Stop it with `Ctrl+C`.

Create a production build:

```sh
pnpm build
```

Serve the built app locally:

```sh
pnpm start
```

`pnpm start` expects a successful build to exist first. The app does not currently define dedicated lint or test scripts in `package.json`.

## Available routes

| Route | Purpose |
| --- | --- |
| `/` | Public WorkFlowX landing page and product previews. |
| `/login` | Sign-in form with client-side validation. |
| `/register` | Account creation form with client-side validation. |
| `/forgot-password` | Password recovery request form. |
| `/reset-password` | New password form; accepts a `token` or `code` query parameter for UI validation. |
| `/dashboard` | Workspace overview and empty states. |
| `/projects` | Project list, local sample entries, search, and status filters. |
| `/projects/new` | New project form interface. |
| `/projects/[id]` | Project details route. |
| `/projects/[id]/edit` | Project editing route. |
| `/tasks` | Task list interface and disabled data controls while no task service is configured. |
| `/tasks/new` | New task form interface. |
| `/tasks/[id]` | Task details route. |
| `/tasks/[id]/edit` | Task editing route. |
| `/notes` | Notes library interface and empty state. |
| `/notes/new` | New note editor interface. |
| `/notes/[id]` | Note details route. |
| `/notes/[id]/edit` | Note editing route. |
| `/finances` | Finance overview and empty states. |
| `/finances/transactions` | Transaction list interface. |
| `/finances/transactions/new` | Transaction entry form interface. |
| `/finances/transactions/[id]` | Transaction details route. |
| `/finances/transactions/[id]/edit` | Transaction editing route. |
| `/finances/categories` | Finance category interface. |
| `/unauthorized` | 401-style account access screen. |
| `/forbidden` | 403-style access screen. |
| `/network-error` | Network error and retry screen. |

Next.js also uses `app/not-found.tsx` for unmatched routes, `app/error.tsx` for route-level errors, and `app/global-error.tsx` for errors at the root layout boundary.

Some navigation links point to `/settings/profile` and `/settings/security`, but there are no matching route files in this repository yet; those links are placeholders for future settings screens.

## How data works today

This repository currently focuses on the interface. There are no route handlers, API client, database models, migrations, or backend configuration files in the project.

- **Landing page previews** use hard-coded presentation content to illustrate the product.
- **Projects** are represented by two sample entries declared in `app/projects/page.tsx`. Search, counts, and status filters operate only on that in-memory array. They are not loaded from a server or saved across sessions.
- **Dashboard, tasks, notes, and finance summaries** use empty states or unavailable-data notices because a service is not connected.
- **Create and edit forms** are user-interface scaffolding. Where a submit action is present without persistence, the page reports that it could not save the data. Form contents are not stored in a database.
- **Login and registration** validate inputs in the browser, then show a message that the account service is not connected. They do not authenticate users or create accounts.
- **Password recovery** validates the email/password fields in the browser but does not send recovery email or change a password.
- The workspace name and avatar shown in the UI (Alex Morgan / AM) are presentation content, not a signed-in identity.

Do not use this frontend by itself to store private notes, credentials, or financial records. Connect it to an appropriately secured backend before treating it as a functioning personal data application.

## Project structure

```text
.
├── app/                          # App Router pages, layouts, and global styles
│   ├── dashboard/                # Workspace dashboard
│   ├── finances/                 # Finance overview, categories, transactions
│   ├── login/                    # Sign-in screen
│   ├── notes/                    # Notes list, create, detail, edit screens
│   ├── projects/                 # Projects list, create, detail, edit screens
│   ├── tasks/                    # Tasks list, create, detail, edit screens
│   ├── unauthorized/             # Access error route
│   ├── forbidden/                # Permission error route
│   ├── network-error/             # Network recovery route
│   ├── layout.tsx                # Root HTML layout, metadata, analytics
│   ├── globals.css               # Global styles and application design system
│   ├── error.tsx                 # Route-level error boundary
│   ├── global-error.tsx          # Root error boundary
│   └── not-found.tsx             # Not-found screen
├── components/
│   ├── ui/                       # Reusable UI primitives
│   ├── inline-error.tsx          # Inline error presentation
│   └── workflow-error.tsx        # Shared full-page error presentation
├── lib/
│   └── utils.ts                  # Shared class-name helper (`cn`)
├── public/                       # Icons and placeholder image assets
├── components.json               # shadcn/ui project configuration
├── next.config.mjs               # Next.js configuration
├── package.json                  # Scripts and dependency manifest
├── pnpm-lock.yaml                # Locked dependency versions
├── pnpm-workspace.yaml           # pnpm workspace settings
├── postcss.config.mjs            # PostCSS / Tailwind integration
└── tsconfig.json                 # TypeScript and `@/*` import alias settings
```

The app uses Next.js file-system routing: each `page.tsx` under `app/` defines a route, while bracketed directory names such as `[id]` represent dynamic route parameters.

## Styling and UI conventions

- Global styles and the majority of the bespoke interface rules live in `app/globals.css`.
- The CSS establishes shared colors, typography, spacing, layout, responsive breakpoints, and component patterns for the landing page and workspace screens.
- Tailwind CSS 4 is imported through the global stylesheet; shadcn's Tailwind stylesheet is also included.
- The `@/*` TypeScript path alias points to the repository root. For example, `@/components/...` resolves to `components/...`.
- `lib/utils.ts` exports `cn()`, which combines `clsx` inputs and resolves conflicting Tailwind classes with `tailwind-merge`.
- Icons come from `lucide-react`.
- `components.json` configures shadcn with the `base-nova` style, CSS variables, and Lucide icons.

## Configuration notes

No `.env` file is required to run the current UI. No environment variables are read by the app for the present frontend-only behavior.

`next.config.mjs` currently sets:

- `typescript.ignoreBuildErrors: true`, so a production build does not fail on TypeScript errors. This should be reconsidered before production deployment; fix type errors and remove the bypass when the app is hardened.
- `images.unoptimized: true`, so Next.js image optimization is disabled.

The root layout declares the WorkFlowX title/description, light and dark theme icons, Apple icon, and viewport theme colors. Vercel Analytics is included only when `NODE_ENV` is `production`.

## Build and deployment

For a production build and local production server:

```sh
pnpm build
pnpm start
```

The project is structured as a standard Next.js app and can be deployed to a compatible Node.js hosting platform. Vercel is a natural fit for the included analytics package, though analytics availability depends on the deployment setup. Configure the hosting provider to install with pnpm and run the build script.

Before a production release, plan and implement the missing backend integrations, remove the TypeScript build-error bypass after resolving reported errors, and review the forms and navigation for routes that are still placeholders.

## Troubleshooting

### `pnpm` is not recognized

Install the project package manager globally, reopen the terminal, and verify it:

```powershell
npm install --global pnpm@12.3.4
pnpm --version
```

If the output mentions a path under `AppData\Local\pnpm\.tools` and says the executable is not recognized, the shell is finding an incomplete pnpm launcher. Inspect command resolution with:

```powershell
where.exe pnpm
Get-Command pnpm -All
```

Repair or remove the stale launcher that appears first, then reinstall pnpm using npm and start a new PowerShell session. If PowerShell specifically blocks `pnpm.ps1` due to its execution policy, use `pnpm.cmd` or configure the policy for the current user; this policy issue is distinct from a missing pnpm executable.

### Dependency installation fails

- Confirm Node and pnpm are available with `node --version` and `pnpm --version`.
- Confirm you are in the directory containing `package.json` and `pnpm-lock.yaml`.
- Retry `pnpm install` with a working internet connection.
- Keep `pnpm-lock.yaml` checked into source control and avoid mixing package managers in the same checkout.

### A page shows “not connected” or an empty state

That is expected for routes that depend on account, task, note, or finance data. Those screens are present, but this repository does not include the services needed to load or persist those records.

## Future integration points

To turn the prototype into a working application, the next implementation work would include:

1. Choose and configure an authentication provider and define the account/session flow.
2. Add server-side authorization so each user's workspace data is isolated.
3. Define data models and API contracts for projects, tasks, notes, transactions, and categories.
4. Replace the project sample array and unavailable-data placeholders with loading, success, empty, and error states backed by real requests.
5. Connect create/edit/delete actions to validated server operations and report save failures clearly.
6. Configure environment variables and deployment secrets for the selected services.
7. Add automated type checking, linting, and tests; the current `package.json` does not define these scripts.

These are implementation opportunities, not services currently included in this repository.
