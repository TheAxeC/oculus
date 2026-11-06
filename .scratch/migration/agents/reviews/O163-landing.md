# O163 landing

Position: roadmap entry "migration" (the cockpit-to-oculus migration); step O163, the hub's portfolio deck written again, landed; next: /land O164, /spec O165, O151 and O159.

## Open items

None.

## The check of Steps 1

`ListAgents` listed no agent of O163 (builder a298e389ab9f210ac, brief check ad6ecc7ddb8993bc9, reviewer aa3bb87266628f0f5); the one running subagent was O161's builder.

## NOT DONE

The hub commit of `deck/present.yml`, `deck/title.md`, `deck/closing.md`, the removal of `deck/engine.md` and `deck/transition.md`, and `README.md:60`: the files are changed on disk in `~/workspace/research-hub` and wait on Axel's word for their commit (ruling Hub deck written again). Not seen at the look: the light, rice and high-contrast themes, the presenter screen, the audience window and the PDF.

## What landed

On main, 1 path, 1 deletion: the "public artifact" comment line of `tests/fixtures/hubs/demo/deck/present.yml`. In the hub, from the report's "Hub files" by `cp` of the extracted fences: `deck/present.yml` (one group `projects` finding `projects/**/present` of tier research, `discover: true`, the order title, the group, closing), `deck/title.md` (kicker "Research portfolio | technical briefing", heading "Research projects", legend of the group), `deck/closing.md` (the first sentence "Happy to go deeper on any of the research projects: the motivation, the method, or where it stands.", the collaborators sentence word for word), `deck/engine.md` and `deck/transition.md` removed, `README.md:60` "A project's slide is `present/main.md`". `git -C ~/workspace/research-hub status --short -- deck README.md` prints the six lines of C10.

## Found and fixed at landing

None. The refuter's Proof 1 and Behaviour 1 are closed with no change (`O163-refuter.md`, "Closed").

## Verification

Gate at 94cb4f3b6: `npm run diagrams && npm run docs:palette && npm run test:quick`, exit 0, "svelte-check (16.5 s): ... 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "test:quick: 63.2 s; every command passed". After the copy into the hub: `npx vitest run tests/checks/config/integrity.test.ts`, "Tests 7 passed | 7 skipped (14)". Main's staged diff equal to the gate's under `cmp`.

## The look

Scratch server on 8797, its hub copy's `deck/` set to the landed files, VS Code Dark Modern with the wallpaper, Mine only on: the portfolio deck "Research projects" draws 27 slides, the title, the 25 decks in C3's order (hccnet-fl first, fed-faithful-ecg last) and the closing; no engine, summary, grid or transition slide. The title slide's legend draws seven domains: Hepatology imaging, Cardiology ECG, Neuroscience EEG, Methods and ML frontier, Meta-science, Privacy vertical FL, Hepatology federated (C7). The stage `submitted` gives 13 slides and "11 of 25 shown", Clear all 27 (C5). A search no project holds gives 2 slides, title and closing, and "0 of 25 shown" (C6). The Findings view searched for "deck" shows no finding (C1). The closing slide draws its kicker, heading, the two sentences and the contact. Screenshots: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O163look/1-title.jpg` and `2-closing.jpg`.

## Agents

Builder a298e389ab9f210ac (claude-opus-5-5, 255823 tokens, 100 tool uses, 25.4 min); brief check ad6ecc7ddb8993bc9 (claude-opus-5-5, 207946 tokens, 62 tool uses, 11.7 min); reviewer aa3bb87266628f0f5 (claude-opus-5-5, 170759 tokens, 49 tool uses, 17.4 min). The builder's first report did not pass its bar (its first line called item 8 not done over load timeouts the review and the gate do not reproduce); no fix at landing.
