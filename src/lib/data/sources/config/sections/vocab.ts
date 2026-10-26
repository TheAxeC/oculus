// Layer 1, data. What is wrong with the words of config/catalogs/vocab.yml as the merged config
// holds them, past the shape of each file (data/shapes/catalog-files/vocab.ts), as findings of the
// file each value was read from: a flag that names the one word a write or a control takes
// (`SINGLE_USE`) carried by two words or more, filed in the file of the second word, the hub's when
// a hub's value gives it; a row of `focus_clusters` whose key an earlier row that reads holds, or
// whose `label` or `glyph` names no word of the text catalog; a Focus lane naming no cluster or one
// the board does not draw, which no row of `focus_clusters` that reads has; and a lane's
// `move_writes` naming both a stage and a chip, the field of the other kind of lane, a word the
// lane does not list or a word the vocabulary lacks. The page reads the same values itself
// (state/boards/focus.ts, data/shapes/boards/focus-clusters.ts, data/shapes/vocab-keys.ts) and
// passes over what each finding names, so each says what is not read. They are worded from the
// merged catalog.

import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import type { Finding } from '../../../model/index.ts';
import { FOCUS_CLUSTERS, readClusterRows } from '../../../shapes/boards/focus-clusters.ts';
import { vocabKeys, wordsWith } from '../../../shapes/vocab-keys.ts';

/**
 * The flags that name the one word a write or a control takes, each with the vocabulary map that
 * carries it: the stage of a new idea, the status of a new task and of a new application, the words
 * the decline, apply and reopen controls of a lead write, the category of the project manifests'
 * deadlines and the default tier.
 */
const SINGLE_USE: readonly { key: string; flag: string }[] = [
    { key: 'stages', flag: 'new_idea' },
    { key: 'statuses', flag: 'default_task' },
    { key: 'statuses', flag: 'default_application' },
    { key: 'lead_statuses', flag: 'lead_declined' },
    { key: 'lead_statuses', flag: 'lead_applied' },
    { key: 'lead_statuses', flag: 'default_lead' },
    { key: 'ticker_categories', flag: 'manifests' },
    { key: 'tiers', flag: 'default' }
];

/** The list of the Focus board's lanes. */
const LANES = 'focus_lanes';

/** The fields of a cluster that name a word of the text catalog. */
const CLUSTER_WORDS = ['label', 'glyph'] as const;

/** The two fields of a lane's `move_writes`, each with the lane's list and the vocabulary map. */
const MOVES = [
    { field: 'stage', list: 'stages', vocab: 'stages' },
    { field: 'chip', list: 'chips', vocab: 'chips' }
] as const;

/** Where a finding is filed and what it says. */
type Note = (key: string, message: string) => void;

/**
 * One finding for each single-use flag two or more words of its map carry, naming the flag and
 * every word carrying it, filed in the file of the second word.
 */
function flagFindings(config: Record<string, unknown>, note: Note, catalog: TextCatalog): void {
    for (const { key, flag } of SINGLE_USE) {
        const words = wordsWith(config, key, flag);
        if (words.length < 2) continue;
        note(
            `${key}.${words[1]}`,
            findingText(catalog, 'findings.config.flag_twice', flag, words.join(', '))
        );
    }
}

/** The text of a row's field, or the empty text when it holds none. */
function textOf(row: Record<string, unknown>, field: string): string {
    const value = row[field];
    return typeof value === 'string' ? value : '';
}

/**
 * The keys of the clusters the Focus board draws (data/shapes/boards/focus-clusters.ts), each once,
 * and the findings of each row of `focus_clusters` that is a map with a key: one for a row whose key
 * an earlier row that reads holds, and, for any other such row, one for each `label` or `glyph`
 * naming no word of the catalog. A row that does not read is also the shape's finding, and its key
 * is no cluster.
 */
