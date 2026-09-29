# Step Q83 brief check (on main at 6b23c357)

The brief was read from the working tree. Probes ran in the scratchpad `q83-check/`: culori 4.0.2, marked 18.0.14 with marked-highlight 2.2.4, nodemailer 10.0.12, write-file-atomic 8.0.0, image-size 2.0.4, mime 4.1.0, smol-toml 1.9.0, perfect-debounce 2.1.0, and the xterm addons, each installed with `npm install` in that folder. Nothing in the repository was changed.

## 1. Names

Evidence:
- `git grep -n "languages\.ts\|words/languages" -- tools/oculus ':!tools/oculus/.scratch'` lists exactly the nine importers the brief names. There is one extra hit, a comment in `tests/checks/source/keys.test.ts:169` that names `state/shared/words/languages.ts`. That file is an importer, so it is inside the paths.
- `grep -rn "hljs-" src` hits only `Code.svelte`. However, `tests/ui/theme/colours.test.ts:548-557` ("paints the code window through those six and nothing else") reads `Code.svelte` and expects `color: var(--c-code-*-txt)` for all six code tokens.
- `git grep -n "tomlServers\|tomlTools"`: the hits are `customizations.ts` and `tests/server/sessions/stores/customizations.test.ts:18,19,194,199,203`. Line 194 is `tomlTools('a = true\n[tools]\nx = true\nx = true\ny = 1\n[tools.z]\nz = true\n')`. It repeats the key `x`, which smol-toml rejects ("trying to redefine an already defined table or value"; probe `probe-toml.mjs`, the duplicate case).
- `grep -rn "writeAtomic\|\.oculus-write-" src tests bin DESIGN.md HELP.md` gives one hit outside json.ts: `tests/routes/files/source.test.ts:232` filters leftovers by `name.startsWith('.oculus-write-')`. write-file-atomic names its temporary file `<file>.<hash>`.
- `git grep -n "typeOf("` finds `tests/routes/files/file.test.ts:73`, `expect(typeOf('archive.tar.gz')).toBe('application/octet-stream')`. `mime.getType('archive.tar.gz')` gives `application/gzip` (probe).
- `git grep -n "SEGMENTS\|readSize\|isFrame|..."` outside `images.ts` and its test prints nothing. `lab`, `hueAngle` and `ciede2000` live only in `lane-distance.test.ts`.
- `grep -rn "rawMessage" src tests`: google.ts:140 and 172, and `tests/server/accounts/mail/write.test.ts:10,81,98`.
- `grep -n "atomic|debounce|xterm|addon|..." DESIGN.md HELP.md README.md`: `README.md:13` lists the runtime dependencies with their licences (`@xterm/xterm` and `@xterm/addon-fit`, and others).
- `images.ts:12-17`, the head comment, says "No image library is used".
- `derive.ts:22-23` says "no imports ... in a plain node run".

Findings:
1. `tests/ui/theme/colours.test.ts:548-557` goes red when the `.hljs-*` rules leave `Code.svelte`. The file is not in "Paths this step writes". It is not a mirrored path of `ui/theme.ts` either; that would be `tests/ui/theme/theme.test.ts`. The paths need to name it, and the brief needs to say what it reads afterwards (`themes/code.css`).
2. `tests/routes/files/file.test.ts:73` becomes false: `.tar.gz` changes from octet-stream to `application/gzip`. That file is the test of `server/files/files.ts`, but it is not at a mirrored path (`tests/server/files/` does not exist; `ls` shows no such folder), so it is outside the paths as written. This is also a user-visible type change the brief does not list.
3. `tests/routes/files/source.test.ts:232` becomes a check that cannot fail: no temporary file will ever start with `.oculus-write-` again. It is outside the paths.
4. `README.md:13`, the list of runtime dependencies with their licences, is made false by eleven new runtime dependencies. README.md is not in the paths, although the spec's grep rule names README.md.
5. `tests/server/sessions/stores/customizations.test.ts:194` changes its answer, because the duplicate key becomes a parse error. The brief gives no rule for `tomlTools` on a parse error; see check 6.
6. `tests/server/accounts/mail/write.test.ts` is the test of `rawMessage`, but it is not at the mirrored path (`google.test.ts`). It is covered only by "each caller of rawMessage" if read loosely. The paths should name it.
7. `tests/checks/tree/boundaries.test.ts` must change for the move; see check 3, finding 1. It is not in the paths.
8. `src/lib/routes/+layout.svelte` must change to load `code.css`; see check 3, finding 2. It is not in the paths.
9. `src/lib/server/sessions/stores/turns.ts` must change for transcript turns; see check 2. It is not in the paths.

