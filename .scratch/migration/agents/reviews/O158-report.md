# O158 report: handed back before any code change

NOT done: nothing of the brief is built. The step is handed back before any code change, as the dispatch says for a case the brief's rules get wrong: under item 6's rules (two lines at most, whole facts only, the strip at `--slide-fs-small` (18 px), the 1150 px inner width, the labels of the shared catalog keys, a label at about 0.72em, a gap of about 1em, a value of at most about 14em), cases C1, C2, C3 and C4 do not give what they expect. The estimate below, from a case-run program calibrated against the brief's own measurement of the base, gives 13 of the 25 project decks hiding 34 facts; no setting of the three numbers inside the design reaches 0 hidden facts on every deck. The worktree is unchanged but for this report: `git status --short` prints `?? .scratch/migration/agents/reviews/O158-report.md` and nothing else.

## Open items of the state file, verbatim

None.

## The cases' first run, on the unchanged worktree

Each case read on the base, by the code and, for the fit cases, by the case-run program quoted at the end (an estimate; the look measures the truth).

- C1 (HCCNet, `hccnet-revision`). Base: `Facts.svelte:87-127` draws the stage as a filled `Chip` (`look: 'stage'`, `filled`, `:140-145`), the domain as a toned `Tag`, the rest as plain `Tag`s, each `'{0}: {1}'` (`present.yml:98`) with the list joined by ", " (`Facts.svelte:88`); no rule above the strip (`.facts` has no border, `Facts.svelte:159-171`; `.strip` only `padding-top: 1.2em`, `Slide.svelte:503-505`). The program's base mode reproduces the brief's 5 hidden facts exactly (venue, funding, compute, code, tier). Under the brief's rules the program gives 3 lines, 3 facts hidden: compute, code, tier. C1's "the venue, the funding, the compute, the code and the tier visible within two lines" does not hold: compute, code and tier are on the third line.
- C2 (`btfno`). Base: 9 hidden (the program gives the same 9 fields the brief names). Under the brief's rules: 12 facts, 3 lines (1130 + 955 + 330 px), 2 hidden (reproduced, tier). Expected 0; does not hold.
- C3 (`covert-applied`, `fed-multicellular-immune`). Base: 10 and 10 hidden (the program gives 10 and 10). Under the brief's rules: `covert-applied` 4 hidden (compute, code, reproduced, tier); `fed-multicellular-immune` 3 hidden (code, reproduced, tier). Expected 0; does not hold.
- C4 (every project deck). Under the brief's rules: 13 of 25 decks hide 34 facts: `dongho-ecg-clustering` 3 (code, reproduced, tier), `hccnet-fl` 3 (compute, code, tier), `btfno` 2 (reproduced, tier), `bttd-source-eeg` 3 (code, reproduced, tier), `bttn-incident-af` 2 (reproduced, tier), `covert-applied` 4 (compute, code, reproduced, tier), `covert-theory` 2 (reproduced, tier), `dries-bttr-ecg` 2 (reproduced, tier), `fed-multicellular-immune` 3 (code, reproduced, tier), `hccnet-revision` 3 (compute, code, tier), `meseret-cirrhosis` 2 (reproduced, tier), `raw-pls` 3 (code, reproduced, tier), `ward-bttr-crosssubject` 2 (reproduced, tier). Expected 0 on each; does not hold. The room they lack: each of these decks needs a third line of 330 to 682 px.
- C5 (`ssm-longitudinal`, 5 facts). Under the brief's rules: one line, 1085 px of 1150. The strip's list is laid out from the left with no justification (`Facts.svelte:173-187` today, and the redesign keeps a left-aligned flow). Holds.
- C6 (`fed-faithful-ecg`, stage `failed`). The stage's words are its vocab label, "failed (no-go or disproved)" (`config/catalogs/vocab.yml:76`, `project-facts.ts:78-81`); its hue `stageTone('failed', hub)` (`tones.ts:256-258`, colour `#dc2626`). Base draws it as a filled chip in that hue. Under the brief's rules: a dot in that hue and the words. Holds; the deck fits one line (1123 px).
- C7 (lists of one and of two). Base joins the words with ", " (`Facts.svelte:88`). Under the brief's rules a list of one draws its entry alone and a list of two its first entry and `+1`. Holds by construction.
- C8 (tooltips). Base: `Tooltip text={shown ? one.text : ''}` with `one.text = t('present.fact', label, words.join(', '))` (`Facts.svelte:88`, `:136`). The redesign keeps the whole words in the tooltip. Holds.
- C9 (toggle off). Base: `.hidden { visibility: hidden }` on `.facts` and `aria-hidden` (`Facts.svelte:132`, `:195-197`); the room is kept, so `Slide.svelte:213` measures the same foot. A rule drawn as `.facts`'s own top border is hidden with it. Holds.
- C10 (text size 1.5; a 400 px frame). Text size 1.5 (27 px type) under the brief's rules: 18 of 25 decks hide, 113 facts in all. A 400 px frame (inner width 400 - 128 - 2 = 270 px): every deck hides, 194 facts in all. The case asks only for the counts; holds as a case.
- C11 (themes). The tokens named (`--line`, `--muted-txt`, `--c-<tone>`, `--c-grey` at `tokens.css:56`) exist. Under the rice theme the face is the monospace one (`themes.css:85-86`) at 17 px; the program does not model it, and a monospace face is wider, so more facts hide there than in C4. Holds as a case.
- C12 (other surfaces). Every surface draws `Slide.svelte`: `screen/Framed.svelte:51` (pane, presenter screen, Overview tiles), `routes/present/show/+page.svelte:276` (audience window), `routes/present/print/+page.svelte:190` (PDF). Holds.
- C13 (a blocking chip not first). Base: `isBlocked({ chips: keys }, words)` over every chip gives `'red'` (`Facts.svelte:104-106`, `focus.ts:216-221`). Holds.
- C14 (a word with no colour). `statusMarkTone` and `stageTone` give `UNKNOWN_TONE`, `'grey'` (`tones.ts:40`, `:258`, `:338`). Holds.
- C15 (a first entry longer than the value's width). Base cuts the whole chip at the column (`Chip.svelte` `.label` ellipsis, `max-width: 100%`). Under the brief's rules the entry shrinks with an ellipsis and the count stays drawn. Holds by construction.
- C16 (the split). `wc -l src/lib/views/academic/present/Slide.svelte` prints 539; `ls src/lib/views/academic/present/screen | wc -l` prints 7. Holds as a case.

## The case the brief's rules get wrong

The rule: item 6, "The aim is that every fact that holds a value fits those two lines on every project deck of the research hub in its frame (1280 by 720 by default) at text size 1. To get there the strip takes the slide's whole inner width (... 1150 px ...), the label is set at about 0.72em, the gap between facts about 1em, and a value at most about 14em", with C1's list of visible facts, C2's and C3's "all drawn within two lines" and C4's "expected 0 on each".

The result it gives (estimate): at 0.72em / 1em / 14em, 13 decks hide 34 facts. A 13-fact strip needs about 2500 to 2800 px of whole facts (each fact a label, a value and the gap to the next), and two lines of 1150 px hold 2300 px less what the wrap leaves at each line's end.

How far the brief's three numbers can move it (the program, face factor 1.0, every other rule kept):

| Label | Gap | Value cap | Decks hiding | Facts hidden |
| --- | --- | --- | --- | --- |
| 0.72em | 1em | 14em | 13 | 34 |
| 0.72em | 1em | 10em | 13 | 25 |
| 0.72em | 0.75em | 8em | 9 | 16 |
| 0.65em | 0.75em | 8em | 7 | 11 |
| 0.65em | 0.6em | 7em | 5 | 7 |
| 0.6em | 0.6em | 7em | 2 | 2 |

The last row sets the label at 10.8 px and cuts every value at 126 px ("submitted / under review" and every pillar title ellipsed), and still hides facts on 2 decks. No setting inside the design reaches 0.

Options that change something the brief or a ruling holds fixed (the program's results):

- (a) Build at the brief's numbers and report the hidden counts (13 decks, 34 facts). C4's own text allows "a deck that still hides a fact is named". This is the lazy option: item 6's aim, every fact seen, is left unmet.
- (b) Tighten the numbers within the design (label 0.65em, gap 0.75em, value 8em): 7 decks, 11 facts hidden; labels at 11.7 px and values cut at 144 px, so the stage and the pillar titles are ellipsed on most decks.
- (c) Three lines at most in place of two, at the brief's numbers: 0 decks, 0 facts hidden. Ruling 680 (`plan.md:3572`) says two lines, so this is Axel's. It costs the slide's content one more line of the strip (about 23 px at 18 px type) on decks with more than about 10 facts.
- (d) A smaller strip type in place of `--slide-fs-small` (item 7 keeps it): 16 px gives 10 decks, 11 facts; 15 px gives 4 decks, 4 facts; 14 px gives 1 deck, 1 fact; 16 px with label 0.65em, gap 0.8em and value 10em gives 4 decks, 5 facts.
- (e) Leave out the tier when it is the hub's unmarked default (`tiers.research: { label: Research, unmarked: true, default: true }`, `vocab.yml:249-252`), as an unmarked word is left off elsewhere; ruling 680 says each field that holds a value, so this is Axel's. At the brief's numbers: 13 decks, 21 facts; with label 0.65em, gap 0.75em, value 10em: 8 decks, 8 facts (reproduced on 7, code on 1).

Recommendation (a judgment): (c), three lines at most at the brief's numbers. It is the only option the estimate gives every fact seen on every deck while the labels stay readable and the values whole; its cost is one strip line of room on the larger decks, which the slide's fit search absorbs by drawing the content a little smaller. The lazy option is (a).

What would settle the estimate: the look on the scratch server at main's head, counting `[data-fact]` items below the strip as the brief's loop did. The program's base mode reproduces that loop's figures for the base: btfno 9, covert-applied 10, fed-multicellular-immune 10, covert-theory 8, hccnet-fl 7, hccnet-revision 5 hidden, each with the same fields the brief names; 16 of the 24 decks losing facts and the 8 small decks losing none; venue hidden on 8 of the 24. The one difference is the tier, hidden on 16 of the 24 by the program and on 15 by the loop.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 to 11 of "What to build" | NOT DONE | handed back before any change; `git status --short` prints only `?? .scratch/migration/agents/reviews/O158-report.md` |
| Verify 1 (`npm run diagrams && npm run docs:palette`, `npm run test:quick`) | NOT RUN | no change to verify; the list was run 0 times; no whole-suite command was run |
| Verify 2 to 8 | NOT RUN | no change to verify |

## Files

`git status --short` prints `?? .scratch/migration/agents/reviews/O158-report.md` and nothing else: no tracked file changed. This report is the one file written, `.scratch/migration/agents/reviews/O158-report.md`, which is on the write list.

## Visible changes

None.

## Comments and docs

None changed; none read against a change.

## Judgment calls

None taken in code. Reading notes for the build once the orchestrator rules:

- The strip at the slide's whole inner width needs `Slide.svelte`'s root to span the frame's inner box and the content to keep the reading width: the foot sits inside `.reading`, which is at most `--slide-reading` (1040 px) wide (`Slide.svelte:473-483`), and no CSS length in the strip knows the frame's inner width. The plan was the root at 100% of the frame's inner box, `.content` at `width: 100%; max-width: var(--slide-reading); margin-inline: auto`, and `.keys` held to the same reading width so the key hint wraps as it does today.
- The split of item 11 was planned as one new file, `screen/drawn-slide.ts`, holding the DOM measures `Slide.svelte:116-187` holds (`figuresIn`, `holderOf`, `frameOf`, `gapOf`, `capTopOf`, `fitFormulas`), about 70 lines out of `Slide.svelte`.
- The accessible text was planned as a visually hidden copy of the fact in `present.fact`'s words, the drawn parts `aria-hidden`, so a reader of the page hears "Collaborators: Maryam Amir Haeri +2" whatever the browser does with the spaces between flex items.

## Wrong or impossible in the brief

Item 6's aim and the expectations of C1 to C4, as above: under the brief's rules they cannot all hold on the hub's decks. The 1150 px and the 18 px premises reproduce (`themes/slide.css:5`, `:21`, `:27`).

## The case-run program

It ran from the scratchpad as `node strip-fit.mjs <worktree>` with the environment variables of each row (`FACE=1.0` on every row above; `TODAY=1 WIDTH=1040 GAP=0.35` for the base mode; `LINES=3` for option (c); `FS=` for option (d); `UNMARKED=1` for option (e); `WIDTH=270` and `FS=27` for C10). It reads the hub read only and writes nothing; it was removed from the scratchpad after this report was written. Collaborators are taken in the manifest's order, which can differ from the server's first entry; the widths of the first entries differ by a few px on the decks read. The run stripped accents with the combining range U+0300 to U+036F; the source below writes it as `\p{M}` to stay ASCII, which gives the same widths for the hub's names. Source:

```js
// Case-run program for C2-C5 and C7 of O158: reads each project deck's manifest of the research
// hub (read only), works out the strip's facts by the word rules of data/shapes/project-facts.ts,
// and estimates in px how the redesigned strip lays them out: each fact as a capital label, a dot
// for the hued fields, the value (a list as its first entry and +n) capped at a width, facts set
// apart by a gap, wrapped whole into lines of the strip's width. Widths are estimates from
// Helvetica's AFM advance widths times a factor for the system face; the look measures the truth.
// It prints only; it writes nothing.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(process.argv[2] + '/package.json');
const YAML = require('yaml');
const HUB = '/Users/axelfaes/workspace/research-hub';
const OC = process.argv[2];

const P = {
    fs: Number(process.env.FS ?? 18),
    width: Number(process.env.WIDTH ?? 1150),
    labelEm: Number(process.env.LABEL ?? 0.72),
    track: Number(process.env.TRACK ?? 0.04),
    labelGap: Number(process.env.LGAP ?? 0.4),
    factGap: Number(process.env.GAP ?? 1),
    capEm: Number(process.env.CAP ?? 14),
    face: Number(process.env.FACE ?? 1.05),
    dotEm: 0.5,
    dotGap: 0.35,
    moreGap: 0.3
};

// Helvetica advance widths per 1000 em.
const W = {
    ' ': 278, '!': 278, '"': 355, '#': 556, $: 556, '%': 889, '&': 667, "'": 191, '(': 333,
    ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278,
    '|': 260, '_': 556, '?': 556, '@': 1015
};
for (const c of '0123456789') W[c] = 556;
Object.assign(W, {
    a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500,
    l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500,
    w: 722, x: 500, y: 500, z: 500, A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778,
    H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722,
    S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611
});
const em = (text) =>
    [...text.normalize('NFD').replace(/\p{M}/gu, '')].reduce(
        (sum, c) => sum + (W[c] ?? 556),
        0
    ) / 1000 * P.face;

const load = (path) => YAML.parse(readFileSync(path, 'utf8'));
const byKey = (file) => {
    const doc = load(join(HUB, '.oculus/data', file));
    const entries = doc.entries ?? doc.datasets ?? [];
    if (Array.isArray(entries))
        return Object.fromEntries(entries.map((e) => [String(e.key ?? e.id), e]));
    return entries;
};
const vocab = load(join(OC, 'config/catalogs/vocab.yml'));
const people = byKey('people/people.yml');
const venues = byKey('research/venues.yml');
const pillars = byKey('pillars/pillars.yml');
const domains = byKey('pillars/domains.yml');
const resources = byKey('research/resources.yml');
const datasets = byKey('research/data.yml');
const funding = byKey('academic/funding.yml');
const label = (list, word) => vocab[list]?.[word]?.label ?? word;
const arr = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v.map(String) : [String(v)]);
const code = { deposited: 'deposited', 'review-anon': 'anon', none: 'pending' };

const LABELS = {
    form: 'Form', stage: 'Stage', chips: 'Status chips', domain: 'Domain', pillars: 'Pillars',
    datasets: 'Datasets', lead: 'Lead', supervisors: 'Supervisors', collaborators: 'Collaborators',
    year: 'Year', venue: 'Venue', funding: 'Funding', compute: 'Compute', code: 'Code',
    reproduced: 'Reproduced', tier: 'Tier'
};
const HUED = new Set(['form', 'stage', 'chips', 'domain']);

function factsOf(m) {
    const f = {
        form: m.form ? [label('forms', m.form)] : [],
        stage: m.stage ? [label('stages', m.stage)] : [],
        chips: arr(m.status?.chips).map((c) => label('chips', c)),
        domain: arr(m.domain).slice(0, 1).filter((k) => domains[k]).map((k) => domains[k].title ?? k),
        pillars: arr(m.pillars).filter((k) => pillars[k]).map((k) => pillars[k].title ?? k),
        datasets: arr(m.datasets).filter((k) => datasets[k]),
        lead: arr(m.lead).filter((k) => people[k]).map((k) => people[k].name ?? k),
        supervisors: arr(m.supervisors).filter((k) => people[k]).map((k) => people[k].name ?? k),
        collaborators: arr(m.collaborators).filter((k) => people[k]).map((k) => people[k].name ?? k),
        year: m.year ? [String(m.year)] : [],
        venue: m.venue && venues[m.venue] ? [venues[m.venue].short || venues[m.venue].name] : [],
        funding: arr(m.funding).filter((k) => funding[k]),
        compute: arr(m.compute).filter((k) => resources[k]).map((k) => resources[k].name ?? k),
        code: m.code_availability?.status ? [code[m.code_availability.status] ?? 'no code'] : [],
        reproduced: m.reproduced ? [m.reproduced.date ? String(m.reproduced.date) : 'reproduced'] : [],
        tier: m.tier ? [label('tiers', m.tier)] : []
    };
    if (process.env.UNMARKED && vocab.tiers?.[m.tier]?.unmarked === true) f.tier = [];
    return Object.entries(f).filter(([, w]) => w.length > 0);
}

function widthOf(field, words, firstIndex = 0) {
    const fs = P.fs;
    const lab = LABELS[field].toUpperCase();
    const labW = (em(lab) + P.track * lab.length) * P.labelEm * fs;
    const first = words[firstIndex];
    const more = words.length - 1;
    const countW = more > 0 ? (P.moreGap + em(`+${more}`)) * fs : 0;
    const value = Math.min(P.capEm * fs, em(first) * fs + countW);
    const cut = em(first) * fs + countW > P.capEm * fs;
    const dot = HUED.has(field) ? (P.dotEm + P.dotGap) * fs : 0;
    return { w: labW + P.labelGap * fs + dot + value, cut };
}

// Today's strip: one chip or tag per fact, 'Label: words, joined', at the strip's type, a chip's
// 5 px side padding and 1 px border, a 16 px-or-type glyph and 4 px gap for the glyphed fields,
// cut at the column, 0.35em to the next fact, in the 1040 px reading column.
const GLYPHED = new Set(['form', 'chips', 'year', 'code', 'reproduced', 'compute']);
const CHIPS = new Set(['form', 'chips', 'stage']);
function todayOf(field, words) {
    const text = `${LABELS[field]}: ${words.join(', ')}`;
    let w = em(text) * P.fs + (CHIPS.has(field) ? 12 : 0) + (GLYPHED.has(field) ? P.fs + 4 : 0);
    return { w: Math.min(w, P.width), cut: w > P.width };
}
function lay(facts) {
    const lines = [[]];
    let used = 0;
    for (const [field, words] of facts) {
        const { w, cut } = process.env.TODAY ? todayOf(field, words) : widthOf(field, words);
        const need = lines.at(-1).length === 0 ? w : used + P.factGap * P.fs + w;
        if (need <= P.width) {
            lines.at(-1).push({ field, w, cut });
            used = need;
        } else {
            lines.push([{ field, w, cut }]);
            used = w;
        }
    }
    return lines;
}

const decks = [];
const walk = (dir) => {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (!statSync(path).isDirectory()) continue;
        if (name === 'present') {
            try {
                statSync(join(path, 'present.yml'));
                decks.push(dirname(path));
            } catch {}
            continue;
        }
        if (['node_modules', '.git', 'code', 'manuscript', 'results', 'data'].includes(name)) continue;
        walk(path);
    }
};
walk(join(HUB, 'projects'));
console.log(JSON.stringify(P));
let hiddenAll = 0;
for (const folder of decks.sort()) {
    const m = load(join(folder, 'project.yml'));
    const facts = factsOf(m);
    const lines = lay(facts);
    const most = Number(process.env.LINES ?? 2);
    const shown = lines.slice(0, most).flat().length;
    const hidden = facts.length - shown;
    hiddenAll += hidden;
    const fill = lines.map((l) => Math.round(l.reduce((s, f) => s + f.w, 0) + P.factGap * P.fs * (l.length - 1)));
    const cuts = lines.flat().filter((f) => f.cut).map((f) => f.field);
    console.log(
        `${m.id}: facts ${facts.length}, lines ${lines.length} (${fill.join(' + ')} px), hidden ${hidden}` +
            (hidden > 0 ? ` [${lines.slice(most).flat().map((f) => f.field).join(', ')}]` : '') +
            (cuts.length > 0 ? `, cut ${cuts.join(', ')}` : '')
    );
    if (process.env.SHOW === m.id) {
        for (const [field, words] of facts) console.log(`  ${field}: ${words.join(', ')} -> ${Math.round(widthOf(field, words).w)} px`);
    }
}
console.log(`decks ${decks.length}, facts hidden in all ${hiddenAll}`);
```

Output at the brief's numbers (`FACE=1.0 node strip-fit.mjs <worktree>`, the `, cut ...` tail of each line left off):

```
{"fs":18,"width":1150,"labelEm":0.72,"track":0.04,"labelGap":0.4,"factGap":1,"capEm":14,"face":1,"dotEm":0.5,"dotGap":0.35,"moreGap":0.3}
fed-faithful-ecg: facts 5, lines 1 (1123 px), hidden 0
dongho-ecg-clustering: facts 14, lines 3 (990 + 1046 + 473 px), hidden 3 [code, reproduced, tier]
hccnet-fl: facts 13, lines 3 (1052 + 1075 + 453 px), hidden 3 [compute, code, tier]
btd-autoencoder: facts 5, lines 1 (1094 px), hidden 0
clinical-ai-eval-artifacts: facts 5, lines 1 (1024 px), hidden 0
ecg-af-fair: facts 8, lines 2 (994 + 542 px), hidden 0
fl-privacy-auditing: facts 5, lines 1 (1073 px), hidden 0
florank-personalization: facts 6, lines 2 (1107 + 257 px), hidden 0
hccnet-fl-sweden: facts 6, lines 2 (965 + 386 px), hidden 0
hccnet-pathology: facts 5, lines 2 (1054 + 116 px), hidden 0
quantum-tensor-fl: facts 5, lines 1 (1094 px), hidden 0
ssm-longitudinal: facts 5, lines 1 (1085 px), hidden 0
bt-operator-theory: facts 10, lines 2 (1115 + 836 px), hidden 0
btfno: facts 12, lines 3 (1130 + 955 + 330 px), hidden 2 [reproduced, tier]
bttd-source-eeg: facts 13, lines 3 (1080 + 1064 + 473 px), hidden 3 [code, reproduced, tier]
bttn-incident-af: facts 13, lines 3 (1024 + 1113 + 330 px), hidden 2 [reproduced, tier]
covert-applied: facts 13, lines 3 (1079 + 947 + 682 px), hidden 4 [compute, code, reproduced, tier]
covert-theory: facts 12, lines 3 (1013 + 1018 + 330 px), hidden 2 [reproduced, tier]
dries-bttr-ecg: facts 13, lines 3 (976 + 1055 + 330 px), hidden 2 [reproduced, tier]
ecg-readable-substrate: facts 10, lines 2 (1059 + 829 px), hidden 0
fed-multicellular-immune: facts 13, lines 3 (1120 + 1034 + 473 px), hidden 3 [code, reproduced, tier]
hccnet-revision: facts 12, lines 3 (1045 + 953 + 467 px), hidden 3 [compute, code, tier]
meseret-cirrhosis: facts 12, lines 3 (1089 + 950 + 330 px), hidden 2 [reproduced, tier]
raw-pls: facts 13, lines 3 (1061 + 1049 + 473 px), hidden 3 [code, reproduced, tier]
ward-bttr-crosssubject: facts 12, lines 3 (1129 + 1005 + 330 px), hidden 2 [reproduced, tier]
decks 25, facts hidden in all 34
```

Output of the option runs (each line: the variables, decks hiding, facts hidden):

```
LINES=3: 0 decks, 0 facts
FS=16: 10 decks, 11 facts
FS=16 LABEL=0.65 GAP=0.8 CAP=10: 4 decks, 5 facts
FS=15: 4 decks, 4 facts
FS=14: 1 decks, 1 facts
WIDTH=270: 25 decks, 194 facts
FS=27: 18 decks, 113 facts
UNMARKED=1: 13 decks, 21 facts
UNMARKED=1 LABEL=0.65 GAP=0.75 CAP=10: 8 decks, 8 facts
```

Base mode (`TODAY=1 WIDTH=1040 GAP=0.35 FACE=1.0`), the decks that hide: `dongho-ecg-clustering` 4, `hccnet-fl` 7, `florank-personalization` 2, `hccnet-fl-sweden` 1, `bt-operator-theory` 4, `btfno` 9, `bttd-source-eeg` 6, `bttn-incident-af` 5, `covert-applied` 10, `covert-theory` 8, `dries-bttr-ecg` 3, `ecg-readable-substrate` 1, `fed-multicellular-immune` 10, `hccnet-revision` 5, `meseret-cirrhosis` 4, `raw-pls` 5, `ward-bttr-crosssubject` 5; the 8 decks of 5 to 8 facts hide none.
