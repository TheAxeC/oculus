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

## Repair round 1, refuted (worktree at base c56819b6)

All nine rulings of the round hold, and the verify list is green on its single run. Nothing in the round's scope is left undone. There are four findings, all low:
- **B-a (point a).** The JPEG walk now stops at the 512 KB head. A JPEG whose frame sits past 512 KB gets no size, where the base parser gave one. I measured this. It follows from the READ_CAP that the brief and the Z61 ruling both keep, so it is for the orchestrator to rule on, not a builder defect.
- **St-a.** `watchPortfolio` lost its doc comment: the new `watchFile` doc block was inserted between that comment and the function.
- **St-b.** The two career-file comments the round rewrote still say the file "sits in the hub root". The configured file is `registries/career.yml`.
- **P-a.** No test covers the new Gmail profile read failing, or a profile with no address.

## 1. Verification lines, verbatim

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, from the worktree's tools/oculus. It exited 0, run once from 21:39 to 21:49 with load averages 11.35 13.83 13.03. Lines extracted with grep:
```
$ npm test
Rebasing (1/1)error: could not apply b95225f... Main
Rebasing (1/1)error: could not apply b95225f... Main
Rebasing (1/1)error: could not apply 1a7b4da... Main
 Test Files  380 passed (380)
      Tests  5915 passed | 1 skipped (5916)
$ npm run check
1790711104136 COMPLETED 2325 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

Other checks:
- `bash bin/folder-check.sh` exits 0.
- The brief's perl ASCII gate prints nothing (exit 0).
- `grep -rlE "addon-search|addon-web-links|addon-unicode11" build/server` prints nothing (exit 1).

### Revert probes

Each probe reverts one ruling's change on a copy of tools/oculus under the scratchpad, with node_modules linked, and runs only the named test file. Every red line matches the report's.

| Ruling | Revert | Red line |
|---|---|---|
| 1 | JPEG sent to image-size (`found.type === "jpg"` with its `orientation`) | 4 failed: offset 16 `expected { width: 300, height: 200 } to deeply equal { width: 200, height: 300 }`; damaged `expected { width: 200, height: 300 } to deeply equal { width: 300, height: 200 }`; fill bytes and frames `expected null to deeply equal { width: 10, height: 20 }` |
| 2 | `want = READ_CAP` | `expected [ 524288, 524288 ] to deeply equal [ 2048 ]` |
| 3 | `refuseReadonly(path)` call removed | json.test `expected [Function] to throw an error`; rail.test `expected 200 to be 500` |
| 4 | `findUnparsable` always false | `expected false to be true` |
| 5 | `messageId` line removed | `expected '<ef23dd38-...' to match /^<[0-9a-f-]{36}@mail\.example\.nl>$/`, and the send case |
| 6 | `watchFile` body as `watch(file, ...)` | `expected 0 to be greater than 0` |
| 7 | literals `'?'` and `` `${FIND_LIMIT}+` `` | `Received: "sessions.find_count(?,1000+)"` |
| 9 | navigator guard removed | `TypeError: Cannot read properties of undefined (reading 'userAgent')` |

Ruling 8 has no red run: it changes names and comments only. I read the new text at `derive.test.ts:1-9, 68` and `lane-distance.test.ts:49-53, 201-204`. It names what the values are, not a removed implementation. `grep -rn -i "hand formula\|before the measure moved\|moved to culori\|when its WCAG" tests src` prints nothing.

The round's JPEG walk is the same code as the base walk, with reads by position replaced by index checks against the head. I checked this with `diff` of `function jpeg` at base against the worktree. The main checkout's `images.ts` equals the base (`cmp`), so the builder's "I read main as the base" is sound.

## 2. Verdicts

### Items (the whole diff since the base)

1. Colour math on culori: **holds**.
2. Code colour in Markdown: **holds**.
3. Terminal find: **holds**. An unparsable pattern is now handled by `findUnparsable` and the `runFind` branch at `TerminalGrid.svelte:152`.
4. Links: **holds**.
5. Wide characters: **holds**.
6. Gmail message: **holds**. The Message-ID is on the account's domain.
7. Atomic writes: **holds**. Read-only files are refused.
8. Image sizes: **holds as amended by Z61 (a)**.
   - JPEG is walked by hand.
   - image-size sizes PNG and WebP.
   - The buffer is `min(size, READ_CAP)`.
   - `PICTURES` is kept, and `stream` takes its type from mime.
   - B-a is the consequence of the cap for JPEG.
9. MIME: **holds**.
10. TOML: **holds**.
11. Debounce: **holds**.
12. Documents: **holds**, except St-a and St-b in comments.
   - `README.md:13` now says image-size reads a PNG's and a WebP's size.
   - The `images.ts:12-25` head comment is per format.
   - No doc names `SEGMENTS`, `readSize`, `ReadAt` or `Macintosh`: a grep over README, HELP, DESIGN and the changed sources finds none.

### Cases

- Colour, lane distance, Markdown, sanitiser (as an audit), stylesheet, boundaries: **met**.
- Terminal, pure parts: **met**. What the look covers is not verifiable here.
- Gmail, atomic, MIME, TOML, debounce, dependencies, server bundle: **met**.
- Images: **met as ruled by Z61**.
  - The three fixtures now assert the hand parser's answers: fill bytes give 10x20, a damaged EXIF block gives no turn, and a frame past `SEGMENTS` gives 640x480.
  - The offset-16 case and the 0xC3, 0xC5, 0xC9 and 0xCA frame cases are added.

### Round rulings

1. Z61 (a): **holds**. B-a covers the frame past the head.
2. B4: **holds**.
   - Over 300 synthetic 3 MB JPEGs, eight interleaved warm rounds (`node bench.mts`):
     - base: 28.2, 23.0, 28.8, 26.6 and 35.3 ms;
     - now: 33.7, 33.2, 57.5, 37.8 and 52.1 ms.
   - That is about 1.2 to 2 times the base, where the first report measured 3.2 times.
   - The cost left is the 512 KB read per photo, which the cap sets.
3. B1: **holds**. Its reach is wider than the nine writers; see B-c.
4. B3: **holds**. The helper is unit-covered. The `runFind` branch itself is for the look.
5. B5: **holds**. P-a is about the new failure path.
6. B6: **holds**. St-a and St-b are in its comments.
7. St1: **holds**.
8. St2: **holds**.
9. St5: **holds**. `grep -rn "Macintosh\|onMac" src` finds the test only in `load.ts`, with its one use at `TerminalGrid.svelte:125`. See St-c.

## 3. Findings

### Spec

- **S-a: two parts of the round brief pull against each other.**
  - Round-brief ruling 1 says "JPEG size and orientation go back to the hand parser as it stood at base".
  - The Z61 ruling line in `plan.md:262` and the brief's item 8 keep the head read of at most READ_CAP.
  - The base walk read by position with no byte cap, so the two cannot both hold for a frame past 512 KB. The builder chose the cap, and the head comment `images.ts:20` says so: "A frame past the head gives no size."
  - The report does not say that the base sized such a file. B-a has the measurement. This is for the orchestrator, not a builder violation.

### Proof

- **P-a: the profile read's failure paths are untested.**
  - Place: `google.ts:189-191`.
    ```
    const profile = await getJson('google', `${BASE}/profile`, args);
    const raw = await rawMessage({
        sender: str(profile.emailAddress) ?? '',
    ```
    and `google.ts:163`:
    ```
    if (domain === null) throw new Error('google: the account has no address to send from');
    ```
  - Two new ways the send can fail have no case:
    - the profile request failing;
    - a profile with no `emailAddress`.
  - `grep -n "no address\|profile" tests/server/accounts/mail/*.ts` finds only the happy-path fakes.
  - Failure scenario: a later change makes a profile failure fall back to sending with `localhost`, or lets the throw escape the route. No test goes red.
  - Reading `routes.ts:105-113`, today either failure becomes a 400 `{ error }` and nothing is sent.

### Standards

- **St-a: `watchPortfolio`'s doc comment is detached.**
  - Place: `portfolio.ts:182-199`.
    ```
     * change republishes portfolio alone. A rebuild that throws leaves the previous payloads standing.
     */
    /**
     * A watch on one file, kept through its folder and filtered on its name: ...
     */
    export function watchFile(file: string, changed: () => void): FSWatcher {
    ...
    export function watchPortfolio(hub: Hub, paths: WatchPaths, options: WatchOptions = {}): Watcher {
    ```
  - At the base, the block "Watch the hub and the engine's `config/`, ..." sat directly on `watchPortfolio`. Now two doc blocks are stacked on `watchFile`, and `watchPortfolio` has none.
  - Failure scenario: an editor's hover and any doc tool show no description for `watchPortfolio`, and the orphaned block reads as describing `watchFile`.
- **St-b: a false clause in two comments the round rewrote.**
  - Places: `portfolio.ts:154`, "The career file is not here: it sits in the hub root, where a recursive watch of its folder would cover the whole hub a second time", and `:271`, "One file watched on its own, for the career file, which sits in the hub root".
  - `config/sources.yml:88` is `career_file: registries/career.yml`, and `roleDirectories` already adds `registries` as a recursively watched folder.
  - The clause came from the base, but the round edited both comments (point e). A reader believes the flat watch exists because the file is in the hub root. For the configured value, it duplicates the recursive `registries` watch.
- **St-c (minor).**
  - Place: `tests/ui/controls/editor/platform.test.ts:3-4`, "since the terminal grid reads it when its module loads and every view renders on the server first".
  - `load.ts:7` says "The page renders no component on the server (`ssr = false` in src/routes/+layout.ts)". Also, `TerminalGrid.svelte:125` calls `onMac()` in the instance script, not when the module loads.
  - The guard is still right for the unit suite's server render, but the sentence is false for the product.

### Behaviour

- **B-a (point a): a JPEG whose frame lies past 512 KB gets no size; the base gave one.**
  - Probe `node probe-a.mts`: JPEGs with n full 64 KB APP2 segments before a 640x480 frame, current `sizeOf` against the base file rebuilt from `git diff c56819b6`:
    ```
    7 APP2 segments, frame at 458761 (448 KB): base {"width":640,"height":480}, now {"width":640,"height":480}
    8 APP2 segments, frame at 524298 (512 KB): base {"width":640,"height":480}, now null
    9 APP2 segments, frame at 589835 (576 KB): base {"width":640,"height":480}, now null
    40 APP2 segments, frame at 2621482 (2560 KB): base {"width":640,"height":480}, now null
    ```
  - `images.ts:61-66` says the cap is "well inside" what a camera keeps before the frame. That holds for EXIF plus ICC, since one APP segment is at most 64 KB. It fails for files carrying eight or more full segments before the frame: extended XMP split over APP1 segments (as some phone portrait modes store a depth map), or a large ICC profile split over APP2.
  - Failure scenario: such a photo's Memories tile is drawn with no proportions.
  - Not verified on a real camera file.
  - The same cap applies to a PNG `eXIf` chunk after 512 KB of chunks. The base walked PNG chunks by position.
  - This is the brief's and Z61's cap, not a builder defect. Keeping both would need the JPEG walk to fall back to reads by position past the head, which item 8's "at most READ_CAP" forbids. This is the orchestrator's call.
- **B-b (point b): the extra profile read.**
  - Neither the account's config nor its token record holds the address, so the extra request is needed:
    - `ConnectAccountConfig` is `{ provider; label }` (`model-connect.ts:30`);
    - `GoogleCredentials` is client id, secret and refresh token (`connect/store.ts:50-55`);
    - the mail scopes are `gmail.modify gmail.send` (`oauth.ts:124`), with no `openid` or `email` that would give an id token carrying it.
  - Deriving the domain from the thread's own headers would not be the sending account's.
  - Cost: one GET per reply, a user action. That `gmail.modify` covers `users.getProfile` is not verified here.
  - On failure, `getJson` throws, `reply` in `routes.ts:105-113` answers 400 with the reason, and nothing is sent. Before the round the reply would have gone out. This is a new way for a reply to fail, and correct: no Message-ID is sent on `localhost`. Its missing test is P-a.
- **B-c (point c): refuseReadonly.**
  - Probe `node probe-c.mts`, run as uid 502:
    ```
    fifo 0444: threw EACCES open 0 ms
      still a fifo: true
    file 0444: threw EACCES open 5 ms
      content "old\n" 444
    ```
  - The `r+` open runs only after `accessSync` has already refused. On a read-only FIFO it fails at once with EACCES, without blocking, and the FIFO stays. The same would hold for a special file with no write permission.
  - A side effect of the open would need `access(2)` with the real uid and `open(2)` with the effective uid to disagree, which only a setuid process gives. oculus is not one.
  - As root, `access(W_OK)` passes on a 0444 file, so no open runs and the library replaces the file. The base's `writeFileSync` also wrote as root. Not verified here: no root.
  - Reach beyond the nine writers: the check is in the shared `writeAtomic`, as the ruling placed it, so all 23 call sites (`grep -rn "writeJsonAtomic(\|writeTextAtomic(\|writeBytesAtomic(" src`) now refuse a 0444 target. The base's hand writer replaced it. One consequence is `git/git-index.ts:156`: Complete Merge now refuses a read-only worktree file that git itself would overwrite. Low.
  - From the whole diff (item 7), not the round: a writable file in a 0555 folder.
    ```
    0644 file in 0555 folder, atomic: threw EACCES open 0 ms
    0644 file in 0555 folder, in place: written 2 ms
    ```
    The nine former in-place writers now answer `unwritable` there. This comes with any rename-based write, so it is inherent in brief item 7, and it is named here for the orchestrator.
- **B-d (point d): watchFile's event count and duplication.**
  - Probe `node probe-d.mjs`, 200 writes deep in the tree, 20 one level down, 5 at the top and 1 to career:
    ```
    flat watch callbacks 6, of them career 1; recursive watch callbacks 227
    ```
  - A flat watch of a hub-root folder receives only the top level, so the cost is small.
  - For the configured `registries/career.yml`, the flat watch of `registries` duplicates the recursive `registries` watch from `roleDirectories`. The base's `watch(file)` duplicated it the same way, and the debounce makes both one rebuild. No defect beyond St-b.

## 4. Declined to judge

- What appears on screen:
  - the find bar's "No results" for `(`;
  - the keys, colours, links and emoji width;
  - what DOMPurify keeps of a span.
  
  The brief assigns these to the look at landing, and I was told not to open a browser.
- Whether Gmail keeps the submitted Message-ID, and whether `gmail.modify` admits `users/me/profile`: both need a real account.
- Whether real camera or phone JPEGs carry more than 512 KB before the frame: I have no such file. B-a is measured on synthetic files built to the standard.
- The root case of refuseReadonly: I cannot run as root.

## 5. Usage

About 150k tokens and 38 tool uses. Wall time is about 20 minutes, of which the verify list took 10 (21:39 to 21:49 by `uptime`). The token count is read from the context counter, not measured.

## Closed

First review (every finding sent in repair round 1): P1, P2, B2 and St3 by Z61 (a); B4 by ruling 2; B1 by ruling 3; B3 by ruling 4; B5 by ruling 5; B6 by ruling 6; St1 by ruling 7; St2 by ruling 8; St5 by ruling 9; St4 by Z62 (a) in the rules file; B7 and B8 no defect.

Repair round 1, refuted (fixed at landing on main, none sent back):
- B-a and S-a: the JPEG walk and the PNG `eXIf` walk go on past the head by reads at their position through the file handle, as the base's walk did, so a frame or chunk past READ_CAP is still reached; the head read stays the one image-size gets.
- P-a: cases for a profile read that fails and a profile with no address, each answering the error and sending nothing.
- St-a: `watchPortfolio`'s doc comment put back on it, `watchFile`'s above its own function.
- St-b: the two career-file comments say the file sits where `career_file` names it, and why it has a flat watch of its folder.
- St-c: the platform test's comment says the unit suite renders on the server.
- B-b, B-c, B-d: no defect. B-c's read-only folder behaviour comes with any rename-based write (item 7) and is stated in the landing report.
