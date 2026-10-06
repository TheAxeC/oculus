# Brief check: E4g

The brief `agents/briefs/E4g.md`, read on main at a564e4e29. The checker changed nothing.

## Names

`git grep -n "apps\.md\|Apps guide" -- ':!tools/oculus/config/local.yml'` finds the new names only in the ledger (`plan.md:641`, `queue.md:5`, `orchestrator-state.md:194`). `config-folder.test.ts:330-341` loops over every `docs:` entry and still holds. `diagrams.ts:23` and `HELP.md:331` name `docs/diagrams/` only and stay true.

1. `h1-h6` becomes false: the Help group has two views (Help, Memories) and four documents; the Apps guide is the seventh, `h7`. `HELP.md:82` and `config/text/app.yml:12` carry the row, and neither is in the write list. H3's brief changed both when it added Data map (`briefs/H3.md:94`).
2. The Help page arrangement is left out and Decision 1 does not say so. `DESIGN.md:84` says the Help group "holds the manual, the Memories wall and the hub's documents, which the Help page's arrangement draws"; `layout.yml:98` does not get the guide. `HELP.md:21` lists the Help page's tabs. H3's Decision 6 (`briefs/H3.md:169`) took catalogue plus arrangement. Decision 1 should list the options, name the lazy one, and widen the write list to `layout.yml:98`, `HELP.md:21`, `HELP.md:82` and `config/text/app.yml:12`.
3. `DESIGN.md:79-80` lists `docs/diagrams/` as the only entry of `docs/`; with `docs/apps.md` the tree is incomplete, and the line is not in the write list.

## The step line

| Part of `plan.md:641` | Requirement in "What to build" |
|---|---|
| the path | 1 |
| from an empty folder to an approved app | 1.3, 1.5 |
| keeps a store | 1.6, 1.10 |
| opens things | 1.6, 1.10 |
| every manifest key | 1.4 |
| every method | 1.6 |
| every refusal word | 1.7 |
| where the files go | 1.2 |
| approval and a change of a file | 1.5 |

4. "reads channels": item 1.6 asks for the channels and how `reads` gates them, not what each channel's payload holds (`ConfigPayload`, `data/model/index.ts:241`; `GitState`, `model-sessions.ts:661`); `data/model/` is not on the read list.
5. "writes": nothing asks for each open write kind's body shape, or for the rule that the body carries its own `kind` equal to the kind named (`app-gate.ts:4-12` refuses 403 `{ error: 'kind' }`, seen as `refused:kind`, `methods.ts:183-185`; bodies in `server/edit/writes/bodies.ts:17-104`). Neither file is on the read list.
6. "a worked example he can copy and run": only a static manifest read checks it (case 9); nothing runs the example. E4's brief set up a scratch oculus (`briefs/E4.md:89`); either the builder runs it there or the landing look runs it on TEST.

## Premises

Rerun and holding: `ls docs` prints only `diagrams`; `grep -n '^## Apps added' DESIGN.md` prints 252; HELP.md `## Apps` at 210 and `## Source Control` at 222; the constants of `manifest.ts:23-46`; the nine methods (`methods.ts:90-100`); the three handlers and the import line (`oculus.js:3,10-11,123-134`); `REFUSED` with six words and `refusedWith`/`failedWith` (`rules.ts:13-40`); the `apps:` block at `behavior.yml:202` with its nine defaults and `options.yml:658-727`; `layout.yml` 176-180; `docs.ts` `renderHubDoc` (`:394-413`); no glossary.

7. The DESIGN section runs 91 lines (252 to 342; `## Relationship to the cockpit` at 343), not 92.
8. `apps.refused_not_json` is the word `not_json` (`config/text/views/apps/apps.yml:65`), not a sentence.
9. Item 1.9 dictates a false claim, "no network outside the addresses it may open through `open`": `connects` origins are in `connect-src` (`address.ts:98`; `HELP.md:214`, `:218`), and DESIGN's "What an app does not get" names WebRTC/STUN, DNS prefetch and preconnect. It also leaves out the sandbox limits (`address.ts:27`, `allow-scripts allow-downloads`): no modals, no `localStorage`, no forms or popups.
10. Item 1.2 and case 5 give only `~/.oculus/apps`; the machine folder is `apps_dir` of `local.yml` (`watch/apps.ts:92-97`, `options.yml:1352-1354`, `HELP.md:212`), and the approvals file moves with `approvals`.
11. The brief names no worktree and no base copy, which `spec.md:31-32` requires (`briefs/E4.md:33` shows the form).

## Cases and checks

