#!/usr/bin/env node
// Layer 1, data. Convert a hub's PRESENT.md files, the idea grid and config/present.yml into decks.
//
// A deck is a folder holding a present.yml and Markdown slide files (DESIGN.md, "Decks"). Run it
// from the hub's root:
//
//     node tools/oculus/utils/migrations/convert-decks.mjs [--hub <dir>]
//     node tools/oculus/utils/migrations/convert-decks.mjs --check [--hub <dir>]
//
// `--check` prints what is left to convert and writes nothing. A target file is written only when
// it does not exist, so a second run changes nothing, and a PRESENT.md is removed only once the
// deck that replaces it exists.
//
// What it writes:
//   - present/main.md and present/present.yml in every project whose PRESENT.md declares a
//     `present:` map (a `slides:` list becomes further slides of main.md), with the mechanism and
//     the headline of the summary row the project had in config/present.yml;
//   - present/main.md (kind: text) and present/present.yml for a PRESENT.md that is prose only;
//   - present/main.md (kind: idea) and present/present.yml for each idea of the idea grid;
//   - the nascent, scoping and de-risking chips of the idea manifests, in place of exploring;
//   - deck/ in the hub, and the deck/ of the demo hub.
// It removes every PRESENT.md under projects/ and under the demo hub's projects/.

