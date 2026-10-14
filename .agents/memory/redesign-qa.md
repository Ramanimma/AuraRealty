---
name: Redesign QA constraints
description: User-defined redesign scope and a testing capability caveat.
---

Redesign phases are styling-only: do not modify server code, Supabase queries, API calls, form handlers, routes, props, or data logic.

**Why:** The user repeated this boundary across the redesign phases.

**How to apply:** Keep behavior and navigation unchanged. Defer programmatic label associations or other non-styling accessibility changes until explicitly authorized.

The final QA requirement is WCAG AA within the approved palette, including text over video and button hover states.

**Why:** Earlier translucent surfaces and white-on-copper hover text did not guarantee adequate contrast; final QA explicitly requires AA.

**How to apply:** Check contrast before restoring earlier visual choices; opaque local text panels and a contrasting text color can preserve the palette without a full-screen video overlay.

Do not assume that a tester configuration documented by a skill is available in the current tool runtime.

**Why:** The documented testing configuration was rejected during browser QA.

**How to apply:** If rejected, use an existing installed browser for read-only checks without adding testing dependencies. Keep authentication in place and distinguish signed-out checks from signed-in verification.
