---
name: modular-ui-authoring
description: Use when writing new UI in the Vite + React app. Modular from the first commit: typed hooks, types and constants files, components under 80 lines.
type: prompt
whenToUse: When creating or adding a component, screen, or view in src/, or when a component file is growing past 80 lines.
---

# Modular UI authoring

The app is Vite + React + TypeScript, one page, two regions: a feed and a composer. Small surface, so the structure has to carry it, not volume of code.

## Before writing anything

1. Check `package.json` before importing anything. Do not assume a library exists, and prefer what is already installed
2. Find the nearest existing pattern and match it: folder naming, export style, tabs, quotes
3. Decide which region the component belongs to. A component that renders both regions is two components

## File structure for anything non-trivial

A component with state, handlers, or more than one visual section is a module:

- `src/components/<feature-name>/` in kebab-case
- `[ComponentName].types.ts` — props interfaces and shared types, exported explicitly
- `[ComponentName].constants.ts` — copy strings, status labels, thresholds, explorer URL builder
- `use[ComponentName].ts` — state, effects, handlers, derived values, contract reads and writes, exporting a typed `UseComponentNameReturn`
- Subcomponents — one per distinct section, each with an explicit props interface
- `components/ComponentName.tsx` — a thin parent wiring hook to subcomponents

## Hard rules

- **Under 80 lines per component file.** Split before crossing, not after
- **No logic in JSX.** Formatting, conditionals beyond a trivial ternary and derived values live in the hook or a named function
- **Strict types.** Explicit interface for every props object and hook return. No `any`
- **Every async surface has loading, empty and error states**, and the empty state is designed, because with no wallet connected it is the first thing anyone sees
- **Money formatting is one function.** Amounts are 6-decimal USDC through the ERC-20 interface. Format to two decimals for display, full precision when constructing a write, and never reimplement that conversion inline
- **No string-concatenated classes.** Use `cn()` if present, semantic class names otherwise
- **Accessibility from the start**: labelled buttons, visible focus, 44px targets

## Definition of done

1. Every UI file under 80 lines, logic in hooks, types and constants in their own files
2. `npx tsc --noEmit` clean, `npm run build` produces output
3. The room screen renders with no wallet connected, as a designed state
4. An executed payout card shows amount, payee and a working explorer link