## 2. The step line

The step line is `plan.md:253`. Mapping:
- "colour math on culori (derive.ts and the lane-distance check)" maps to item 1.
- "code colour in Markdown through marked-highlight with one code stylesheet under themes/" maps to item 2.
- "the xterm search, web-links and unicode11 addons" maps to items 3, 4 and 5.
- "nodemailer MailComposer" maps to item 6.
- "write-file-atomic" maps to item 7.
- "image-size" maps to item 8.
- "mime" maps to item 9.
- "smol-toml" maps to item 10.
- "perfect-debounce" maps to item 11.
- The LA references map to "Libraries checked".

Findings:
1. "Code colour in Markdown" covers transcript turns: LA13 (`library-audit.md:154`) says "Fenced code in documents, transcript turns and the source preview is drawn uncoloured". Item 2 ends by claiming "transcript turns ... colour code from one place". Transcript turns, however, are rendered by `src/lib/server/sessions/stores/turns.ts:155`, `marked.parse(body, { async: false })`, which is not `renderDocument`. No item changes turns.ts and it is not in the paths, so turns stay uncoloured. This part of the line has no item.
2. Every other part maps to an item.

## 3. Premises

Evidence and results:
- **derive.ts.** `wc -l` gives 262 lines, lane-distance 290. `grep -n "function "` matches every line number given: channels 62, luminance 77, ratio 86, contrastOn 96, rgbToHls 102, channel 122, hlsToRgb 131, mix 139, hex 146, readable 160, deriveTokens 205; lab 41, hueAngle 58, ciede2000 65. The threshold `0.03928` is at derive.ts:80. The "no imports" sentence is at lines 22-23, with 22 as the brief says.
- **isDark and importers.** `isDark` is at editor/theme.ts:101-107. `grep -rl "themes/derive" src tests` returns the nine importers named. The claim about the two WCAG thresholds holds: culori luminance and contrast alone produce 0 of 3186 differing tokens (probe `probe4.ts`).
- **Markdown render.** `renderDocument` is at markdown.ts:103-120. The callers are at docs.ts:236 and 312 and html.ts:335. `ALLOWED_TAGS` at html.ts:44 has no `span`, and `class` is allowed. The `.hljs` rules are at Code.svelte:98-150.
- **Terminal.** TerminalGrid.svelte:172-185 loads only fit. The folder has 9 items. `grep -rn "Cmd+F\|mod+f" config HELP.md src/lib/shell` prints nothing.
- **Gmail and writes.** rawMessage is at google.ts:140-158. The json.ts writers are at 38-89. The atomic writers are used by 14 files, json.ts included, so 13 other files. `grep -rn "writeFileSync(" src/lib/server` gives the nine writes plus the three that are not the reader's files, at the lines the brief says.
- **Watchers.** The line numbers of all five watchers match (`grep -n "clearTimeout\|setTimeout"`).
- **TYPES and TOML.** images.ts TYPES is at 32, files.ts TYPES at 45-61 with 15 entries. customizations.ts has `tomlServers` at 259 and `tomlTools` at 327.
- **Documents.** HELP.md:84 is the Alt+F5 row and :126 the Terminal row. DESIGN.md:70, 116 and 284 are the lines described.
- **Library facts.** `npm view` confirms every version, licence and date. Additional facts: write-file-atomic has one dependency (`signal-exit`) and ships no types; `@types/write-file-atomic` is 4.0.3; image-size does not export `MaxInputSize` (it is a local constant in `dist/esm/fromFile.js:4`).