import {
    existsSync,
    globSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { parse, stringify } from 'yaml';

/** The head comment of the portfolio deck's and the demo deck's present.yml: the slide rule. */
const SLIDE_RULE =
    "# Rules for what goes on a slide (a public artifact): public-safe only, every number real and matching the manuscript, never a null or negative result, no hedging (the slide's `tag` chip carries the status).";

/** What config/present.yml holds that the decks carry, by project and by idea. */
const DATA = {
    summaries: {
        'hccnet-revision': {
            mechanism: '3D DINO backbone + $\\sqrt{\\Delta t}$ Transformer',
            headline: 'AUROC 0.936 | backbone = +136% AUPRC'
        },
        'hccnet-fl': {
            mechanism: 'Federate label-free backbone, localize head',
            headline: '~97% of centralized at -37% comms'
        },
        'covert-applied': {
            mechanism: 'Couple via shared DP score; private cores',
            headline: 'O(Pm+mC) comms; theorem exact+private'
        },
        'covert-theory': {
            mechanism: 'PALM+KL, Gaussian-DP excess-risk bound',
            headline: 'Dimension-free in $\\prod I_n$; matching $\\Omega(\\sigma)$ bound'
        },
        'bttn-incident-af': {
            mechanism: 'K=12 block-term net, Cox loss',
            headline: 'BTTN 0.762 vs CNN 0.748, P~1.0'
        },
        'raw-pls': {
            mechanism: 'Supervised fused-GW + PLS head',
            headline:
                'Beats registered and grid baselines on real BraTS (struct +0.43 $R^2$, grade AUC 0.935)'
        },
        btfno: {
            mechanism: 'Mixture of block-term experts (MoBTE)',
            headline: 'MoBTE -60% error vs CP (6-PDE)'
        },
        'bt-operator-theory': {
            mechanism: 'Inductive-bias and generalization-gap account',
            headline: 'Gen-gap CP .029 to BT .019 to MoBTE .012 (predicted)'
        },
        'bttd-source-eeg': {
            mechanism: 'Lead-field-constrained sparse BTD',
            headline: 'Time-course corr 0.93 | 13.4 mm focal'
        },
        'dries-bttr-ecg': {
            mechanism: 'Supervised glass-box BTTR',
            headline: '0.718 vs 0.631 clinical, p=0.002'
        },
        'dongho-ecg-clustering': {
            mechanism: 'Chance-corrected ARI, 5 arms',
            headline: 'Hand-crafted 0.71 vs foundation 0.19'
        },
        'fed-multicellular-immune': {
            mechanism: 'Stacked-SVD = centralized',
            headline: 'SLE-AUC 0.958 | COVID corr 0.989'
        },
        'meseret-cirrhosis': {
            mechanism: 'Cause-specific Cox + Aalen-Johansen',
            headline: 'Death C 0.833 | transplant C 0.822'
        },
        'ward-bttr-crosssubject': {
            mechanism: 'BTTR deflation, LOSO transfer',
            headline: '$\\rho$ 0.084 to 0.49 fix | ~10 x faster'
        }
    },
    grid: {
        'btd-autoencoder': {
            title: 'BTD Autoencoder',
            desc: 'Tensor-native autoencoder for sparse scRNA-seq denoising plus a small-N rigor benchmark',
            maturity: 'scoping'
        },
        'florank-personalization': {
            title: 'FLoRank x HCCNet / Block-Term',
            desc: 'Adaptive low-rank federated personalization extended to HCCNet imaging or a block-term adapter',
            maturity: 'scoping'
        },
        'clinical-ai-eval-artifacts': {
            title: 'Clinical-AI Eval Artifacts',
            desc: 'Meta-science: many federated and clinical-AI gains are evaluation artifacts; a corrected protocol',
            maturity: 'scoping'
        },
        'ecg-af-fair': {
            title: 'ECG-AF (Vandervoort)',
            desc: 'FAIR-aligned AF-risk prediction from sinus-rhythm ECG, interpretable tensor and private multisite',
            maturity: 'de-risking'
        },
        'fl-privacy-auditing': {
            title: 'FL Privacy Auditing',
            desc: 'A standardized privacy-attack audit battery for deployed federated and DP clinical models',
            maturity: 'scoping'
        },
        'hccnet-fl-sweden': {
            title: 'HCCNet-FL Network (Sweden)',
            desc: 'Real cross-country federated HCC (Twente and Link\u00f6ping) with modality-incomplete federation',
            maturity: 'de-risking'
        },
        'hccnet-pathology': {
            title: 'HCCNet Pathology Networks',
            desc: 'Modular pathology-decomposed HCC risk (fibrosis, inflammation, steatosis, iron) plus a temporal head',
            maturity: 'scoping'
        },
        'ssm-longitudinal': {
            title: 'SSM Longitudinal Imaging',
            desc: 'Continuous-time state-space backbone for irregular-interval longitudinal 3D MRI',
            maturity: 'nascent'
        },
        'quantum-tensor-fl': {
            title: 'Quantum Tensor / FL',
            desc: 'Exploratory: quantum-inspired tensor networks or quantum federated learning, after a novelty check',
            maturity: 'nascent'
        }
    },
    meta: {
        kicker: 'Research portfolio | technical briefing | June 2026',
        title_html: 'Structured models,<br>everywhere they hide',
        lede: 'A dozen active projects spanning brain, heart, liver and immunity. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away.',
        closing_kicker: 'Thank you',
        closing_title_html: 'Questions &amp;<br>collaborations welcome',
        closing_lede:
            'Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine.',
        contact: 'axel.faes@gmail.com'
    },
    engine: {
        title: 'The common engine: rank-(L,L,1) block-term decomposition',
        lede: 'A block-term tensor is a <b>sum of R low-multilinear-rank blocks</b>, strictly between CP (rank-1 blocks, no within-block coupling) and Tucker (one dense core, no modularity). That middle ground recurs across the portfolio:',
        cards: [
            {
                n: '1',
                title: 'Interpretable by construction.',
                body: 'Sparse and low-rank cores <i>are</i> the explanation: per-block (time x lead) or (freq x lead) signatures a clinician can read.'
            },
            {
                n: '2',
                title: 'Parameter-efficient.',
                body: 'An (R,L) knob matches CP and Tucker budgets while dedicating capacity to distinct regimes (scales, modalities, leads).'
            },
            {
                n: '3',
                title: 'Composable with constraints.',
                body: 'The same factorization carries through irregular time, federation, differential privacy, and unaligned geometry.'
            }
        ],
        hint: 'Each of the next slides leads with the governing equation, then specs, method, and results.'
    },
    transition: {
        title: 'Six more, same backbone: across brain, heart, immunity and survival',
        lede: 'The next six projects apply the same structured-tensor philosophy to other modalities and questions: locating brain sources, reading AF substrate, benchmarking ECG representations, federating immune atlases, fixing a survival benchmark, and transferring brain-computer interfaces across people.',
        legend: [
            {
                label: 'Brain | EEG / BCI',
                color: '#7c3aed'
            },
            {
                label: 'Heart | ECG',
                color: '#e2374d'
            },
            {
                label: 'Immunology | federated',
                color: '#2563eb'
            },
            {
                label: 'Hepatology | survival',
                color: '#0d9488'
            }
        ],
        hint: 'Same four-layer format: equation | specs | method | measured results.'
    },
    ideas: {
        title: 'The idea pipeline, what is next',
        lede: 'Early-stage directions seeding the next wave. Most reuse the federated, block-term and longitudinal machinery above, plus meta-science and methods bets.'
    }
};

/** The demo hub's folder under the hub. */
const DEMO = 'tools/oculus/demo';

/** The chip of an idea the idea grid gives no maturity. */
const NASCENT = 'nascent';

/** The ideas the idea grid lists, in its order; each one's deck is the grid card. */
const GRID_ORDER = [
    'btd-autoencoder',
    'florank-personalization',
    'clinical-ai-eval-artifacts',
    'ecg-af-fair',
    'fl-privacy-auditing',
    'hccnet-fl-sweden',
    'hccnet-pathology',
    'ssm-longitudinal',
    'quantum-tensor-fl'
];

/** The portfolio deck's first group, in the order of config/present.yml. */
const PILLARS = [
    'hccnet-revision',
    'covert-applied',
    'covert-theory',
    'bttn-incident-af',
    'raw-pls',
    'btfno',
    'bt-operator-theory'
];

/** The portfolio deck's second group, in the order of config/present.yml. */
const MORE = [
    'bttd-source-eeg',
    'dries-bttr-ecg',
    'dongho-ecg-clustering',
    'fed-multicellular-immune',
    'meseret-cirrhosis',
    'ward-bttr-crosssubject'
];

/** What the unfilled PRESENT.md template carries, which makes the file no deck. */
const TEMPLATE_MARK = '<the public hook';

/** What a run did: the files it wrote and removed, and in check mode what is left. */
const written = [];
const removed = [];
const left = [];

/** A value as YAML, one key per line, nothing folded. */
function dump(value) {
    return stringify(value, {
        lineWidth: 0,
        indentSeq: false,
        singleQuote: true,
        blockQuote: false
    });
}

/** Write a file when it does not exist; in check mode report it as left. */
function put(path, text, check) {
    if (existsSync(path)) return;
    if (check) {
        left.push(`write ${path}`);
        return;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text, 'utf8');
    written.push(path);
}

/** The front matter map and the body of a file, or null and the text when it has none. */
function splitFront(text) {
    if (!text.startsWith('---\n')) return { front: null, body: text };
    const end = text.indexOf('\n---\n', 4);
    if (end < 0) return { front: null, body: text };
    return { front: parse(text.slice(4, end)) ?? {}, body: text.slice(end + 5) };
}

/** A front matter block as it opens a slide. */
function slideText(meta) {
    return `---\n${dump(meta)}---\n`;
}

/** Whether a parsed value is a map. */
function isMap(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** present/main.md and present/present.yml from a `present:` map and an optional `slides:` list. */
function projectDeck(folder, front, check) {
    const project = basename(folder);
    const present = front.present;
    const first = { kind: 'project', ...present };
    const row = DATA.summaries[project];
    if (row !== undefined) {
        first.mechanism = row.mechanism;
        first.headline = row.headline;
    }
    let text = slideText(first);
    for (const entry of front.slides ?? []) {
        const { id: _id, ...rest } = entry;
        text += `\n${slideText({ kind: 'project', ...rest })}`;
    }
    const deck = { deck: { title: present.title ?? project }, order: ['main.md'] };
    put(join(folder, 'present', 'main.md'), text, check);
    put(join(folder, 'present', 'present.yml'), dump(deck), check);
}

/** present/main.md (kind: text) from the prose of a PRESENT.md, and its present.yml. */
function proseDeck(folder, body, check) {
    const kept = [];
    let title = basename(folder);
    for (const line of body.split('\n')) {
        const heading = /^#\s*PRESENT:\s*(.*)$/.exec(line);
        if (heading !== null && title === basename(folder)) {
            title = heading[1].trim();
            kept.push(`# ${title}`);
        } else if (line.startsWith('<!--') && line.trimEnd().endsWith('-->')) {
            continue;
        } else {
            kept.push(line);
        }
    }
    const prose = kept
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\n+|\n+$/g, '');
    put(join(folder, 'present', 'main.md'), `${slideText({ kind: 'text' })}${prose}\n`, check);
    put(
        join(folder, 'present', 'present.yml'),
        dump({ deck: { title }, order: ['main.md'] }),
        check
    );
}

/** present/main.md (kind: idea) with the grid card's description, and its present.yml. */
function ideaDeck(folder, check) {
    const card = DATA.grid[basename(folder)];
    put(join(folder, 'present', 'main.md'), slideText({ kind: 'idea', desc: card.desc }), check);
    put(
        join(folder, 'present', 'present.yml'),
        dump({ deck: { title: card.title }, order: ['main.md'] }),
        check
    );
}

/** The exploring chip of every idea manifest becomes nascent, scoping or de-risking. */
function chips(hub, check) {
    const ideas = join(hub, 'projects', 'ideas');
    if (!existsSync(ideas)) return;
    for (const name of readdirSync(ideas).sort()) {
        const manifest = join(ideas, name, 'project.yml');
        if (!existsSync(manifest)) continue;
        const maturity = DATA.grid[name]?.maturity ?? NASCENT;
        const lines = readFileSync(manifest, 'utf8').split('\n');
        let changed = false;
        for (let at = 0; at < lines.length; at += 1) {
            const found = /^(\s*chips:\s*\[)([^\]]*)(\].*)$/.exec(lines[at]);
            if (found !== null && /\bexploring\b/.test(found[2])) {
                lines[at] = found[1] + found[2].replace(/\bexploring\b/, maturity) + found[3];
                changed = true;
                break;
            }
        }
        if (!changed) continue;
        if (check) left.push(`chip ${manifest}`);
        else {
            writeFileSync(manifest, lines.join('\n'), 'utf8');
            written.push(manifest);
        }
    }
}