12. Cases 2 and 3 limit refusals to `methods.ts`; `getStore` rejects with what `store-cache.ts` gives (`missing`, `failed:<status>`, `:10-14,72-97`), `setStore` and `write` reasons come from the server (`app-gate.ts:8`), `app-store.ts:51-53` answers `{ error: 'unwritable' }`, `key` drops the call (`methods.ts:336`), and `read` resolves `null`.
13. Case 7 reads only `methods.ts`; the server half (`open.ts:1-13`) answers `closed` for a link out of the root, a link into a dot folder and oculus's config folder.
14. Case 9 cannot run as written: `tsx` is not in `node_modules/.bin`, and `npx tsx -e` fetches an unnamed package (`spec.md:55`); Node v24.21.0 runs `.ts` directly. `readManifest` needs `file`, `folder`, `root`, `files`, `glyphs`, `port` and `catalog` (`manifest.ts:61-75`); a hand-written `files` set lets the entry check pass. `scanApps` (`scan.ts:92`) with `machine` set to a scratch folder and `roots: []` runs the walk, manifest, hash and store read and writes nothing.
15. Case 9 passes an example that cannot run: it checks neither the content policy (`script-src <base> <shared>`, no `'unsafe-inline'`, `address.ts:93`), the served types (`TYPED`, `address.ts:31-45`), modals, nor the write body against its parser.
16. The example's write is unsafe on the real hub: the five kinds that ask first are `delete-entry`, `feed-delete`, `new-idea`, `linkedin-idea` and `linkedin-post` (`data/helpers/files/apps.ts:153-159`); three record `undo: 'none'` and two delete hub data. Case 8's "the History row with its Undo" is false for three. The brief should name the kind, the body and what is pressed, for example deleting an entry the example first made with `new-entry`.
17. Case 12 bans only "was"; `spec.md:42` gives the full list. Verify item 3's grep has no `---`. A nested list item matches ` - `, which only needs naming.
18. The report path under `.scratch/` conflicts with `spec.md:35`; standing practice (`grep -l "reviews/.*-report.md" briefs/*.md | wc -l` prints 206). Low severity, not specific to this brief.

Verify item 1's claim that `test:quick` runs the config checks holds: `tests/tiers/essential.txt` lists `tests/checks/config/{integrity,config-folder,config}.test.ts`, `quick.mjs:183-186` picks them, and `layout.yml` is in `.prettierignore`.

## The question

- Item 1.1: could pass alone, cannot fail.
- Item 1.2: yes (finding 10; dot files and links neither recorded nor served, `record.ts:3-6`; the approval hash covers the real folder path).
- Item 1.3: yes; an inline-script `index.html` passes and does not run (finding 15); writing `app.yml` before `index.html` raises a brief `entry_missing` (`manifest.ts:297-298`).
- Item 1.4: no, bound by case 1.
- Item 1.5: mostly no; nothing asks that Keep approved ends with the server process.
- Item 1.6: yes, findings 4, 5 and 12.
- Item 1.7: yes, finding 12.
- Item 1.8: no, bound by case 4.
- Item 1.9: yes, dictated wrong (finding 9).
- Item 1.10: yes, findings 6, 15 and 16.
- Item 1.11: yes; no case checks it beyond case 11.
- Item 2: yes; it does not say where the guide opens inside oculus.
- Item 3: no for the entry, but it makes `h1-h6` false (finding 1).

Cases: 1 no; 2 yes (12); 3 yes (12); 4 no; 5 yes (10); 6 no; 7 yes (13); 8 yes (5, 16); 9 yes (14, 15); 10 no; 11 no in principle; 12 yes (17). The step-line check passes while findings 4 to 6 stand.

## Implied inputs

19. The content policy, the served extensions and the sandbox limits (findings 9 and 15): a natural first app fails silently.
20. Channel payload shapes and write body shapes (findings 4 and 5).
21. When the guide can be seen in oculus: `docs:` paths are read under the hub `local.yml` names, the main checkout; until landing the entry draws the missing line (`docs.ts:510-515`). The look runs on main after landing.
22. Links and code blocks in the doc view: a relative link resolves against the hub root (`docs.ts:236`), not verified for HELP.md or DESIGN.md; fenced code is sanitised (`docs.ts:30-33`); whether the doc view gives a copy control is not verified.

## ADRs

`ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both; `grep -n "adr" .agents/plan.yaml` exits 1. None.

## Dictated text

- The `layout.yml` entry (`grep -n '"Apps guide"' E4g.md` prints 44 and 87): holds; ASCII, columns aligned (`path:` at 35 and `group:` at 68 on all five lines).
- The label "Apps guide": holds.
- "Keep approved while I edit" (line 36): holds; matches `apps.yml:11`.
- The HELP.md sentence (line 43): content only; holds, and should say where the guide opens inside oculus.
- The brief's own dash hits (`grep -n -- ' - \| -- \|---' E4g.md` prints 124 and 136): a quoted grep pattern and a nested list marker; holds.
- Item 1.9's sentence: breaks the rule that no claim is made the code does not bear out (finding 9).

## Declined to judge

- Whether Node 24's type stripping loads the whole import graph of `config.ts` and `manifest.ts`.
- How `app-store.ts`'s `{ error: 'unwritable' }` reaches the app.
- Whether the Settings view shows `apps_dir` under the same Apps heading (`options.yml:1352`, `section: Apps`, no `heading`).
- Whether `utils/outside-paths.mjs` parses "HELP.md lines 210-221" entries.
- `plan.md` has no Goal heading; the header paragraph and Z633 (`plan.md:1373`) served as the goal.

Usage: a0be667a081a9ab33, claude-opus-5-5, 205,592 tokens, 78 tool uses, 8.8 min.

## Closed

Each finding is closed by a change to `agents/briefs/E4g.md`:

1. Item 5 makes `HELP.md:82` and `config/text/app.yml:12` true for seven entries, the count read from the code; both lines join "Paths this step writes"; case 14 checks them.
2. Item 4 adds the guide as a tab of the Help page (`layout.yml:98`), and item 5 makes `HELP.md:21` name it. Decision 1 lists options (a) catalogue and tab, chosen, (b) catalogue only, the lazy option, and (c) no entry. `DESIGN.md:83` (the sentence the checker cited at :84) then holds unchanged.
3. Item 5 adds `docs/apps.md` to `DESIGN.md:79-80`'s tree; the range joins the write list.
4. Item 1.6 asks for each channel's payload fields as `src/lib/data/model/` types them; read list item 9 adds `index.ts` and `model-sessions.ts`.
5. Item 1.6 asks for each write kind's body as `bodies.ts` types it and the `kind` rule of `app-gate.ts`; "What is on the tree" states the rule; read list item 8 adds the files; case 8 checks them.
6. New case 13 runs the example in a scratch oculus set up as E4's brief item 14 did, with a scratch hub, quoting what the page showed; a step a headless run cannot press is named for the look on TEST. Verify item 4 quotes cases 9 and 13.
7. "What is on the tree" gives 91 lines, to 342.
8. "What is on the tree" and case 3 give the word `not_json`.
9. Item 1.9 is rewritten to the code: the `connects` origins in `connect-src`, the `open` addresses, what DESIGN.md says no policy stops, no inline script, no modals, no `localStorage`, no forms or popups, and the served types; "What is on the tree" states each with its line.
10. Item 1.2 and case 5 name `apps_dir` and its default; "What is on the tree" names the `approvals` key.
11. The brief names the worktree `.agents/worktrees/E4g` and the base copy `.agents/worktrees/E4g-base/tools/oculus/` with its `git archive` command.
12. Item 1.6 and case 2 read refusals from `methods.ts`, `store-cache.ts`, `app-gate.ts`, `app-store.ts` and `open.ts`, with `key` dropping and `read` resolving `null`; case 3 lists the server's reasons.
13. Case 7 names `src/lib/server/machine/apps/open.ts` and its rules.
14. Case 9 runs `scanApps` with `machine` set to a scratchpad folder and `roots: []`, in a `node` run of a `.ts` script; `npx tsx` is named as not installed and not fetched.
15. Case 9 checks no inline script, no `alert` or `confirm`, every file's extension in `TYPED`, and each write body against its parser; item 1.3 puts the script in its own file and writes `index.html` before `app.yml`.
16. Item 1.10 and Decision 3 make the example's write a `new-entry` and a `delete-entry` of that entry, Cancel first for `declined`, so the hub's data is left as found; case 8 and item 1.6 name the kinds that record no Undo; case 13 runs it against a scratch hub only.
17. Case 12 uses `agents/spec.md`'s list of words and asks for the grep quoted with each hit judged.
18. Standing practice for every brief; no change.
19. to 20. Closed by 4, 5, 9 and 15.
21. Case 13 runs the example before landing in a scratch oculus; the guide in the doc view is seen at the look on main.
22. Read list item 10 adds `docs.ts` for how a relative link resolves, so the guide's links open in the doc view; the copy control is seen at the look.
- Item 1.5 adds that Keep approved ends when the server process ends; item 1.2 adds dot files, links and the real-path hash; item 2's sentence says where the guide opens in oculus.

Dictated lines added after the check, held line by line:

- `{ view: doc, state: { id: tools/oculus/docs/apps.md, path: tools/oculus/docs/apps.md, label: "Apps guide" } }` (`grep -n 'id: tools/oculus/docs/apps.md' E4g.md`): holds; it takes the shape of the four doc tabs at `layout.yml:98`, with the hub-relative path the `docs:` entry uses, ASCII (`LC_ALL=C grep -n '[^ -~]' E4g.md` exits 1).