Findings:
1. **The layer premise is wrong.** The brief says "the data layer is the one both the server and the page may import". In fact `tests/checks/tree/boundaries.test.ts:88-128` `ALLOWED` gives `views: ['ui/**', 'state/**', 'views/shared/**']`, with no `data/**`, and the `state` row allows only a named list of data modules, which does not include `data/prose/languages`. After the move, `Code.svelte` (views) and `file-type.ts`, `status.ts` and `editor-text.ts` (state) import a module their rows forbid, so the boundaries check goes red. The spec says this test "must pass". boundaries.test.ts is not in the paths, and the brief names no ALLOWED change.
2. **The stylesheet premise is wrong.** `ui/theme.ts:12-13` imports `tokens.css?raw` and `themes.css?raw` as text for derivation only; they style nothing. The page loads the stylesheets in `src/routes/+layout.svelte:8-9` (`import '$lib/themes/tokens.css'`). Loading `code.css` "by `ui/theme.ts` as tokens.css and themes.css are" would apply no rule. `+layout.svelte` is not in the paths.
3. **Transcript turns** do not go through `renderDocument` (turns.ts:155). See check 2.
4. **Library premise for item 1.** The brief expects culori's HSL conversion, `interpolate` or mix on rgb objects, and `formatHex` to keep every result. Probe `probe-colour.ts`, over all 18 theme blocks (3186 derived tokens), says otherwise:
   - With culori for everything the brief lists, 1656 tokens differ (for example light `--muted-txt` `#5f6f85` against `#606f85`). The cause is that `hex` truncates (`Math.trunc(v*255)`) while `formatHex` rounds.
   - Keeping a truncating `hex` but using culori `hsl` and rgb-object mix, 139 still differ.
   - Using culori `hsl` only, 22 still differ (dracula `--c-red-txt` `#fe7d7d` against `#ff7d7d`).
   - Using culori luminance and contrast only, 0 differ.
   So "results stay as they are" holds only when `channels`, `hex`, `mix` and the HLS pair stay by hand. This contradicts both item 1 and LA5's framing.
5. **Library premise for the lane-distance case.** culori `differenceCiede2000()` over hex strings (its `lab65`) differs from the hand CIELAB and CIEDE2000 by up to 0.0071 delta E across 13,338 lane pairs (max Lab difference 0.0070). The case asks for 1e-9. No pair crosses the threshold of 10 (probe `probe6.ts`). culori reproduces the Sharma table rows to about 4e-4, for example 2.04246 against 2.0425.
6. **The sanitiser cases cannot run in the unit suite.** `tests/ui/html.test.ts:5-11` states that the suite runs in node (`vite.config.ts:31 environment: 'node'`), where `sanitise` returns its input unchanged. `ls node_modules | grep -i "jsdom|happy-dom|linkedom"` finds none of them. Every case that says "after sanitise" (the span is kept, `onclick` and `style` are dropped, no `script`) either passes without testing anything or fails, and the brief names no DOM package.
7. **The diagram profile widens.** `DIAGRAM_PROFILE` (html.ts:140) shares `ALLOWED_TAGS`, so adding `span` also allows `<span style=...>` in diagrams. The brief does not name this.
8. **images.ts `TYPES` is also the picture filter.** It filters the listing (`images()`, images.ts:51) and the served extensions (`stream`, images.ts:300). Item 9, "The TYPES tables go", and "`images.ts` answers `mime.getType(path)`" leave both undefined. Two readings follow:
   - A filter on `image/*` would bring `.gif`, `.svg`, `.heic` and others onto the wall.
   - `stream` would serve `image/svg+xml` from a hub folder same-origin. An SVG opened directly runs its script.
   This is a security hazard the brief does not rule out.
