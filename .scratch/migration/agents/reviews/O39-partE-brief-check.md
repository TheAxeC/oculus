# Brief check: O39 part E (`.scratch/migration/agents/briefs/O39-partE.md`, 115 lines, uncommitted, read on main at 65ceceae)

Usage: aece82159cd53f676, claude-opus-5-5, 221577 tokens, 71 tool uses, 10 min 19 s.

## Names

Command: `git grep -n -F "<name>" -- . ':!config/local.yml' ':!.scratch'` for each name. Hits outside the brief's "Paths this step writes":

1. `startOf`: `src/lib/state/shared/words/appearance.ts:41`, `:504`, `:512`. Not made false as long as `startOf`'s signature stays the same. `src/lib/state/system/machine/lsp/hierarchy.ts:80,99` and `src/lib/state/workbench/layout/open/float/folder-opener.ts:85,127` are other functions with the same local name and are unaffected.
2. `startClass`: `appearance.ts:510`; `src/lib/shell/window/appearance.svelte.ts:36,130` (in the write list, head comment only); `src/lib/ui/theme/app-theme.ts:26,220` (in the write list); `tests/server/desktop/window-guard.test.ts:38,400`, which asserts `[startClass(true), startClass(false)]` equals `['vscode-dark-modern', '']`. Not made false unless the signature changes.
3. `windowStart`: `tests/server/desktop/window-guard.test.ts:31,347,350,393`, which is not in the write list. The server needs a start for an unmarked request with no `app_theme` start, and `windowStart` (`start-theme.ts:62-73`) always passes `config.app_theme`. If the builder adds an in-app parameter to `windowStart`, these four calls break. If the builder adds a separate function, they hold. The brief names neither path, and `window-guard.test.ts` is outside the write list.
4. `transformPageChunk` and `%oculus.title%`: `tests/server/root/hooks-server.test.ts:48-49` is G11's test ("reads it once for a page, whose title and load function share the read", `guarded.md:184-185`). It calls the hook's `transformPageChunk` on `<title>%oculus.title%</title>` and asserts `loadConfig` is called once (`:51-52`). The change reaches this test directly: a second config read, or a read of `locals.server.apps` that the context fixture does not serve, turns it red. The file is not in the write list and the verify list in the brief does not name it (finding under Cases and checks).
5. `firstAppThemes`: `src/lib/server/root/process/parent.ts:12`, `src/lib/state/shared/page/install.ts:6`, `src/routes/find/+page.server.ts:3,20`, `src/routes/present/print/+page.server.ts:3,20`, `src/routes/present/show/+page.server.ts:3,20`, `src/server.ts:57,117`. I read each comment and call (parent.ts:1-16, install.ts:1-9, find/+page.server.ts:1-22, server.ts:108-120); each stays true. The route that defines it, `src/lib/server/machine/apps/routes/theme.ts`, is not in the write list. Its head comment becomes false: `:3-4` "The page converts the answer into oculus's theme tokens, since the server may not import the themes folder." and `:13-15` "a page's first load carries the themes ... so a page whose theme is an app's draws it from its first paint". It is also missing from item 4's comment list.
6. `APP_THEME_CLASS`: `src/lib/data/helpers/files/apps/choices.ts:16` (the definition), `appearance.ts:43,452,475,478`, `src/lib/ui/theme/app-rules.ts:7,19`. None is made false by a move. A conversion module under `src/lib/themes/` cannot import this constant from `data/` (see Premises 1).
7. `oculus-app-theme`: the only hit outside `app-theme.ts:43` is `tests/server/desktop/app-theme-start.test.ts:158`, a scratch-folder prefix that has nothing to do with the style id. Nothing in the brief makes the server and `paintAppTheme` share one constant for the id, so the hook can write a second literal (finding under Cases and checks, item 4).
8. `convertAppTheme`, `appThemeBlock`: every hit is in `app-theme.ts` or `start-colours.ts`, both in the write list.
9. A sentence that becomes false outside the write list: `src/routes/+layout.ts:1`, "The app renders in the browser. The server's job is data and the socket, not HTML." After the step, the server writes the theme into the HTML. This is my reading; the orchestrator decides whether the sentence counts as false.

