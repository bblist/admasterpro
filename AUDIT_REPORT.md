# AdMaster Pro — Comprehensive Codebase Audit

**Date:** Generated from full source review  
**Scope:** All 20 source files in `src/app/` + `src/components/`  
**Categories:** Bugs, Security, UX, Navigation, Code Quality

---

## CRITICAL Severity

### SEC-01: No Authentication — Login Page Bypasses Auth Entirely
**File:** `src/app/login/page.tsx` · **Lines 70–73**  
The "Sign In" button is a `<Link href="/dashboard">`, not a form submission. Clicking it navigates directly to the dashboard with **zero credential validation**. There is no auth state, no session, no token.

```tsx
<Link href="/dashboard" className="...">Sign In</Link>
```

**Impact:** Anyone can access the full dashboard by visiting `/dashboard` directly.

---

### SEC-02: No Route Protection on Dashboard or Admin
**Files:** `src/app/dashboard/layout.tsx`, `src/app/admin/layout.tsx`  
Neither layout checks for authentication. All 13 dashboard routes and 5 admin routes are publicly accessible by URL.

**Impact:** All user data and admin controls are exposed without authentication.

---

### SEC-03: Sign Out Button Does Nothing
**File:** `src/app/dashboard/layout.tsx` · **Line 111–114**  
The "Sign Out" button has no `onClick` handler and no `href`. It is purely decorative.

```tsx
<button className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger transition w-full">
    <LogOut className="w-4 h-4" />
    Sign Out
</button>
```

**Impact:** Users cannot log out, even if auth were implemented.

---

### SEC-04: Google Sign-In Button is Non-Functional
**File:** `src/app/login/page.tsx` · **Lines 24–45**  
The "Sign in with Google" button has no `onClick` handler. It renders a Google logo SVG but does nothing when clicked.

---

### BUG-01: Missing React Fragment Key in `.map()` Loop
**File:** `src/app/admin/users/page.tsx` · **Line 181**  
The fragment `<>` wrapping each user row and its expanded detail row has no `key` prop. React requires the outermost element in `.map()` to have a key.

```tsx
{filtered.map((user) => (
    <>                          {/* ← Missing key */}
        <tr key={user.id}>...</tr>
        {expandedUser === user.id && (
            <tr key={`${user.id}-detail`}>...</tr>
        )}
    </>
))}
```

**Fix:** Change to `<Fragment key={user.id}>` and import `Fragment` from React.

---

### BUG-02: Stale Closure in Chat Voice Recognition
**File:** `src/app/dashboard/chat/page.tsx` · **Line 925**  
The `startListening` callback references `sendMessage` but the dependency array is empty, suppressed with `eslint-disable-line`. This causes the speech recognition to use a stale version of `sendMessage`.