/** The names of a group as the block list under its `slides:` key. */
function block(slides) {
    return slides.map((name) => `            - ${name}\n`).join('');
}

/** The hub's deck/ folder, from what config/present.yml held. */
function hubDeck(hub, check) {
    const meta = DATA.meta;
    const lede = meta.lede.replace(
        'A dozen active projects spanning brain, heart, liver and immunity.',
        '{{pillars.count}} pillar projects and {{more.count}} more.'
    );
    const root = join(hub, 'deck');
    put(
        join(root, 'title.md'),
        `${slideText({ kind: 'title', kicker: meta.kicker, legend: 'pillars' })}# ${meta.title_html}\n\n${lede}\n`,
        check
    );
    const engine = DATA.engine;
    const cards = engine.cards
        .map((card, at) => `${at + 1}. **${card.title}** ${card.body}\n`)
        .join('');
    put(
        join(root, 'engine.md'),
        `${slideText({ kind: 'section' })}# ${engine.title}\n\n${engine.lede}\n\n${cards}\n${engine.hint}\n`,
        check
    );
    put(
        join(root, 'transition.md'),
        `${slideText({ kind: 'section', legend: 'more', foot: DATA.transition.hint })}# {{more.count}} more, same backbone\n`,
        check
    );
    put(
        join(root, 'closing.md'),
        `${slideText({ kind: 'closing', kicker: meta.closing_kicker, contact: meta.contact })}# ${meta.closing_title_html}\n\n${meta.closing_lede}\n`,
        check
    );
    const ideas = DATA.ideas;
    const text = [
        SLIDE_RULE,
        'deck:',
        "    title: 'Structured models, everywhere they hide'",
        '',
        'groups:',
        '    pillars:',
        '        find: { folders: projects/*/*/present, tiers: [active, manuscripts, ideas] }',
        '        slides:',
        `${block(PILLARS)}    more:`,
        '        find: { folders: projects/*/*/present, tiers: [active, manuscripts] }',
        '        discover: true',
        '        sort: folder',
        '        slides:',
        `${block(MORE)}    ideas:`,
        '        find: { folders: projects/*/*/present, tiers: [ideas], status: [nascent, scoping, de-risking] }',
        '        discover: true',
        '        slides:',
        `${block(GRID_ORDER)}`,
        'order:',
        '    - title.md',
        '    - engine.md',
        '    - { slides: pillars }',
        "    - { kind: summary, of: pillars, title: 'Active pillars, at a glance', foot: 'Unified by structured, interpretable tensor models.' }",
        '    - transition.md',
        '    - { slides: more }',
        "    - { kind: summary, of: more, title: 'The wider portfolio, at a glance', foot: 'The same structured-tensor backbone throughout.' }",
        '    - kind: grid',
        '      of: ideas',
        `      title: '${ideas.title}'`,
        `      lede: '${ideas.lede}'`,
        "      foot: 'Each gated on a novelty check before committing.'",
        '    - closing.md',
        ''
    ].join('\n');
    put(join(root, 'present.yml'), text, check);
}

