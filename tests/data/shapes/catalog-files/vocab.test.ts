// Layer 1, data tests. The words of config/catalogs/vocab.yml past the shape of each file, as a
// hub's `.oculus/config.yml` lays them over oculus's: a single-use flag carried by two words, a row
// of `focus_clusters` the shape refuses or whose words the text catalog lacks, a Focus lane naming
// no cluster or one no readable row has, and a lane's `move_writes` naming a word the lane does not
// list or the field of the other kind of lane. Each finding names the file the value was read from,
// the hub's when the hub's value gives it, and the one-word readers give no word for a flag two
// words carry. The hub's file is given as text, so no file is read for it.

import { describe, expect, it } from 'vitest';
import { appliedWord } from '../../../../src/lib/data/accounts/leads.ts';
import { engineDir, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { vocabFindings } from '../../../../src/lib/data/sources/config/sections/vocab.ts';
import { oneWordWith } from '../../../../src/lib/data/shapes/vocab-keys.ts';
import { clusters } from '../../../../src/lib/state/boards/focus.ts';
import {
    HUB,
    HUB_SETTINGS as FILE,
    OCULUS,
    findingLines,
    readerFindings,
    withHub
} from '../../sources/config/layers/layers-fixture.ts';

/** Oculus's own vocabulary file, where a finding on a value of oculus's is filed. */
const OCULUS_VOCAB = `${engineDir()}/config/catalogs/vocab.yml`;

/** The findings of the merge and of the config's readers over a hub file holding `text`. */
function said(text: string): string[] {
    const read = withHub(text);
    return [...findingLines(read.findings), ...findingLines(readerFindings(read, HUB))];
}

/** A row of `focus_clusters` drawn in columns. */
function cluster(key: string, words: string): string {
    return `{ key: ${key}, ${words}muted: false, layout: columns }`;
}

/** oculus's four clusters as a hub file writes them, `incubate` given `words` for its label. */
function clustersWith(words: string): string {
    return [
        'focus_clusters:',
        `  - ${cluster('now', 'label: focus.cluster_now, glyph: focus.now_glyph, ')}`,
        `  - ${cluster('parked', 'label: focus.cluster_parked, ')}`,
        `  - ${cluster('incubate', words)}`,
        '  - { key: idea, glyph: focus.ideas_glyph, muted: true, layout: full_width, sort: title }',
        ''
    ].join('\n');
}

/** A hub file whose one Focus lane holds `fields` after its key, label and colour. */
function laneWith(fields: string): string {
    return `focus_lanes: [ { key: s, label: S, color: "#0e7490", ${fields} } ]\n`;
}

describe("the vocabulary's words past its shape", () => {
    it('reads oculus alone with no finding of the vocabulary', () => {
        const findings = vocabFindings(OCULUS, () => 'vocab.yml', textCatalog(OCULUS));
        expect(findings).toEqual([]);
    });

    it('case 5: words a lane naming a cluster no row has and one naming none, and reads a fourth cluster', () => {
        const text = [
            'focus_clusters:',
            '  - { key: now, label: focus.cluster_now, muted: false, layout: columns }',
            '  - { key: later, label: focus.cluster_parked, muted: true, layout: columns }',
            'focus_lanes:',
            '  - { key: run, label: Run, color: "#16a34a", cluster: now, stages: [exploring] }',
            '  - { key: wait, label: Wait, color: "#475569", cluster: later, stages: [submitted] }',
            '  - { key: lost, label: Lost, color: "#b45309", cluster: nowhere, stages: [revision] }',
            '  - { key: loose, label: Loose, color: "#0e7490", stages: [scoping] }',
            ''
        ].join('\n');
        expect(said(text)).toEqual([
            `${FILE} | focus_lanes[2] | the Focus lane lost names the cluster nowhere, which no readable row of focus_clusters has; the lane is not drawn`,
            `${FILE} | focus_lanes[3] | the Focus lane loose names no cluster; the lane is not drawn`
        ]);
    });

    it('case 6: words a cluster drawn in a layout the shape does not take and each of its lanes, and reads no cluster from it', () => {
        const text = clustersWith('label: focus.cluster_incubate, ').replace(
            'key: incubate, label: focus.cluster_incubate, muted: false, layout: columns',
            'key: incubate, label: focus.cluster_incubate, muted: false, layout: grid'
        );
        const lanes = ['scope', 'derisk', 'build'].map(
            (lane, at) =>
                `${OCULUS_VOCAB} | focus_lanes[${String(at + 6)}] | the Focus lane ${lane} names the cluster incubate, which no readable row of focus_clusters has; the lane is not drawn`
        );
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters.2.layout | focus_clusters.2.layout must be one of columns, full_width`,
            ...lanes
        ]);
        expect(clusters(withHub(text).config).map((one) => one.key)).toEqual([
            'now',
            'parked',
            'idea'
        ]);
    });

    it("words each lane of a cluster whose row does not read, and of oculus's clusters the hub's list leaves out", () => {
        const text =
            'focus_clusters: [ { key: now, label: focus.cluster_now, muted: false, layout: grid } ]\n';
        const lanes = [
            ['run', 'now'],
            ['push', 'now'],
            ['revise', 'now'],
            ['review', 'parked'],
            ['blocked', 'parked'],
            ['backburner', 'parked'],
            ['scope', 'incubate'],
            ['derisk', 'incubate'],
            ['build', 'incubate'],
            ['idea', 'idea']
        ].map(
            ([lane, cluster], at) =>
                `${OCULUS_VOCAB} | focus_lanes[${String(at)}] | the Focus lane ${lane} names the cluster ${cluster}, which no readable row of focus_clusters has; the lane is not drawn`
        );
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters.0.layout | focus_clusters.0.layout must be one of columns, full_width`,
            ...lanes
        ]);
    });

    it('words the label of a cluster whose row does not read, and a row repeating a key after it does not read', () => {
        const text =
            'focus_clusters: [ { key: now, label: focus.nosuch, muted: false, layout: grid } ]\n';
        const lines = said(text);
        expect(lines.slice(0, 2)).toEqual([
            `${FILE} | focus_clusters.0.layout | focus_clusters.0.layout must be one of columns, full_width`,
            `${FILE} | focus_clusters[0].label | the label of the Focus cluster now names focus.nosuch, which the text catalog lacks; it reads as absent`
        ]);
        const repeated = clustersWith('label: focus.cluster_incubate, ').replace(
            '  - { key: idea,',
            '  - { key: now, muted: false, layout: grid }\n  - { key: idea,'
        );
        expect(said(repeated)).toEqual([
            `${FILE} | focus_clusters.3.layout | focus_clusters.3.layout must be one of columns, full_width`,
            `${FILE} | focus_clusters[3] | a second row of focus_clusters has the key now; the row is not read`
        ]);
    });

    it("words a cluster's label and glyph naming no word of the text catalog", () => {
        const text = clustersWith('label: focus.nosuch, glyph: focus.nosuch_glyph, ');
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters[2].label | the label of the Focus cluster incubate names focus.nosuch, which the text catalog lacks; it reads as absent`,
            `${FILE} | focus_clusters[2].glyph | the glyph of the Focus cluster incubate names focus.nosuch_glyph, which the text catalog lacks; it reads as absent`
        ]);
    });

    it('words a row of focus_clusters whose key an earlier row holds', () => {
        const text = clustersWith('label: focus.cluster_incubate, ').replace(
            '  - { key: idea,',
            `  - ${cluster('now', '')}\n  - { key: idea,`
        );
        expect(said(text)).toEqual([
            `${FILE} | focus_clusters[3] | a second row of focus_clusters has the key now; the row is not read`
        ]);
    });

    it('case 7: words two tiers carrying default, and the one-word reader gives none', () => {
        const read = withHub('tiers: { personal: { label: Personal, default: true } }\n');
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | tiers.personal | research, personal each carry default, which one word carries at most; none of them is read for it`
        ]);
        expect(oneWordWith(read.config, 'tiers', 'default')).toBe(undefined);
    });

    it('case 11: words a stage lane moving onto a stage it does not list, and one naming a chip', () => {
        expect(
            said(laneWith('cluster: now, stages: [scoping], move_writes: { stage: building }'))
        ).toEqual([
            `${FILE} | focus_lanes[0].move_writes | the move_writes of the Focus lane s names building, which the lane does not list; the lane takes no move`
        ]);
        expect(
            said(laneWith('cluster: now, stages: [scoping], move_writes: { chip: blocked }'))
        ).toEqual([
            `${FILE} | focus_lanes[0].move_writes | the move_writes of the Focus lane s names a chip, and the lane is placed by its stages; the lane takes no move`
        ]);
    });

    it('words a move naming both fields, and a listed word the vocabulary lacks', () => {
        const both =
            'cluster: now, stages: [scoping], move_writes: { stage: scoping, chip: blocked }';
        expect(said(laneWith(both))).toEqual([
            `${FILE} | focus_lanes[0].move_writes | the move_writes of the Focus lane s names both a stage and a chip; the lane takes no move`
        ]);
        const config = {
            ...OCULUS,
            focus_lanes: [
                { key: 's', cluster: 'now', stages: ['nosuch'], move_writes: { stage: 'nosuch' } }
            ]
        };
        const findings = vocabFindings(config, () => 'vocab.yml', textCatalog(OCULUS));
        expect(findingLines(findings)).toEqual([
            'vocab.yml | focus_lanes[0].move_writes | the move_writes of the Focus lane s names nosuch, which is no word of stages; the lane takes no move'
        ]);
    });

    it('case 12: words default_task on two statuses, and the one-word reader gives none', () => {
        const read = withHub('statuses: { doing: { color: "#16a34a", default_task: true } }\n');
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | statuses.doing | todo, doing each carry default_task, which one word carries at most; none of them is read for it`
        ]);
        expect(oneWordWith(read.config, 'statuses', 'default_task')).toBe(undefined);
    });

    it('case 12: words lead_applied on two lead statuses, and the apply word is none', () => {
        const read = withHub(
            'lead_statuses: { closed: { lead_closed: true, lead_applied: true } }\n'
        );
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | lead_statuses.closed | applied, closed each carry lead_applied, which one word carries at most; none of them is read for it`
        ]);
        expect(appliedWord(read.config)).toBe('');
    });

    it("files a flag carried by a word of oculus's file and one of a hub's in the hub's file", () => {
        const read = withHub(
            'stages: { scoping: { label: Scoping, idea: true, new_idea: true } }\n'
        );
        expect(read.from['stages.nascent']).toBe('catalogs/vocab.yml');
        expect(findingLines(readerFindings(read, HUB))).toEqual([
            `${FILE} | stages.scoping | nascent, scoping each carry new_idea, which one word carries at most; none of them is read for it`
        ]);
        expect(oneWordWith(read.config, 'stages', 'new_idea')).toBe(undefined);
    });
});
