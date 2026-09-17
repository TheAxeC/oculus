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

NOT DONE: half of ruling 1. The state half is done (a malformed answer is held as a failed read with a reason); the drawing half is not, and it cannot be done inside my paths. Everything else in the eight rulings is done.

## Repair round

| Ruling | State | Command and output |
|---|---|---|
| 1. Malformed answer is a failed read | **State DONE, drawing NOT DONE** | `state/memories.svelte.ts` `pictures()` now answers `{ images }` or `{ malformed }`, and `load()` holds `{ images: [], error: <reason>, loading: false }` for `images_not_a_list`, `image_without_name` and `image_name_repeated`. The size screen is unchanged. `tests/views/memories.test.ts:190` is now three cases asserting the whole `Wall`, the repeated-name case among them. `npx vitest run tests/views/memories.test.ts`: 22 passed. See "The drawing half" below |
| 2. JPEG tables before the frame | DONE | New case "steps over a Huffman table and an arithmetic coding table before the frame": a DHT (C4) whose bytes read as a frame would give 512x256, and a DAC (CC) that would give 1024x768, each before a real 640x480 frame |
| 3. APP1 order | DONE | New case "reads the orientation of an EXIF block that comes after an XMP block": an XMP APP1 (`http://ns.adobe.com/xap/1.0/`) before an EXIF APP1 with orientation 6; the answer is 3024x4032 |
| 4. One wire type | DONE | `Picture` is declared once, in `src/lib/data/model.ts` (beside `AuditPayload`, in the facade both layers already import). `server/memories.ts` and `state/memories.svelte.ts` both `import type { Picture }` from it; `tests/views/memories.test.ts` takes it from there too |
| 5. PNG orientation | DONE | `pngOrientation()` walks the chunks after IHDR by their lengths, stops at IDAT, IEND or a chunk head that is not four letters, and reads `eXIf` under the JPEG caps (512 chunks, 1024 bytes). `turned()` is now the one place that trades the sides, for JPEG and PNG alike. Node cases: swapped for orientation 6, unswapped for 3, no orientation from an `eXIf` after IDAT. Browser case: a 40x30 PNG with `eXIf` orientation 6, built in the spec with real CRCs, drawn by Chrome at 30x40, tile box 0.75 |
| 6. The 4:3 source-text test | DONE | `tests/views/memories.test.ts` no longer reads the stylesheet text; the browser case's `mem-00.webp` is the coverage |
| 7. The bound sentence | DONE | `state/memories.svelte.ts` now reads: "A picture past that, drawn at its own shape, would be a sliver across a column or a column of its own, so its box stops at the bound and the picture is fitted whole inside it." |
| 8. The repeated border width | DONE | `.tile` sets `--tile-border: 1px`; the rule reads `border: var(--tile-border) solid var(--line)` and `width: calc(100% - 2 * var(--tile-border))`. A new browser assertion measures the column step against the tile's whole width plus the 8px gap, so a border the width leaves no room for is caught |

## The drawing half of ruling 1 (a premise found wrong, for you to rule on)

The wall draws no failed read today. `Memories.svelte` reads `held.images` only, never `held.error`, so a failed fetch already draws the empty-wall message (`memories.empty`). Drawing a read failure needs a new key in `config/text/views/memories.yml`: a literal sentence in the view is a defect, and my paths exclude every config file, so I did not add one. What is done instead: the reason is in `Wall.error` as a word, the way the upload's wire words are mapped to sentences by `uploadMessage`.

To finish it, one of:
- (a) allow `config/text/views/memories.yml` in a follow-up and add, say, `read_failed: 'The wall could not be read: {0}'` with a sentence per reason (`read_not_a_list`, `read_without_name`, `read_name_repeated`), drawn in the `.failed` paragraph the upload failures already use, with the empty-wall message drawn only when `error` is empty;
- (b) leave the words in state and rule that the view keeps drawing the empty-wall message.

The three reason words (`images_not_a_list`, `image_without_name`, `image_name_repeated`) are a vocabulary you may reverse.

## Verify before you report (final tree)

