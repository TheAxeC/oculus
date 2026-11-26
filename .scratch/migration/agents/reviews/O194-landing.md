# O194 landing

Position: the migration plan, step O194, long text stays inside its card, landed (495 of the plan's 540 step lines ticked). Next: the app rebuilt from main and copied over `~/Applications/oculus.app`, then O193's landing, whose three screenshots are taken again and wait on Axel's approval.

## Open items

None.

## Landed

- Check of Steps 1: the runner's agent listing shows no subagent of this session left, only the peer sessions; the builder, the brief check and the two reviewers had all completed.
- NOT DONE: nothing of the brief.
- What landed: the whole range from base 55fa909a3 (wip commit ab8986eef, the build and repair round 1) with the fixes at landing, 257 paths, 572 insertions and 370 deletions. A plain press's label may now shrink to the press (`.tool.plain > :global(.label) { min-width: 0; }`), so a long tag inside it is cut at the card's edge with its ellipsis; ToolButton and its props moved into `src/lib/ui/controls/tool-button/` with `ToolFace.svelte` split out; every card Tag that can be cut gives its whole words on hover, a pressed one on the first line of its press's tip, an unpressed one as its native title through Tag's `titled`; the stage chip and an entry card's status chip carry a tooltip of their words.
- Fixes at landing: the session row's tip is the tool, the session's title, then the hint; Tag's head comment scoped to the cards; a card's cut-title hover words moved from the whole card to its title (`Card.svelte` `tip`, `RecordCard.svelte`) and LaneCard's full title to its name, so no tooltip inside a card sits under a second native title; prettier on RecordCard.
- Verification in the gate at eec2a8c4f, `npm run diagrams && npm run docs:palette && npm run test:quick`: `257 changed file(s)`, `17 test file(s)`; the ASCII gate, svelte-kit sync, prettier, svelte-check (595 files, 0 errors, 0 warnings), vitest, vitest checks and eslint ok; `test:quick: 574.6 s; every command passed`. Main's staged diff equals the gate's. Not covered: tests that reach no changed file within the import depth.
- Look on a scratch server, port 8797, from the gate after `npm run build`, in Dark Modern, Light and Gruvbox with brackets: no element of any card past its card on Projects, Focus, Pillars, Registries, Academic Life, Incoming and Literature, nor on the Projects board at a 290 px column; the pillar tag cut with its full words, then "open in Pillar", on hover; the Literature record tag cut inside its card with its full title, then "Open this record as its own tab"; one tip on the stage chip; the session row of a made-up session inside its card with its three-line tip; the palette's long rows in the list. The server is stopped, its folder removed and its tab closed.

## Found

- First review: Spec 1 and 2 sent in repair round 1; Proof 1 settled on the look (the Literature card's 4 px ended by the same rule); Standards 1 closed by round 1.
- Review over round 1: Spec 1, Standards 1 and Behaviour 1 fixed at landing; Standards 2 (the builder ran `git ls-files`) recorded.
- The builder's first report did not pass its bar.

## Agents

- Builder a33a0018ecd3c3bfd (claude-opus-5-5): 334508 tokens, 162 tool uses, 2587 s; round 1 243272 tokens, 162 tool uses, 2707 s.
- Brief check accc28dffde18681b (claude-opus-5-5): 206106 tokens, 62 tool uses, 604 s.
- Reviewer a40f5b361cc792a2f (claude-opus-5-5): 215535 tokens, 67 tool uses, 1294 s.
- Reviewer over round 1 a10e599f9abb66762 (claude-opus-5-5): 221987 tokens, 77 tool uses, 1386 s.
