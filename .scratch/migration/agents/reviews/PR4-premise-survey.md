Survey report for the presenter screen. All paths are under /Users/axelfaes/workspace/research-hub/tools/oculus. I read everything and changed nothing. I did not open config/local.yml.

## 1. How the Present view holds the slide and moves between slides

**Where the slide index lives**
- The view does not keep a numeric index. It keeps the current slide's **key** in the pane's instance state, not in a store.
  - `src/lib/state/life/present.ts:59-65`: `PresentState = { slide: string /* key, empty = first */; overview: boolean; recent: DeckRef[] }`.
  - It is parsed by `parsePresentState` at `present.ts:78-85`.
- Present.svelte reads it:
  - `:124` `const held = $derived(parsePresentState(instanceState(instance.id)));`
  - `:144` `shown = slideAt(rows, held.slide)`
  - `:145` `at = indexOf(rows, held.slide)`
  - `:146` `grid = held.overview`
- Writing goes through `write()` at `:184-186`, which calls `setInstanceState(instance.id, { ...held, ...changes })`.
- `step(by)` at `:260-263` calls `write({ slide: stepKey(rows, held.slide, by) })`.
- Helpers in `present.ts`:
  - `indexOf` `:209-212`: an unknown key falls back to 0.
  - `slideAt` `:215-217`.
  - `stepKey` `:220-223`: clamps at both ends.
- The comment at Present.svelte `:31-33` says two panes hold two positions, and a push that rebuilds the deck leaves each reader where they were.
- The deck in use is `deck = liveDeck() ?? filesDeck` (`:142`). It is drawn from unsaved source-tab drafts through `acts/live.svelte.ts`. `rows = deck?.slides` (`:143`).

**Keys**
- Handler `keys()`, Present.svelte `:265-323`. It is bound to the view's box (`onkeydown={keys}` at `:386`), not to the window.
- Any Alt, Ctrl or Meta modifier makes it return at once (`:266`).

| Key | What it does | Line |
|---|---|---|
| ArrowRight, PageDown | next slide | `:268-272` |
| ArrowLeft, PageUp | previous slide | `:273-277` |
| Home, End | first / last slide | `:278-285` |
| `o` / `O` | toggle the overview grid | `:286-290` |
| `f` / `F` | `screen.toggle()`; ignored with no rows or on key repeat | `:291-296` |
| Space / Shift+Space | next / previous; skipped when the target is a control (`inControl`) | `:297-302` |
| Escape | closes the grid only | `:303-307` |
| Tab | in full screen, `keepTab` wraps focus inside the box (keys.ts `:12-30`) | `:308-310` |

- **Default branch in full screen** (`:311-321`): every other key gets `preventDefault`, so the shell's single keys wait. The exceptions are the grid keys (`GRID_KEYS` at `:113`: j k i J K ArrowUp ArrowDown) and Enter on a control.
- The shell honours `defaultPrevented` in `src/lib/shell/keys/keys.ts:106,123,138`.
- **Focus**
  - The box grabs focus on mount unless the reader is in an input or another pane (`:237-248`).
  - `onpointerdown` focuses the box (`:388`).
  - `focusLeft` (`:326-329`) ends full screen when focus goes to an element outside the box, e.g. Cmd+Shift+F.
- **Clicks:** in full screen, `advance` (`:332-336`) moves to the next slide on a click. It does nothing over the grid, over a control, or when text is selected.
- **Grid:** `pick` (`:339-342`) sets `{slide, overview:false}`.
- **`CONTROLS` selector:** keys.ts `:5-6`.

**Full screen (PR1), in fullscreen.svelte.ts**
- `createFullscreen({box, showable})` (`:38`). It calls `element.requestFullscreen()` on the pane's own box (`:47-60`).
- `leave()` calls `document.exitFullscreen()` (`:62-67`).
- `sync()` reads `document.fullscreenElement === box` (`:75-79`). It is wired at Present.svelte `:368` as `<svelte:document onfullscreenchange={screen.sync} />`.
- **How Esc leaves:** the page never handles Esc for full screen. The browser's own Esc exits fullscreen, and `fullscreenchange` → `sync` sees it (header comment `:6-8`). The page's own Escape handler only closes the grid (Present.svelte `:303-307`).
- **Auto-leave:**
  - when it is not `showable` (tab hidden or no rows): `:98-100`, with `showable` defined at Present.svelte `:150`;
  - on unmount: `:102-109`.