| Command | Output |
|---|---|
| `npx vitest run --reporter=dot` | `Test Files 249 passed (249)`, `Tests 4184 passed (4184)`, 48.22s. No timing test timed out |
| `npm run check` | `COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | exit 0 |
| `npm run format:check` | `All matched files use Prettier code style!` |
| `npm run lint` | exit 0, no findings |
| ASCII gate (the brief's perl form) | prints nothing, exit 0; `LC_ALL=C grep -n '[^ -~]'` over the touched files prints nothing |
| `npx playwright test tests/browser/memories.spec.ts` | `4 passed (8.1s)`, on the final build. Two earlier attempts waited on the port 8792 lock; it was never touched |
| `grep -rl wallpaper tests` files | in the full vitest run above |

## Reverts run in this round (each put back; `cmp` against the saved copy shows all five source files identical)

- `isFrame` widened to C0..CF: `tests/server/images.test.ts tests/routes/memories.test.ts` 1 failed of 54 (the tables case).
- First APP1 decides (`exifOrientation(...) || -1`): 1 failed of 54 ("reads the orientation of an EXIF block that comes after an XMP block").
- PNG orientation not applied (`return sized(width, height)`): 3 failed (the eXIf case and the two PNG byte-count cases). Browser, rebuilt: shape case failed, expected 0.75, received 1.3333.
- PNG `eXIf` read cap removed: 1 failed ("reads a PNG eXIf chunk only as far as its first directory needs").
- Chunk walk stop removed (only IEND stops it): 3 failed (orientation read from a chunk after IDAT, the chunk-walk byte count, the non-letter head).
- `images` not a list read as an empty wall: 1 failed ("reads an answer whose pictures are not a list as a failed read...").
- Item with no name skipped: 1 failed. Name already read skipped: 1 failed.
- Border width as a literal `3px` with the width still on the property (the mutation that shows the property is load-bearing), rebuilt: browser shape case failed, the column step off by 4.1875 px against a bound of 1 px.

The earlier round's reverts still hold; they were rerun by the reviewer.

## Doc text as it now stands (neither file edited)

- HELP.md:114 is unchanged: "| `memories` | Memories | The photo wall, each picture shown whole in a tile of one shape, a muted tile while it loads and its name when it fails, with a control that adds a picture and a click that enlarges one. |". Suggested: "| `memories` | Memories | The photo wall, each picture in a tile of its own proportions (a 4:3 tile when its size cannot be read), a muted tile while it loads and its name when it fails, with a control that adds a picture and a click that enlarges one. |"
- DESIGN.md:337 ends, unchanged: "The Memories wall draws every tile as one 4:3 box with the whole picture fitted inside; carrying each picture's size so a tile takes the picture's proportions is a later step." Suggested: "The Memories wall draws each tile at its picture's proportions: `GET /api/memories` answers `{ name, width, height }` per picture, read per listing from the header bytes by `sizeOf` in `server/images.ts` (PNG, JPEG and WebP, with the EXIF quarter turns a browser applies to a JPEG's EXIF block and a PNG's `eXIf` chunk, and not to a WebP), and the tile's `aspect-ratio` is set from it, bounded at three to one either way, with a 4:3 box for a picture whose size is not read."

## Notes

- Chrome does not turn a WebP: the reviewer's probe drew `webp-exif-o6.webp` at its stored 400x300, so no WebP orientation is read and the earlier limitation line about it is dropped.
- The `eXIf` chunk is read only before the first IDAT, which is where the PNG extension puts it; a chunk after the image data is not read (node case "reads no orientation from a chunk after the image data").
- The column-step assertion allows one pixel, because the step is a whole pixel and the tile's width a fraction of one; the border mutation misses it by 4.19 px.

## Files changed (added / removed lines against main)

- `src/lib/data/model.ts`: +6 / -0
- `src/lib/server/images.ts`: +226 / -1 (344 lines)
- `src/lib/server/memories.ts`: +19 / -5
- `src/lib/state/memories.svelte.ts`: +69 / -7
- `src/lib/views/Memories.svelte`: +22 / -11
- `tests/browser/memories.spec.ts`: +173 / -5
- `tests/routes/memories.test.ts`: +29 / -6
- `tests/views/memories.test.ts`: +133 / -9
- `tests/server/images.test.ts`: new, 483 lines

All paths are under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q46/tools/oculus/`.