## The step line

Step line: `plan.md:655`. Booking: `plan.md:664`. Rulings: `plan.md:2314`, `:2316`, `:2457`, found with `grep -n` of their openings.

1. Booking 664, "the first HTML carries the start theme (its class, and for an app theme the block the host converts), so the page's first paint is the start theme's ground": served by items 1 and 2.
2. Ruling 186, "an app's colour theme is drawn from a window's first paint ... the page converts it before it first paints, and the desktop host converts the same file": served by items 1 and 2. The ruling's means ("the page converts it before it first paints") is replaced by a server-side conversion, and the brief does not say it departs from the ruling's mechanism. The booking at 664 shows the premise is wrong: the page's script cannot run before its first paint. Under `spec.md:18` a departure from a ruling is a shape to report, and the "Decisions" section does not list this one.
3. Ruling 186 covers both `theme` and `app_theme` naming an app's theme. No case covers `app_theme` naming an approved app's theme on a marked request versus an unmarked one. C4 covers `theme` only.
4. Ruling "Start theme while an app theme loads" (passing over to the `app_theme` start for an app theme that is pending, not offered or not loaded): served by item 1's pass-over sentence and C5.
5. Ruling O39 closing, the look in the packaged app: served by C8, as the orchestrator's look. Two of its parts have no requirement anywhere in the brief: the packaged app (`npm run app:package`, `~/Applications/Oculus.app`) must be rebuilt from main after landing before C8 can show anything, and the look must be written under "Taken" in `agents/reviews/owed-looks.md` before the step is ticked. Both are the orchestrator's, but C8 does not name them.
6. Item 3's mark is a wire format between the host and the server (a request header name or a user-agent token). The brief leaves the means to the builder. `spec.md:18` allows that only as a decision reported afterwards. The ledger's precedent (`plan.md` ruling Z831, "the wire formats the change adds", taken at the brief check) settles wire formats before dispatch.

## Premises

1. Does not reproduce: layer rules. Item 2 says "within the layer rules of `spec.md:55` (nothing client-side imports `lib/server/`)". `spec.md:55` names `tests/checks/tree/boundaries.test.ts` as the enforcer, and its table (`:335-337`) reads `server: ['server/**', 'data/**']`, `data: ['data/**']`, `themes: ['themes/**']`. Consequences:
   - A module under `src/lib/server/` or `src/lib/data/helpers/editor/` may not import the conversion from `src/lib/themes/`. `theme.ts:3-4` already says "the server may not import the themes folder".
   - A module under `src/lib/themes/` may not import `APP_THEME_CLASS` from `data/`.
   - `src/hooks.server.ts` and `src/desktop/` are outside `LAYERS` (`boundaries.test.ts:20`), so only the hook itself can call the conversion. That contradicts "the hook stays a thin caller: the computation lives in a module of its own under `src/lib/server/` or `src/lib/data/helpers/editor/`".
