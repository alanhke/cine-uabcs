# Admin Dashboard Responsive Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make admin modules accessible near the top of the dashboard on mobile and persistently available on desktop.

**Architecture:** Extract the module links into a focused `AdminDashboardNavigation` component. The component renders a sticky desktop sidebar from `lg` upward and a mobile/tablet quick-access grid below `lg`; the dashboard page supplies no navigation state and keeps its analytics behavior unchanged.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, Lucide React, Vitest, Testing Library

---

### Task 1: Responsive Admin Dashboard Navigation

**Files:**
- Create: `src/components/admin/admin-dashboard-navigation.tsx`
- Create: `src/components/admin/admin-dashboard-navigation.test.tsx`
- Modify: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Write the failing component test**

Render `AdminDashboardNavigation` and assert that it exposes a navigation landmark, a current Panel link, the five operational routes in desktop and mobile presentations, and responsive visibility classes.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/components/admin/admin-dashboard-navigation.test.tsx`

Expected: FAIL because `AdminDashboardNavigation` does not exist.

- [ ] **Step 3: Implement the navigation component**

Create a shared link definition, render a sticky `lg` desktop sidebar with Panel active, and render a `lg:hidden` quick-access grid containing the five operational modules.

- [ ] **Step 4: Integrate the component into the dashboard**

Wrap the dashboard in a responsive two-column layout, place the navigation beside the main content, render mobile quick access after the tabs, remove the old bottom grid, and increase the desktop content width.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
npm test -- src/components/admin/admin-dashboard-navigation.test.tsx
npm test
```

Expected: PASS.

- [ ] **Step 6: Verify production build**

Run `npm run build` with `DATABASE_URL` available in the shell.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/plans/2026-06-03-admin-dashboard-responsive-navigation.md src/components/admin/admin-dashboard-navigation.tsx src/components/admin/admin-dashboard-navigation.test.tsx src/app/admin/dashboard/page.tsx
git commit -m "feat: mejorar navegación del dashboard admin"
```
