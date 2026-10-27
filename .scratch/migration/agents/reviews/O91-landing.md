# O91 landing report

Position: the migration plan (`.scratch/migration/plan.md`), step O91, joint work onto the people file and the projects on the cards of a person, an organisation and a resource, landed with the research hub's commit 6e868b885. In flight: none. Next: /spec O90, then /spec O92.

## Open items

None.

## The check of Steps 1

ListAgents, before anything was cherry-picked: no subagent running; none of O91's builder aee7e1a854ae78fa0, its brief check a9938b4abd405e606 or its reviewer a9b1c10a67c74430a listed, only the peer session research-hub-6f, idle.

## NOT DONE

- Not looked at on 8790: the Settings collection row without the `joint_work` toggle and the hub editor's mark of a `joint_work:` key (case 19); no hub file on 8790 holds the key. Both are covered by the case-run the review reran.

## What landed

- oculus: the range eeafcd4cb..migration-O91 (wip 8f8aa817b), 53 paths (52 changed, 1 deleted), 500 insertions and 657 deletions, with the fixes at landing and the Doc text of `docs/data-map.md` staged alone.
- The research hub, commit 6e868b885: `people.yml` gains `work`, `tags` and `note`, each of the ten people of the joint-work file carrying its title as `work` and its `tags` and `note`; `joint-work.yml` deleted; `gen_figures.py` without its joint-work rows and its figures regenerated; the Meyfroidt README names `people.yml`.

## Conflicts, resolved by reading both sides

- `docs/diagrams/*`: taken from main and regenerated.
- `tests/fixtures/hubs/demo/.oculus/data/academic/joint-work.yml`: deleted.
- `config/defaults/sources.yml`: O91's flags line, O87's `ticker:` line.
- `config/options/behavior.yml:161`: O87's text ending "talks, teaching and positions."
- `src/lib/state/boards/ticker.ts`: O87's comment without joint work.
- `src/lib/state/boards/person.ts`: the head comment with O93's `lineNames`, without joint work; O93's imports kept, `Entry` and `flaggedEntries` dropped.
- `src/lib/views/boards/person/Person.svelte`: O88's `GroupHead` for Projects, the Joint work group dropped, the head comment naming the four block keys left.
- `src/lib/views/shared/forms/entry/Referrers.svelte`: the merged head comment.
- `docs/HELP.md:551` and `docs/templates.md`: O87's sentences without `joint_work`.

## Fixes at landing

- The review's two Standards findings: the `docs/templates.md` collections paragraph and the `RecordCard.svelte` foot paragraph rewrapped whole.
- Ruling 489 (b): the `work` row in `docs/templates.md`'s people schema and in the demo fixture's `people.yml`, the demo's two people carrying their former joint-work titles.
- `agents/guarded.md`: G66's row title names a statements entry; G32's joint-work clause removed.

## Verification

- Gate, the run after the last change: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (552 files, 0 errors, 0 warnings), vitest checks, vitest and vitest slow ok, "test:quick: 286.7 s; every command passed".
- Gate, the first run: red only on time-outs at a load average of 12 to 15 (`tests/ui/html.dom.test.ts` worker start; 20000 ms in `hub-portfolio.test.ts`, `self.test.ts`, `config-value.test.ts`); the four files passed alone, 64 of 64 and 56 of 56 in the slow tier.
- Main: the gate's staged diff applied with `git apply --index`; each of the 52 staged paths that is not a deletion equal under `cmp` to the gate's file.
- Hub: `python3 docs/figures/gen_figures.py` exit 0; `git grep -n -i "joint-work\|joint_work" -- ':!.oculus/local.yml'` prints nothing; each of the ten people holds `work`, `tags` and `note` (`yaml.safe_load`).

## The look, localhost:8790, Axel's page

- Right after the files reached main, the rail's badge threw `text key not in the text catalog: views.joint-work` three times while the dev server swapped the code; after a reload the page loads with no console error or warning.
- Academic Life: the saved tab read "Unknown view: joint-work" (case 22); closed.
- People: 30 cards in rows of three at 366 px, each row one height, no sideways scroll; Amir Haeri one Collaborator row (8 in flight, 2 done); van den Berg Lead, then Collaborator; Axel's card Lead, Supervisor and Collaborator; Work, tags and note on the cards.
- Organisations: one strip with no heading. Resources: UTwente HPC 8 in flight and 1 done, This Mac 7 in flight and 1 idea, Local data none.
- Amir Haeri's Person page: no Joint work block or button; Projects 11; Waiting on BT-Op-Theory; the editor with Work, Tags and Note.
- Status bar findings 0; no page text names joint work. The page was left as Axel had it, without the closed tab.

## Agents

- Builder aee7e1a854ae78fa0 (claude-opus-5-5): 261710 tokens, 353 tool uses, 69 min 39 s. Its first report passed its bar: no repair round.
- Brief check a9938b4abd405e606 (claude-opus-5-5): 228428 tokens, 71 tool uses, 11 min 7 s.
- Reviewer a9b1c10a67c74430a (claude-opus-5-5): 304973 tokens, 100 tool uses, 28 min 53 s.