2. Does not reproduce: folder sizes. `git ls-files -co --exclude-standard <dir>`, counting the items directly inside each folder, gives `src/lib/themes 10`, `src/lib/server 10`, `src/desktop 10`, `src/desktop/windows 10`, `src/lib/data/helpers/editor 3`, `tests/server/desktop 9`. `spec.md:48` allows at most ten. A new file directly in `src/lib/themes/` ("the module the conversion moves to, under `src/lib/themes/`"), directly in `src/lib/server/`, or a new host file directly in `src/desktop/` or `src/desktop/windows/` fails `utils/folder-check.sh`. Only an existing file (for example `vscode-map.ts`, 585 lines) or a subfolder fits.
3. Does not reproduce: "none reads the HTML the server sends (`grep -rln "transformPageChunk\|app.html" tests` prints nothing)". The command prints `tests/checks/source/history.test.ts` and `tests/server/root/hooks-server.test.ts`, exit 0. The second is G11's test of the hook (Names 4). The brief's claim is true only of G118's three files.
4. Wrong line: "`locals.config()` (`src/routes/+page.server.ts:69`, ...)". `grep -n` gives `58: const read = locals.config();`, and the quoted sentence is at `:18`. Line 69 is `hubs,`.
5. Wrong lines in `app-theme.ts`: `convertAppTheme` is at `:59` (the doc comment at `:58`, the function `:59-66`), not `:20-30`. The `?raw` imports are at `:37-38`, not `:36-37`. `paintAppTheme` is at `:95-111`, not `:56-70`. "replaces the element's text when the element is there, `:96`": line 96 is `const present = document.getElementById(STYLE_ID);`, and the replacement is at `:102-104`. The head comment is `:1-13`, not `:1-12`.
6. Wrong line: `inApp = desktop !== undefined` is at `appearance.svelte.ts:77` (`grep -n "const inApp"`), not `:76`.
7. Off by a few lines: `appThemeBlock` is at `start-colours.ts:78-90` (doc comment from `:78`, function `:82`), not `:80-92`. `startColours` is at `:92-115` (function at `:97`).
8. Reproduce as stated:
   - `hooks.server.ts:101-103` and 109 lines.
   - `+layout.ts:2`; `app.html:7` and `:10`.
   - `theme.ts:51` (`firstAppThemes`); `ui/theme/theme.ts:138`; `app-theme.ts:43`; `app-theme.ts:208-225`.
   - `start-theme.ts:1-11`, `:42-52`, `:62-73` and 73 lines.
   - `appearance.ts:497-513`.
   - `windows.ts:190,204,217-228,373,401,446,472`.
   - `config/defaults/appearance.yml:9,60,63`.
   - `guarded.md:336-338`; `start-colours.ts:1-23` and 115 lines; `app-theme.ts` 226 lines; `windows.ts` 541 lines.
   - `grep -rn "userAgent\|user-agent" src/lib/server src/hooks.server.ts` prints nothing (exit 1).
   - `standards:` at `orchestrator-state.md:11`.
9. Incomplete: "the host loads `${origin}/` ... with `webContents.loadURL`, `windows.ts:190,204,446,472`". The host makes three more surfaces that load app.html pages, and all three have the preload, so their pages draw with in-app true:
   - the audience window, `src/desktop/windows/show.ts:92-109`, which loads `/present/show`;
   - the print window, `print.ts:46-58`;
   - the find bar's view, `find-bar.ts:49,81`, which loads `/find`.

   The audience and print pages draw with `desktopOf(window,'') !== undefined` (`present/show/+page.svelte:183`, `present/print/+page.svelte:72`), and the find page with `true` (`find/+page.svelte:62`). The write list names `windows.ts` and "the host file that sets the mark", singular. A mark set per window inside `windows.ts` misses these three, and `show.ts`, `print.ts` and `find-bar.ts` are not in the write list. All windows use `session.defaultSession` (`app.ts:159`; `show.ts:8` says so), so a mark set on the session in `app.ts` would cover them.
10. Not stated: with `ssr = false`, SvelteKit sends the HTML without running load functions (`node_modules/@sveltejs/kit/src/runtime/server/page/index.js:140-142`, "provide nodes without running load functions"). The page data therefore comes from a second request. Item 1's "The theme is the one the page's first draw will choose ... over the request's merged config" reads two different requests, and they agree only while nothing changes between them.
11. The base copy `.agents/worktrees/migration-O39-partE-base/` does not exist yet (`ls .agents/worktrees/` lists `gate`, the O54, O64 and O65 worktrees and their bases). The brief says it is made at preparation.

## Cases and checks

