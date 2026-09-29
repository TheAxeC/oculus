# Q83 refuter report (worktree at base c56819b6)

Every brief item is built as the brief words it. The verify list is green except for one timeout in a file this step does not touch. The findings that matter:
- **Proof:** two picture-size tests are written to pass on answers a browser does not draw (P1, P2).
- **Behaviour B1:** the nine writers now write over a read-only file that they used to refuse.
- **Behaviour B2:** image-size sizes some JPEGs worse than the hand parser did, beyond the three fixtures the brief named.
- **Behaviour B3:** a regex that does not parse throws out of the find bar.
- **Behaviour B4:** a picture listing costs more than the report measured.

## Verification lines (verbatim)

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null`, run from the worktree's tools/oculus. It exited 1. The load averages were 10.45, 14.82 and 14.06 (`uptime`).
```
$ npm test
Rebasing (1/1)error: could not apply 8c593fc... Main
Rebasing (1/1)error: could not apply eb199b4... Main
Rebasing (1/1)error: could not apply 8b2521b... Main
 FAIL  tests/server/git/git-ops.test.ts > pull, fetch, sync and publish > syncs: pulls, then pushes what the branch holds
Error: Test timed out in 5000ms.
 Test Files  1 failed | 377 passed (378)
      Tests  1 failed | 5903 passed | 1 skipped (5905)
checks: failed with exit 1: npm test
```

`git-ops.test.ts` is not changed by the step. Run alone with `npx vitest run tests/server/git/git-ops.test.ts` it gives `Test Files  1 passed (1)` and `Tests  37 passed (37)`.

The commands after `npm test`, run one by one:
- `npm run check`: `COMPLETED 2323 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0.
- `npm run build`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`, exit 0.
- `npm run lint`: exit 0.
- `! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0.

The brief's own gates:
- The hand-function grep over derive.ts and lane-distance.test.ts prints nothing (exit 1).
- `grep -c "from 'culori'"` gives 1 in each of derive.ts, lane-distance.test.ts and editor/theme.ts.
- `grep -rn "hljs-" src/lib/views` prints nothing.
- `grep -n "writeFileSync("` over the nine writers' files prints nothing.
- `grep -n "setTimeout\|clearTimeout"` over the five watchers prints nothing.
- `grep -rlE "addon-search|addon-web-links|addon-unicode11" build/server` prints nothing.
- The perl ASCII gate prints nothing (exit 0).
- `bash bin/folder-check.sh` exits 0.
- `npm ls` shows the eleven runtime packages and `@types/culori` at the brief's versions.
- `grep -rlE "from '<name>|import\('<name>" src` finds each package in the file its item names.

The step's 38 test files together pass: `Test Files  38 passed (38)`, `Tests  795 passed (795)`.

Two report claims were rerun on a copy of the tree in the scratchpad:
- **The leftover check.** With `writeAtomic` also writing `<path>.leftover-temporary`, `tests/routes/files/source.test.ts` fails with `+ "notes.md.leftover-temporary"`, as the report says.
- **The async debounce.** With usage/watch.ts changed to `debounced(refresh, debounce)`, both cases of `tests/server/machine/usage/watch.test.ts` fail. The test does catch the risk the brief named.

## Verdicts, items

1. **Colour math on culori: holds.**
   - `ratio = wcagContrast` and `wcagLuminance` in `readable` (derive.ts:82, 160); the head comment names culori.
   - lane-distance uses `differenceCiede2000()` and `converter('lab65')`, with the threshold of 10 unchanged.
   - `isDark` uses `wcagLuminance < 0.18`.
2. **Code colour in Markdown: holds.**
   - `data/prose/languages.ts` exports `codeColour` in the brief's form, and `state/shared/words/languages.ts` re-exports it.
   - The boundary row and the DESIGN state row are updated.
   - `renderDocument` and `turns.ts:157` use `codeColour`. `span` is in `ALLOWED_TAGS`, which covers both profiles.
   - `code.css` is imported by +layout.svelte.
   - A fence language cannot inject an attribute: probed with "```x\"onmouseover=...", it comes out as `class="hljs language-x&quot;onmouseover=&quot;alert(1)"`.
