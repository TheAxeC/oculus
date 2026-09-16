// Layer 2, client-state test fixture. Synthetic board and collection records exercise badge hooks without reading or writing hub data.

import type { Project, Snapshot, Tier } from '../../src/lib/data/model.ts';
import type { ClientState } from '../client.ts';
import { textCatalog } from '../../src/lib/data/sources/config.ts';
import { NO_FEEDS } from '../entities-fixture.ts';

function project(id: string, tier: Tier, type: string, chips: string[] = []): Project {
    return {
        id,
        tier,
        ghost: false,
        type,
        chips,
        title: id,
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: '',
        file: ''
    };
}

/** Two project-board types, three archive outcomes and four coauthor outcomes, including a first-bucket overlap. */
export function badgeSnapshot(empty = false): Snapshot {
    const projects = empty
        ? []
        : [
              project('active', 'active', 'active'),
              project('idea', 'ideas', 'idea'),
              project('paper', 'archive', 'published', ['journal']),
              project('output', 'archive', 'software'),
              project('closed', 'archive', 'nogo'),
              project('co-inflight', 'coauthor', 'submitted', ['journal']),
              project('co-paper', 'coauthor', 'published', ['conference']),
              project('co-output', 'coauthor', 'software'),
              project('co-closed', 'coauthor', 'dropped')
          ];
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(projects.map((item) => [item.id, item])),
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding: {},
            collections: {
                funding: {
                    id: 'funding',
                    title: 'Funding',
                    file: '',
                    entries: empty
                        ? []
                        : [
                              {
                                  id: 'grant',
                                  title: 'Grant',
                                  file: '',
                                  index: 0,
                                  fields: { status: 'in-prep' }
                              }
                          ]
                }
            },
            feeds: NO_FEEDS,
            career: null
        },
        relations: {
            projectVenue: [],
            projectFunding: [],
            projectDataset: [],
            projectPillar: [],
            projectDomain: [],
            projectRelated: [],
            fundingPillar: []
        },
        findings: []
    };
}

/** Install a snapshot and config with versions accepted after any earlier fixture. */
export function installBadges(
    client: ClientState,
    config: Record<string, unknown>,
    empty = false
): void {
    const { message, receive } = client.entities;
    receive({
        channel: 'config',
        version: (message('config')?.version ?? 0) + 1,
        payload: { config, text: textCatalog(config), findings: [] }
    });
    const version = (message('portfolio')?.version ?? 0) + 1;
    receive({ channel: 'portfolio', version, payload: { ...badgeSnapshot(empty), version } });
}
