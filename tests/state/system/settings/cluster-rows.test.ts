// Layer 2, client state tests. The cluster a row of This machine's `clusters:` is for, as the
// Settings view offers it (state/system/config/other-rows/cluster-rows.ts over the family editor's
// pool, editors/offers.ts `poolOf`): a new row is offered the clusters `slurm.resource` names that
// no row holds, a row there keeps its own cluster among them, and a cluster of the resources
// registry that `slurm.resource` does not name is offered to none. A cluster has a row when a row
// of another hub's file holds it or a card of the draft does: the scope's own saved row counts
// through its card, so a row taken out in the draft frees its cluster before the Save. The rows are
// the This machine rows of the primary over the shipped catalog of `local.yml`.
//
// What this does NOT cover: how the row is drawn (other-rows/ClusterRows.svelte, seen at the look),
// the read of the rows of every hub's file (POST /api/clusters, tests/server/machine/hpc/), and the
// Save of the scope, which holds this row's changes as it holds every other row's
// (tests/routes/edit/undo/config-save.test.ts).

import { describe, expect, it } from 'vitest';
import type { LocalFile } from '../../../../src/lib/data/shapes/config-save.ts';
import type { ClusterSetup } from '../../../../src/lib/data/model/index.ts';
import { draftOf } from '../../../../src/lib/state/system/config/editors/draft.ts';
import type { Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { poolOf } from '../../../../src/lib/state/system/config/editors/offers.ts';
import { settingsGroups } from '../../../../src/lib/state/system/config/groups.ts';
import {
    clusterChoice,
    clusterLists
} from '../../../../src/lib/state/system/config/other-rows/cluster-rows.ts';
import type { ConfigRow, LocalScope } from '../../../../src/lib/state/system/config/rows.ts';
import { bareLists, shipped } from './fixture.ts';

/** What the server sent of the machine's files. */
const MACHINE: LocalScope['machine'] = {
    primary: 'hub',
    set: [],
    defaults: { port: '8790' },
    values: {},
    hubs: {},
    portRefused: null
};

/** The primary's `local.yml`, which holds a row for the cluster `held`. */
const FILE: LocalFile = {
    present: true,
    digest: 'd',
    values: { clusters: [{ resource: 'held', user: 'me' }] },
    unparsed: null
};

/** The `clusters:` row of This machine for the primary. */
function clustersRow(): ConfigRow {
    const groups = settingsGroups(shipped, {}, { workspace: null }, undefined, [], {
        hub: 'hub',
        primary: true,
        file: FILE,
        machine: MACHINE
    });
    const row = groups
        .flatMap((group) => group.sections.flatMap((section) => section.rows))
        .find((one): one is ConfigRow => one.kind === 'config' && one.id === 'local.yml:clusters');
    if (row === undefined) throw new Error('no clusters row');
    return row;
}

/** Lists whose resources registry holds the clusters `free`, `held` and `unnamed`. */
function registryLists(): Lists {
    const bare = bareLists({});
    return {
        ...bare,
        items: (source) =>
            source === 'clusters'
                ? { state: 'ready', items: ['free', 'held', 'unnamed'] }
                : bare.items(source)
    };
}

describe("the cluster a row of This machine's clusters: is for", () => {
    const row = clustersRow();
    const resource = row.fields.resource;
    // `slurm.resource` names `held` and `free`; the file holds a row of `held`.
    const lists = clusterLists(registryLists(), { named: ['held', 'free'], held: ['held'] });

    it('offers a new row the clusters of slurm.resource with no row, and no other', () => {
        expect(poolOf(resource, {}, lists).items).toEqual(['free']);
    });

    it('offers a row its own cluster with the clusters of slurm.resource no row holds', () => {
        expect(poolOf(resource, { resource: 'held', user: 'me' }, lists).items).toEqual([
            'held',
            'free'
        ]);
    });
});

/** A cluster of `slurm.resource`, drawn under `name`. */
function named(resource: string, name: string): ClusterSetup['clusters'][number] {
    return {
        resource,
        name,
        missing: '',
        host: '',
        user: '',
        keyFile: '',
        suggested: '',
        keyRefused: '',
        publicKey: '',
        access: '',
        resolution: null
    };
}

/**
 * The setup as POST /api/clusters reads it: `slurm.resource` names `held`, `free` and `elsewhere`;
 * the primary's own file holds a row of `held` and the hub `second` a row of `elsewhere`.
 */
const SETUP: ClusterSetup = {
    clusters: [named('held', 'Held'), named('free', ''), named('elsewhere', 'Elsewhere')],
    hint: '',
    keyMissing: '',
    rows: [
        { resource: 'held', user: 'me', keyFile: '', hub: 'hub' },
        { resource: 'elsewhere', user: 'me', keyFile: '', hub: 'second' }
    ]
};

describe('the clusters that have a row, as the choice reads them from the setup and the draft', () => {
    const row = clustersRow();
    const draft = draftOf(row);

    it("counts a row of another hub's file and a card of the draft, not the scope's saved row", () => {
        const choice = clusterChoice(SETUP, row, draft);
        expect(choice.named).toEqual(['held', 'free', 'elsewhere']);
        expect(choice.held).toEqual(['elsewhere', 'held']);
        expect([...(choice.names ?? [])]).toEqual([
            ['held', 'Held'],
            ['elsewhere', 'Elsewhere']
        ]);
    });

    it('offers a new row again the cluster whose row was taken out in the draft', () => {
        if (draft === null) throw new Error('no draft');
        const choice = clusterChoice(SETUP, row, { ...draft, cards: [] });
        const lists = clusterLists(registryLists(), choice);
        expect(poolOf(row.fields.resource, {}, lists).items).toEqual(['held', 'free']);
    });
});
