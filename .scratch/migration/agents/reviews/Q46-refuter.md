# Step Q46 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/q46, base 8eed7e03)

## Verification (rerun by the reviewer)

```
npx vitest run --reporter=dot                      Test Files  249 passed (249) / Tests  4177 passed (4177), Duration 33.65s; no timing test timed out
npm run check                                      COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint                                       > eslint .   (no output, exit 0)
npm run format:check                               All matched files use Prettier code style!
ASCII gate (perl, the brief's form)                prints nothing
find src tests bin -type f | xargs wc -l | sort -n | tail -3
                                                   970 tests/state/layout.test.ts / 980 tests/state/board.test.ts / 169426 total
npm run build                                      exit 0
npx playwright test tests/browser/memories.spec.ts 4 passed (9.2s)

Commands and claims the report quotes:
npx vitest run tests/server/images.test.ts         20 tests in the file (counted), all pass in the full run
DESIGN.md:337 / HELP.md:114                        both lines read as the report quotes; DESIGN.md:310 does not carry the shape
report's doc grep                                  only HELP.md:114 and DESIGN.md:337 remain stale; the other hits are unrelated
demo sizes (sizeOf over assets/memories)           mem-03/05/14/16 are 922x2048, as the report says
listing time, 16 demo pictures (own timing.ts, warm cache, 30 runs)
                                                   names median 0.07 ms; with sizes median 0.87 ms, max 1.09 ms (report: 1.791 ms median; same order, other load)
listing time, 300 copies of a 4032x3024 JPEG with a 40 KB EXIF block (warm)
                                                   names median 0.25 ms; with sizes median 17.81 ms, max 27.16 ms
sizeOf vs Pillow over 3000 real PNG/JPEG/WebP files on this machine (mdfind list, 958.7 ms total)
                                                   JPEG 431 match 0 mismatch; WebP 165 match 0 mismatch; PNG 2315 match, 28 mismatch
                                                   (pngsuite corrupt files ours 32x32/Pillow error, and CgBI iphone_*.png ours null; Chrome draws neither)
                                                   none of the 431 real JPEGs has orientation 5 to 8

Reverts (reviewer's clone of tools/oculus under scratchpad/q46-review/oculus, restored and cmp-checked after each):
no swap for orientation                            images.test.ts 2 failed (swaps the sides..., reads an EXIF block only as far...) = report
EXIF cap removed                                   images.test.ts 1 failed (reads an EXIF block only as far...) = report
client duplicate check removed                     views/memories.test.ts 1 failed = report
style:aspect-ratio removed (node)                  views/memories.test.ts 2 failed = report
browser: content-box sizing removed (rebuilt)      failed, Expected 1.2590448625180897, Received 1.262013015957921, difference 0.002968 = report
browser: style:aspect-ratio removed (rebuilt)      failed, Received 1.3333333333333333 = report
isFrame widened to C0..CF (C4, C8, CC included)    images.test.ts + routes/memories.test.ts 47 passed (stays green)
first APP1 decides (orientation(...) || -1)        images.test.ts + routes/memories.test.ts 47 passed (stays green)

Chrome probe (own spec in the clone, own build, port 8792 after the lock cleared; 22 files: phone-style JPEG o1/o3/o6/o8 with a 30 KB MakerNote, 4032x3024 o6, progressive, progressive o6, 200 KB ICC + 60 KB EXIF o6, CMYK, CMYK o6, PNG, PNG with eXIf o6, lossy/lossless/extended WebP, WebP with EXIF o6, PNG named .jpg, 3000x600, 600x3000, two truncated JPEGs, a directory named dir.jpg):
every JPEG (all orientations, progressive, CMYK, large ICC/EXIF), every WebP, PNG named .jpg: content-box ratio == naturalWidth/naturalHeight to 4 places
png-exif-o6.png                                    answer 400x300, tile box 1.3333, Chrome natural 300x400 (0.75): MISMATCH
webp-exif-o6.webp                                  answer 400x300, Chrome natural 400x300 (Chrome does not turn WebP)
3000x600 / 600x3000                                box 3.0004 / 0.3333, picture fitted whole
dir.jpg, truncated files                           null size, 4:3 box, data-arrived failed
tile outer width vs column: viewport 1600, 700, 330 and deviceScaleFactor 0.5
                                                   left(n+1) - left(n) = width + 8 at every size (238/246, 280/288, 261/269); single column 198 = wall 198; body.rice body.wall classes added: same boxes
```

## 1. Spec

