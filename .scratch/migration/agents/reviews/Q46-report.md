# Q46 report

Everything in the brief is done.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. Picture sizes read on the server | DONE | `src/lib/server/images.ts`: `readSize(read: ReadAt)` and `sizeOf(path)`. PNG uses the IHDR chunk. JPEG walks the segments to the first frame marker and skips each one by its length, reads the first Exif APP1 block for its orientation, and swaps width and height for orientations 5 to 8. WebP handles VP8, VP8L and VP8X. It reads through one file handle (`openSync`/`readSync`) and never throws. No new dependency. `npx vitest run tests/server/images.test.ts`: 20 passed |
| 2. The listing carries the sizes | DONE | `server/memories.ts` `pictures(dir)` and `listing` answer `{ images: { name, width, height }[] }` in name order. `images(dir)` still returns names, so the wallpaper is unchanged. The route file needed no change |
| 3. The client holds records | DONE | `state/memories.svelte.ts`: `Picture`, `Wall.images: Picture[]`, `hold(images: Picture[])`. `load()` checks the answer (`pictures()`) before holding it |
| 4. Each tile takes its picture's shape | DONE | `Memories.svelte`: `style:aspect-ratio={tileRatio(picture)}`. A tile with no size keeps the stylesheet's `aspect-ratio: 4 / 3` |
| 5. Comments follow the change | DONE | Head comments and doc comments updated in `Memories.svelte`, `memories.svelte.ts`, `images.ts` and `memories.ts` |
| Tests 1 to 4 | DONE | Commands and reverts are below |
| `npx vitest run --reporter=dot` | pass | `Test Files 249 passed (249)`, `Tests 4177 passed (4177)`. No timing test timed out. The wallpaper tests (`grep -rl wallpaper tests`: `tests/routes/wallpaper.test.ts`, `tests/ui/wall.test.ts`, `tests/server/context.test.ts` and the rest) are in that run |
| `npm run check` | pass | `COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | pass | exit 0, `✔ done`. Rebuilt last, after every revert was put back |
| `npm run format:check` | pass | `All matched files use Prettier code style!` |
| `npm run lint` | pass | exit 0, no output after `> eslint .` |
| ASCII gate (the perl command in the brief) | pass | prints nothing, exit 0. `LC_ALL=C grep -n '[^ -~]'` over the 8 touched files prints nothing (exit 1) |
| `npx playwright test tests/browser/memories.spec.ts` | pass | `4 passed (9.8s)` on the final build. The run waited about 2 minutes for another step's lock; the lock was not touched |

## Decisions (each reversible)

- **The bound (item 4):** `TILE_BOUND = 3` in `state/memories.svelte.ts`. A tile is at most three times as wide as tall, or three times as tall as wide. Past that, the box stops at `3 / 1` or `1 / 3` and the picture is fitted whole inside it (`object-fit: contain` is unchanged). The demo's phone screenshots (922x2048, ratio 0.45) are inside the bound.
- **Wire shape (decision 1):** as the brief names it. A picture whose header gives no size answers `width: null, height: null`.
- **Picture type from content:** the format is read from the first bytes, not the extension, which is how the browser decodes a picture.
- **Read caps:**
  - PNG and WebP: 30 header bytes.
  - JPEG: at most 512 segments walked.
  - An Exif block is read only as far as its first 1024 bytes.
- **Files that are not regular files:** `sizeOf` checks `statSync(path).isFile()` before opening. Opening a named pipe waits for a writer and would stall the listing.
- **Checking the answer on the client:**
  - An item with no name is dropped.
  - A second item with a name already read is dropped, since tiles are keyed by name.
  - A size that is not two whole positive numbers is treated as no size.
- **Tile box:** `.tile` is now `box-sizing: content-box; width: calc(100% - 2px)`, so the ratio applies to the box inside the 1px border and a picture fills it exactly. That `2px` repeats the tile's 1px border. If the border width changes, this must change with it.

## Listing time (decision 2)

Measured with `node scratchpad/q46-builder/timing.ts assets/memories`: 16 pictures, 50 runs after one warm-up, file cache warm.
- Names only (`images`): median 0.136 ms, max 0.237 ms.
- `listing` with sizes: median 1.791 ms, max 3.989 ms.

A cold file cache and a large folder were not measured.

A probe (`node scratchpad/q46-builder/probe.ts`) checked `sizeOf` against real files:
- All 16 demo pictures match what `file` reports.
- Pillow-made files: a lossy, lossless and extended (VP8X) WebP, a progressive JPEG, and JPEGs with orientation 1, 3, 6 and 8. Orientations 6 and 8 came back swapped (360x640).

## Reverts run (each put back; `cmp` against the saved copy confirmed all four source files identical)

- **Server (`tests/server/images.test.ts`):**
  - No width/height swap for orientation: 2 failed ("swaps the sides...", "reads an EXIF block only as far...").
  - `at += 2 + length` replaced by `return null` (no segment walk): baseline, EXIF, orientation, fill-byte and block-skip cases failed.
  - Exif read cap removed: 1 failed ("reads an EXIF block only as far as its first directory needs").
  - Header read of 1 MB instead of 30 bytes: 4 failed (the byte-counting cases).
  - Segment cap removed: 1 failed ("gives up on a file of fill bytes...").
  - VP8L without `+ 1`, VP8X without `+ 1`, VP8 without the 14-bit mask and little-endian read: each failed "is read from a lossy, a lossless and an extended header".
  - Regular-file check removed: the pipe case hung, with no result until a 60 s alarm ended it (exit 142). I then ended that run's own two vitest processes.
- **Route (`tests/routes/memories.test.ts`):** `pictures(dir)` back to `images(dir)`: 1 failed ("answers the picture extensions in name order, each with its size...").
- **View (`tests/views/memories.test.ts`):**
  - `style:aspect-ratio` removed: 2 failed.
  - Wide-picture bound line disabled: 1 failed.
  - Size check reduced to `value as number | null`: 1 failed ("reads a size that is not two whole positive numbers as none").
  - Duplicate-name check removed: 1 failed.
- **Browser (`-g "tall and a wide"`, rebuilt each time):**
  - `style:aspect-ratio` removed: failed, expected 1.2590, received 1.3333.
  - Content-box sizing removed: failed at precision 3 (difference 0.00297).
- The "4:3 box" check that reads `Memories.svelte` as text is an audit, not coverage. The 4:3 fallback is actually covered by the browser case's `mem-00.webp`, a text file that gives no size: its box measures 4/3 before and after it fails to load.

## Doc text (not edited, per decision 3)

- HELP.md:114 now reads "The photo wall, each picture shown whole in a tile of one shape, ...". Suggested: "The photo wall, each picture shown whole in a tile of its own proportions (a 4:3 tile when its size cannot be read), a muted tile while it loads and its name when it fails, with a control that adds a picture and a click that enlarges one."
- DESIGN.md:337, not line 310 as the brief says; line 310 does not mention the shape. It ends: "The Memories wall draws every tile as one 4:3 box with the whole picture fitted inside; carrying each picture's size so a tile takes the picture's proportions is a later step." Suggested: "The Memories wall draws each tile at its picture's proportions: `GET /api/memories` answers `{ name, width, height }` per picture, read per listing from the header bytes by `sizeOf` in `server/images.ts` (PNG, JPEG with its EXIF quarter turns, WebP), and the tile's `aspect-ratio` is set from it, bounded at three to one either way, with a 4:3 box for a picture whose size is not read."
- Grep for text the change makes false (`grep -rn "without sizes\|one shape\|fixed shape\|4:3\|4 / 3\|names without\|picture names\|by name, as JSON" src tests config HELP.md DESIGN.md README.md`): only the two doc lines above remain. The rest are unrelated uses of "one shape" and the new 4:3 fallback text.

## Before and after

- **Before:** every tile was one 4:3 box. A tall picture (mem-02, 777x1200) showed as a narrow strip with empty sides, and a wide one with bands above and below.
- **After:**
  - Each tile's box has its picture's proportions from the first render, while the picture is still loading. mem-02 is a tall tile, mem-01 (870x691) a wide one, and neither has empty bands. The box height does not change when the picture arrives (the browser test measures under 0.5 px).
  - Past three to one either way, the box stops at the bound and the picture is fitted whole with bands.
  - A picture with no readable size keeps the old 4:3 box.
  - The loading placeholder, the failed tile's words, the enlarged overlay and the wallpaper and rice rules are unchanged.

## Limitations

- An Exif orientation tag past the first 1024 bytes of its block is missed, and so is orientation carried in a later APP1 block. Such a picture gets an unswapped box, with the picture fitted whole inside.
- A JPEG whose frame comes after more than 512 segments gets no size and a 4:3 box.
- The swap assumes the browser applies Exif orientation, which is Chrome's default. The browser test uses the two PNGs; a turned JPEG was checked only by the Node probe, not in a browser.
- WebP orientation (an EXIF chunk inside VP8X) is not read.
- Sizes are read synchronously on each listing request: a stat, an open and a few small reads per picture. Only the warm 16-picture folder was timed.

## Files changed (lines added / removed)

- `src/lib/server/images.ts`: +189 / -1 (307 lines)
- `src/lib/server/memories.ts`: +21 / -5 (188)
- `src/lib/state/memories.svelte.ts`: +60 / -7 (135)
- `src/lib/views/Memories.svelte`: +19 / -10 (389)
- `tests/browser/memories.spec.ts`: +106 / -5 (200)
- `tests/routes/memories.test.ts`: +29 / -6 (340)
- `tests/views/memories.test.ts`: +116 / -9 (238)
- `tests/server/images.test.ts`: new, 379 lines. Its picture bytes are built in code; no fixture files are checked in.

All paths are under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q46/tools/oculus/`.