9. **Item 9's charset rule contradicts itself.** Item 9 says "`image/svg+xml` stays without". Decision 9 says the suffix is added "for text types, JSON, JavaScript and SVG, as the old tables did", yet the old table has `.svg` without a charset (files.ts:53). Item 9 also lists `application/javascript`, while mime answers `text/javascript` for `.js` and `.mjs`.
10. **The debounce premise is correct.** perfect-debounce has `cancel()`. Its semantics differ from the hand copies in one respect: while a call's promise is pending, a new call returns that promise and re-runs `fn` immediately afterwards, without the wait (`dist/index.mjs`, `applyFn` and `.finally`). `usage/watch.ts:93-96` debounces `void refresh()` over an async `refresh`, so passing `refresh` directly changes the timing the brief says is kept.

Findings (numbered as above): 1 to 10.

## 4. Cases and checks

Library probes, in addition to those in check 3:
- **marked-highlight with marked 18** (`probe-md.mjs`). ```` ```ts```` gives `<code class="hljs language-ts"><span class="hljs-keyword">const</span>`. A fence with no language gives `<pre><code>&lt;b&gt;x&lt;/b&gt;` with no highlight call. `nosuchlang` gives `x` with no span, but with `class="hljs language-nosuchlang"`. An indented block is escaped. The `</code><script>` input is escaped inside spans. The Markdown cases are consistent with the library.
- **MailComposer** (`probe-mail.mjs`, ESM `import MailComposer from 'nodemailer/lib/mail-composer'`, `build()` returns a promise).
  - `Subject: =?UTF-8?Q?Re=3A_Link=C3=B6ping_rapport?=` and `To: =?UTF-8?Q?J=C3=B6ns?= <j@example.se>`.
  - A body with `\u00e5` gets `Content-Transfer-Encoding: quoted-printable`. The audit said base64; either satisfies the case.
  - A subject with `\r\nBcc: x@y` gives `Subject: hi Bcc: x@y` and no Bcc header.
  - An empty `inReplyTo` or `references` omits the header.
  - It adds `Message-ID: <uuid@localhost>` and `Date:`.
  The cases are consistent.
- **write-file-atomic** (`probe-wfa.mjs`, umask 022).
  - Existing 0600 file, no mode: stays 600.
  - Existing 0600 file with `{mode:0o640}`: becomes 640.
  - New file with mode: 640. New file without mode: 644.
  - A `Uint8Array` is written correctly.
  - A missing folder throws ENOENT; a folder that is a file throws ENOTDIR. No temporary file is left.
  - A symlink is written through to its target and stays a link. Today `renameSync` replaces the link with a regular file.
- **image-size** (`img/cases.ts`, the existing image test file run against an image-size sizeOf, with PNG eXIf kept by hand). Every `sizeOf` case matches today's answer. Three existing `readSize` fixtures differ:
  - "steps over fill bytes before a marker": null, where today gives 10x20.
  - "damaged EXIF block": 200x300, where today gives 300x200.
  - "frame past SEGMENTS": 640x480, where today gives null.
- **mime** (`probe-mime.mjs`). `.mjs` gives `text/javascript`, `.csv` `text/csv`, `.ico` `image/vnd.microsoft.icon`, `.wasm` `application/wasm`, `.avif` `image/avif`, `.md` `text/markdown`, `.svg` `image/svg+xml`. A name with no extension and `.nosuchext` give null. A bare name `.png` gives `image/png`; today `extname('.png')` is `''`, so octet-stream. `.ts` gives `video/mp2t`.
- **smol-toml** (`probe-toml.mjs`). Every TOML case of the brief gives the stated answer. `[mcp_servers.a]\ncommand="x"\n[mcp_servers.b` gives a parse error; today it gives names `[a]` with `malformed: true`.
- **xterm.**
  - `term.unicode` is `get unicode(){return this._checkProposedApi(),...}` (`@xterm/xterm/lib/xterm.mjs`), which throws unless `allowProposedApi: true`. `registerDecoration` has the same gate.
  - addon-search's `onDidChangeResults` fires "when decorations are enabled" (typings:155). Its `ISearchDecorationOptions` requires `matchOverviewRuler` and `activeMatchColorOverviewRuler`, and colours must be `#RRGGBB`.
  - web-links' default regex is `/(https?|HTTPS?):[/]{2}.../`.
- **VS Code's terminal find keys.** `curl .../terminal.find.contribution.ts`, lines 187-224, show `FindNext` is F3, Cmd+G on macOS and **Shift+Enter**, and `FindPrevious` is Shift+F3, Cmd+Shift+G and **Enter**.
- `grep -n find src/lib/themes/tokens.css themes.css` prints nothing, so no `--c-find-*` token exists.

Findings:
1. The colour case "`deriveTokens` byte for byte" is inconsistent with item 1's instruction to use culori for HLS, mix and hex (check 3, finding 4). Because the capture rule compares against the unchanged tree, the builder's stop rule never triggers on the first run. The conflict first appears mid-change.
2. The lane-distance case's 1e-9 is inconsistent with culori's real output (0.0071; check 3, finding 5). It would only pass by loosening, which the spec forbids.
3. The Markdown sanitise cases cannot be exercised in the node suite (check 3, finding 6). The spec says an assertion that proves nothing is an audit, not coverage. The brief must say either that these go to the look at landing, or which DOM package to use (none is on the dependency list).
4. The terminal case "Enter goes to the next match and Shift+Enter to the previous ... as VS Code's terminal find widget" is the reverse of VS Code's. VS Code's F3, Shift+F3, Cmd+G and Cmd+Shift+G are not listed.
5. Items 3 and 5 cannot work without `allowProposedApi: true` in `gridOptions` (`grid-look.ts:62`). The brief does not state it, and `grid-look.ts` appears only as a place for an overflow helper.
6. The "--c-find-* where they exist, else the selection token" rule always falls back, because none exist. The match and the active match would then be drawn in the selection colour, not distinguishable from a selection or from each other. The two overview-ruler colours the addon's type requires are not named.
7. The image case "sizeOf on each picture fixture the tests hold answers what it answers today" holds only for the `sizeOf` fixtures. Item 8's "every picture the tests hold is unchanged" is false for three `readSize` fixtures (fill bytes, damaged EXIF, frame past SEGMENTS). The existing byte-count cases ("reads the thirty header bytes of a WebP", "gives up ... without reading it whole" at <4096 bytes, images.test.ts:447-522) contradict a 512 KB read. The brief does not say those cases and the `readSize`/`SEGMENTS` exports go.
8. The MIME case ".svg is image/svg+xml" contradicts Decision 9 (check 3, finding 9). The case "every extension of the old tables answers what it answered before" holds (probe), but `.tar.gz` changes (check 1, finding 2).
9. The TOML case "`[mcp_servers.a` (unclosed) gives malformed: true and no names" is consistent with the library. Decision 10's "as an unclosed `[` does today" is false for a file with an unclosed header and other valid ones: today some names are listed, afterwards none. That is an unstated user-visible change in the Customizations count.
10. The Gmail case is consistent with the library. The brief sentence "no `Date`-less or `Message-ID`-less oddity beyond what MailComposer writes" does not state a rule. MailComposer adds `Message-ID: <...@localhost>` and `Date`; the brief should say whether that is wanted.
11. The atomic cases are consistent. Item 7's literal `writeFileAtomic.sync(path, content, { mode })` with `mode = newMode` overrides an existing file's mode (probe: 0600 becomes 0640). The contract says it is kept, and no case covers an existing file together with a `newMode`. The symlink behaviour changes silently (see probe).

## 5. The question (could it pass without the goal being reached)

Findings:
1. **Colour: yes.** Keeping every hand formula except luminance and contrast passes both colour cases, and it is the only way to pass them. The cases do not check that culori replaced the HLS, mix and CIELAB code, so "colour math on culori" can pass with most of the math by hand. The brief has to decide which parts culori takes, given the probe.
2. **Markdown: yes.**
   - The `renderDocument` cases pass while the page shows no colour. `code.css` loaded through `?raw` in ui/theme.ts applies no rule (check 3, finding 2), and the "Stylesheet" case only checks the selectors held and a grep.
   - The sanitise cases pass trivially in node.
   - Transcript turns stay uncoloured and no case reads a turn.
   A case needs the stylesheet reaching the page (a `+layout.svelte` import) and a turn render.
3. **Stylesheet case: yes.** "`code.css` holds every selector" and the grep pass with the file imported nowhere.
4. **Terminal find: yes.** The pure parts (count words and option mapping) pass with the addon never loaded, or loaded with decorations off, in which case the count never updates. Only the look covers the real behaviour, and it needs `allowProposedApi`, which is not stated.
5. **Terminal links: yes.** The pure handler rule passes whether or not `WebLinksAddon` is constructed with that handler. Only the look covers it.
6. **Wide characters: yes.** No case at all, and without `allowProposedApi` the line throws at mount. A look item or a check of the options object is needed.
7. **Gmail: no.** The decoded-header cases need MailComposer output (or an equivalent hand encoder, which the spec's "library used for what it names" rule forbids).
8. **Atomic: partly.**
   - The mode cases pass with `{ mode: newMode }` passed unconditionally, because no case combines an existing file with a `newMode` (check 4, finding 11).
   - "`grep writeFileSync(` prints nothing" passes with the writes moved to any other plain call.
   - `tests/routes/files/source.test.ts:232` stays green whatever temporary files remain.
9. **Images: partly.** "What it answers today" for the listed fixtures passes with the hand parser kept. A case needs to show that image-size is the reader, for example a format only image-size reads, or the 512 KB byte count, which the case does include.
10. **MIME: no** for `.mjs`, `.wasm`, `.avif` and `.ico`: they need a table beyond the old one. A hand-extended table would also pass them, which the spec's library rule covers.
11. **TOML: no** for the dotted, inline, quoted and multi-line cases, short of rewriting a parser by hand.
12. **Debounce: yes.** Three events and one more under fake timers pass with the hand timers kept. The cancel case also passes with the hand timers. The brief should require `debounce` to be the only timer, for example by `grep -n "setTimeout" ` on the five files printing nothing, apart from the intervals in sessions.ts and usage/watch.ts.
13. **Dependencies case: yes.** It checks `package.json` only, not use.

## 6. Implied inputs

Findings (each with the expected result):
1. The boundaries rows: add `data/prose/languages` to the `state` and `views` rows of `tests/checks/tree/boundaries.test.ts:88-128` (and the path), or keep a state module in between. Expected: `npx vitest run tests/checks/tree/boundaries.test.ts` passes.
2. Where `code.css` is loaded: `src/routes/+layout.svelte:8-9`, beside `tokens.css` and `themes.css`. Expected: a Markdown fenced block is coloured in the doc view, the source preview and a transcript turn at the look.
3. Transcript turns: `turns.ts:155` renders through `renderDocument`, or through the same highlight extension. Expected: an assistant turn with a ```` ```ts```` fence holds `hljs-keyword`.
4. `allowProposedApi: true` in `gridOptions` (`grid-look.ts:62`), with the grid-look test updated. Expected: the grid mounts with `term.unicode.activeVersion === '11'` and the find count updates.
5. The find decoration colours: the match, the active match, and the two required overview-ruler colours, each from a named token in `#RRGGBB`. The brief should also say whether new `--c-find-*` tokens are added, since Decision 3's "no new token" covers code only.
6. The find keys: Enter is previous (upward) and Shift+Enter next, as VS Code; F3, Shift+F3, Cmd+G and Cmd+Shift+G are either named or explicitly left out.
7. The picture extension set in `images.ts` after `TYPES` goes: `images()` and `stream` keep exactly `.jpg`, `.jpeg`, `.png` and `.webp`. Expected: an `.svg` or `.gif` in a picture folder is neither listed nor served (404).
8. The fate of `readSize`, `SEGMENTS` and their byte-count cases in `images.test.ts:447-522`, and the three fixtures whose answer changes. Expected: named as removed, or ruled on as changed answers.
9. `MaxInputSize` is not exported by image-size (`dist/esm/fromFile.js:4`), so `sizeOf` needs its own 512 KB constant. Expected: the constant is `512 * 1024`.
10. `tomlTools` on a parse error, and a `mcp_servers` or `tools` value that is not a table (probe: `mcp_servers = 3` and `[[mcp_servers]]` both parse). Expected: no names. `tomlTools`'s caller has no malformed finding today, so the brief should state whether the tools reader reports one.
11. The mode rule when a file exists and `newMode` is given: the existing mode wins. Expected: `writeTextAtomic(existing0600, text, 0o640)` leaves 600. It also needs a ruling on writing through symlinks (the new behaviour) against replacing them (today).
12. The `.tar.gz` answer and the `file.test.ts:73` expectation. Expected: `application/gzip`, with the test path added. The bare-dotfile name `.png` gives `image/png`, where today it gives octet-stream.
13. The Message-ID and Date that MailComposer adds (`@localhost` domain). Expected: accepted, or a `messageId` given.
14. The debounced function for `usage/watch.ts`: `() => void refresh()` rather than `refresh`, so an in-flight refresh keeps today's timing. Expected: an event during a pending refresh waits the full wait.
15. The name clash: each watcher's wait is a local called `debounce` (`local.ts:42`, `bookmarks.ts:75`, `portfolio.ts:391`, `sessions.ts:215`, `usage/watch.ts:96`), which shadows the imported `debounce`. Expected: an import alias or a rename, named in the report.
16. The diagram profile gaining `span`. Expected: stated as intended, or `DIAGRAM_PROFILE` built without it.
17. The README dependency list (`README.md:13`) gains the eleven packages with their licences, and `README.md` joins the paths.
18. The head comment of `images.ts:12-17` ("No image library is used") and `ui/html.ts`'s `ALLOWED_TAGS` comment are rewritten. Item 12's grep rule covers these, but they are not named.

## Declined to judge

- Whether Gmail's `messages.send` keeps or rewrites MailComposer's `@localhost` Message-ID. It was not tested against Gmail.
- Whether the SSR build keeps the dynamic `import('@xterm/addon-search')` string out of `build/server` after the change. `grep -rlE "xterm" build/server` prints nothing today, but `npm run build` was not run.
- The look-only terminal behaviours: focus, the browser's own Cmd+F, and hover underline.

Agent usage: 85 tool uses, 229k tokens, 12 min (from the completion notice).

# Closed

Each finding is closed in `agents/briefs/Q83.md`; the brief's premises now carry the probes' results.

- Names 1: `tests/ui/theme/colours.test.ts` joins the paths; item 2 says its code case reads `code.css`.
- Names 2: `tests/routes/files/file.test.ts` joins the paths; item 9 and decision 11 state `.tar.gz` as `application/gzip`, with a case.
- Names 3: `tests/routes/files/source.test.ts` joins the paths; item 7 makes its leftover check compare the folder's listing, with a case that it fails when a temporary file is left.
- Names 4: `README.md` line 13 joins the paths; item 12 lists the new runtime dependencies there.
- Names 5: `customizations.test.ts` joins the paths; item 10 drops the repeated key and states the parse-error rule for both readers.
- Names 6: `tests/server/accounts/mail/write.test.ts` joins the paths.
- Names 7: `boundaries.test.ts` (the `state` row) joins the paths (Premises 1).
- Names 8: `src/routes/+layout.svelte` joins the paths (Premises 2).
- Names 9: `turns.ts` joins the paths (Step line 1).
- Step line 1: item 2 renders assistant turns through the `codeColour` extension; a case reads a turn.
- Premises 1: the highlighter's code moves to `data/prose/languages.ts`, `state/shared/words/languages.ts` re-exports it for the page layers so no state or view importer changes, and the `state` boundary row gains that one module (decision 1).
- Premises 2: `code.css` is imported by `src/routes/+layout.svelte` beside the two stylesheets; `ui/theme.ts` leaves the paths.
- Premises 3: as Step line 1.
- Premises 4: item 1 and decision 4 take from culori only what LA5 names (WCAG luminance and contrast, CIEDE2000); the HLS pair, mixing and hex stay by hand, since culori's change 1,656 derived colours.
- Premises 5: the lane case keeps today's verdicts and states the library's rounding (within 0.01 of the captured distances), the threshold of 10 unchanged.
- Premises 6: the sanitiser cases become a unit audit named as such (`span` in `ALLOWED_TAGS`, no `style` in `ALLOWED_ATTR`) and a look at landing.
- Premises 7: decision 2 states `span` in both profiles, since a diagram already allows `style` on `div`.
- Premises 8: item 8 keeps the picture set of four extensions as `PICTURES` for `images()` and `stream`, with a case that an SVG or GIF is neither listed nor served.
- Premises 9: item 9 and decision 11 give one rule: `text/*` and JSON with the charset, SVG without, `.ts`, `.mts`, `.cts` octet-stream; the case list follows it (`.mjs` as `text/javascript`).
- Premises 10: item 11 hands perfect-debounce a synchronous wrapper (`() => { void rebuild(); }`), with a case that an event during a pending rebuild waits the full wait.
- Cases 1: as Premises 4; a grep case checks the hand WCAG and CIEDE2000 functions are gone and culori imported.
- Cases 2: as Premises 5.
- Cases 3: as Premises 6.
- Cases 4: item 3 and the case take VS Code's keys: Enter, Shift+F3 and Cmd+Shift+G previous; Shift+Enter, F3 and Cmd+G next.
- Cases 5: item 3 sets `allowProposedApi: true` in `gridOptions`, with a case.
- Cases 6: item 3 and decision 6 draw matches in `--accent-bg` and the active match in `--accent`, the overview-ruler colours the same, read as 6-digit hex.
- Cases 7: item 8 removes `readSize`, `SEGMENTS` and their byte-count cases and keeps the three changed fixtures as `sizeOf` cases with image-size's answer, stated in the report.
- Cases 8: as Premises 9 and Names 2.
- Cases 9: decision 12 states the Customizations count for a broken `config.toml`; the case with an unclosed header after a valid one gives no names.
- Cases 10: item 6 and decision 8 keep MailComposer's `Message-ID` and `Date`.
- Cases 11: item 7 passes `mode` only when the file does not exist, with the existing-file-plus-`newMode` case; decision 9 states the symlink behaviour.
- Question 1: as Cases 1.
- Question 2: the stylesheet case checks the layout import; a turn case added; the sanitiser half goes to the look.
- Question 3: as Question 2.
- Question 4: `allowProposedApi` case, the key table as a pure mapping, and the look list.
- Question 5: the link handler is handed to the addon's constructor (item 4); the look covers the click.
- Question 6: the `gridOptions` case and the look's emoji item.
- Question 7: none needed.
- Question 8: the existing-file-plus-`newMode` case, and the leftover check's failing run.
- Question 9: the byte-count spy and the picture-set cases.
- Question 10: none needed.
- Question 11: none needed.
- Question 12: the `setTimeout` grep over the five watchers.
- Question 13: the dependencies case checks each package is imported by the file its item names.
- Implied inputs 1 to 18: each is written into the item named above (1 Premises 1; 2 Premises 2; 3 Step line 1; 4 Cases 5; 5 Cases 6; 6 Cases 4; 7 Premises 8; 8 Cases 7; 9 item 8's `READ_CAP`; 10 item 10; 11 Cases 11; 12 Names 2 and item 9's `extname` rule; 13 Cases 10; 14 Premises 10; 15 item 11's import name; 16 Premises 7; 17 Names 4; 18 item 12's head comments).