- src/lib/state/memories.svelte.ts:60 and :64: `if (!Array.isArray(value)) return [];` and `... || seen.has(item.name)) continue;`. No brief item asks the client to screen the answer (item 3 is "Wall.images becomes that list of records; hold takes records"). The size screening has a reason (the value is written into a style), but the other two rules turn a server fault into a silent state: an answer whose `images` is not a list draws the empty-wall message, as if the folder held no picture, and a duplicated name draws one tile with no log and no error. The server cannot produce either today (readdir names are unique, `pictures()` answers an array), so the checks guard nothing reachable and would hide the fault the day one appears. tests/views/memories.test.ts:190 `holds no pictures for an answer that is not a list` encodes the malformed answer as a normal empty wall.

## 2. Proof

- src/lib/server/images.ts:71 `return code >= 0xc0 && code <= 0xcf && code !== 0xc4 && code !== 0xc8 && code !== 0xcc;`: the exclusion of C4 (a Huffman table), C8 and CC is untested. With the line widened to `code >= 0xc0 && code <= 0xcf`, images.test.ts and routes/memories.test.ts stay green (47 passed). No case puts a DHT or DAC segment before the frame, which is where a wrong size would be read from a table's bytes; the one real JPEG (REAL_JPEG) has its DHT after the frame.
- src/lib/server/images.ts:184 `if (code === 0xe1 && turn === 0) {`: reading past a non-EXIF APP1 (XMP) to a later EXIF block is untested. With `turn = orientation(...) || -1` (first APP1 decides), the suite stays green (47 passed). The code itself is right: a probe JPEG with an XMP APP1 before its EXIF o6 block reads 300x400.
- tests/views/memories.test.ts:207 `gives a tile the 4:3 box of the stylesheet when its element sets no ratio` asserts over the source text of Memories.svelte. The report names it an audit and points at the browser case's `mem-00.webp` for coverage, which does measure 4/3; recorded here only because it sits among coverage cases under an `it` name that reads as behaviour.

## 3. Standards

- src/lib/server/memories.ts:65 and src/lib/state/memories.svelte.ts:16: `export type Picture = { name: string; width: number | null; height: number | null };` is declared twice, once on each side of the wire. spec.md principles: "a parser, a fold or a rule exists once and is reused". The client may not import lib/server, but both sides already import lib/data (guards.ts), so one wire type there would serve both.
- src/lib/server/images.ts:50 `/** A picture's width and height in pixels, as the browser draws it. */`: false for a PNG carrying an eXIf orientation (see Behaviour). spec.md: "A sentence in a document or a head comment that the change makes false is a defect of the change."
- src/lib/state/memories.svelte.ts:32 `A panorama inside the bound would be a sliver in a column and a long screenshot a column of its own; past it the box stops at the bound`: the sentence says the opposite of what it means (a panorama drawn without the bound is the sliver; one inside the bound is drawn at its own shape).
- src/lib/views/Memories.svelte:286 `width: calc(100% - 2px);` repeats the 1px border of the same rule as a literal; the report names the coupling. Measured correct at every size and scale tried (see Verification); recorded as a repeated constant, not as a wrong box.

## 4. Behaviour

- A PNG whose eXIf chunk names a quarter turn: Chrome draws it turned (natural 300x400) and the server answers the unturned 400x300, so the tile is a 4:3 box with a portrait picture fitted inside it with bands at the sides, the case the step exists to remove. The report's limitations do not name it; they name WebP orientation instead, which Chrome does not apply (webp-exif-o6.webp draws 400x300, matching the answer), so that limitation line describes no visible difference.
- An answer whose `images` is not a list now draws the empty-wall message rather than anything that says the read went wrong (state/memories.svelte.ts:60); the report lists the client's checks but not this before and after.

## Not checked

