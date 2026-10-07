# PR4 landing

Position: the oculus migration plan; step PR4, Present's presenter screen, landed; next: the reviews of D45 and D23b when their builders report.

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Z681 (2026-10-07, M8's /spec, a clash between a design rule and an automode ruling): `tools/oculus/DESIGN.md:24` says "Not a rewrite of the data. The YAML in the hub is the source of truth and its shape does not change for oculus." Z672, which the orchestrator closed in automode, changes the hub's YAML for M8 (the hub's YAML checked and completed in the editor): it renames `options_from` to `from` in the `schema:` blocks of 16 hub files, adds `when:` conditions and new `schema:` blocks (career, literature radar), and changes values in the data itself (`access: public` to `open`, new venue categories, a new event role). A clash between a written design rule and a ruling is Axel's, so M8 waits. Options: (a) recommended: the sentence is reworded so that the hub's `schema:` blocks, which describe the data, may change to serve the editor's checks, while the records themselves keep their shape and change only where a value breaks its own rule (the Z468 departures); Z672 stands. Pro: one name for one thing across every schema, and the editor and the Findings view check the same declarations. Con: 16 hub files and the cockpit's two readers (`tools/cockpit/src/cockpit/selftest.py:595-621`, `page.py:706-709`) change. (b) the sentence stands and the hub's YAML keeps its keys: oculus reads `options_from` and `from` as two spellings of one key, and only the data departures are settled. Pro: no hub file's keys change. Con: three names for one thing stay, which Z672 called the lazy option. (c) the sentence stands strictly: no hub file changes at all, the data departures included, and M8 only reads. Pro: the hub untouched. Con: the Z468 departures stay as findings forever. The lazy option is (b).

## The check of Steps 1

The builder aae584457c255ee97 and the reviewers a65731dee140e3b13 and a2951440a5a116e09 had finished; TaskStop found no task for any of them, and the agent listing showed only D45's and D23b's builders.

## NOT DONE

- Not looked at: the audience popup in a browser (it opened outside the ChromeTabs the browser tool sees), the oculus desktop window's audience window, Close Window and real full screen (cases 16, 17 and the full-screen half of 18, which need the desktop app and a press), and the light theme (case 19).

## What landed

The presenter screen in the pane, the audience window at `/present/show` in a browser popup or an app window of its own, the two kept on one slide, the deck drawn as saved while presenting, presenting held per pane; 30 files from base 70b68cca plus the fixes at landing. G47's test line widened by the two new tests.

## Fixes at landing (6)

1. The host reloads an existing audience window only when its page shows `data-ended` (Z689), `src/desktop/windows/show.ts`.
2. `docs/views.md` names both hosts for a second Presenter press.
3. `Present.svelte`'s head comment names `screen/fullscreen.svelte.ts`.
4. A reused audience window takes the asking window as its `from`, so it is placed and closed with it.
5. An audience page that ends after two failed reads posts `closed` first, so the presenter screen ends after its wait.
6. From the look: in a narrow pane the presenter screen wraps its side column under the current slide (`Presenter.svelte`); before, the current slide was 0 px wide in a 146 px pane.

## The gate

In `.agents/worktrees/gate`, `npm run diagrams && npm run test:landing`. First run: red only in `tests/checks/config/integrity.test.ts` (2 tests), because the gate's sparse checkout lacked the hub's `deck/`; with `deck` added, `npm run test:checks` alone passed 17 files, 243 tests. After fix 6 the whole gate again:

```
ok      ASCII gate (1.8 s)
ok      npm run format:check (24.4 s): All matched files use Prettier code style!
ok      npm run lint (81.1 s)
ok      npm test (126.1 s)
ok      npm run test:checks (240.3 s)
ok      npm run check, then npm run build, then npm run test:slow (300.4 s)
test:landing: 300.4 s; every command passed
```

Main's staged diff equal to the gate's by `cmp`.

## The look

On TEST in oculus in Chrome (port 8790): Present in a narrow pane, Presenter started; after fix 6 the current slide, the counter, clock and timer, Pause, Reset and End, the next slide and the notes all drawn; End returned the pane to the view; `/present/show?root=hub&path=deck` opened in its own ChromeTab said "The presenter screen has ended. Close this tab to leave."

## Agents

- Builder aae584457c255ee97 (claude-sonnet-5-5): 244,067 tokens, 196 tool uses, 55.5 min; round 1 289,334 tokens, 17 tool uses, 5.5 min.
- Brief check adc90b337fe7ebaaa (claude-opus-5-5): 229,636 tokens, 65 tool uses, 10.4 min.
- Reviewer a65731dee140e3b13 (claude-opus-5-5): 275,449 tokens, 72 tool uses, 17.4 min.
- Reviewer over round 1 a2951440a5a116e09 (claude-opus-5-5): 212,724 tokens, 53 tool uses, 13.2 min.

The first report did not pass its bar (one repair round); fixes at landing: 6.
