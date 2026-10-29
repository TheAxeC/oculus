// Layer 2, client state, pure. The cluster a row of This machine's `clusters:` may be for, as the
// family editor of the row offers it: the clusters `slurm.resource` names (the cluster setup's
// `clusters`, POST /api/clusters) that no row of the merged `clusters:` holds, each drawn by its
// name, with a row's own cluster kept in its choice. The rows counted are those of every other
// hub's file as the setup read them and the cards of the draft of the file on screen, so a row
// added or taken out in the draft counts before the scope is saved. While the setup is being read
// the choice is loading, and a setup that could not be read says so. The `clusters` list itself is
// left as it is: the choice is narrowed through the lists' `narrow` (editors/sources.ts), which
// the row's editor alone is handed.

import { t } from '../../../shared/words/text.ts';
import type { ClusterSetup } from '../../machine/hpc/setup.ts';
import type { Draft } from '../editors/draft.ts';
import type { Lists, SourceItems } from '../editors/sources.ts';
import type { ConfigRow } from '../rows.ts';

/** The id of the This machine row of `clusters:`. */
export const CLUSTERS_ROW = 'local.yml:clusters';

/**
 * What a row's cluster is picked from: the clusters `slurm.resource` names in its order, the
 * clusters a row holds, and the words each named cluster is drawn under.
 */
export type ClusterChoice = {
    named: readonly string[];
    held: readonly string[];
    names?: ReadonlyMap<string, string>;
};

/**
 * The choice over a setup read for the row: the clusters `slurm.resource` names, and as held the
 * clusters of the rows of the other hubs' files and of the draft's cards.
 */
export function clusterChoice(
    setup: ClusterSetup,
    row: ConfigRow,
    draft: Draft | null
): ClusterChoice {
    const others = setup.rows.filter((one) => one.hub !== row.hub);
    const drafted = (draft?.cards ?? []).map((card) => card.fields.resource);
    return {
        named: setup.clusters.map((one) => one.resource),
        held: [
            ...others.map((one) => one.resource),
            ...drafted.filter((one): one is string => typeof one === 'string' && one !== '')
        ],
        names: new Map(
            setup.clusters.filter((one) => one.name !== '').map((one) => [one.resource, one.name])
        )
    };
}

/** The clusters a row of cluster `own` (undefined for a new row) is offered, in the named order. */
function clusterOffer(choice: ClusterChoice, own: string | undefined): string[] {
    return choice.named.filter((one) => one === own || !choice.held.includes(one));
}

/**
 * The lists of the row's editor: `lists` with the clusters a record is offered narrowed to its
 * `clusterOffer` and drawn by the names of the choice. A choice of null is a setup still being
 * read; `failed` is a setup that could not be read.
 */
export function clusterLists(lists: Lists, choice: ClusterChoice | null, failed = false): Lists {
    const narrowed = (own: string | undefined): SourceItems => {
        if (choice !== null) return { state: 'ready', items: clusterOffer(choice, own) };
        return failed
            ? { state: 'failed', error: t('accounts.cluster_unreachable') }
            : { state: 'loading' };
    };
    return {
        ...lists,
        narrow: (source, record) => {
            if (source !== 'clusters') return lists.narrow?.(source, record);
            return narrowed(typeof record.resource === 'string' ? record.resource : undefined);
        },
        labels: (source) => {
            const own = lists.labels(source);
            if (source !== 'clusters' || choice?.names === undefined) return own;
            return new Map([...own, ...choice.names]);
        }
    };
}