- A cold file cache and a slow or network-backed disk for the listing's synchronous reads (only warm reads timed: 17.81 ms median for 300 pictures).
- Real phone JPEGs with orientation 5 to 8, and an EXIF block whose first directory sits past 1024 bytes: none exist on this machine; only Pillow-written EXIF (directory at offset 8) was tried.
- A stat-then-open race where a regular file is replaced by a named pipe between `statSync` and `openSync` (images.ts sizeOf).
- Browser zoom levels other than deviceScaleFactor 1 and 0.5.
- The full browser suite (only memories.spec.ts and the reviewer's probe spec were run).

Reviewer usage: tokens not known, about 45 tool uses, about 25 minutes (19:38 to 20:02, including about 5 minutes waiting for the port 8792 lock held by another run).

## Repair round 1, refuted

```
Verification (from tools/oculus in the worktree)
npx vitest run --reporter=dot        run 1: Test Files 1 failed | 248 passed (249) / Tests 1 failed | 4183 passed (4184), 48.30s
                                     the one failure is tests/server/watch/git.test.ts:686 (latest(client.got)[added].branch), a watcher timing case outside the step's paths
                                     run 2: Test Files 249 passed (249) / Tests 4184 passed (4184), 43.30s
npm run check                        COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint                         > eslint .  (no output, exit 0)
npm run format:check                 All matched files use Prettier code style!
ASCII gate (the brief's perl form)   prints nothing, exit 0
find src tests bin | wc -l | tail -3 970 tests/state/layout.test.ts / 980 tests/state/board.test.ts / 169666 total
npm run build                        exit 0
npx playwright test tests/browser/memories.spec.ts   4 passed (9.3s)
src/lib/server/images.ts             344 lines (report: 344)

Claims of the round's report rerun
tests/views/memories.test.ts         22 tests in the file (report: 22 passed)
listing time, 16 demo pictures (own probe over pictures(), warm, 50 runs, after the PNG chunk walk)
                                     names median 0.096 ms; with sizes median 1.288 ms, max 2.088 ms (report: 1.791 ms median, measured before the walk; same order)
sizeOf vs Pillow over 600 real PNGs on this machine (78 interlaced, 46 with an eXIf chunk)
                                     597 match; the 3 misses are CgBI PNGs (People.framework camera/photos/screentime.png): ours null, Chrome errors on the same file
sizeOf vs Pillow over 485 real JPEGs 485 match, 343 ms; orientations present: 1 or none, no 5 to 8 on this machine
caps against real camera files       max 11 JPEG segments before the EXIF block (cap 512); tag 0x0112 ends at most 94 bytes into the EXIF body (cap 1024); real PNGs put eXIf at chunk index 2 to 3, length 68 to 244 bytes
Chrome (installed Chrome, file page, from my own build of the clone) vs the server's answer
  exif-o6.png (eXIf o6 before IDAT)  ours 300x400, Chrome 300x400
  exif-late-o6.png (eXIf after IDAT) ours 400x300, Chrome 400x300 (Chrome ignores it too)
  animated.png / animated-o6.png     ours 320x200 / 200x320, Chrome 320x200 / 200x320 (APNG, eXIf read before IDAT)
  interlaced (two real files)        ours 14x14 / 28x28, Chrome 14x14 / 28x28
  cut20 / cut33 / cut40 / cut-half   ours null / 800x600 / 800x600 / 800x600, Chrome errors on all but cut-half (800x600)
  overrun.png (chunk length 10 MB past the end), huge-len.png (0xFFFFFFFF)
                                     ours 800x600 both, no throw and no stall; Chrome errors
  many-chunks-o6.png (600 chunks before eXIf)   ours 800x600, Chrome 600x800  -> the 512-chunk cap
  some-chunks-o6.png (400 chunks)    ours 600x800, Chrome 600x800
  webp-exif-o6.webp                  ours 400x300, Chrome 400x300 (Chrome does not turn a WebP: the new head comment holds)
tile box in Chrome (own probe spec, own build): plain 1280, body.wall, body.rice, body.rice+body.wall
                                     --tile-border computes 1px in all four; outer 223.188, content 221.188, ratio 1.2591 = 870/691; column step 231.203 vs width+gap 231.188
  narrow 900 / 640 / 420 / 330 / 300 step 258.672 vs 258.656, 258 vs 258; single column at 420/330/300 with outer == wall width (288/198/168) and content = outer - 2
  deviceScaleFactor 1.25 and 1.5     same boxes; 1.25 at viewport 517: outer 385 == wall 385, content 383

Reverts (my own clone under scratchpad/q46-review2/clone, each restored and cmp-checked; rebuilt before each browser run)
isFrame widened to C0..CF            1 failed: expected { width: 512, height: 256 } to equal { width: 640, height: 480 } (the DHT read as a frame)
isFrame with C4 kept, C8/CC allowed  1 failed: expected { width: 1024, height: 768 } (the DAC read as a frame)
isFrame with C4/CC kept, C8 allowed  images.test.ts + routes/memories.test.ts 54 passed (stays green)
first APP1 decides (exifOrientation(...) || -1)   1 failed: expected { 4032, 3024 } to equal { 3024, 4032 }
PNG orientation not applied (return sized(width, height))   node 3 failed (eXIf case and the two PNG byte-count cases); browser, rebuilt: expected 0.75, received 1.3333
PNG eXIf read cap removed            1 failed ("reads a PNG eXIf chunk only as far as its first directory needs")
chunk walk stop removed (only IEND)  3 failed (chunk after the image data, the chunk-walk byte count, the non-letter head)
images not a list read as an empty wall   1 failed ("reads an answer whose pictures are not a list as a failed read")
a name already read skipped          1 failed ("reads a name given twice as a failed read")
border as a literal 3px with the width still on --tile-border, rebuilt   browser failed, |step - (width + 8)| = 4.1875 against a bound of 1
.tile aspect-ratio: 4 / 3 removed, rebuilt   browser failed at before[UNREAD].ratio toBeCloseTo(4/3): the 4:3 fallback the removed source-text test named is covered by the browser case
```

- src/lib/server/images.ts:73 `code !== 0xc4 && code !== 0xc8 && code !== 0xcc`: the C8 exclusion is still untested. With only `code !== 0xc8` removed, `npx vitest run tests/server/images.test.ts tests/routes/memories.test.ts` is 54 passed; the new case covers C4 and CC only (each fails on its own revert, 512x256 and 1024x768). Ruling 2 named the tables, so this is the residue of the first report's finding, not a break of the ruling; under Proof.
- src/lib/server/images.ts:169 `const tiff = 0;`: an always-zero local left from the extraction of `tiffOrientation` out of `exifOrientation`, so `tiff + 8`, `tiff + 2`, `tiff + 4` and `spells(body, tiff, 'II')` are offsets that cannot vary. Under Standards.
- tests/browser/memories.spec.ts:107 `const dir = mkdtempSync(join(tmpdir(), 'oculus-memories-'));`: the directory is never removed (the `finally` takes the two files out of the hub only), so every browser run leaves one behind; `ls -d $TMPDIR/oculus-memories-*` counts 8008 and `oculus-images-*` 1039, and the same habit is at tests/routes/memories.test.ts:33 and tests/server/images.test.ts:24, so it predates this round and the round adds one more per run. Under Standards.
- src/lib/server/images.ts:105 `for (let passed = 0; passed < SEGMENTS; passed += 1)`: past the 512-chunk cap the answer and Chrome part company. My `many-chunks-o6.png` (600 tEXt chunks, then eXIf orientation 6) reads 800x600 while Chrome draws 600x800, so such a tile takes a landscape box around a portrait picture, the case the step exists to remove; at 400 chunks both read 600x800. The round's row 5 names the cap ("512 chunks, 1024 bytes"); the report's Limitations list names only the JPEG segment cap and the EXIF 1024-byte cap. Real PNGs on this machine put eXIf at chunk index 2 to 3, so nothing reachable here hits it. Under Behaviour.
- src/lib/state/memories.svelte.ts:54 and :131, the drawing half of ruling 1: still not built, and it is booked in the state file's `reported2` line. What is there is right as far as it goes: `Memories.svelte:52` reads `held.images` alone (`grep -rn "wall()" src tests` finds no other reader, and no file outside `state/context.ts` touches the store), so no reason word reaches a reader today, and a malformed answer draws `memories.empty` as a failed fetch already did. The builder's premise for the stop holds: the one general sentence the wall has, `config/text/views/memories.yml:27 failed_other: The picture was not added.`, is about an upload, so drawing a read failure does need a new key. Under Spec.

Reviewer usage: tokens not known, about 50 tool uses, about 35 minutes (20:19 to 20:54, no wait for the port 8792 lock, which was free).

## Closed at landing

- The drawing half of ruling 1 (`state/memories.svelte.ts` holding a reason word no reader sees): closed. `config/text/views/memories.yml` gains `read_failed` and one sentence per reason word, `state/memories.ts` gains `readMessage(error)` beside `uploadMessage`, and `views/Memories.svelte` draws that sentence in place of the empty-wall message whenever the wall's `error` is set. `tests/views/memories.test.ts` "says a read of the wall that failed, with the reason, in place of the empty message" is red with the empty message drawn whatever `error` holds. Looked at in the page: "The wall could not be read: the server did not answer with a list of pictures", drawn in the failure colour under the header (`scratchpad/looks/q46/q46-read-failed.png`).
- `images.ts:73`, the C8 exclusion untested: closed. The tables case gains a C8 segment whose bytes would read as 128x96, and it is red with C8 allowed as a frame.
- `images.ts:169` `const tiff = 0;`, an always-zero local: closed, the offsets are written as they are.
- The scratch directories never removed (`tests/server/images.test.ts`, `tests/routes/memories.test.ts`, `tests/browser/memories.spec.ts`): closed. Each file remembers what it made and removes it when its cases are done.
- The 512-chunk cap: recorded, not changed. A PNG whose `eXIf` chunk sits past 512 chunks reads unturned while Chrome turns it; the reviewer's own scan of the real PNGs on this machine puts every `eXIf` at chunk index 2 or 3, and the cap is what keeps a damaged file from being walked to its end.