1. G11 is missing. The step changes `src/hooks.server.ts`, which is G11's Code (`guarded.md:184`). `spec.md:59` says "A step whose change touches an entry's code runs that entry's test". Verify item 2 lists only G118's files, and neither "Read" nor the write list names `tests/server/root/hooks-server.test.ts`. The brief also does not settle whether the hook's new HTML rows belong to G118 (the new module as a unit) or to G11 (the hook as a unit); `spec.md:59` keeps one test per unit per entry.
2. C6 is inconsistent with the paragraph after the cases. That paragraph says "C1 to C6 and C10 are rows of G118's tests", while C6 says "Test or reading, named".
3. C9 is inconsistent with the TEST practice. The `theme` option is a workspace setting (`ui.svelte.ts:279-280`, read from the merged config), so setting "a dark theme" on TEST writes Axel's workspace file and changes his working pages too. "No light frame" seen by eye on a reload can miss a single frame; C8 asks for a recording, C9 does not.
4. C4's check, "the same CSS text the page's conversion makes from the same file", holds by construction once item 2 has both sides call one function. The style id is matched by a literal on each side unless a shared constant is required, and the brief does not require one. The match is what C7's "one element, not two" rests on.
5. C10 contradicts itself. "As today's hook sends it" includes today's throw when `app.title` is missing (`hooks.server.ts:95-97`), which is an error page, while the case says "never an error page". Its input is also two different things: "a config cannot be read" and "a finding the read still answers".
6. C8 asks for "the packaged app", which needs `npm run app:package` from landed main first (step line, finding 5). Without that rebuild the look shows the old build.
7. The opening sentence says "the first run of every case above on the unchanged tree", which includes C8 and C9. The builder runs no page (`spec.md:64`), and only the later bullet makes those two readings.
8. C4's test needs the `?raw` sheets mocked. `app-theme-start.test.ts:12-13` says "Vitest empties a stylesheet a module reads as text". If the hook imports `?raw`, a test of the hook needs the same `vi.mock` lines (`:34-35`). The brief does not say so.
9. No case asks the builder to check, quote or explain a place the step does not change. C7 reads `app-theme.ts`, which is in the write list.

## The question

The goal: a desktop window and a browser tab show the start theme's ground from their first paint.

1. C1, C2, C3, C5, C10: yes, each could pass without the goal. Each asserts only the HTML string. They pass even when the page's first `applyTheme` (`theme.ts:128-138`) then sets a different class string, which happens with `crt`, `rice-plain`, `rice-sans` or `wall` (`appearance.svelte.ts:117,132-140`), with the find page in a browser (draw with `true`), and with the two-request race (Premises 10).
2. C4: yes. The equality holds by construction (Cases 4), and the test does not check that the element's id is the one `paintAppTheme` looks up.
3. C6: yes. `/find` in a browser tab gets the browser start from the server while its page draws the desktop start (`find/+page.svelte:62`), so the HTML can match `/` while the find page changes colour.
4. C7: no. It reads the one place that decides between one element and two.
5. C8: partly. It is the only end-to-end proof, and it covers the main window's first open only. A float window, a reload, the audience window, the print window, the find bar and a window onto an oculus the app did not start are not looked at, so a mark that misses them passes C8. It also proves nothing without the packaged app rebuilt.
6. C9: yes. A by-eye look on a reload can miss a one-frame light flash.
7. The step line check (booking 664, ruling 186, ruling O39 closing): yes for ruling 186's `app_theme` half, which has no case (step line 3). The owed-looks entry and the repackaging are not in the brief.
8. Item 1: yes, at unit level, for the reasons under 1 above. "No change of colour" is not true with the CRT overlay or a wallpaper.
9. Item 2: no. It is a structure requirement, but it cannot be built as written (Premises 1 and 2).
10. Item 3: yes. Only the server's read of a synthetic mark is tested. The host's setting of it has no test and no look beyond C8's first open.
11. Item 4: no effect on the goal. Its list misses `theme.ts:1-16` (Names 5).

## Implied inputs