3. **Terminal find: holds.**
   - `allowProposedApi` is set. The search addon has decorations on, and `attachCustomKeyEventHandler` carries the key table.
   - FindBar sits inside FloatingBar, as ruling C says.
   - The colours are `--accent-bg` and `--accent`, read again on a theme change. All labels are in `config/text/views/sessions/terminal.yml`.
   - The regex defect is under Behaviour, B3.
4. **Links: holds.** `linkHandler(mac, open)` needs the modifier and admits only `http:` and `https:`.
5. **Wide characters: holds.** `Unicode11Addon` is loaded and `activeVersion = '11'` is set.
6. **Gmail message: holds.** MailComposer builds the message, it is async and awaited, and it returns base64url. The `@localhost` domain is B5.
7. **Atomic writes: holds** as specified. The read-only overwrite is B1, and the ownership and link notes are B8.
8. **Image sizes: holds** as specified: `READ_CAP`, `PICTURES`, and mime for `stream`. The concerns are P1, P2, B2 and B4.
9. **MIME: holds.**
10. **TOML: holds.**
11. **Debounce: holds.** All five watchers use `debounced(() => {...}, wait)` and call `.cancel()` on close.
12. **Documents: holds.** README:13, HELP after 84, HELP 126, and DESIGN 70, 116, 169 and 284 are updated. One comment inaccuracy is St3.

## Verdicts, cases

- **Colour (tokens, ratio, contrastOn, isDark, greps): met.**
  - The derive.test digests for 17 themes of 177 tokens pass. The brief's "18 / 3186" counted `rice`, which is a modifier and not a theme.
  - The report left `isDark('#80808080')` "as today" unverified. Computing the old formula (`node -e` over the removed code) gives luminance 0.21586, so false, the same as now.
- **Colour (lane verdict, 0.01 case): met.** The LIGHT table has 22 pairs within 0.01.
- **Markdown: met.** All six cases are in markdown.test.ts and turns.test.ts.
- **Sanitiser: met as an audit.** What DOMPurify does with a span is for the look.
- **Stylesheet: met.**
- **Boundaries: met.**
- **Terminal: met** for the pure parts. The look items are not verifiable here.
- **Gmail: met.**
- **Atomic: met.** The leftover revert was reproduced.
- **Images: met as the brief words it.** Two of the fixture expectations are P1 and P2.
- **MIME: met.**
- **TOML: met.**
- **Debounce: met.** The async-pending hazard was reproduced.
- **Dependencies: met.** A declaration file stands in for `@types/write-file-atomic`, which the brief allows.
- **Server bundle: met.**

## Spec

No violation of a brief item. One clash for the orchestrator: brief item 8 and Decision 10 ("three edge fixtures take image-size's answer") collide with spec.md's "A test never asserts a known defect", and the spec says nothing in a brief overrides it (P1, P2).

## Proof

- **P1: a test asserts that a drawable JPEG gets no size.**
  - `tests/server/content/images.test.ts:381-382`: `// image-size's answer for fill bytes before a marker, which a browser still draws.` / `it('gives no size for a JPEG with fill bytes before a marker', ...) ... toBeNull()`.
  - This asserts a known defect. The JPEG standard allows 0xFF fill bytes before any marker, and the test's own comment says a browser draws the picture.
  - Failure scenario: a later fix that restores the size, such as skipping fill bytes before image-size, turns this test red. The test protects the regression rather than the behaviour.
- **P2: a test asserts a turn read from the wrong place.**
  - `images.test.ts:371`: `it('turns the frame by a damaged EXIF block as image-size reads it'` expects 200x300.
  - image-size reads the first directory at a fixed offset of 8 and never reads the offset field (`node_modules/image-size/dist/esm/types/jpg.js`, `extractOrientation`: `const idfOffset = 8`).
  - The removed hand parser checked every offset, "so a damaged block reads as no orientation", which matches a decoder that follows the offset. Browser drawing was not verified here.
  - The same root cause produces B2's wrong answer on valid files.
- **P3: the report's listing cost leaves out the parse.**
  - The report's "149.2 ms warm vs 97.4" came from "a temporary script mirroring sizeOf's reads", so image-size's parse is not in it.
  - I timed the real `sizeOf` over 300 synthetic 3 MB JPEGs, each with JFIF, a 30 KB EXIF block, a 3 KB ICC profile, tables and a frame (`node $S/bench.mts`, the old images.ts rebuilt by reversing `git diff c56819b6`).
    - Old: 291.3, 213.6 and 120.7 ms over three runs.
    - New: 456.4, 423.7 and 386.5 ms.
  - Warm, the new code is about 3.2 times the old, where the report shows 1.5 times.

