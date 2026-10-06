# Brief check of step Q126

Read on main at e7952e16 by a fresh agent; the brief is `agents/briefs/Q126.md`. The findings are given below by check, as the agent reported them; the session's change for each is under "Closed".

## 1. Names

- The brief's quoted-name grep reproduces (41 hits, Auth 14, The socket 4, PTY 4, Git 4, ...), each name where the brief says; "Decks" has no hit; "Sessions are six views, not one" is `:466`, cited by `src/lib/state/workbench/selection.svelte.ts:7`.
- Comments that cite DESIGN.md by description, missed by that grep (`grep -rn 'DESIGN' src tests utils config --exclude=local.yml`): `:461` ("Git writes and the deposit") by `deposit-git.ts:3`, `deposit.ts:1-4`, `deposit-routes.ts:8`, `git-write.ts:50`, `ui/controls/Confirm.svelte:7`; `:100` (Validate) by `data/snapshot/validate.ts:1` and `tests/checks/config/integrity.test.ts:5`, the second under `tests`, which the write list left out; "Untyped input" (`data/helpers/guards.ts:4`) at `:163`.
- Comments already false on main: `state/life/memories.ts:5` and `state/system/audit.ts:4` (the deck write's "sentence of its own per refusal", `grep -n -i "sentence of its own" DESIGN.md` prints nothing); `server/machine/pty/channel.ts:7` (the socket accepts nothing but subscriptions and terminal input, not in `:121`); `server/git/deposit.ts:319` ("DESIGN.md's step 6").
- The guides' headings are linked by anchor from HELP.md (six anchors in window, files-and-search and terminals, 49 in views.md) and named by DESIGN.md (about 30 cites, for example `:147`, `:542`, `:529`); `config/layout.yml:177-182` names the guides by title. Item 2 does not forbid renaming a heading.

## 2. The step line

Every part of the step line (`plan.md:650`) has a requirement (the list, items 1, 2, 3, Decision 1, item 5). In reverse: item 4 (the 1500-character limit) has no part in the step line and widens to `:479`, which the review had judged a decision; item 3's "a rewritten or kept item" is unclear in scope.

## 3. Premises

- `wc -l DESIGN.md` 576, the sections, the four lines over 1500 characters, the guides' line counts and the absent ADR folders all reproduce. The base copy does not exist yet, which fits the order of /spec, though the brief describes it as unpacked.
- The DESIGN.md translation holds: the 69 bullets equal the review's but for the numbers; all 81 DESIGN.md numbers (72 leading) match by their first 60 characters ("bad 0").
- Finding: the guide numbers were not translated. views.md gained two lines after `:95` and changed `:93` and `:95`, so the cites `views.md:95`, `:103`, `:107`, `:115`, `:163`, `:175`, `:181`, `:185`, `:197`, `:217`, `:231` point at the wrong paragraph; the cited text is 2 lines lower, and `:494`'s cite is now `:97`. Twelve bullets are affected. configuration.md, files-and-search.md, window.md and README.md changed words and no count.
- `:509` names `--engine` and `--default-port` and not `--handler`, which README now names: incomplete as well as a repeat.
- 27 items sampled against their cited places hold, but for the views.md cites above.

## 4. Cases and checks

- Case 3 names `ui/menu/Tooltip.svelte`; the one-open rule is held by `ui/menu/TooltipGroup.svelte`.
- Case 5's "one write chain per file" is false: the file operations share one chain, `opsWrites` (`src/routes/api/(files)/ops/+server.ts:10`, `server/root/context.ts:156`).
- Cases 4 and 6 conflict: case 4 keeps why worktrees live at the path in DESIGN.md, case 6 asks that a path change made in the guide alone leave DESIGN.md true. Recommended: case 4 keeps the decision without the literal path.
- Case 7 checks only names and its list is incomplete; its pattern forces a bold "Decks".
- Case 9 can pass by splitting `:479` or `:574` into two bullets.
- Item 5 contradicts item 4 (item 4's reduction of `:479` is not among item 5's exceptions).
- Item 3's "a comment line" goes against `spec.md:43` (a changed comment is rewrapped whole); `spec.md:42`'s history-word grep is not in the verify list.

## 5. The question

- Item 1 and case 1 can pass with a paraphrase left in DESIGN.md, which is still a second home; and where the guide line holds the reason (`source-control.md:55`, `files-and-search.md:73`) the brief does not say which side keeps it.
- The twelve views.md items can pass with a "no repeat; keep" judgment against the wrong line.
- Item 3 and case 7 can pass with the description-cited comments made false.
- Item 4 and case 9 can pass with a split line.
- Decision 1 leaves known repeats outside the list named and unchanged while the goal says each fact has one home; leaving them is the lazy option, and the recommendation is to reduce them in this step.

## 6. Implied inputs

1. The comments that cite listed items by description (check 1).
2. The views.md cites (check 3).
3. README's three arguments against `:509`.
4. A guide line that holds the reason itself.
5. A move into a guide with no section for it (`:245`'s wallpaper toggle rule, for views.md's Settings section; `:465`'s keyboard equivalents, absent from window.md); item 2 should say no heading is renamed.
6. D23, in flight on a pre-Q125 base, writes DESIGN.md's Processes paragraph (`:165`, which `:546` may merge into), the socket, Hot reload, the editor theme and the status bar; the brief names no merge order with it.
7. HELP.md is not among item 1's places a repeat can sit.

## 7. ADRs

None: `ls tools/oculus/docs/adr` and `ls docs/adr` print "No such file or directory".

## 8. Dictated text

- "**Decks.**" holds the prose rules but breaks the section's form: every item of "Decisions taken" opens `- <Label>:` (`grep -c '^- \*\*' DESIGN.md` prints 0); use `- Decks:`.
- "Everything in the brief is done" holds.
- Case 5's "one write chain per file" and case 3's `Tooltip.svelte` hold the prose rules and are false (check 4).

## Declined to judge

The review's per-item verdicts beyond the 27 sampled; whether each item's reason is unique to DESIGN.md, item by item; whether `history.test.ts` is in `test:quick`.

Usage: a184d66639bbbd679, claude-opus-5-5, 193,539 tokens, 55 tool uses, 8.1 min (from its completion notice).

## Closed

- Check 1, the description cites: "What is on the tree" lists them (the `:461` five, the `:100` two, "Untyped input"); item 3 requires each to hold or be rewritten; the write list names the comment paragraph of any file under `src`, `tests` or `utils`, with the files named.
- Check 1, the four comments false on main: item 3 rewrites them in this step (the step line's "every cite names a file that holds what its sentence says"), and the write list names their files.
- Check 1 and implied input 5, the headings: item 2 forbids renaming, splitting or removing a guide's heading, and names where `:245` and `:465`'s moved sentences go.
- Check 2, item 4: kept, since `:574` is on the list and the 1500-character limit is the rule Q125's brief set for DESIGN.md; item 5 now names item 4's reduction of `:479` among its exceptions. Item 3's scope is stated: the cites of a listed item or of any item the step changes.
- Check 3, the views.md cites: every `views.md` cite at 95 and above in the list moved 2 lines down, `:494`'s to `:97`, and "What is on the tree" says so with the diff command. The base copy is described as unpacked at preparation.
- Check 3 and implied input 3, `:509`: "What is on the tree" states it is incomplete as well as a repeat.
- Check 4, case 3: `ui/menu/TooltipGroup.svelte`.
- Check 4, case 5: "the file operations on one write chain of their own, apart from the other writes".
- Check 4, cases 4 and 6: case 4 keeps the decision without the literal path and points at the guide.
- Check 4, case 7: the grep is `grep -n "^- Decks:" DESIGN.md`, and every description cite is read and quoted.
- Check 4, case 9: `:479` and `:574` stay one item each, with a row each; item 4 says the same.
- Check 4, item 3 and the history grep: a comment paragraph, rewrapped whole as `agents/spec.md` says; verify item 6 is the history-word grep with each hit judged.
- Check 5, item 1: a fact said elsewhere is removed in whatever words DESIGN.md said it; a reason lives in DESIGN.md and the behaviour in the guide, the guide dropping the reason clause or pointing at DESIGN.md; case 1's bar is no fact of `source-control.md:55` restated.
- Check 5, Decision 1: further repeats of the same kind outside Apps are reduced in this step and named in the table (item 1, Decision 1).
- Implied input 6, D23 and PR3: "What is on the tree" states the shared paths and the merge rule (Z642's: the second to land carries the other's text).
- Implied input 7, HELP.md: item 1 names HELP.md among the places a repeat sits; HELP.md keeps its short form, DESIGN.md keeps the decision.
- Check 8, "Decks": the item opens `- Decks:` (item 3, Decision 2, case 7).
- Dictated lines added after the check, each held against the prose rules (plain, ASCII, no dash stand-in, no history): `- Decks:` (item 3, case 7, Decision 2) holds; the verify item 6 word list quotes `agents/spec.md:42` and holds.
