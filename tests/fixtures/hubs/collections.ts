// Layer 4, test helper. The `collections:` list of a planted hub that keeps its data files in
// folders of their own (registries/, funding/, network/, feeds/ and the rest), as a hub's
// `.oculus/config.yml` names them. Oculus's own default of each key is `.oculus/data/<key>.yml`,
// so a case whose hub plants its files at these paths sets this list in the merged config, as the
// hub's settings file would, rather than relying on the engine's default.

/** One entry per key, the file a planted hub keeps it in. */
const HUB_COLLECTIONS: readonly { key: string; file: string }[] = [
    { key: 'data', file: 'registries/data.yml' },
    { key: 'venues', file: 'registries/venues.yml' },
    { key: 'pillars', file: 'registries/pillars.yml' },
    { key: 'domains', file: 'registries/domains.yml' },
    { key: 'statements', file: 'registries/boilerplate.yml' },
    { key: 'people', file: 'registries/people.yml' },
    { key: 'organisations', file: 'registries/organisations.yml' },
    { key: 'resources', file: 'registries/resources.yml' },
    { key: 'funding', file: 'funding/funding.yml' },
    { key: 'events', file: 'network/events.yml' },
    { key: 'education', file: 'education/education.yml' },
    { key: 'applications', file: 'applications/applications.yml' },
    { key: 'joint-work', file: 'network/joint-work.yml' },
    { key: 'tasks', file: 'tasks/tasks.yml' },
    { key: 'literature', file: 'registries/literature.yml' },
    { key: 'leads', file: 'feeds/position-leads.yml' },
    { key: 'radar', file: 'feeds/literature-radar.yml' }
];

/** A merged config with the planted hub's `collections:` list in place of the engine's. */
export function withHubCollections(config: Record<string, unknown>): Record<string, unknown> {
    return { ...config, collections: HUB_COLLECTIONS.map((one) => ({ ...one })) };
}
