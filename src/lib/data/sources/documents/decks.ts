// Layer 1, data. The one module a deck folder is read through, by the snapshot build and by the
// deck route, so the two give a deck the same slides, groups, members, projects, domains and
// facts. Server side only: it reads the filesystem and no client module may import it.
//
// A read is made under one hub, given by its name, its folder and its settings, over projects in
// the merged shape: each a `Project` with its internal id and every reference resolved as the
// merge of the hubs resolves it (snapshot/hubs/merge.ts), its domain the record of its own hub that
// holds the key, else of the one other hub that holds it, else none. The deck route reads the
// merged snapshot's projects (server/content/deck/read.ts); the build makes the hub's projects the
// same way from its manifests and the records of every hub of the workspace
// (snapshot/hubs/deck-facts.ts). Each project's facts, which its slides' strip draws and its
// `{{project.<field>}}` placeholders are filled from, are worked out by `projectFacts` with the
// words the read is given. The decks a group discovers are ordered under the hub's merged settings,
// its categories, its `deck_order` and its stages (data/shapes/boards/order.ts `deckOrderOf`), read
// once for the reader.
//
// Neither read raises a finding on a project's domain. Each manifest's `domain:` is checked by
// the manifest check (snapshot/schema/check.ts) against the keys of every hub of the workspace,
// which raises the finding on that line for a key no hub holds, and the merge raises its own for a
// key two or more other hubs hold and the project's own hub does not; such a project has no
// domain, and its slides are drawn in the neutral tone. An empty `domain:` names no domain, and
// the manifest check raises its finding for it as for any key no hub holds. The findings of the
// build's read are the hub's findings, which the Findings view lists.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ofHub } from '../../helpers/hub-names.ts';
import type {
    Finding,
    Id,
    PortfolioConfig,
    Project,
    RawDeck,
    RawPortfolio
} from '../../model/index.ts';
import { deckOrderOf } from '../../shapes/boards/order.ts';
import { projectFacts, type FactWords } from '../../shapes/project-facts.ts';
import { hubProjects, type HubRecords } from '../../snapshot/hubs/deck-facts.ts';
import { frameSetting } from '../config.ts';
import type { DeckProject } from '../deck/kinds.ts';
import { createReader, type DeckReader } from '../deck/read.ts';

/** A hub a deck is read under: its name, its folder and its settings. */
type DeckHub = { key: string; dir: string; config: PortfolioConfig };

/** What a read of decks is made over. */
type DeckInput = {
    hub: DeckHub;
    /** Projects in the merged shape; the reader holds those of `hub`, each under its own key. */
    projects: Project[];
    /** The words the projects' facts name records by. */
    words: FactWords;
    /** The text an editor holds unsaved for files, by the file's real path. */
    drafts?: ReadonlyMap<string, string>;
    /** The keys of the projects a filter keeps; none for no filter. */
    keep?: ReadonlySet<string>;
};

/**
 * What the reader holds of a project, its facts among it: its key in its own hub's files, and its
 * domain as the internal id of the record it resolves to, which the client's hue and title of a
 * domain read.
 */
function deckProject(project: Project, words: FactWords): DeckProject {
    const one: DeckProject = {
        id: project.id,
        file: project.file,
        folder: project.folder,
        tier: project.tier,
        chips: project.chips,
        short: project.short ?? '',
        title: project.title,
        facts: projectFacts(project, words)
    };
    if (project.workspaceFolder !== undefined) one.workspaceFolder = project.workspaceFolder;
    if (project.stage !== undefined) one.stage = project.stage;
    if (project.form !== undefined) one.form = project.form;
    if (project.year !== undefined) one.year = project.year;
    const domain = project.domainIds.at(0);
    if (domain !== undefined) one.domain = domain;
    return one;
}

/** The reader of the decks of a hub, over the projects and the words `input` gives. */
export function deckReader(input: DeckInput): DeckReader {
    const { hub, words } = input;
    return createReader({
        hub: { key: hub.key, dir: hub.dir },
        projects: ofHub(input.projects, hub.key).map((project) => deckProject(project, words)),
        tagTones: hub.config.tagTones,
        frame: frameSetting(hub.config.merged),
        catalog: hub.config.text,
        order: deckOrderOf(hub.config.merged),
        ...(input.drafts === undefined ? {} : { drafts: input.drafts }),
        ...(input.keep === undefined ? {} : { keep: input.keep })
    });
}

/** A hub as the snapshot build reads its decks: its folder, name, settings and manifests. */
type BuildHub = {
    hub: string;
    root: string;
    config: PortfolioConfig;
    raw: Pick<RawPortfolio, 'manifests'>;
};

/**
 * The snapshot build's read of the decks of the hub `read`: its project decks, by project id, its
 * portfolio deck, and the findings of the read. The hub's projects resolve their references in
 * `own`, the hub's records, then in `others`, the other hubs of the workspace.
 */
export function readDecks(
    read: BuildHub,
    own: HubRecords,
    others: readonly HubRecords[]
): { decks: Record<Id, RawDeck>; findings: Finding[] } {
    const { config } = read;
    const hub = { key: read.root, dir: read.hub, config };
    const made = hubProjects(read.raw.manifests, own, others, config);
    const reader = deckReader({ hub, projects: made.projects, words: made.words });
    const decks: Record<Id, RawDeck> = {};
    for (const one of reader.projectDecks()) decks[one.id] = { path: one.path, tags: one.tags };
    if (config.portfolioDeck !== null) {
        const deck = join(read.hub, config.portfolioDeck);
        if (!(config.unnamed?.deck === true && !existsSync(deck))) {
            reader.read({ key: hub.key, dir: hub.dir }, config.portfolioDeck);
        }
    }
    return { decks, findings: reader.findings() };
}