- **Pointer hiding**
  - `POINTER_REST_MS = 2000` (`:13`).
  - `rouse()` (`:81-85`) sets `resting` after the rest. It is wired to `onpointermove={screen.rouse}` at Present.svelte `:389`.
  - The effect at `:89-96` starts the rest timer when full screen is entered.
  - CSS `.present.resting, .present.resting :global(*) { cursor: none; }` is at Present.svelte `:474-477`.
- **Full-screen CSS:** Present.svelte `:457-471`.
- **Toolbar control:** Bar.svelte `:61-68` is a `ToolButton` with `label=t('present.present')`, `title=present.present_tip`, `pressed={full}`, `active={full}`, `onclick={onpresent}`, disabled when `count === 0`. Present.svelte wires `onpresent={screen.toggle}` at `:359`.

**Bar.svelte, the other controls**
- deck Select `:52`
- Previous / Next `:53-54` → `onstep(±1)`
- Overview Chip `:55-60`
- Slides button `:69`, which opens the `slides` view beside the pane (Present.svelte `:360-362`)
- Export `:70-75`
- status `said` `:76`
- counter `{at}/{count}` `:77`
- Bar holds no state (`:2-6`).

**Drawing**
- Slide.svelte (`:30-75`) is the one switch from slide kind to part component (parts/Title, Section, Summary, Grid, Project, Plain).
- `first` adds the key hint `present.key_hint` (`:72-74`).
- Present.svelte draws the slide in a 1280x720 frame scaled by `fit(width,height)` (`:122`, `:415-431`). `FRAME_WIDTH`/`FRAME_HEIGHT` and `fit` are in present.ts `:174-188`.
- Panel.svelte is only one visual (figure, diagram, caption) inside a project slide. It is imported by parts/Project.svelte `:10`. It has no navigation role.

## 2. The /present/print route

**Files**
- `src/routes/present/print/+page.server.ts`
- `src/routes/present/print/+page.ts`
- `src/routes/present/print/+page.svelte`

**URL shape:** `/present/print?root=<root key>&path=<folder>`.
- It is built by `printAddress(ref)` at present.ts `:443-449`, with `PRINT_ROUTE = '/present/print'` at `:444`.
- The desktop host accepts exactly the params `path,root` (`src/desktop/decide/sender.ts:47-60`, `printTarget`).

**Load**
- `+page.server.ts:8-17` returns `text`, `glyphs`, `icons`, `vocab` and `token: locals.token`. It has no seed, socket or collections (comment `:4-7`).
- `+page.ts:6-9` calls `installPageConfig(data)` and returns `{ token }`.

**How it reads the deck** (`+page.svelte:65-81`)
- It reads `root` and `path` from `window.location.search`.
- It calls `fetch('/api/deck?root=&path=', { headers: { 'x-oculus-token': data.token } })`, then `readAnswer`, then `readAs(deckShape, ...)`.
- It is read once in `onMount` (`:83-104`). It has no live updates (no socket).
- The API route is `src/routes/api/(docs)/deck/+server.ts:26-30`, handled by `src/lib/server/content/deck/endpoint.ts`. GET requires a non-empty `root` and `path !== null` (`:40-44`).
- **Deck references:** `{root, path}`. The portfolio deck is `{ root: HUB_ROOT, path: portfolio_deck }` (`src/lib/state/life/present.svelte.ts:124-125`).
  - In tab state an empty reference names the portfolio deck (`deckRefOf`, present.ts `:101-108`).
  - A root's own folder is stored as `path: "."`.

**Drawing**
- Theme: `applyTheme(..., savedTheme(localStorage.getItem('oculus.ui.v1')))` (`:84`).
- Every slide is drawn as `<section class="slide-frame page"><div data-fit><Slide {row} {deck} first={false} /></div></section>` (`:116-122`) at 1280x720, with `@page` size set (`:128-140`).
- `fitSlides` scales tall slides down (`:55-62`).
- When ready it sets `data-ready` on `[data-print-root]`; on failure it sets `data-failed` (`:107-112`).
- In a browser (no bridge) it calls `window.print()` (`:102`).

**Other standalone routes**
- `/find` (`src/routes/find/+page.svelte`, `+page.ts`, `+page.server.ts`) is the desktop find bar. It has no client state or socket, and uses `desktopOf(window,'')?.bridge`.
- No other route draws a single slide. The only routes are `/` (shell), `/find`, `/present/print`, `/apps/[...path]` and `/api/**`.

