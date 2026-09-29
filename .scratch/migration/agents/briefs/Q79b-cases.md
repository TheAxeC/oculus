# Q79b cases ruling (round 0, 2026-09-29)

The first run is accepted as handed back. Rulings:

1. **The history audit reads every comment, trailing ones included (option A).**
   - For a code file, `history.test.ts` matches its pattern against the comment text of each line: the line with its code blanked.
   - The comment text comes from a new export of `tests/checks/source/code.ts`, such as `commentText(name, text)`, which gives each line's comment characters and blanks everything else. It is built on the same parse as `fileCode` and `withoutComments`.
   - Trailing comments in `.ts`, `.svelte`, `.mjs` and `.js` files are read, as they are today. A `.sh` file's trailing `# ` comment is read through the same export.
   - Code such as `'http://x/Q12'` or `const Q1 = ...` no longer matches.
   - Two new cases:
     - `src/trail.ts` holding `const a = 1; // written for Q12` is reported;
     - `x=1 # Q12` in a `.sh` file is reported.
   - Membership in `commentLines` (option B) would stop auditing trailing comments. It was the lazy option.
2. **`scratchDir` leaves no directory behind on an escaping prefix (case 19).**
   - Check the resolved `join(tmpdir(), prefix)` before `mkdtempSync`, so nothing is made outside.
   - Case 19 also asserts that nothing new appears in the parent of `tmpdir()`.
3. **The count is 102 suites**, the helper's head comment being the 103rd hit. `routes/sessions/terminal-fixture.ts` is reached through and registers nothing, so it is left as it is.
4. **`src/app.html` and `src/lib/assets/favicon.svg` are read by svelte/compiler's `parse`**, their comments as HTML comments, as the handed-back judgment call proposes. The report lists it as a decision.

Resume at the conversion. The first-run tests and the walker lists recorded in your scratch folder carry over. The rest of the brief holds unchanged.
