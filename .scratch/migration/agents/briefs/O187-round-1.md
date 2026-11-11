# O187, repair round 1

Read with the brief `.scratch/migration/agents/briefs/O187.md`, whose rules hold unchanged except where this round widens the paths. The review is `.scratch/migration/agents/reviews/O187-refuter.md`. Each item below is a finding of that review with its ruling; build each one.

## Items

1. Review 3.1, `src/lib/views/shared/card/project/CardAddresses.svelte:8-10`. The head comment's closing clause "so the list never shows one address twice" is false: two `links:` entries that are the same address as each other are both drawn. Ruling: end that sentence at "is drawn once, as the code line". Do not deduplicate the `links:` entries among themselves; no item asks for it.

2. Review 4.1, the Clone press. The Clone row's tip names the trimmed `repository.url` (`ProjectCard.svelte:160-161`), but the press clones the untrimmed value: `cloneProject` in `src/lib/server/git/clone/clone-routes.ts:113-117` reads `found.repository?.url` and passes it to `cloneRepository`, which runs `git remote add origin <url>` (`src/lib/server/git/clone/clone.ts:117`). Ruling 761 (3) makes the Clone row stand for a non-empty trimmed address, so the press clones that same trimmed address. Ruling:
   - `clone-routes.ts`: `cloneProject` takes the trimmed `repository.url`, and refuses with `server.clone.no_url`, as now for a missing url, when the trimmed value is empty. `clone.ts` is not changed.
   - The route's test is G80's (`agents/guarded.md`, entry G80, whose Code line names `clone-routes.ts`): `tests/routes/git/clone.test.ts`, describe 'cloning the repository of a project into the folder the reader chose'. Add the rows for this behaviour there, as the rules file's test rule says (one row per input that gives a different outcome): a project whose `repository.url` is the test's bare remote with spaces around it clones as the unpadded address does, its clone's `origin` being the unpadded address; a project whose `repository.url` holds only spaces is refused with the `no_url` sentence and leaves no folder. If the existing table 'refuses $name and reads nothing again' is where the second row belongs, put it there.
   - Run each new row on the unchanged code first and quote its failure (or, for a row the unchanged code already passes, its pass), then after the change quote its pass. Tag a row slow only if it runs a real git process for longer than the file's other rows do.
   - The orchestrator writes the new titles into G80's Test line at landing; you do not edit `agents/guarded.md`.

3. Review 2.1, the report. Its sentence on the helper grep says it found no address comparison; the same command prints 26 lines, among them `src/lib/data/sources/origin.ts:123` `sameAddress`. Rewrite that part of the report: quote what the grep prints, and say why `sameAddress` is not used (it keys an address by host and path with the trailing slash and `.git` stripped and github.com paths compared without case, so it would draw case 12 as one line, against Decision 3, and it gives no key for a non-address).

4. Review 4.2, the report's before and after. Replace the three-card statement with one that names every manifest holding a non-empty `repository.url`, found by listing them (`grep -rl --include=project.yml -E "^repository:" ~/workspace/research-hub` and the `.oculus/project.yml` of each `~/workspace/*` folder, each read for a non-empty `url`), each with its before and after, and every manifest holding a non-empty `code_availability.url` and no `repository.url`, each with its before and after. Quote the commands. The review counted 18 repository manifests where the brief said 16; give the count you find.

## Paths this round writes

- `src/lib/views/shared/card/project/CardAddresses.svelte`
- `src/lib/views/shared/card/project/ProjectCard.svelte` (unchanged by this round unless an item needs it)
- `src/lib/server/git/clone/clone-routes.ts`
- `tests/routes/git/clone.test.ts`
- `.scratch/migration/agents/reviews/O187-report.md`

## Verify before you report

From the worktree root, Node at `$HOME/.nvm/versions/node/v24.21.0/bin`, TMPDIR unset:

1. `npm run diagrams` and then `npm run test:quick`, which prints `test:quick: <time>; every command passed`; quote the lines it prints.
2. `npx vitest run tests/routes/git/clone.test.ts` (and with the slow configuration if the file's rows are tagged slow, as `package.json` names it), quoted, every row passing.
3. The ASCII gate: `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof'` over the five paths prints nothing.
4. `sh utils/unused-exports.sh` compared with `/Users/axelfaes/workspace/oculus/.agents/worktrees/O187-unused-base.txt`; quote each line added, or say there is none.

The plan's whole verify list runs once, at landing on main.

## Report

Update `.scratch/migration/agents/reviews/O187-report.md` in place, in ASCII, its shape as the brief's "Report" says, with a section "Repair round 1" that gives, item by item, what changed (file and lines), the runs of item 2's rows before and after, and the checks above with their output.
