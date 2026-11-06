# O150 report

NOT done: no item of "What to build" is built and no hub file is drafted. The step is handed back before any change, as the brief's "Cases" asks for a case its rules get wrong: item 4 and case C8 require `deck/engine.md:12` to say that each project's slides give "its governing equation where it has one, then its specs, method and results" and that each claim holds for the 25 decks, and 11 of the 25 decks draw no equation, no specs, no method list and no results list (9 are one idea card each, 2 are one text slide each). A second expectation, C1's "no deck finding under Findings", is likely false at the look for a reason outside this step's files (the Too tall findings of the placed project decks); it is not verified, since a builder runs no page. Both are set out under "Handed back" with options and a recommendation.

## Open items of the state file, verbatim

- 697 (2026-11-06, O150's brief check): the hub's new portfolio deck finds its decks with `projects/**/present`, which must walk every folder under `projects/` (70,316 files); timed with `node -e` and `globSync` in the hub it takes 1319 ms, against 2 ms for the old `projects/*/*/present`. The deck reader keeps a glob only inside one reader (`src/lib/data/sources/deck/read.ts:217,347-362`), and a new reader is made for each snapshot build and each deck read of the Present view, a filter change included, so each of those would wait about 1.3 s. (a) A new step: the deck reader keeps a folder glob's matches per hub across readers and drops them when the file watcher sees a folder added, moved or removed under the glob's root. Pros: every depth stays covered, as the hub's `README.md:52` allows any depth of filing, and the cost is paid once. Cons: one more step, and a cache that must be cleared at the right moments. (b) Accept the 1.3 s on each snapshot build and each filter change. Pros: no work. Cons: the Present view's filter bar answers about a second late on this hub. Recommended (a); (b) is the lazy option. A list of today's three depths is not offered, since it misses a deck filed deeper, which the layout allows. O150 is built with `**` either way.
- 698 (2026-11-06, O150's brief check): with every research deck placed, some of the deck's framing words no longer hold for all of them: the title slide's "A shared thesis: clinical data is intrinsically multi-way ... block-term tensor structure ...", the heading "The common engine" and "recurs across the portfolio" on the engine slide, and the kicker "June 2026". Three of the 25 decks (`clinical-ai-eval-artifacts`, `fl-privacy-auditing`, `ssm-longitudinal`) name no tensor or block-term word (`grep -c -i -E 'block-term|tensor|multi-way|BTD|Tucker'` gives 0). O150 keeps these words as they stand, and its builder drafts versions that hold for all 25 decks; both come to you with the landing's screenshots. (a) The drafted versions, as you correct them. Pros: the public deck claims only what each deck shows. Cons: the thesis line becomes less sweeping. (b) Your words as they stand. Pros: no change of the deck's voice. Cons: the title slide claims a shared thesis three decks do not share, and the kicker carries a past month. Recommended (a); (b) is the lazy option.

## Handed back

### 1. Item 4 and C8: the sentence the brief dictates is false for 11 of the 25 decks

The rule: item 4 says `deck/engine.md:12` is one sentence saying the slides after the engine slide are "the decks of the research projects that have one (25 of the 95 research projects), each project's slides first giving its governing equation where it has one (`ward-bttr-crosssubject`'s project slide has no `equation:`), then its specs, method and results"; C8 says "each of its claims holds for the 25 decks".

The result, read on the hub's deck files (one line per deck: its files, the `kind:` of each slide, and how many slides write `equation:`, `specs:`, `method:` and `results:`):

```
$ cd ~/workspace/research-hub && for d in $(find projects -path '*/present/present.yml' | sort); do dir=$(dirname $d); n=$(basename $(dirname $dir)); kinds=$(cat $dir/*.md | grep -E '^kind:' | tr '\n' ' '); eq=$(cat $dir/*.md | grep -c -E '^equation:'); sp=$(cat $dir/*.md | grep -c -E '^specs:'); me=$(cat $dir/*.md | grep -c -E '^method:'); re=$(cat $dir/*.md | grep -c -E '^results:'); echo "$n | files $(ls $dir | tr '\n' ' ') | $kinds| eq $eq specs $sp method $me results $re"; done
fed-faithful-ecg | files main.md present.yml  | kind: text | eq 0 specs 0 method 0 results 0
dongho-ecg-clustering | files dongho_silhouette.png dongho.png eq_dongho.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
hccnet-fl | files eq_hccnetfl.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
btd-autoencoder | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
clinical-ai-eval-artifacts | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
ecg-af-fair | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
fl-privacy-auditing | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
florank-personalization | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
hccnet-fl-sweden | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
hccnet-pathology | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
quantum-tensor-fl | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
ssm-longitudinal | files main.md present.yml  | kind: idea | eq 0 specs 0 method 0 results 0
bt-operator-theory | files eq_btfno.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
btfno | files btfno_blocks.png btfno.png eq_btfno.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
bttd-source-eeg | files bttdeeg_correlated.png bttdeeg.png eq_bttdeeg.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
bttn-incident-af | files eq_incidentaf.png incidentaf_arch.png incidentaf.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
covert-applied | files eq_covert.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
covert-theory | files eq_coverttheory.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
dries-bttr-ecg | files dries_forest.png dries.png eq_driesptb.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
ecg-readable-substrate | files main.md present.yml  | kind: text | eq 0 specs 0 method 0 results 0
fed-multicellular-immune | files eq_immune.png fedimmune.png immune_schematic.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
hccnet-revision | files eq_hccnet.png hccnet_arch.png hccnet.png main.md present.yml  | kind: project | eq 1 specs 1 method 1 results 1
meseret-cirrhosis | files eq_meseret.png main.md meseret_landmark.png meseret.png present.yml  | kind: project | eq 1 specs 1 method 1 results 1
raw-pls | files eq_rawpls.png main.md present.yml rawpls_method.png rawpls.png registration_baseline.png saliency_ortho.png saliency_patients.png synthetic_upgrades.png  | kind: project | eq 1 specs 1 method 1 results 1
ward-bttr-crosssubject | files calibration_curve.png finger_spatial_maps.png main.md method_overview.png present.yml  | kind: project | eq 0 specs 1 method 1 results 1
```

So 14 decks are one `kind: project` slide each (13 with an equation, `ward-bttr-crosssubject` without one, all 14 with specs, method and results); 9 are one `kind: idea` slide each, which draws one card (the idea's `desc:`, for example `ideas/ssm-longitudinal/present/main.md`: `kind: idea`, `desc: Continuous-time state-space backbone for irregular-interval longitudinal 3D MRI`, no body); 2 are one `kind: text` slide each (`archive/failed/fed-faithful-ecg/present/main.md` and `manuscripts/ecg-readable-substrate/present/main.md`, each a body under the headings "One-liner", "In plain words (ELI5)", "The idea / method", "Key results" and "Why it matters / what's next", with no equation and no spec chips). The reader run of the case-run program below agrees: with the brief's `present.yml` it places `{"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}`, `project slides 14, with no equation [ward-bttr-crosssubject]`. A sentence with item 4's content is false for the 9 idea decks and the 2 text decks, so C8 cannot be met as written.

A second point inside item 4: its "(25 of the 95 research projects)", if it is meant as words of the sentence, is false under every filter that narrows the group (C5 places 11 decks) and goes stale when a deck is added; no placeholder of the deck counts decks, since `{{projects.count}}` counts slides (`docs/decks.md:152`; it is 25 today only because each deck holds one slide). The options below write no count.

Options for the orchestrator's ruling:

- (a) The sentence names what each kind of slide that follows gives, with no count, for example: "The slides that follow are the research projects' own decks: a project slide gives its governing equation where it has one, then its specs, method and results; an idea is one card, and the other decks are one page of text each." Pros: true for all 25 decks and under every filter, and it keeps what the engine slide told the audience about the project slides. Cons: a longer line on a slide, and it names three kinds a deck author may later add to.
- (b) The sentence drops what the slides give: "The slides that follow are the research projects' own decks, in the order of the project boards." Pros: short, and true whatever kinds the decks use. Cons: the audience loses the line that tells it how a project slide reads.
- (c) Keep item 4's sentence and rewrite the 11 decks as `kind: project` slides with an equation, specs, method and results. Not recommended: it writes 11 project decks' content, Axel's words on his slides, which no ruling of this step covers, and an idea has no results to state.

Recommended (a); (b) is the lazy option.

### 2. C1: Too tall findings of the placed decks (not verified)

The rule: C1 says the portfolio deck opens "with no deck finding under Findings and no finding on the deck's files".

The reading: the reader raises no finding on the portfolio deck with the brief's `present.yml` once the title slide's lede carries no old count (the case-run program's runs below: the two findings left are the old lede's `{{pillars.count}}` and `{{more.count}}`, which item 3 removes). But the Present view lists every slide it has drawn taller than its frame under Findings as "slide too tall" (`docs/HELP.md:331`, `docs/decks.md:432`, `tallFindings` in `src/lib/state/life/present.svelte.ts:513-520`, which builds one finding per such slide at its source file and line), and O157's landing look measured "16 of the 25 project decks are Too tall" (`agents/reviews/O157-landing.md:52`). With all 25 decks placed, the look of C1 will see those findings, on the project decks' own files, if O158 (in flight) leaves them Too tall. This step's files cannot remove them. Not verified: it needs a page, which a builder does not run. Proposed reading of C1 for the look: no finding raised by the deck reader (state `ok`, an empty `findings` of the deck route's answer), with the Too tall findings of the placed project decks counted and named apart, as the state O157 and O158 leave.

## The cases' first run, on the hub's files as they stand

Each case read on `~/workspace/research-hub/deck/` as it stands (the base run of the case-run program, quoted whole below), and, where the case is about what the brief's rules produce, on the brief's item-1 `present.yml` (dictated whole by item 1) in a scratch copy of the deck folder, read by the same program with no hub file written.

- C1. As the hub stands: `snapshot findings 0`, `state ok, deck findings 0`. With the brief's `present.yml` and the old `title.md`: three reader findings, all from the title slide's old words (`a count of group pillars ...`, `a count of group more ...`, `legend names group pillars ...`); with `legend: projects` in the scratch `title.md` the two count findings remain, which item 3's lede removes. The reader's side of C1 holds once item 3 is built. The look's side: see "Handed back", point 2.
- C2. As the hub stands, the three groups hold 24 decks and leave out one research deck: `research decks the groups do not hold: [projects/archive/failed/fed-faithful-ecg]`. With the brief's group: `group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0`, `research decks the groups do not hold: []`, `held decks of no research project with a deck: []`; `fed-faithful-ecg` (stage `failed`) and both decks under `projects/archive/published/2026/` are members; `research projects 95, with a deck 25`, so 70 have none. Holds as the brief states it.
- C3. As the hub stands: 22 slides, with two summaries, one section (transition) and one grid (`slide kinds {"title":1,"section":2,"project":14,"summary":2,"text":1,"grid":1,"closing":1}`); the 9 idea decks share the one grid slide. With the brief's `present.yml`: 28 slides, the title, the engine slide, the 25 decks one slide each, the closing, no summary, grid or transition (`slide kinds {"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}`); each idea deck is its own `idea` slide. Holds as the brief states it.
- C4. With the brief's group, the order by category, each deck as the reader places it, by title: publications: "Federate What Transfers" (`hccnet-fl`), "Which representation clusters?" (`dongho-ecg-clustering`), both `accepted`; in-review, all `submitted`, by title: `bttn-incident-af`, `dries-bttr-ecg`, `ward-bttr-crosssubject`, `meseret-cirrhosis`, `hccnet-revision`, `bttd-source-eeg`, `fed-multicellular-immune`, `covert-theory`, `raw-pls`, `covert-applied`, `ecg-readable-substrate`; in-flight: `ecg-af-fair` (`exploring`), then `bt-operator-theory` and `btfno` (`revision`), the stage first; idea: the six `nascent` decks `btd-autoencoder`, `clinical-ai-eval-artifacts`, `fl-privacy-auditing`, `hccnet-fl-sweden`, `quantum-tensor-fl`, `ssm-longitudinal`, then the `scoping` decks `florank-personalization`, `hccnet-pathology`; dead-ends: `fed-faithful-ecg`. No deck of no category. The membership the brief lists holds; the brief lists in-flight as `bt-operator-theory, btfno (revision), ecg-af-fair (exploring)`, and the reader places `ecg-af-fair` first, by the board's stage order, which C4's own rule ("then the board's order (stage, then title)") gives.
- C5. With the brief's group and the filter keeping the projects at stage `submitted`: `group projects: members 25, kept 11, count 11`, 14 slides: the title, the engine slide, the 11 in-review decks of C4 in C4's order, the closing; the legend draws 4 domains (`hub:heart,hub:brain,hub:liver,hub:method`). With no filter (Clear all), the 25 again. Holds as the brief states it.
- C6. With the filter keeping the projects at stage `in-prep`: `kept 0, count 0`, 3 slides (title, engine, closing), the title slide's legend `[]`; the only findings are the old lede's two counts, which item 3 removes. Holds as the brief states it, once item 3 is built.
- C7. As the hub stands: `title.md:4` is `legend: pillars` and `title.md:8` holds `{{pillars.count}}` and `{{more.count}}`; the legend draws 4 domains (`hub:liver,hub:method,hub:heart,hub:brain`). With `legend: projects` in the scratch copy: `legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]`, the seven domains the brief names, each once; the domains of the 25 deck projects' manifests count `3 brain, 6 heart, 5 liver, 1 liverfl, 1 meta, 8 method, 1 privacy`. Holds as the brief states it.
- C8. As the hub stands, `engine.md:12` reads "Each of the next slides leads with the governing equation, then specs, method, and results.", which is false today for the grid, the summaries and the two text slides it precedes. The sentence item 4 asks for is false for 11 of the 25 decks: see "Handed back", point 1. C8 is a case the brief's rules get wrong.
- C9. As the hub stands: `grep -n '^\s*#' deck/present.yml` prints `1:# Rules for what goes on a slide (a public artifact): ...`. The brief's `present.yml` holds no comment line. Holds once item 1 is built.
- C10. As the hub stands: `grep -n -E 'transition\.md|pillars|more|ideas' deck/*` prints `present.yml` lines 6, 16, 26, 43 to 47 and 49, `title.md` lines 4 and 8, and `transition.md` lines 3 and 6. Holds once items 1 to 3 are built.

## The case-run program

It ran oculus's deck reader over the hub, read only. In mode `new` it read the text of `present.yml`, `title.md` and `engine.md` from a scratch copy of the deck folder and handed them to the reader as an editor's drafts over the hub's own paths (`drafts` of `DeckContext`, read by `src/lib/data/sources/deck/read.ts:260-264`), so the globs ran over the real hub's `projects/` and nothing was written there; `transition.md` stayed on disk, and no order entry of the brief's `present.yml` names it. The scratch copy held the brief's item-1 `present.yml` (below) and the hub's `title.md` with line 4 changed to `legend: projects`; `engine.md` was the hub's. Run as `node o150-cases.ts <base|new> <scratch deck folder> <none|stage>` from the scratchpad. The program, the scratch copy and the outputs are removed from the scratchpad (`rm -f` and `rm -rf`, then `ls ... | grep` printed none of them).

The scratch `present.yml`:

```yaml
deck:
    title: 'Structured models, everywhere they hide'

groups:
    projects:
        find: { folders: [projects/**/present], tiers: [research] }
        discover: true

order:
    - title.md
    - engine.md
    - { slides: projects }
    - closing.md
```

The source:

```ts
// Case-run program of O150. It only prints. It reads the research hub read only, builds its
// projects as the integrity test does, and reads the portfolio deck through oculus's deck reader,
// either as the hub's files stand (mode base) or with the text of the files in a scratch copy of
// the deck folder handed in as an editor's drafts over the hub's own paths (mode new). A third
// argument narrows the read as the filter bar does: none, or a stage whose projects it keeps.
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O150';
const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
const { buildOneHub } = await import(`${W}/tests/fixtures/hubs/hub-build.ts`);
const { mergeHubs } = await import(`${W}/src/lib/data/snapshot/hubs/merge.ts`);
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { deckReader } = await import(`${W}/src/lib/data/sources/documents/decks.ts`);
const { deckOrderOf } = await import(`${W}/src/lib/data/shapes/boards/order.ts`);
const { categoryOf } = await import(`${W}/src/lib/data/shapes/boards/categories.ts`);

const [mode, scratch, stage] = process.argv.slice(2);
const HUB = '/Users/axelfaes/workspace/research-hub';
const merged = loadConfig(engineDir(), { hub: HUB }).config;
const config = portfolioConfigFrom(merged);
const snapshot = buildOneHub(HUB, config).snapshot;
const projects = Object.values(
    mergeHubs([{ key: 'hub', snapshot, files: config.registries }], textCatalog(merged), 0).entities
        .projects
) as any[];
const order = deckOrderOf(merged);
const byFolder = new Map(projects.map((p) => [p.folder, p]));

const drafts = new Map<string, string>();
if (mode === 'new') {
    for (const file of ['present.yml', 'title.md', 'engine.md']) {
        const at = realpathSync(join(HUB, config.portfolioDeck, file));
        drafts.set(at, readFileSync(join(scratch, file), 'utf8'));
    }
}
let keep: Set<string> | undefined;
if (stage !== undefined && stage !== 'none') {
    const { ofHub } = await import(`${W}/src/lib/data/helpers/hub-names.ts`);
    keep = new Set(ofHub(projects.filter((p) => p.stage === stage), 'hub').map((p: any) => p.id));
}
const words = { record: () => undefined, vocab: merged, catalog: textCatalog(merged) };
const hub = { key: 'hub', dir: HUB, config };
const deck = deckReader({ hub, projects, words, drafts, ...(keep ? { keep } : {}) }).read(
    { key: 'hub', dir: HUB },
    config.portfolioDeck
);

const research = projects.filter((p) => p.tier === 'research');
console.log(`mode ${mode}, filter ${stage ?? 'none'}, portfolio_deck ${config.portfolioDeck}`);
console.log(`snapshot findings ${snapshot.findings.length}`);
for (const f of snapshot.findings) console.log(`  snapshot finding ${JSON.stringify(f)}`);
console.log(`research projects ${research.length}, with a deck ${research.filter((p) => p.deck !== undefined).length}`);
console.log(`state ${deck.state}, deck findings ${deck.findings.length}`);
for (const f of deck.findings) console.log(`  deck finding ${JSON.stringify(f)}`);
console.log(`order entries ${deck.order.map((e: any) => `${e.kind}:${e.name}`).join(', ')}`);
for (const group of deck.groups) {
    console.log(`group ${group.name}: members ${group.members.length}, kept ${group.members.filter((m: any) => m.kept).length}, count ${group.count}, missing [${group.missing}], conflicts ${group.conflicts.length}, candidates ${group.candidates.length}`);
    for (const m of group.members) {
        const p = byFolder.get(dirname(m.path));
        const cat = p === undefined ? '-' : (categoryOf(p, order.categories, order.vocab)?.key ?? 'none');
        const mine = p === undefined ? '-' : [...p.lead, ...p.supervisors].some((id: string) => id.endsWith('axel-faes'));
        console.log(`  ${m.kept ? 'kept' : 'left'} ${cat} | ${p?.stage} | ${m.name} | ${p?.tier} | axel ${mine} | ${m.path} | ${p?.title}`);
    }
}
const withDeck = research.filter((p) => p.deck !== undefined).map((p) => p.folder);
const found = new Set(deck.groups.flatMap((g: any) => g.members.map((m: any) => dirname(m.path))));
console.log(`research decks the groups do not hold: [${withDeck.filter((f) => !found.has(f))}]`);
console.log(`held decks of no research project with a deck: [${[...found].filter((f) => !withDeck.includes(f))}]`);
console.log(`slides ${deck.slides.length}`);
let run = '';
let last = '';
for (const [i, s] of deck.slides.entries()) {
    const who = s.project === undefined ? '(deck)' : s.project;
    if (who !== last) {
        if (run !== '') console.log(run);
        run = `  from ${i + 1}: ${who}: ${s.kind}`;
        last = who;
    } else run += ` ${s.kind}`;
    if (s.kind === 'title' || s.kind === 'section' || s.kind === 'closing') {
        if (run !== '') console.log(run);
        run = '';
        last = '';
        console.log(`  slide ${i + 1} ${s.kind} heading ${JSON.stringify(s.heading)} legend [${s.legend}]`);
        console.log(`    lede ${JSON.stringify(s.lede)}`);
        if ('kicker' in s) console.log(`    kicker ${JSON.stringify(s.kicker)}`);
    }
}
if (run !== '') console.log(run);
const noEquation = deck.slides
    .filter((s: any) => s.kind === 'project' && (s.slide.equation === undefined || s.slide.equation === ''))
    .map((s: any) => s.project);
console.log(`project slides ${deck.slides.filter((s: any) => s.kind === 'project').length}, with no equation [${noEquation}]`);
console.log(`slide kinds ${JSON.stringify(deck.slides.reduce((a: any, s: any) => ({ ...a, [s.kind]: (a[s.kind] ?? 0) + 1 }), {}))}`);
```

The output, `node o150-cases.ts base - none` (the hub as it stands):

```
mode base, filter none, portfolio_deck deck
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 0
order entries file:title.md, file:engine.md, group:pillars, summary:pillars, file:transition.md, group:more, summary:more, grid:ideas, file:closing.md
group pillars: members 7, kept 7, count 7, missing [], conflicts 0, candidates 15
  kept in-review | submitted | hccnet-revision | research | axel true | projects/manuscripts/hccnet-revision/present | HCCNet: A Self-Supervised CNN-Transformer for Disease Prognosis from Longitudinal 3D MRI, with a Case Study on Hepatocellular Carcinoma
  kept in-review | submitted | covert-applied | research | axel true | projects/manuscripts/covert-applied/present | When Masking Meets Sparsity: COVERT for Private, Communication-Efficient Vertical Federated Tensor Regression
  kept in-review | submitted | covert-theory | research | axel true | projects/manuscripts/covert-theory/present | Private Coupled Descent: Dimension-Free Privacy for Vertical Federated Learning by Privatizing the Coupling Variable
  kept in-review | submitted | bttn-incident-af | research | axel true | projects/manuscripts/bttn-incident-af/present | An Interpretable Block-Term Tensor Network for Incident Atrial-Fibrillation Prediction from the Sinus-Rhythm 12-Lead ECG and Clinical Risk Factors
  kept in-review | submitted | raw-pls | research | axel true | projects/manuscripts/raw-pls/present | Registration-Free Supervised Tensor-PLS for Unaligned Multiparametric MRI
  kept in-flight | revision | btfno | research | axel true | projects/manuscripts/btfno/present | MoBTE: A Mixture of Block-Term Spectral Experts for Multi-PDE Operator Learning
  kept in-flight | revision | bt-operator-theory | research | axel true | projects/manuscripts/bt-operator-theory/present | A Generalization Separation for Block-Term Spectral Operators
group more: members 8, kept 8, count 8, missing [], conflicts 0, candidates 8
  kept in-review | submitted | bttd-source-eeg | research | axel true | projects/manuscripts/bttd-source-eeg/present | Jointly localized spatiotemporal components of evoked EEG via a lead-field-constrained block-term decomposition
  kept in-review | submitted | dries-bttr-ecg | research | axel true | projects/manuscripts/dries-bttr-ecg/present | An interpretable tensor model for identifying atrial fibrillation in sinus-rhythm ECG: block-term tensor regression on PTB-XL, benchmarked against deep and foundation models
  kept publications | accepted | dongho-ecg-clustering | research | axel true | projects/archive/published/2026/dongho-ecg-clustering/present | Which representation clusters? A chance-corrected benchmark of ECG representations for unsupervised arrhythmia structure on PTB-XL
  kept in-review | submitted | fed-multicellular-immune | research | axel true | projects/manuscripts/fed-multicellular-immune/present | Privacy-preserving federated tensor decomposition of single-cell immune data: recovering multicellular programs across institutions
  kept in-review | submitted | meseret-cirrhosis | research | axel true | projects/manuscripts/meseret-cirrhosis/present | Competing-Risks Modelling of a Widely-Used Cirrhosis Outcome Benchmark: Recovering the Transplant Outcome and Cause-Specific Risk Lost to Classification
  kept in-review | submitted | ward-bttr-crosssubject | research | axel true | projects/manuscripts/ward-bttr-crosssubject/present | Behavior-Supervised Alignment for Cross-Subject Neural Decoding across Non-Corresponding Electrode Grids
  kept publications | accepted | hccnet-fl | research | axel true | projects/archive/published/2026/hccnet-fl/present | Federate What Transfers: Component-Aware Federation of Self-Supervised Backbones for Longitudinal 3D MRI
  kept in-review | submitted | ecg-readable-substrate | research | axel true | projects/manuscripts/ecg-readable-substrate/present | You Don't Need the Black Box: Named ECG Features Rival Foundation Models for Mortality Prediction
group ideas: members 9, kept 9, count 9, missing [], conflicts 0, candidates 0
  kept idea | nascent | btd-autoencoder | research | axel true | projects/ideas/btd-autoencoder/present | BTD Autoencoder
  kept idea | scoping | florank-personalization | research | axel true | projects/ideas/florank-personalization/present | FLoRank x HCCNet / Block-Term: structured personalization for federated clinical models
  kept idea | nascent | clinical-ai-eval-artifacts | research | axel true | projects/ideas/clinical-ai-eval-artifacts/present | Clinical-AI Eval Artifacts
  kept in-flight | exploring | ecg-af-fair | research | axel true | projects/ideas/ecg-af-fair/present | ECG-AF (FAIR / Vandervoort)
  kept idea | nascent | fl-privacy-auditing | research | axel true | projects/ideas/fl-privacy-auditing/present | FL Privacy Auditing
  kept idea | nascent | hccnet-fl-sweden | research | axel true | projects/ideas/hccnet-fl-sweden/present | HCCNet FL Network (Sweden)
  kept idea | scoping | hccnet-pathology | research | axel true | projects/ideas/hccnet-pathology/present | HCCNet Pathology Networks
  kept idea | nascent | ssm-longitudinal | research | axel true | projects/ideas/ssm-longitudinal/present | SSM Longitudinal Imaging
  kept idea | nascent | quantum-tensor-fl | research | axel true | projects/ideas/quantum-tensor-fl/present | Quantum Tensor / Quantum FL
research decks the groups do not hold: [projects/archive/failed/fed-faithful-ecg]
held decks of no research project with a deck: []
slides 22
  from 1: (deck): title
  slide 1 title heading "Structured models,<br>everywhere they hide" legend [hub:liver,hub:method,hub:heart,hub:brain]
    lede "7 pillar projects and 8 more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away."
    kicker "Research portfolio | technical briefing | June 2026"
  from 2: (deck): section
  slide 2 section heading "The common engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:"
  from 3: hccnet-revision: project
  from 4: covert-applied: project
  from 5: covert-theory: project
  from 6: bttn-incident-af: project
  from 7: raw-pls: project
  from 8: btfno: project
  from 9: bt-operator-theory: project
  from 10: (deck): summary section
  slide 11 section heading "8 more, same backbone" legend [hub:brain,hub:heart,hub:method,hub:liver]
    lede ""
  from 12: bttd-source-eeg: project
  from 13: dries-bttr-ecg: project
  from 14: dongho-ecg-clustering: project
  from 15: fed-multicellular-immune: project
  from 16: meseret-cirrhosis: project
  from 17: ward-bttr-crosssubject: project
  from 18: hccnet-fl: project
  from 19: ecg-readable-substrate: text
  from 20: (deck): summary grid closing
  slide 22 closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 14, with no equation [ward-bttr-crosssubject]
slide kinds {"title":1,"section":2,"project":14,"summary":2,"text":1,"grid":1,"closing":1}
```

The output, `node o150-cases.ts new deck none` (the brief's `present.yml`, `legend: projects`, no filter):

```
mode new, filter none, portfolio_deck deck
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 2
  deck finding {"file":"/Users/axelfaes/workspace/research-hub/deck/present.yml","key":"order[0]","message":"a count of group pillars, which the deck does not define, stays as written"}
  deck finding {"file":"/Users/axelfaes/workspace/research-hub/deck/present.yml","key":"order[0]","message":"a count of group more, which the deck does not define, stays as written"}
order entries file:title.md, file:engine.md, group:projects, file:closing.md
group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0
  kept publications | accepted | hccnet-fl | research | axel true | projects/archive/published/2026/hccnet-fl/present | Federate What Transfers: Component-Aware Federation of Self-Supervised Backbones for Longitudinal 3D MRI
  kept publications | accepted | dongho-ecg-clustering | research | axel true | projects/archive/published/2026/dongho-ecg-clustering/present | Which representation clusters? A chance-corrected benchmark of ECG representations for unsupervised arrhythmia structure on PTB-XL
  kept in-review | submitted | bttn-incident-af | research | axel true | projects/manuscripts/bttn-incident-af/present | An Interpretable Block-Term Tensor Network for Incident Atrial-Fibrillation Prediction from the Sinus-Rhythm 12-Lead ECG and Clinical Risk Factors
  kept in-review | submitted | dries-bttr-ecg | research | axel true | projects/manuscripts/dries-bttr-ecg/present | An interpretable tensor model for identifying atrial fibrillation in sinus-rhythm ECG: block-term tensor regression on PTB-XL, benchmarked against deep and foundation models
  kept in-review | submitted | ward-bttr-crosssubject | research | axel true | projects/manuscripts/ward-bttr-crosssubject/present | Behavior-Supervised Alignment for Cross-Subject Neural Decoding across Non-Corresponding Electrode Grids
  kept in-review | submitted | meseret-cirrhosis | research | axel true | projects/manuscripts/meseret-cirrhosis/present | Competing-Risks Modelling of a Widely-Used Cirrhosis Outcome Benchmark: Recovering the Transplant Outcome and Cause-Specific Risk Lost to Classification
  kept in-review | submitted | hccnet-revision | research | axel true | projects/manuscripts/hccnet-revision/present | HCCNet: A Self-Supervised CNN-Transformer for Disease Prognosis from Longitudinal 3D MRI, with a Case Study on Hepatocellular Carcinoma
  kept in-review | submitted | bttd-source-eeg | research | axel true | projects/manuscripts/bttd-source-eeg/present | Jointly localized spatiotemporal components of evoked EEG via a lead-field-constrained block-term decomposition
  kept in-review | submitted | fed-multicellular-immune | research | axel true | projects/manuscripts/fed-multicellular-immune/present | Privacy-preserving federated tensor decomposition of single-cell immune data: recovering multicellular programs across institutions
  kept in-review | submitted | covert-theory | research | axel true | projects/manuscripts/covert-theory/present | Private Coupled Descent: Dimension-Free Privacy for Vertical Federated Learning by Privatizing the Coupling Variable
  kept in-review | submitted | raw-pls | research | axel true | projects/manuscripts/raw-pls/present | Registration-Free Supervised Tensor-PLS for Unaligned Multiparametric MRI
  kept in-review | submitted | covert-applied | research | axel true | projects/manuscripts/covert-applied/present | When Masking Meets Sparsity: COVERT for Private, Communication-Efficient Vertical Federated Tensor Regression
  kept in-review | submitted | ecg-readable-substrate | research | axel true | projects/manuscripts/ecg-readable-substrate/present | You Don't Need the Black Box: Named ECG Features Rival Foundation Models for Mortality Prediction
  kept in-flight | exploring | ecg-af-fair | research | axel true | projects/ideas/ecg-af-fair/present | ECG-AF (FAIR / Vandervoort)
  kept in-flight | revision | bt-operator-theory | research | axel true | projects/manuscripts/bt-operator-theory/present | A Generalization Separation for Block-Term Spectral Operators
  kept in-flight | revision | btfno | research | axel true | projects/manuscripts/btfno/present | MoBTE: A Mixture of Block-Term Spectral Experts for Multi-PDE Operator Learning
  kept idea | nascent | btd-autoencoder | research | axel true | projects/ideas/btd-autoencoder/present | BTD Autoencoder
  kept idea | nascent | clinical-ai-eval-artifacts | research | axel true | projects/ideas/clinical-ai-eval-artifacts/present | Clinical-AI Eval Artifacts
  kept idea | nascent | fl-privacy-auditing | research | axel true | projects/ideas/fl-privacy-auditing/present | FL Privacy Auditing
  kept idea | nascent | hccnet-fl-sweden | research | axel true | projects/ideas/hccnet-fl-sweden/present | HCCNet FL Network (Sweden)
  kept idea | nascent | quantum-tensor-fl | research | axel true | projects/ideas/quantum-tensor-fl/present | Quantum Tensor / Quantum FL
  kept idea | nascent | ssm-longitudinal | research | axel true | projects/ideas/ssm-longitudinal/present | SSM Longitudinal Imaging
  kept idea | scoping | florank-personalization | research | axel true | projects/ideas/florank-personalization/present | FLoRank x HCCNet / Block-Term: structured personalization for federated clinical models
  kept idea | scoping | hccnet-pathology | research | axel true | projects/ideas/hccnet-pathology/present | HCCNet Pathology Networks
  kept dead-ends | failed | fed-faithful-ecg | research | axel true | projects/archive/failed/fed-faithful-ecg/present | Faithfulness-Preserving Federated Learning for Interpretable ECG
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 28
  from 1: (deck): title
  slide 1 title heading "Structured models,<br>everywhere they hide" legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]
    lede "{{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away."
    kicker "Research portfolio | technical briefing | June 2026"
  from 2: (deck): section
  slide 2 section heading "The common engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:"
  from 3: hccnet-fl: project
  from 4: dongho-ecg-clustering: project
  from 5: bttn-incident-af: project
  from 6: dries-bttr-ecg: project
  from 7: ward-bttr-crosssubject: project
  from 8: meseret-cirrhosis: project
  from 9: hccnet-revision: project
  from 10: bttd-source-eeg: project
  from 11: fed-multicellular-immune: project
  from 12: covert-theory: project
  from 13: raw-pls: project
  from 14: covert-applied: project
  from 15: ecg-readable-substrate: text
  from 16: ecg-af-fair: idea
  from 17: bt-operator-theory: project
  from 18: btfno: project
  from 19: btd-autoencoder: idea
  from 20: clinical-ai-eval-artifacts: idea
  from 21: fl-privacy-auditing: idea
  from 22: hccnet-fl-sweden: idea
  from 23: quantum-tensor-fl: idea
  from 24: ssm-longitudinal: idea
  from 25: florank-personalization: idea
  from 26: hccnet-pathology: idea
  from 27: fed-faithful-ecg: text
  from 28: (deck): closing
  slide 28 closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 14, with no equation [ward-bttr-crosssubject]
slide kinds {"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}
```

The output, `node o150-cases.ts new deck submitted` (its 25 member lines are those of the run above, in the same order, `kept` on the 11 `submitted` decks and `left` on the other 14; `grep -c '^  left'` over the output printed `14`):

```
mode new, filter submitted, portfolio_deck deck
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 2
  deck finding {"file":"/Users/axelfaes/workspace/research-hub/deck/present.yml","key":"order[0]","message":"a count of group pillars, which the deck does not define, stays as written"}
  deck finding {"file":"/Users/axelfaes/workspace/research-hub/deck/present.yml","key":"order[0]","message":"a count of group more, which the deck does not define, stays as written"}
order entries file:title.md, file:engine.md, group:projects, file:closing.md
group projects: members 25, kept 11, count 11, missing [], conflicts 0, candidates 0
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 14
  from 1: (deck): title
  slide 1 title heading "Structured models,<br>everywhere they hide" legend [hub:heart,hub:brain,hub:liver,hub:method]
    lede "{{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away."
    kicker "Research portfolio | technical briefing | June 2026"
  from 2: (deck): section
  slide 2 section heading "The common engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:"
  from 3: bttn-incident-af: project
  from 4: dries-bttr-ecg: project
  from 5: ward-bttr-crosssubject: project
  from 6: meseret-cirrhosis: project
  from 7: hccnet-revision: project
  from 8: bttd-source-eeg: project
  from 9: fed-multicellular-immune: project
  from 10: covert-theory: project
  from 11: raw-pls: project
  from 12: covert-applied: project
  from 13: ecg-readable-substrate: text
  from 14: (deck): closing
  slide 14 closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 10, with no equation [ward-bttr-crosssubject]
slide kinds {"title":1,"section":1,"project":10,"text":1,"closing":1}
```

The output, `node o150-cases.ts new deck in-prep` (its 25 member lines are those of the unfiltered run, in the same order, every one `left`; `grep -c '^  left'` printed `25`):

```
mode new, filter in-prep, portfolio_deck deck
snapshot findings 0
research projects 95, with a deck 25
state ok, deck findings 2
  deck finding {"file":"/Users/axelfaes/workspace/research-hub/deck/present.yml","key":"order[0]","message":"a count of group pillars, which the deck does not define, stays as written"}
  deck finding {"file":"/Users/axelfaes/workspace/research-hub/deck/present.yml","key":"order[0]","message":"a count of group more, which the deck does not define, stays as written"}
order entries file:title.md, file:engine.md, group:projects, file:closing.md
group projects: members 25, kept 0, count 0, missing [], conflicts 0, candidates 0
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 3
  from 1: (deck): title
  slide 1 title heading "Structured models,<br>everywhere they hide" legend []
    lede "{{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away."
    kicker "Research portfolio | technical briefing | June 2026"
  from 2: (deck): section
  slide 2 section heading "The common engine: rank-(L,L,1) block-term decomposition" legend []
    lede "A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:"
  from 3: (deck): closing
  slide 3 closing heading "Questions &amp;<br>collaborations welcome" legend []
    lede "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine."
    kicker "Thank you"
project slides 0, with no equation []
slide kinds {"title":1,"section":1,"closing":1}
```

The domain count of C7: `grep -n 'domain'` over the 25 deck projects' `project.yml`, the `domain:` values counted with `sort | uniq -c`: `3 brain`, `6 heart`, `5 liver`, `1 liverfl`, `1 meta`, `8 method`, `1 privacy`.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. `deck/present.yml` rewritten | NOT DONE, handed back | The item-1 text was read by the reader only as probe input in the scratchpad (C2 to C6 above); no hub file is drafted for the report |
| 2. `deck/transition.md` removed | NOT DONE, handed back | No hub file is written by a builder; the removal goes in the report once built |
| 3. `deck/title.md` | NOT DONE, handed back | Not drafted |
| 4. `deck/engine.md:12` | NOT DONE, handed back | The dictated content is false for 11 of 25 decks ("Handed back", point 1) |
| 5. `deck/closing.md` unchanged | Holds | No file was written |
| 6. "Hub files" section | NOT DONE | Waits on items 1 to 4 |
| 7. The grep over oculus | NOT DONE | Part of the build; its read so far: `grep -rn --exclude=local.yml -e 'more\.count' -e 'transition\.md' -e 'public artifact' src tests config docs README.md` printed one line, `tests/fixtures/hubs/demo/deck/present.yml:1`, the demo hub's comment, which the change does not make false; `pillars` hits 109 files (`grep -rln ... | wc -l`), mostly the pillars registry, and was not yet judged hit by hit |
| Proposed framing (item 3) | NOT DONE | Waits on the ruling |
| Verify 1, ASCII gate over the report | Run | `LC_ALL=C perl -ne '... print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; ...' .scratch/migration/agents/reviews/O150-report.md` printed nothing |
| Verify 2, the hub files parse | NOT DONE | No hub file text yet |
| Verify 3, `git status --short` | Run | after the report: `?? .scratch/migration/agents/reviews/O150-report.md`, and nothing else |
| Verify 4, `npm run test:quick` | Run once | `npm run diagrams` (exit 0, `git status --short` empty after it), then `npm run test:quick`: `test:quick: 0 changed file(s), from git since HEAD`, `ok      ASCII gate (0.7 s)`, `ok      svelte-check (26.8 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `test:quick: 29.7 s; every command passed`. It ran before the report was written; the report is under `.scratch/`, which chooses no check (`tests/tiers/quick.mjs:36`) and which `.prettierignore` holds |
| Verify 5, prose of new sentences | NOT DONE | No sentence written |

The list ran once; no whole-suite command ran.

## Files changed

From `git status --short` and the write list: `.scratch/migration/agents/reviews/O150-report.md` (this file, new). No oculus file and no hub file is changed. No test is added or changed.

## Hub files

None drafted: the step is handed back before item 1.

## Proposed framing

None drafted: it waits on the ruling of point 1, since the engine slide's framing and item 4's sentence sit on one slide.

## Before and after, for the look

None: nothing is built. The first run above gives the state the look would start from: the portfolio deck at 22 slides with three groups, the old title lede "7 pillar projects and 8 more. ...", and `fed-faithful-ecg` in no group.

## Judgment calls

- The case-run program reads the brief's text as drafts over the hub's own deck paths (`read.ts:260-264`), in place of a scratch copy of the whole hub, so that the globs run over the real `projects/` (70,316 files, which a copy would duplicate) and nothing is written in the hub. The scratch copy of `deck/` the brief names held the files the drafts were read from.
- The filter of C5 and C6 is simulated by the reader's `keep` set (the bare keys of the projects at the stage), as the deck route passes it (`src/lib/server/content/deck/read.ts:76,101`); Mine only is left out of the set, since every one of the 25 deck projects names `axel-faes` as lead or supervisor (`axel true` on every member line).

## Wrong or impossible in the brief

- Item 4 and C8, as "Handed back", point 1: the dictated content is false for the 9 idea decks and the 2 text decks, and a written count of 25 is false under a filter.
- C1, as "Handed back", point 2, not verified: the look will likely list the Too tall findings of the placed project decks.
- C4 lists the in-flight decks as `bt-operator-theory, btfno (revision), ecg-af-fair (exploring)`; the reader places `ecg-af-fair` first, by the stage order C4's own rule names. Membership holds.
- Every other premise the cases rest on reproduced: 25 research decks, 95 research projects, the 9 + 13 + 2 + 1 split of the decks' folders, the 24 decks the three groups hold today, the 7 domains, the `deck_order` categories.