```tsx
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Impact:** Voice-to-text submissions may use outdated state, causing messages to be lost or sent incorrectly.

---

## MEDIUM Severity

### BUG-03: Unsafe Type Assertions on Campaign Data
**File:** `src/app/dashboard/campaigns/page.tsx` · **Lines 256, 268**  
Shopping campaign data uses `(c as any).purchases` and `(c as any).roas`. This bypasses TypeScript's type system and will render `undefined` or `"0 sales"` for non-shopping campaigns without warning.

```tsx
{(c as any).purchases || 0} sales
{(c as any).roas ? `${(c as any).roas}x ROAS` : "—"}
```

**Fix:** Use a discriminated union type for campaign types.

---

### UX-01: ~30+ Buttons With No Click Handlers (Non-Functional UI)

These buttons appear interactive but do nothing when clicked:

| File | Line(s) | Button(s) |
|------|---------|-----------|
| `dashboard/page.tsx` | ~250–270 | "Pause & Save", "Ignore" on money leaks |
| `dashboard/campaigns/page.tsx` | ~240 | `MoreVertical` (⋮) menu per campaign |
| `dashboard/chat/page.tsx` | ~1020 | Paperclip attach button |
| `dashboard/chat/page.tsx` | ~1050 | ThumbsUp / ThumbsDown feedback buttons |
| `dashboard/keywords/page.tsx` | ~280 | "Pause" on loser keywords |
| `dashboard/drafts/page.tsx` | ~450 | "Preview" button |
| `dashboard/drafts/page.tsx` | ~470 | "Edit" button on text ads |
| `dashboard/drafts/page.tsx` | ~480 | "Go Live" button |
| `dashboard/knowledge-base/page.tsx` | ~500 | Upload zone (div, no `<input type="file">`) |
| `dashboard/knowledge-base/page.tsx` | ~560 | "Add" note button |
| `dashboard/knowledge-base/page.tsx` | ~650 | "Add to Knowledge Base" for URLs |
| `dashboard/knowledge-base/page.tsx` | ~700 | "Retrain AI" button |
| `dashboard/knowledge-base/page.tsx` | ~750 | "Preview" / "Download" on asset detail |
| `dashboard/knowledge-base/page.tsx` | ~770 | "Edit" / "Copy" on text detail |
| `dashboard/knowledge-base/page.tsx` | ~900 | "Save Changes" on brand profile |
| `dashboard/shopping/page.tsx` | ~170 | "Sync Products", "Feed Settings" |
| `dashboard/shopping/page.tsx` | ~200 | "Open Shopify" |
| `dashboard/settings/page.tsx` | ~280 | "Save" (fake — shows "Saved!" for 2s, persists nothing) |
| `admin/layout.tsx` | ~135 | Bell notification button |
| `admin/layout.tsx` | ~138 | Settings gear button |
| `admin/users/page.tsx` | ~76 | "Export CSV" button |
| `admin/users/page.tsx` | ~80 | "Invite User" button |
| `admin/users/page.tsx` | ~280 | "View Profile", "Send Email", "Suspend" per user |
| `admin/ai-costs/page.tsx` | ~340 | "Export" button |

---

### UX-02: Footer Links Are Dead
**File:** `src/app/page.tsx` · **Lines 384–386**  
All three footer links point to `"#"`:

```tsx
<a href="#">Privacy</a>
<a href="#">Terms</a>
<a href="#">Support</a>
```

---

### UX-03: Settings Save is Fake
**File:** `src/app/dashboard/settings/page.tsx`  
The `handleSave` function just shows "Saved!" for 2 seconds via `useState`. Nothing is persisted to any backend or storage. All settings reset on page reload.

---

### UX-04: Missing `aria-label` on Icon-Only Buttons

| File | Element |
|------|---------|
| `dashboard/layout.tsx` L133 | Bell notification button |
| `dashboard/layout.tsx` L136 | User avatar (no label, no alt) |
| `dashboard/layout.tsx` L124 | Mobile menu hamburger |
| `admin/layout.tsx` L135 | Bell notification button |
| `admin/layout.tsx` L138 | Settings button |
| `admin/layout.tsx` L122 | Mobile menu hamburger |

These fail WCAG 2.1 accessibility requirements.

---

### UX-05: Onboarding is Fully Simulated
**File:** `src/app/onboarding/page.tsx`  
All four onboarding steps use `setTimeout` delays to fake async operations. No real Google Ads connection, no real knowledge base upload, no real audit. Users complete a visual flow that stores nothing.

---

## LOW Severity

### CODE-01: Unused Imports

| File | Unused Import(s) | Line(s) |
|------|-------------------|---------|
| `dashboard/drafts/page.tsx` | `SlidersHorizontal` | 37 |
| `dashboard/drafts/page.tsx` | `LayoutGrid` | 34 |
| `dashboard/drafts/page.tsx` | `Maximize2` | 31 |
| `dashboard/shopping/page.tsx` | `Link2` | 5 |
| `admin/ai-costs/page.tsx` | `ArrowDownRight` | 8 |
| `admin/ai-costs/page.tsx` | `ChevronDown` | 15 |
| `admin/ai-costs/page.tsx` | `Eye` | 19 |
| `admin/users/page.tsx` | `MoreVertical` | 8 |
| `admin/users/page.tsx` | `Filter` | 6 |
| `admin/analytics/page.tsx` | `BarChart3` | 4 |

---

### CODE-02: Local `Bell` Component Shadows Import Pattern
**File:** `src/app/admin/page.tsx` · **Lines 324–333**  
A local `Bell` SVG component is hand-written at the bottom of the file instead of importing `Bell` from `lucide-react` (which is used everywhere else). This creates an inconsistency and potential confusion.

---

### CODE-03: No TypeScript Strict Mode Issues but No Data Validation
All components render hardcoded demo data directly with no validation, null checks, or error boundaries. If connected to a real API, most components would crash on missing fields.

---

### CODE-04: External Image URLs from Third-Party CDNs
**Files:** `dashboard/chat/page.tsx`, `dashboard/drafts/page.tsx`  
Images are loaded from `api.dicebear.com` and `images.unsplash.com`. These would need to be configured in `next.config.js` under `images.remotePatterns` for `<Image>` optimization, or they'll cause build failures if migrated from `<img>` to `<Image>`.

---

### CODE-05: `LLMModel` Type Declared but Unused
**File:** `src/app/admin/ai-costs/page.tsx` · **Line 24**  
```tsx
type LLMModel = "gpt-4o" | "claude-4.6";
```
This type is never used in the file.

**File:** `src/app/dashboard/drafts/page.tsx` · **Line 48**  
Same — `LLMModel` type declared and unused.

---

## NAVIGATION AUDIT

### Dashboard Sidebar vs. Actual Files

| Sidebar Entry | Route | File Exists? |
|---------------|-------|:------------:|
| Dashboard | `/dashboard` | ✅ |
| AI Assistant | `/dashboard/chat` | ✅ |
| Campaigns | `/dashboard/campaigns` | ✅ |
| Keywords | `/dashboard/keywords` | ✅ |
| Ad Drafts | `/dashboard/drafts` | ✅ |
| Shopping Ads | `/dashboard/shopping` | ✅ |
| Knowledge Base | `/dashboard/knowledge-base` | ✅ |
| Settings | `/dashboard/settings` | ✅ |

**Result:** All 8 sidebar entries have matching page files. No broken links. No orphan pages.

### Admin Sidebar vs. Actual Files

| Sidebar Entry | Route | File Exists? |
|---------------|-------|:------------:|
| Overview | `/admin` | ✅ |
| Users | `/admin/users` | ✅ |
| Revenue | `/admin/revenue` | ✅ |
| AI Costs | `/admin/ai-costs` | ✅ |
| Analytics | `/admin/analytics` | ✅ |

**Result:** All 5 sidebar entries have matching page files. No broken links. No orphan pages.

### Cross-Navigation Issues

| Issue | Severity |
|-------|----------|
| **No link to `/admin` exists anywhere in the user-facing UI.** The admin panel can only be reached by typing the URL manually. | Medium |
| Landing page nav anchors (`#features`, `#how-it-works`, `#pricing`) all have matching section `id` attributes. | ✅ OK |
| "Back to User Dashboard" link in admin sidebar (`/dashboard`) works. | ✅ OK |
| Login → Dashboard link works (but should be auth-gated). | ⚠️ See SEC-01 |
| Onboarding → Dashboard link works (but should be auth-gated). | ⚠️ See SEC-01 |

---

## SUMMARY

| Severity | Count |
|----------|-------|
| **Critical** | 6 |
| **Medium** | 5 |
| **Low** | 5 |
| **Total** | **16 findings** |

### Top Priorities
1. Implement real authentication (SEC-01, SEC-02, SEC-03, SEC-04)
2. Fix React Fragment key bug (BUG-01) — causes console warnings, potential render issues
3. Fix stale closure in voice recognition (BUG-02) — causes silent data loss
4. Wire up the ~30 non-functional buttons or remove them (UX-01)
5. Remove unused imports (CODE-01) — 10 unused imports across 5 files
