// Layer 2, client state. The Map's bar as data, in the shapes of a project board's bar
// (state/boards/board/), so views/shared/forms/bar/FilterBar.svelte and SliceLine.svelte draw it
// as they draw a board's. The Map filters its projects by a board's facets over the items of a
// preset that takes every project (state/boards/board/presets.ts `mapPreset`), and adds two groups
// a board has not: the Stage group, first on line 1, and the Show group of its toggles, the kinds
// of node the graph draws (graph.ts beside this file).
//
// The Stage group lists every stage a project is at, terminal stages included, in the order of
// `stages` of every hub's words. With none picked the Map keeps the projects at a stage that does
// not carry `terminal` and the projects with no stage, so a Map opened fresh shows the live work;
// with stages picked it keeps the projects at those stages. Its picks are stored under
// `filters.stage`, which `applyFilters` does not read, so the stage rule is applied here. Every
// count is taken over what the other filters leave, the Stage group's under every filter but its
// own, the other groups' over the projects the stage rule keeps. The Stage group's listing
// (`stageGroup`) is also the Stage group of a collection's Projects section in More
// (state/boards/collection/bar.ts), which applies no stage rule of its own.

import type { Snapshot } from '../../../data/model/index.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import { hasWord, recordWords, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import { t } from '../../shared/words/text.ts';
import { namedTone, stageLabel, stageTone } from '../../shared/words/tones.ts';
import {
    appliedFilters,
    applyFilters,
    facets,
    filterGroups,
    shortWords,
    sliceGroups,
    type BoardItem,
    type BoardPreset,
    type Facet,
    type FilterChoice,
    type FilterGroup,
    type SliceGroup
} from '../board/index.ts';
import { buildGraph, type GraphKind, type GraphShow } from './graph.ts';

/** The facet key the Stage group's picks are stored under. */
const STAGE_FACET = 'stage';

/** The facet the Pillar group stores its picks under, which the graph draws its pillars by. */
export const PILLAR_FACET = 'pillar';

/** The id of the Show group, which is no facet and is stored apart (`MapState.show`). */
const SHOW_GROUP = 'show';

/** The ids of the Show group's items: the kinds of node, and Connected only. */
export const SHOW_CONNECTED = 'connected';

/**
 * The groups line 1 of the Map's bar draws as buttons, in their order; More holds the rest. It is
 * frozen, since the Map hands it to the bar.
 */
export const MAP_LINE: readonly string[] = Object.freeze([
    STAGE_FACET,
    'form',
    'status',
    'role',
    'year',
    'domain',
    'venue',
    PILLAR_FACET,
    'tier',
    'hub'
]);

/** What the Map's bar is made of: its items, its preset, its state and the words it reads. */
export type MapBarInput = {
    /** The items of the Map's preset, every project. */
    items: BoardItem[];
    preset: BoardPreset;
    /** The picked values by facet, the Stage group's under `stage`. */
    filters: Record<string, string[]>;
    search: string;
    /** Whether Mine only is on. */
    mine: boolean;
    /** Whether a person is marked as the user, which the Role group and Mine only need. */
    named: boolean;
    /** The hubs the Hub group lists, none while the workspace has one hub. */
    hubs: readonly string[];
    /** The merged config, and the words of each hub a project's stage is read under. */
    config: Record<string, unknown>;
    wordsOf?: WordsOf;
};

/** The Map's bar, and the projects it keeps. */
export type MapBar = {
    /** Line 1's groups: Stage, then a board's groups. */
    groups: FilterGroup[];
    /** Line 2's slices, read from every item before any filter. */
    slices: SliceGroup[];
    /** The facets with their counts, for line 2. */
    counted: Facet[];
    /** The items the filters, the stage rule, the search and Mine only keep. */
    kept: BoardItem[];
    /** How many items the Map holds. */
    total: number;
};

/** Whether a project's stage carries `terminal` in the words of its own hub. */
function terminal(item: BoardItem, config: Record<string, unknown>, wordsOf?: WordsOf): boolean {
    const stage = item.project.stage;
    return hasWord(recordWords(config, wordsOf, item.project), 'stages', 'terminal', stage);
}

/**
 * Whether the stage rule keeps an item: with no stage picked, a project at a stage that does not
 * carry `terminal` or with no stage; with stages picked, a project at one of them.
 */