## 3. How a slide's `notes` reaches the page

- **Type:** `src/lib/data/model/model-entities.ts:362-371`, `SlideBase = { key; title; notes?: string; source?: DeckSlideSource }`.
  - `DeckSlide` is the union starting at `:383`, exported via `src/lib/data/model/index.ts:371`.
  - It is re-exported as `DeckSlide` from `$lib/state/life/present`.
- **Reader:** `src/lib/data/sources/deck/kinds.ts:232-234`:
  ```ts
  const notes = str(meta.notes);
  const withNotes = <T extends object>(slide: T): T =>
      notes === undefined ? slide : { ...slide, notes };
  ```
  - `meta` is the slide's own front matter (deck/split.ts `:1-27`, `RawSlide = { meta, body }`).
  - Every file-made kind is wrapped in `withNotes`: title, closing `:243`, section `:257`, text `:270`, image `:274`, columns `:287`, equation `:300`, code `:312`, project `:324`, idea `:337`.
  - **Summary and grid slides, built from `present.yml` entries in `deck/read.ts:400-430`, carry no `notes`.**
- **Transport:** notes come with the whole deck on GET /api/deck. `deckShape` (present.ts `:424-436`) is `unchangedAs`, so extra fields pass through unchanged.
- **Display:** no view shows `notes` today. A grep for `.notes` or `notes` in `src/lib/views/academic` and `src/lib/state/life/present*` finds nothing.
- **Docs and tests:** neither docs/views.md "Present" nor any test mentions slide notes.

## 4. The desktop host

**Bridge**
- The preload `src/desktop/preload.cjs:22-51` exposes `window.oculusDesktop` with:
  `openFloatWindow, closeSelf, focusMain, dropOutside, answerDrop, saveLayout (sync), showFind, find, stopFind, closeFind, printPdf, spelling, on(event, listener)`.
- `on()` listens on the single host→page channel `'oculus:event'` and filters by name.
- **Channel names:** `src/desktop/decide/channels.ts:6-38`.
  - Page → host: `oculus:save-layout`, `oculus:open-float-window`, `oculus:close-self`, `oculus:focus-main`, `oculus:show-find`, `oculus:find`, `oculus:stop-find`, `oculus:close-find`, `oculus:print-pdf`, `oculus:drop-outside`, `oculus:drop-taken`.
  - Host → page: `EVENT = 'oculus:event'`.
  - `PRINT_CHANNELS = []`.
- The preload spells these names out again because a sandboxed preload cannot import channels.ts (channels.ts `:1-3`).
- **Page-side types:** `src/lib/state/shared/stores/desktop.ts`.
  - `DesktopEvents` (`:51-66`): bounds, drop-here, command, found, shown, restore, move-to.
  - `DesktopBridge` (`:69-99`).
  - `Desktop = { bridge; float: string | null }` (`:102`).
  - `desktopOf(win, search)` (`:111-116`) reads `?float=`.
  - It is read once in `src/routes/+page.svelte:48-50` and handed to the client. Present gets it as `desktop` from `useState()` (Present.svelte `:100`, `:162`).
- **Who may call** (`src/desktop/decide/sender.ts:26-40`):
  - `senderOf` returns `'find-bar'` for `/find` and `'print'` for `/present/print`; every other path of the server origin, top frame only, is `'page'`.
  - `mayCall`: `'page'` may call any channel.
  - `bridge.ts:101-113` (`callerOf`) checks the sender, then registers its handlers (`:115-225`).
- **A new standalone route would be a `'page'` sender with full bridge rights** unless sender.ts is extended.

**windows.ts**
- **Window kinds:** `'main' | 'float'` (`:41-52`).
- `openMain` (`:360-383`) loads `${origin}/`.
- `openFloat(id, bounds, origin)` (`:385-404`) makes a **visible** second window that loads `${origin}/?float=<id>`. It is reached over the bridge `oculus:open-float-window` (bridge.ts `:123-128`).
  - That is the "Move into New Window" of a float (docs/window.md `:50`, `:53`; DESIGN.md `:574`).
  - So the host can open a second visible window today, but only on the shell page with a float id.