/** A small portfolio deck for the demo hub. */
function demoDeck(hub, check) {
    const root = join(hub, DEMO, 'deck');
    put(
        join(root, 'title.md'),
        `${slideText({ kind: 'title', kicker: 'Demo hub', legend: 'projects' })}# A synthetic research hub\n\n{{projects.count}} project slides, found by the deck itself.\n`,
        check
    );
    put(
        join(root, 'closing.md'),
        `${slideText({ kind: 'closing', kicker: 'Thank you' })}# Questions welcome\n\nNothing in this hub is real.\n`,
        check
    );
    const text = [
        SLIDE_RULE,
        'deck:',
        "    title: 'The demo hub, at a glance'",
        '',
        'groups:',
        '    projects:',
        '        find: { folders: projects/*/*/present }',
        '        discover: true',
        '        sort: folder',
        '',
        'order:',
        '    - title.md',
        '    - { slides: projects }',
        "    - { kind: summary, of: projects, title: 'At a glance' }",
        '    - closing.md',
        ''
    ].join('\n');
    put(join(root, 'present.yml'), text, check);
}

/** Every PRESENT.md under the hub's projects/ and under the demo hub's projects/, sorted. */
function sources(hub) {
    const found = [];
    for (const base of ['projects', `${DEMO}/projects`]) {
        if (!existsSync(join(hub, base))) continue;
        const names = globSync('**/PRESENT.md', { cwd: join(hub, base) }).sort();
        found.push(...names.map((name) => join(hub, base, name)));
    }
    return found;
}