## Standards

- **St1: two reader-visible literals are not catalog text.** `terminal-list.ts:346-347` has `'?'` and `` `${FIND_LIMIT}+` ``, which the count shows. The spec requires every string a reader sees to come from a catalog.
- **St2: history in test names and comments.**
  - derive.test.ts:3 ("when its WCAG measure was a hand formula") and :8.
  - derive.test.ts:68: `'are what every theme derived before the measure moved to culori'`.
  - lane-distance.test.ts:50, 200 and 203: `'measures the light theme as the hand formula did...'`.
  - These name a removed implementation. They should say what the captured values are, not narrate the move.
- **St3: an images.ts comment is false for JPEG.** `images.ts:19` says "A picture whose size or orientation sits past the head is sized as far as the head says". A JPEG whose frame lies past the head gives null, because image-size throws "Corrupt JPG, exceeded buffer limits".
- **St4 (point e): a git command against the dispatch, disclosed.** The builder ran `git -C . diff --stat` and said so in its report.
  - spec.md contradicts itself here. "You never run a git command. Not add, ... not status" stands against its last paragraph: "Reading git state (`git diff`, `git status`, `git log`) to verify a worker's own change is allowed".
  - The rules file needs that contradiction removed so the next builder is not misled.
- **St5: the macOS test exists twice.** `TerminalGrid.svelte:123` repeats `navigator.userAgent.includes('Macintosh')`, which `ui/controls/editor/load.ts:77` (`onMac`, private) already holds. This is a minor DRY defect.
- **Point h (tests named "audits"): no finding.** The rule in `tests/checks/tree/allow-audits.txt` (checked by `tests/checks/tree/audits.test.ts`) requires the word for a views case that asserts over a pure function.
- **Point h (tests that stay green with the change reverted): no finding.** Several stay green on the old code by design, as guards that today's results are kept: the digests, `ratio`, the MIME table, the JSON mode cases, the debounce bursts and the Markdown escapes. The change itself is proven by the greps, the audits and the cases that were red first.

## Behaviour

- **B1: the nine writers now overwrite a read-only file they used to refuse.** This is medium, the most serious of the findings.
  - The probe (`node $S/ro.mts`) prints:
    - `in-place write: EACCES`
    - `atomic write: written -> "new\n" 444`
  - Before, `writeFileSync` on a 0444 `behavior.yml`, `rail.yml`, deck file, manifest or registry failed, and rail, deck and audit-mute answered `unwritable`. write-file-atomic makes the temporary file and renames it over the read-only one.
  - The source route treats read-only as a refusal on purpose: `server/files/source.ts:37` runs `accessSync(path, constants.W_OK)`, and source.test.ts:103 expects "refuses a file this machine locks with readonly".
  - Failure scenario: Axel makes a config file read-only, and an audit mute or a rail edit silently rewrites it.
  - Fix: in `writeAtomic`, refuse an existing file that fails `W_OK`.
- **B2: image-size sizes some JPEGs worse, outside the three named fixtures.**
  - A valid EXIF block whose first directory is at offset 16 with orientation 6 (`node $S/ifd.mts`): old `{"width":200,"height":300}`, new `{"width":300,"height":200}`.
  - Frames 0xC3, 0xC5, 0xC9 and 0xCA (`node $S/sof.mts`): old `{"width":10,"height":20}`, new `null`. image-size accepts only 0xC0, 0xC1 and 0xC2 as frames.
  - No fixture covers either case, so the brief's probe could not see them.
  - Failure scenario: such a photo's tile is drawn at the wrong proportions, or with no size.
  - Whether Chrome draws arithmetic-coded JPEGs was not verified.
- **B3: a regex that does not parse throws out of the find bar.**
  - addon-search builds `RegExp(I, ...)` with no try (read in `node_modules/@xterm/addon-search/lib/addon-search.mjs`; not run in a browser).
  - With Use Regular Expression on, typing `(` or `[a` throws a SyntaxError out of `runFind` (`TerminalGrid.svelte:141-151`) through `typedFind`, at every keystroke until the pattern closes. The count keeps the previous search's numbers.
  - VS Code shows an invalid pattern as no results.
  - Fix: a try/catch in `runFind` that clears the marks and sets the count to 0.
