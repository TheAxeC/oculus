# O187 landing report

Position: the oculus migration plan, step O187 (a project card draws its repository's address), landed. Next: v1.1.0 made once more, then the installed app replaced, with 8790 stopped first.

Open items: none.

Agents stopped before the landing: the runner's agent listing showed only the reviewer over round 1 (a92592978de2dffeb), completed; the builder (a230564e2afc12cab) and the first reviewer (a565d66ff1bae5d4a) were no longer listed.

NOT DONE: nothing of the step.

## What landed

- `src/lib/views/shared/card/project/CardAddresses.svelte`: the first address line of a project card is its non-empty trimmed `repository.url`, or, where it has none, its non-empty `code_availability.url`, with the glyph `repositories`; a link opening a new tab when `posting` names a web page, the words otherwise; a `links:` entry that is the same address is drawn once.
- `src/lib/views/shared/card/project/ProjectCard.svelte`: the menu's Clone row needs a non-empty trimmed `repository.url`; its tip names the trimmed address.
- `src/lib/server/git/clone/clone-routes.ts`: the Clone press clones the trimmed address and refuses one of only spaces with the `no_url` sentence.
- `tests/routes/git/clone.test.ts`: two rows of G80, the padded address cloned unpadded (red on the unchanged route with "Could not read from remote repository.", green after) and the address of only spaces refused; both titles in G80's Test line in `agents/guarded.md`.
- The Focus lane card is unchanged.

## Verification

In the gate at main's head 949643904 with the fixes at landing, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (16.0 s)
ok      svelte-check (16.7 s): 1794427256113 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (31.2 s)
ok      vitest slow (51.5 s)
ok      vitest checks (64.6 s)
test:quick: 68.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            utils; the build, the lint of unchanged files
```

The diagrams and the palette page unchanged. The staged diffs of main and the gate are equal under `cmp`. The verify list was not changed. A/B: none, `bench: []`.

## The look

On a scratch server on 8797 from the gate, with a scratch HOME holding copies of the hub and the repositories:

- Software board: oculus draws one line, `https://github.com/TheAxeC/oculus`, folder-git glyph, new-tab link (case 1); FLkit draws `https://github.com/TheAxeC/fl-kit` with the folder-git glyph, then the UHasselt toolkit with the link glyph (case 2); BTTR and FL tutorial draw their repository.
- The FLkit project page draws the same two lines as its board card (case 9).
- Personal board: Axeski draws `https://github.com/TheAxeC/axeski`, folder-git glyph, new-tab link (case 10).
- The manuscript cards with a deposit (RAW-PLS, HCCNet, BT-FNO, BTTN and the others) draw their `code_availability.url` the same way (case 14).
- Algebraic Effects draws `/publications/other/effCompiler.zip` as words with the folder-git glyph and no link (case 15).
- Cards with neither address draw no list.
- BTTR's menu holds Clone, tip "Clone the repository at https://github.com/TheAxeC/block-term-tensor-regression into a folder you pick".
- Nothing was pressed that writes; the scratch workspace file is unchanged (`cmp`).

## Found

- Premise corrections: no glyph is named `git`, the glyph is `repositories`; 18 manifests hold `repository.url`, not 16; 16 hold a non-empty `code_availability.url` and no `repository:`, not 13. No decision rests on the counts.
- Fixes at landing, from the review over round 1: the head comment of `CardAddresses.svelte` says a `links:` entry that names no web page carries no glyph (3.1); the head comment of `clone-routes.ts` says the route test runs real git over scratch repositories (3.2, false at the base); the builder's report given its `links:` grep and `--exclude=local.yml` (2.1, 3.3).
- Findings outside the brief: none.

## Agents

- Builder a230564e2afc12cab, claude-opus-5-5: 127259 tokens, 39 tool uses, 373.4 s; round 1 186474 tokens, 27 tool uses, 392.2 s.
- Brief check abe2dd01598571517, claude-opus-5-5: stopped and resumed on Axel's word; the resumed run 153886 tokens, 2 tool uses, 77.1 s; 54 tool uses in all.
- Reviewer a565d66ff1bae5d4a, claude-opus-5-5: 161685 tokens, 39 tool uses, 399.6 s.
- Reviewer over round 1 a92592978de2dffeb, claude-opus-5-5: 186729 tokens, 52 tool uses, 520.7 s.

The builder's first report did not pass its bar: the first review's 3.1, 4.1, 2.1 and 4.2 went to repair round 1, which closed them.

## Next

v1.1.0 made once more as ruling 758 says (release notes, whole suite in the gate, three archives, tag moved, main and tag pushed, the release published), then `~/Applications/oculus.app` replaced with 8790 stopped first.