function clusterFindings(
    config: Record<string, unknown>,
    note: Note,
    catalog: TextCatalog
): Set<string> {
    const keys = new Set<string>();
    const rows = config[FOCUS_CLUSTERS];
    if (!Array.isArray(rows)) return keys;
    const read = new Set(readClusterRows(rows).map(({ at }) => at));
    rows.forEach((row: unknown, at) => {
        if (!isMap(row)) return;
        const key = textOf(row, 'key');
        if (key === '') return;
        const place = `${FOCUS_CLUSTERS}[${String(at)}]`;
        if (keys.has(key)) {
            note(place, findingText(catalog, 'findings.config.cluster_repeated', key));
            return;
        }
        if (read.has(at)) keys.add(key);
        for (const field of CLUSTER_WORDS) {
            const word = textOf(row, field);
            if (word === '' || Object.hasOwn(catalog, word)) continue;
            note(
                `${place}.${field}`,
                findingText(catalog, 'findings.config.cluster_word', key, field, word)
            );
        }
    });
    return keys;
}

/** The words of a lane's list, `stages` or `chips`. */
function listOf(row: Record<string, unknown>, list: string): string[] {
    const value = row[list];
    return Array.isArray(value) ? value.filter((one) => typeof one === 'string') : [];
}

/**
 * The findings of a lane's `move_writes`: both fields named; a field of the other kind of lane; a
 * word the lane does not list; a word the vocabulary map lacks. A `move_writes` naming neither
 * field takes no move and is no finding, as a hub's removed word leaves it.
 */
function moveFindings(
    config: Record<string, unknown>,
    lane: string,
    row: Record<string, unknown>,
    at: string,
    note: Note,
    catalog: TextCatalog
): void {
    const move = row.move_writes;
    if (!isMap(move)) return;
    const place = `${at}.move_writes`;
    const named = MOVES.filter((one) => Object.hasOwn(move, one.field));
    if (named.length > 1) {
        note(place, findingText(catalog, 'findings.config.move_both', lane));
        return;
    }
    for (const one of named) {
        const word = textOf(move, one.field);
        const listed = listOf(row, one.list);
        const other = MOVES.find((each) => each.list !== one.list);
        if (listed.length === 0 && other !== undefined && listOf(row, other.list).length > 0) {
            note(
                place,
                findingText(catalog, 'findings.config.move_kind', lane, one.field, other.list)
            );
        } else if (!listed.includes(word)) {
            note(place, findingText(catalog, 'findings.config.move_unlisted', lane, word));
        } else if (!vocabKeys(config[one.vocab]).includes(word)) {
            note(
                place,
                findingText(catalog, 'findings.config.move_unknown', lane, word, one.vocab)
            );
        }
    }
}

/**
 * One finding for each Focus lane naming no cluster or one `clusters`, the clusters the board
 * draws, does not hold, and the findings of each lane's `move_writes`.
 */
function laneFindings(
    config: Record<string, unknown>,
    clusters: ReadonlySet<string>,
    note: Note,
    catalog: TextCatalog
): void {
    const rows = config[LANES];
    if (!Array.isArray(rows)) return;
    rows.forEach((row: unknown, index) => {
        if (!isMap(row)) return;
        const lane = textOf(row, 'key');
        const at = `${LANES}[${String(index)}]`;
        const cluster = textOf(row, 'cluster');
        if (cluster === '') {
            note(at, findingText(catalog, 'findings.config.cluster_none', lane));
        } else if (!clusters.has(cluster)) {
            note(at, findingText(catalog, 'findings.config.cluster_unknown', lane, cluster));
        }
        moveFindings(config, lane, row, at, note, catalog);
    });
}

/**
 * The findings of the vocabulary's words in the merged config: the single-use flags carried by more
 * than one word, the rows of `focus_clusters`, and each Focus lane's cluster and `move_writes`.
 * `fileOf` gives the file a key was read from.
 */
export function vocabFindings(
    config: Record<string, unknown>,
    fileOf: (key: string) => string,
    catalog: TextCatalog
): Finding[] {
    const found: Finding[] = [];
    const note: Note = (key, message) => {
        found.push({ file: fileOf(key.replace(/\[\d+\].*$/, '')), key, message });
    };
    flagFindings(config, note, catalog);
    const clusters = clusterFindings(config, note, catalog);
    laneFindings(config, clusters, note, catalog);
    return found;
}