function stageKeeps(
    item: BoardItem,
    picked: readonly string[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): boolean {
    const stage = item.project.stage;
    if (picked.length === 0) return stage === undefined || !terminal(item, config, wordsOf);
    return stage !== undefined && picked.includes(stage);
}

/**
 * The Stage group: every stage a project of `items` is at, in the order of `order` (the stages of
 * every hub's words), then the rest by name, a stage picked that no project is at listed at 0 after
 * them; each counted over `counted`, drawn in its stage's hue, its words cut at the first " (" with
 * its whole words in its tip.
 */
export function stageGroup(
    items: BoardItem[],
    counted: BoardItem[],
    order: readonly string[],
    picked: readonly string[]
): FilterGroup {
    const at = new Set(items.flatMap((item) => item.project.stage ?? []));
    const listed = [
        ...order.filter((stage) => at.has(stage)),
        ...[...at].filter((stage) => !order.includes(stage)).sort(),
        ...picked.filter((stage) => !at.has(stage))
    ];
    const counts = new Map<string, number>();
    for (const item of counted) {
        const stage = item.project.stage;
        if (stage !== undefined) counts.set(stage, (counts.get(stage) ?? 0) + 1);
    }
    const choices: FilterChoice[] = listed.map((stage) => {
        const whole = stageLabel(stage);
        return {
            id: stage,
            label: shortWords(whole),
            title: whole,
            count: counts.get(stage) ?? 0,
            active: picked.includes(stage),
            tone: stageTone(stage)
        };
    });
    return { id: STAGE_FACET, heading: t('map.stage'), tone: namedTone(''), items: choices };
}

/** The Map's bar for its items and its state. */
export function mapBar(input: MapBarInput): MapBar {
    const { items, preset, config, wordsOf } = input;
    const picked = byKey(input.filters, STAGE_FACET) ?? [];
    const filters = appliedFilters(input.filters, input.named, input.hubs);
    const quick = { mine: input.named && input.mine };
    const staged = items.filter((item) => stageKeeps(item, picked, config, wordsOf));
    const inForce = { filters, search: input.search, quick };
    const counted = facets(staged, preset, input.named, inForce, input.hubs);
    const others = applyFilters(items, filters, input.search, quick);
    return {
        groups: [
            stageGroup(items, others, preset.stageOrder, picked),
            ...filterGroups(counted, input.filters, preset, input.named, input.hubs)
        ],
        slices: sliceGroups(items, preset),
        counted,
        kept: applyFilters(staged, filters, input.search, quick),
        total: items.length
    };
}

/** What the Show group's counts are taken over: the projects kept, and the graph's options. */
export type ShowContext = {
    /** The ids of the projects the bar keeps. */
    projects: ReadonlySet<string>;
    /** The pillars picked by key, which narrow the pillar nodes. */
    pillars?: readonly string[];
    wordsOf?: WordsOf;
};

/** How many nodes of one kind a graph built under `show` and `connected` draws. */
function drawnOf(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    context: ShowContext,
    kind: GraphKind,
    show: GraphShow,
    connected: boolean
): number {
    const graph = buildGraph(snapshot, config, { ...context, show, connected });
    return graph.nodes.filter((node) => node.kind === kind).length;
}

/**
 * The Show group of the Map's toggles: Projects, Pillars and Team, each ticked while its kind of
 * node is drawn and counted by the nodes of its kind the graph draws with it on, and Connected
 * only, ticked while on and counted by the projects it keeps. Its items are untoned, drawn in the
 * unknown tone; its button reads "Show" whatever is ticked.
 */
export function showGroup(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    context: ShowContext,
    show: GraphShow,
    connected: boolean
): FilterGroup {
    const tone = namedTone('');
    const count = (kind: GraphKind, next: GraphShow, joined: boolean): number =>
        drawnOf(snapshot, config, context, kind, next, joined);
    const items: FilterChoice[] = [
        {
            id: 'projects',
            label: t('map.show_projects'),
            count: count('project', { ...show, projects: true }, connected),
            active: show.projects,
            tone
        },
        {
            id: 'pillars',
            label: t('map.show_pillars'),
            count: count('line', { ...show, pillars: true }, connected),
            active: show.pillars,
            tone
        },
        {
            id: 'team',
            label: t('map.show_team'),
            count: count('collaborator', { ...show, team: true }, connected),
            active: show.team,
            tone
        },
        {
            id: SHOW_CONNECTED,
            label: t('map.show_connected'),
            title: t('map.connected_tip'),
            count: count('project', { ...show, projects: true }, true),
            active: connected,
            tone
        }
    ];
    return { id: SHOW_GROUP, heading: t('map.show'), tone, items };
}