1. `app_theme` names an approved, enabled app's theme whose file resolves, and `theme` is empty. Expected: a marked request gets `<body class="app-theme">` with the block; an unmarked one gets the first row (Light, the empty class) and no style element. Missing; ruling 186 covers it.
2. A class or CSS text that reaches HTML.
   - A `themes:` row whose class holds several words (`config/defaults/appearance.yml:21-23`, for example `rice kanagawalotus`). Expected: the whole string on `<body class>`.
   - A row whose class holds `"`, `<` or `&`. `themeRowShape` takes any string (`appearance.ts:296`), and so does `windowStart` (`start-theme.ts:69`). Expected: escaped in the attribute, or the row given the empty class. G5 (`guarded.md`) says hub text reaches HTML only through the sanitiser, and the brief does not mention it.
   - The hook's `html.replace(..., string)` treats `$&`, `` $` ``, `$'` and `$$` in the replacement as patterns. Expected: inserted literally, for example by a replacer function.
3. CRT on (`crt.on`), and the rice toggles off (`rice.brackets` or `rice.monospace` off). Expected: the first HTML's body class equals the string `applyTheme` would set (`theme.ts:128-137`: the theme class plus `crt`, `rice-plain`, `rice-sans`), or the brief states that the overlay and the font arrive with the script. Missing; item 1's "no change of colour" is false for CRT.
4. A page with a wallpaper. The page adds `wall` (`appearance.svelte.ts:117`) and sets the wall properties from the script (`theme.ts:95-111`). Expected: the theme's ground first, then the wallpaper, stated as accepted. Missing.
5. The presenter's audience window, the print window and the find bar's view (Premises 9). Expected: their requests carry the mark, and their first HTML is the desktop start. Missing from the write list and from the cases.
6. A reload (Cmd-R, `location.reload`), `moveTo`'s `loadURL` (`windows.ts:204`), `follow` (`:190`), and a window onto an oculus the app did not start. Item 3 names these, but no case or look covers any of them. A mark passed as `loadURL`'s `extraHeaders` would not survive a reload. Expected: every one marked.
7. A request from a desktop window to another origin (an app's frame, a web frame). Expected: the mark is sent only to the server's origin, or the brief states it is harmless. Missing.
8. The light theme's empty class: covered by C1 (`<body class="">` or no class).
9. A reload after the theme changed: expected to give the new theme. The per-request read covers it (`hooks.server.ts:88-89`, G61). No case, and none is needed beyond C3.
10. An app theme whose file changes after the server started, or any change between the HTML request and the page-data request (Premises 10). Expected: the HTML uses the file as it is at that request, and the page redraws to the data's theme with one change of colour, stated as accepted. Missing.
11. A request to an API route. Expected: no config or apps read for it, so the theme is computed inside `transformPageChunk`. `hooks.server.ts:67-70` says "a request to an API route that never asks reads nothing", and G11's row asserts one read. Missing as a requirement.
12. `/find` opened in a browser tab. Expected: the brief either accepts that the server's start (browser) differs from the page's draw (`inApp` true), or sends the desktop start for `/find`. Missing.

## ADRs

1. The folder does not exist. `ls docs/adr` prints "ls: docs/adr: No such file or directory".

## Dictated text

1. The brief dictates no line of text for a file. `grep -n '"[^"]*"'` over the brief finds quotations of the plan (`:11`, `:17`), the report's first line (`:107`), and the expected outputs of C2 and C3 (`:32` `<body class="vscode-dark-modern">`, `:33` `<body class="dark">`). As expected outputs, those two leave out the attribute the body already carries (`app.html:10`, `data-sveltekit-preload-data="hover"`), so a test cannot match them literally. `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Declined to judge

1. Whether Electron's default user agent already carries `Electron/` and the app's name, which would let the server tell the desktop window from a browser without any change to the host. `node_modules/electron/electron.d.ts:2003-2012` documents `userAgentFallback` but not its default value, and starting Electron is outside this check.
2. Whether `start-theme.ts:59-60`, "A row whose class is not words has the empty class", is false against `:69`. That depends on whether "words" means "a string", which the reading does not settle.
3. Whether the paths of O54, O64 and O65, which are in flight, overlap this step's paths. That comparison is the spec skill's own step, and this brief check does not include it.

## Closed

Each finding is closed by a change to the brief `agents/briefs/O39-partE.md` (rewritten on main, uncommitted until the preparation commit) or, where named, to `plan.md`.