- **B4 (point a): listing cost.** Low to medium.
  - The brief names the cap (item 8: "reads at most READ_CAP", Decision 10, LA15) but no read budget. The code as it stands is what the brief asked for.
  - The cost has two causes:
    - `sizeOf` allocates and fills `new Uint8Array(READ_CAP)` for every file, whatever its size (images.ts:174).
    - image-size's JPEG walk copies the rest of that buffer at every segment (`input.slice(i + 2)`), so the parse cost grows with the head size (P3's numbers).
  - image-size has no smaller-head API, but two cheaper shapes give the same answers:
    - Allocate `min(size, READ_CAP)` from the stat already taken at :168, which is what image-size's own `fromFile` does.
    - Read in stages: 64 KB first, then `READ_CAP` only when image-size throws or the PNG walk runs out before IDAT. A JPEG frame found in the first stage means its EXIF block was inside it too.
  - Neither test was fitted to the new cost: the 20 MB case asserts only `<= 512 * 1024`.
- **B5 (point f): the Message-ID ends in `@localhost`.**
  - nodemailer takes the domain from `(this.getEnvelope().from || this.hostname || 'localhost')` (`dist/esm/mime-node/index.js:1448`). `rawMessage` passes no `from` or `messageId`, so every reply carries `<uuid@localhost>`.
  - Whether Gmail keeps or replaces it is not verified. If it is kept, a Message-ID whose domain is not a full host name may count against the reply in spam filters (also not verified).
  - Fix: pass a `messageId` on the account's domain.
- **B6: a single-file watch dies after an atomic write.** Low.
  - `portfolio.ts:261-276` watches the career file with `watch(file)`. After a rename-over, a file watch receives nothing more (`node $S/watchfile.mjs`: `after atomic write 2 change,rename`, then `after a later in-place write 2`), and `handles.has(file)` stops it being opened again.
  - career writes now go through `saved` and `writeTextAtomic` (subtasks.ts:245).
  - With the configured `career_file: registries/career.yml`, the registries folder watch still covers the file, so nothing fails today.
  - With a career file in the hub root, which the watcher's comment at :229 describes, a second career change would not reach an open page.
- **B7 (point d): no defect found.**
  - A throw in the debounced function now gives two unhandled rejections: the returned promise, which the watchers discard with `void`, and perfect-debounce's own `currentPromise.finally(...)`. Under Node's defaults either one ends the process, as the old uncaught `setTimeout` throw did.
  - Of the callbacks: `reloadAccounts` (context.ts:388) catches `loadLocal`, the portfolio rebuild and the sessions rescan catch their own errors, and `Hub.publish` has no throwing path I found.
  - This was not checked exhaustively: `setAccounts` and the socket send were not traced.
- **B8 (point g): notes, none blocking.**
  - For a file owned by another user, the library's `chown` fails with EPERM, which it ignores when not root, so the file becomes the server's user's. The nine former in-place writers kept the owner.
  - A hard link stops sharing content after a write. The report discloses this; it is untested.
  - `fresh = newMode !== undefined && !existsSync(path)` leaves a window before the library's own stat, the same size as the old stat-then-open window. Negligible.
  - The temporary name is `<file>.<number>` beside the target.
- **Point c (TOML): no finding.** The brief rules it explicitly: the TOML case "`[mcp_servers.a]\ncommand="x"\n[mcp_servers.b` gives `malformed: true` and no names", and Decision 12.

## Declined to judge

- What happens on screen is the look's at landing:
  - the find bar's keys, focus and colours, in two themes;
  - Cmd+click and a plain click on a URL;
  - an emoji taking two cells;
  - what DOMPurify keeps of a span.
  
  I was told not to open a browser.
- Whether a browser draws an arithmetic-coded JPEG, or one with fill bytes or a damaged EXIF block: not verified. P1, P2 and B2 compare against the hand parser and the JPEG standard.
- Whether Gmail keeps a submitted Message-ID: this needs a real send.
- Whether perfect-debounce fits the plan: the library audit already ruled it.

## Usage

320046 tokens, 86 tool uses, 24 min (from its completion notice).