const { values } = parseArgs({ options: { check: { type: 'boolean' }, hub: { type: 'string' } } });
const check = values.check === true;
const hub = resolve(values.hub ?? '.');
if (!existsSync(join(hub, 'projects'))) {
    console.error(`run this from the hub root: no projects/ folder in ${hub}`);
    process.exit(1);
}
for (const source of sources(hub)) {
    const folder = dirname(source);
    const { front, body } = splitFront(readFileSync(source, 'utf8'));
    let converted;
    if (body.includes(TEMPLATE_MARK)) converted = true;
    else if (front !== null && isMap(front.present)) {
        projectDeck(folder, front, check);
        converted = existsSync(join(folder, 'present', 'present.yml'));
    } else {
        proseDeck(folder, body, check);
        converted = existsSync(join(folder, 'present', 'present.yml'));
    }
    if (converted && !check) {
        rmSync(source);
        removed.push(source);
    } else if (check) left.push(`remove ${source}`);
}
for (const idea of GRID_ORDER) ideaDeck(join(hub, 'projects', 'ideas', idea), check);
chips(hub, check);
hubDeck(hub, check);
demoDeck(hub, check);
if (check) console.log(left.length > 0 ? left.join('\n') : 'nothing left to convert');
else {
    for (const path of written) console.log(`wrote ${path}`);
    for (const path of removed) console.log(`removed ${path}`);
}
