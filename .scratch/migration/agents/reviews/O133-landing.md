# O133 landing

Roadmap entry: the cockpit-to-oculus migration. Step O133, one front-matter pattern for every Markdown reader (rulings 648 and 652). Next: O132's landing (ruling 647), O136's repair round 1 (rulings 651 and 653), then /spec O135 (ruling 650), O137 (ruling 654) and O138 (ruling Interview status).

## Open items

- Open item 655 (2026-11-03): rename a collection's `status` field to `stage`, as a project's manifest names its lifecycle word `stage:`? (a) keep `status`, recommended: a record's words are mostly outcomes, and the two vocabularies (`stages:` and `statuses:` of `config/catalogs/vocab.yml`) share five words with different flags, so one name would read as one list. (b) rename it in the hub's six collection files, `vocab.yml`, every reader that finds the field by name (the audit, the feeds, the website's CV export) and the three pages. The full text is in `orchestrator-state.md` under "Open items".

## Steps 1

The runner's agent listing (ListAgents) showed no subagent running: the builder ad1c4e85c8b936035, the brief check aa8f129fd1b7631ff, the reviewer a65e7d50717ad34a0 and the reviewer over round 1 a7df403ff43b2bf2e had each sent their completion notice.

## Not done

Nothing.

## What landed

The whole range from base 651a57b8a (the wip commit 3d556ce21) with the fixes at landing, 22 paths, 374 insertions and 69 deletions. `src/lib/data/prose/markdown/front-matter.ts` exports `FRONT_MATTER`, the wider form (an opening `---`, a closing `---` or `...`, each line allowed to end in spaces or tabs, the empty block tried first), and `headerLines`; the note scan, the Outline's heading reader, the preview, an embed, the Markdown server's `front_matter` token and the docs split read a leading header by it. `tests/data/prose/markdown/front-matter.test.ts` is the test of G150, added to `agents/guarded.md`. `docs/HELP.md:406` says what front matter is and where the readers part.

## Verification

In the gate, `npm run diagrams && npm run docs:palette && npm run test:quick`, after the last fix:

```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (2.8 s)
ok      svelte-check (11.5 s): 1793728959403 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (67.1 s)
ok      vitest checks (82.0 s)
ok      vitest slow (96.8 s)
test:quick: 99.4 s; every command passed
```

The three tests that read `docs/HELP.md`, run together: 20 passed, one 5000 ms timeout in `tests/checks/source/history.test.ts` 'names no package id, date or session in any comment' (7442 ms), a file the step does not change; alone with `--testTimeout=60000`, 6 passed at a load average of 4.78, and it passed in the `vitest checks` above. The palette page and `docs/diagrams/writes.*` unchanged. The staged diffs of main and the gate are equal under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## Fixes at landing

The builder's first report did not pass its bar; repair round 1 closed the first review's findings. Five fixes at landing:

- Proof 1 of the review over round 1: the report's check 2 output, Files table and run count rewritten to the tree as landed.
- Standards 1: `docs.ts:54-57`, `note-links.ts:13-14`, `requests.ts:26-29` and `front-matter.test.ts:6-8` name the pattern every reader matches with and the byte-order mark exception.
- Standards 2: the round's `BYTE_ORDER_MARK` removed; `scanNote` and `markdownOutline` call `withoutMark` of `src/lib/data/prose/text-edits.ts`.
- The point the review declined: `docs/HELP.md:406` says that in a note with lone CR line ends the tags read front matter that the preview and an embed do not.
- From the look: the Outline of a note a Markdown server serves is the server's document symbols (`src/lib/views/sources/files/sections/Outline.svelte:123-151`), and markdown-it keeps a byte-order mark and turns a lone CR into a newline. `docs/HELP.md:406` now says the tags skip a byte-order mark as the Outline does while no Markdown server serves the note, and that in a lone-CR note the tags and the Outline the server draws read front matter that the preview and an embed do not; G150's text names the Outline's heading reader.

Standards 3 of both reviews (the verify list run three times in the first build and twice in the round): no change; its cost is in the builder's usage below.

## The look

A scratch server on 8797 from the gate, three notes in the hub's notes folder:

- `look-tab.md`, opening line `---` then a tab: the preview shows "Look tab header" alone; the Outline shows "Look tab header" on line 4.
- `look-dots.md`, closed by `...`: the preview shows its heading alone.
- `look-bom.md`, a byte-order mark, `---`, `tags: [delta]`, `---`, `# Look bom header`: the preview shows "Look bom header" alone; the Outline, drawn by the Markdown server, shows "## ---tags: [delta]" on line 1 and "Look bom header" on line 4; the Tags section lists `#delta`.

The console was not read. The server is stopped and 8797 is free (`lsof -nP -iTCP:8797 -sTCP:LISTEN` prints nothing).

## Usage

- Builder ad1c4e85c8b936035: first run 255722 tokens, 124 tool uses, 28 min 26 s; round 1 309528 tokens, 51 tool uses, 10 min 13 s.
- Brief check aa8f129fd1b7631ff: 223032 tokens, 61 tool uses, 12 min 14 s.
- Reviewer a65e7d50717ad34a0: 208309 tokens, 45 tool uses, 13 min 46 s.
- Reviewer over round 1 a7df403ff43b2bf2e: 209676 tokens, 48 tool uses, 15 min 27 s.

All served claude-opus-5-5.

## Next

/land O132; O136's repair round 1; /spec O135, O137 and O138.