- **Navigation guard:** `guard()` (`:189-206`) routes every `window.open` and navigation through `linkDecision` (`src/desktop/decide/links.ts:44-53`).
  - Only `/` with nothing or `?float=<id>` opens an app window.
  - **Any other same-origin path, e.g. a new `/present/...` route, goes to the default browser** (`links.ts:49-51`).
  - `inPlace` (`:175-186`) lets a reload through only for `pathname === '/'` and the window's own search.
- **Choosing a display**
  - `displays()` (`:91-97`) uses Electron `screen.getAllDisplays()` and `getPrimaryDisplay()` work areas.
  - `placeWindow(saved, areas, primary)` (`src/desktop/decide/place.ts:63-67`) keeps saved bounds on the display that shows them, otherwise moves onto the primary display, otherwise centres the default size.
  - A float with no bounds opens at primary + 28 px cascade, 600x400 (`:388-398`).
  - **Nothing chooses a non-primary or "external" display on purpose, and nothing calls `setFullScreen` on a chosen display.** The only `setFullScreen` is `openMain` restoring a saved state (`:377`).
- **Electron `screen` module:** used only in `windows.ts:12` and `:92-96`.
- **Full screen in the window:** HTML fullscreen events are recorded (`:250-251`, `:277-287`; `decide/window-file.ts`). The `fullscreen` permission is granted in `src/desktop/decide/permissions.ts:7`.
- **print.ts:** `printPdf` (`:40-75`) makes a hidden `BrowserWindow({show:false, 1280x720})`.
  - It denies `window.open` and allows navigation only to the exact address.
  - It polls `[data-print-root][data-ready|data-failed]` (`:25-27`, `:61-67`), then `printToPDF`, then destroys the window.
  - It is not in the windows list. It is wired in `src/desktop/app.ts:131`.
- **menu.ts**
  - `MenuActions` (`:12-18`): newWindow, closeWindow, command('settings'|'help'), zoom, switchToMain.
  - View menu `togglefullscreen`, Ctrl+Cmd+F (`:77-81`).
  - File > New Window, Cmd+Shift+N (`:45-49`).
  - Window > Switch to Main (`:114`).
  - Nothing is Present-specific.

## 5. Existing cross-window / cross-tab sync

