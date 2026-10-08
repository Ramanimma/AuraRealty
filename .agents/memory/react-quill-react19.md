---
name: react-quill with React 19
description: Installing react-quill (or other React-16/17/18-only packages) in a React 19 project
---

`react-quill@2.0.0`'s package.json peer dependency is `react@"^16 || ^17 || ^18"`, so a plain `npm install react-quill` fails hard on a React 19 project.

**Why:** npm's strict peer resolution treats this as a conflict and aborts the install, even though react-quill works fine at runtime with React 19 in practice.

**How to apply:** run `npm install react-quill --legacy-peer-deps`. If a prior failed attempt left partial/conflicting entries in the dependency tree (e.g. a leftover `react-quill` or `quill` reference blocking a later plain install), clean up with `npm uninstall react-quill quill` first, then retry with `--legacy-peer-deps`. Don't give up after one plain-install failure — retry once with the flag before concluding the package is incompatible.
