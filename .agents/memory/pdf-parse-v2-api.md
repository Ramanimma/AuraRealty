---
name: pdf-parse v2 API
description: The installed pdf-parse package uses a named PDFParse class rather than the legacy default-function API.
---

Use `PDFParse` from `pdf-parse`, instantiate it with `{ data: buffer }`, call `getText()`, and destroy the parser afterward.

**Why:** The current package version is ESM and does not provide the legacy default export, so importing or calling it as a function prevents the server from starting.

**How to apply:** Check the installed package API before adding PDF parsing code, especially after dependency installation.