- **BroadcastChannel:** not used anywhere in src.
- **`storage` events:** `src/lib/state/shared/stores/storage-events.ts:8-14` (`followKey`). It has two users:
  - **Instance state (this is what Present's slide key lives in):** `src/lib/state/workbench/ui.svelte.ts`.
    - Key `UI_KEY = 'oculus.ui.v1'` (`:34`).
    - `setInstanceState` (`:609-611`) calls `save()`, which writes localStorage synchronously (`:517-531`) after merging with the saved records (`mergedInstances` `:486-502`).
    - Other tabs/windows hear it through `followKey(source, UI_KEY, takeSavedInstances)` (`:414-419`). `takeSavedInstances` (`:508-515`) replaces their `instances` map.
    - It is attached in `src/routes/+page.svelte:228` as `loadUi(localStorage, window)`.
    - Header comment `:14-19` describes this.
    - **Consequence:** a second shell page or desktop window (they share one origin storage) that draws the same instance id would already see `slide` changes through the storage event. Different instances do not share a position.
  - **Layout:** `src/lib/state/workbench/layout/saved/storage.ts:297-298` follows `oculus.layout.v1` and `oculus.layout.writes.v1`.
    - In the desktop app, layout saves also take a turn through the host (`:14-19`; `decide/save-turn.ts`; `src/lib/shell/desktop-windows.svelte.ts`).
- **Server socket**
  - Channels are server-published state. The server keeps only the latest message per channel (`src/lib/server/core/channels.ts:1-17`).
  - The page subscribes with `{type:'subscribe', channels, token}` (`src/lib/state/client/socket.svelte.ts:197`, `subscribe(names)` `:226-231`, `unsubscribe` `:238`).
  - The server accepts only subscribe messages, plus pty input/resize and lsp frames (`src/lib/server/root/socket.ts:1-14`, `:80-99`, `:142-150`). **A page cannot publish to a channel.**
  - There is no per-user or presenter channel. Every subscribed sink of any window gets the same broadcast (single user, 127.0.0.1).
  - The Present store listens to `files`, `portfolio` and `config` to mark decks stale (`src/lib/state/life/present.svelte.ts:75`).

## 6. How a top-level route is added and served

- SvelteKit filesystem routes under `src/routes`.
  - The root `+layout.svelte` (`:1-48`) applies to every route: theme CSS, `themes/slide.css`, favicon, TooltipGroup.
  - `+layout.ts:2` sets `export const ssr = false` for all routes.
  - There are no nested or group layouts for pages.
- The shell is `src/routes/+page.svelte`, plus `+page.ts` (`installPageConfig`, `:20-23`) and `+page.server.ts`.
- **Routes outside the shell:** `/present/print` and `/find`.
  - Each has its own `+page.server.ts` returning the catalogs and token, and a `+page.ts` calling `installPageConfig(data)`.
  - Each calls `provideTipIds(createTipIds())` and `applyTheme` from the saved theme itself.
- **hooks.server.ts:**
  - The origin/token guard covers only `/api/` routes (`:7`, `:49-60`).
  - The CSP `frame-src 'self'` is set only on route id `/` (`:10`, `:110`).
  - A new page route is served with no extra registration.
  - The view registry (`src/routes/views.ts`) is only for shell views.

## 7. Text strings and the shortcuts list

- **Present strings:** `config/text/views/academic/present.yml`, under `text.present.*` (`:3-60`). Notable keys:
  - `key_hint` `:39`
  - `present` `:50`, `present_tip` `:51` ("... (F, while the deck has the focus)")
  - `next` `:47`, `previous` `:53`, `overview` `:48`, `counter` `:9`, `toolbar` `:60`, `title` `:59`
  - `views.present` `:62`
- **Desktop print strings:** `desktop.print.*` in `config/text/desktop.yml`, used in `acts/export.ts:94-95`.
- **Shortcuts sheet**
  - Rows are `config/text/app.yml:10-13` (`app.keys.rows`, a single `;;`-separated string of `key | description`).
  - It is joined in the app with `desktop.keys.rows` (`config/text/desktop.yml:25-26`) at `src/lib/shell/Workbench.svelte:271-272`.
  - **No Present keys (O, F, arrows, Space) are listed there.** Only `t1 | open a view of the Present page's group` is.
  - The Present keys are documented only in `present.key_hint` and `present_tip`, and in docs/views.md.

## 8. Docs

- **`docs/views.md` "## Present", lines 95-107:**
  - `:97` deck, menu and tabs
  - `:99` full screen: Present control and `F`, Esc leaves, arrows / Space / click, pointer hides after 2 s, shell keys wait, focus leaving ends it, ends when the tab is hidden or the deck is empty
  - `:101` Slides catalog
  - `:103` slide acts, image drop
  - `:105` live drafts
  - `:107` Export to PDF: desktop hidden window, browser print tab
- **`docs/window.md`:**
  - `:50` Float and "Move into New Window (in the app)"
  - `:53` pane menu
- **`DESIGN.md`:**
  - `:478` Decks bullet: `api/deck`, staleness channels, tab identity, "Full screen is the deck box's own, read from the document's `fullscreenchange`...", acts, drafts, Export via `/present/print` and `printToPDF`
  - `:570` native window: page full screen puts the window in full screen; bridge only for the top frame; links decision
  - `:574` windows: floats as windows `?float=<id>`, shared arrangement via save turn, print hidden window "is answered no bridge channel and is no entry of the windows list"
  - **No line mentions "presenter".**

## 9. Tests

- **No test covers the Present view, its keys, full screen, `state/life/present.ts` helpers (`stepKey`, `parsePresentState`, `printAddress`), or slide `notes`.**
- `tests/fixtures/present.ts` is unrelated: a generic `present(value, what)` helper.
- Deck-related tests:
  - `tests/data/sources/present.test.ts`: `splitSlides` `:36`, deck reader `:119`, `outlineOf` `:245`. Its "notes" at `:268`/`:290` is a deck name, not slide notes.
  - `tests/routes/docs/deck.test.ts`: GET/POST /api/deck.
  - `tests/routes/edit/deck-slides.test.ts`
  - `tests/server/edit/deck-acts.test.ts`, `tests/server/edit/deck-edit.test.ts`
  - `tests/server/desktop/window-guard.test.ts`: `senderOf`, `mayCall`, `printTarget`, `linkDecision`, including `/present/print` cases at `:61-64` and `:74-85`.

Agent: a8b16cccec475fcc3, claude-opus-5-5, 129,421 tokens, 49 tool uses, 3.7 min.
