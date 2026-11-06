// Layer 1, data. Reads a hub's decks for the snapshot build: the portfolio deck and every project
// deck, with what was wrong in them, which the Findings view lists. The hub's registries give the
// keys of its domains, which a project's `domain:` is checked against, and each project's facts,
// which its slides fill their `{{project.<field>}}` from, name the records of the hub and of the
// other hubs of the workspace as the merge resolves them (snapshot/hubs/deck-facts.ts), so the
// findings are the ones the deck route raises over the merged snapshot. Server side only: it reads
// the filesystem and no client module may import it.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMap, str, strings } from '../../helpers/guards.ts';
import { tierOf } from '../../helpers/hub-names.ts';
import type {
    Finding,
    Id,
    PortfolioConfig,
    ProjectFact,
    RawDeck,
    RawManifest,
    RawPortfolio
} from '../../model/index.ts';
import { vocabKeys } from '../../shapes/vocab-keys.ts';
import { hubFacts, type HubRecords } from '../../snapshot/hubs/deck-facts.ts';
import { frameSetting } from '../config.ts';
import type { DeckProject } from '../deck/kinds.ts';
import { createReader } from '../deck/read.ts';

/** A hub as the deck read needs it: its folder, its name, its settings and what it holds. */
type DeckHub = {
    hub: string;
    root: string;
    config: PortfolioConfig;
    raw: Pick<RawPortfolio, 'manifests' | 'registries'>;
};

/** What the deck reader needs of each project: where it is, what it is called and its facts. */
function deckProjects(
    manifests: RawManifest[],
    tiers: readonly string[],
    facts: (manifest: RawManifest) => ProjectFact[]
): DeckProject[] {
    return manifests.map((manifest) => {
        const status = isMap(manifest.status) ? manifest.status : {};
        const project: DeckProject = {
            id: manifest.id,
            file: manifest.file,
            folder: manifest.folder,
            chips: strings(status.chips),
            short: str(manifest.short) ?? '',
            title: str(manifest.title) ?? manifest.id,
            facts: facts(manifest)
        };
        if (manifest.workspaceFolder !== undefined)
            project.workspaceFolder = manifest.workspaceFolder;
        const tier = tierOf(manifest.tier, tiers);
        if (tier !== undefined) project.tier = tier;
        const stage = str(manifest.stage);
        if (stage !== undefined) project.stage = stage;
        const form = str(manifest.form);
        if (form !== undefined) project.form = form;
        const domain = str(manifest.domain);
        if (domain !== undefined && domain !== '') project.domain = domain;
        return project;
    });
}

/**
 * The decks of the hub `read`, by project id, and the findings of their read: a project's facts
 * name the records of `own`, the hub's, or of `others`, the other hubs of the workspace.
 */
export function readDecks(
    read: DeckHub,
    own: HubRecords,
    others: readonly HubRecords[]
): { decks: Record<Id, RawDeck>; findings: Finding[] } {
    const { hub, config } = read;
    const root = { key: read.root, dir: hub };
    const tiers = vocabKeys(config.merged.tiers);
    const facts = hubFacts(own, others, { vocab: config.merged, catalog: config.text, tiers });
    const reader = createReader({
        hub: root,
        projects: deckProjects(read.raw.manifests, tiers, facts),
        domains: read.raw.registries.domains.entries.map((entry) => entry.key),
        tagTones: config.tagTones,
        frame: frameSetting(config.merged),
        catalog: config.text
    });
    const decks: Record<Id, RawDeck> = {};
    for (const one of reader.projectDecks()) decks[one.id] = { path: one.path, tags: one.tags };
    if (config.portfolioDeck !== null) {
        const deck = join(hub, config.portfolioDeck);
        if (!(config.unnamed?.deck === true && !existsSync(deck))) {
            reader.read(root, config.portfolioDeck);
        }
    }
    return { decks, findings: reader.findings() };
}