- Names 1, 2, 3: item 2 keeps `startOf`, `startClass` and `windowStart` with their signatures; the request's start is a new function. `window-guard.test.ts` is read and run (verify 2), not written.
- Names 4 and Cases 1: G11's test `tests/server/root/hooks-server.test.ts` joins the write list, the Read list and verify 2; the hook's HTML rows are G11's (the hook is G11's unit), the request-start function's rows G118's; C16 requires the theme to be computed inside `transformPageChunk` from the one `locals.config()` read, G11's existing row unchanged and passing.
- Names 5 and The question 11: `src/lib/server/machine/apps/routes/theme.ts` joins the write list (the request-start function lives there) and item 4's comment list.
- Names 6, 7 and Cases 4, The question 2: the conversion takes the class as an argument (themes cannot import `data/`), and the style id is one exported constant of the themes module that the hook and `paintAppTheme` both import; C4 asserts the element's id is that constant.
- Names 9: `src/routes/+layout.ts:1` joins the write list and item 4.
- Step line 2: premise corrected in `plan.md` under O39 (the ruling's result is kept, its "the page converts it before it first paints" cannot hold since the page's script runs after its first paint) and stated under "What is on the tree" and Decisions 1.
- Step line 3 and Implied 1: new case C12 (`app_theme` naming an approved app's theme, marked and unmarked).
- Step line 5 and Cases 6: C8 names the orchestrator's `npm run app:package` from landed main before the look and the "Taken" entry in `agents/reviews/owed-looks.md` before the tick.
- Step line 6: the mark is taken in the brief (Decisions 3): a user-agent token `oculus-desktop` the host appends to `session.defaultSession`'s user agent at start, read by the server, the constant shared from `start-theme.ts`. Reason: it rides every request of every window on the default session (the main window, float windows, a reload, `moveTo` and `follow`, the audience and print windows, the find bar, a window onto an oculus the app did not start), needs no per-load option and no query.
- Premises 1 and 2: item 2 rewritten to the layer table and the folder counts: the pure conversion and the style id go into the existing `src/lib/themes/vscode-map.ts` with the class name as an argument; the body-class join and the CRT and rice class names into the existing `data/helpers/editor/start-theme.ts`, which joins the `ui` row of the layer table with its reason; the request's start into the existing `server/machine/apps/routes/theme.ts`; the hook, outside the layers, calls the request's start and the conversion. No new file directly in a folder at ten.
- Premises 3 to 7: the lines corrected in "What is on the tree".
- Premises 9 and Implied 5, 6: the mark is on the session, so `show.ts`, `print.ts` and `find-bar.ts` need no change; C6 covers the float window, the audience, print and find pages by test of the server's start for each path.
- Premises 10 and Implied 10: stated under "What is on the tree" and accepted in Decisions 4 (one redraw when the config changes between the two requests).
- Premises 11: the base copy is made at preparation, as the brief says.
- Cases 2: C6 is a test.
- Cases 3 and The question 6: C9 is taken on the scratch setup of the part A look (scratch HOME and hub, port 8797), under a screen recording, never on TEST's workspace.
- Cases 5: C10 rewritten: a config the read answers with a finding; a throw in the theme's computation sends the HTML with no theme, while the title behaves as today.
- Cases 7: the first-run sentence names the cases that are tests and readings; C8 and C9 are the look.
- Cases 8: the `?raw` mocks are named for a test of the hook.
- The question 1, 3, 8 and Implied 3, 12: new case C11 (CRT on and rice toggles off: the body class equals `applyTheme`'s string, both made by one join); the find page draws with `desktopOf(window, '') !== undefined` as the audience and print pages do (`src/routes/find/+page.svelte` joins the write list), C13; the wallpaper arrives with the script, stated and accepted (Decisions 5).
- The question 5 and 10: C8's look covers a float window, a reload and the find bar as well as the first open.
- Implied 2: new cases C14 (a class with `"`, `<`, `&` and `$&`) and C15 (a block holding `<` is not sent).
- Implied 7: Decisions 3 states the token reaches the other origins a desktop window's frames load, and that it carries no user data.
- Implied 11: C16.
- Dictated text 1: C2 and C3 name the class attribute, not the whole tag.
- Declined 3: the spec skill's path comparison is done in the dispatch entry's `shared_paths`.
