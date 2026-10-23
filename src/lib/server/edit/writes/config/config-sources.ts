// Layer 2, server. The lists a config write checks a choice, a multi or a suggestion against, as
// the server reads them: the config-derived ones through options.ts (the page reads the same
// function), the languages and code themes the data layer holds (the code themes held to the
// TextMate rules the checkout ships, data/places/code-rules.ts), and the domains, clusters, people
// and slides of the portfolio this server last published. The domains, the clusters and the people
// are the keys of the primary hub's records (`hubRecords`), since a setting such as `self` names a
// record of the primary by the key its file gives it.
//
// A list the server does not hold answers null, and the check of a value drawn from it is its type
// alone. That is every portfolio list of a process that has published no portfolio yet, and the
// lists only the page can build (the view registry, the theme classes of the sheet, the fs listing,
// the usage store's tiers). The write never reaches for a list by itself: config-write.ts hands it
// the pieces of the write target through SourceInputs.

import { codeThemeIds, CODE_TOKENS } from '../../../../data/helpers/editor/code-themes.ts';
import type { Project } from '../../../../data/model/index.ts';
import { vscodeRuleIds } from '../../../../data/places/code-rules.ts';
import { registered } from '../../../../data/prose/languages.ts';
import {
    configItems,
    hubRecords,
    resourcesOfKind,
    slideTagClasses,
    type Source
} from '../../../../data/sources/config/catalog/options.ts';

/** What a write target holds that a list can be built from. */
export type SourceInputs = {
    /** The primary hub's folder, or null while the workspace has no primary. */
    hub: string | null;
    /** The primary hub's name, or null while the workspace has no primary. */
    primary: string | null;
    /**
     * The projects of the portfolio this server last published, none when it has published none.
     */
    projects: () => Project[];
    /** One entity map of that portfolio, or null while it holds none. */
    entities?: (kind: 'domains' | 'resources' | 'people') => Record<string, unknown> | null;
};

/** The lists of one write, over the merged configuration the write was made against. */
export type Sources = {
    hub: string | null;
    config: Record<string, unknown>;
    /** The items of a list, or null when the server does not hold it. */
    items: (source: Source) => string[] | null;
};

/** The lists the server reads, over the merged configuration a write checks against. */
export function sourcesFor(inputs: SourceInputs, config: Record<string, unknown>): Sources {
    const items = (source: Source): string[] | null => {
        const derived = configItems(source, config);
        if (derived !== null) return derived;
        switch (source) {
            case 'languages':
                return registered();
            case 'code_themes':
                return [CODE_TOKENS, ...codeThemeIds(config, new Set(vscodeRuleIds()))];
            case 'domains': {
                const domains = inputs.entities?.('domains') ?? null;
                return domains === null ? null : Object.keys(hubRecords(domains, inputs.primary));
            }
            case 'clusters': {
                const resources = inputs.entities?.('resources') ?? null;
                return resources === null
                    ? null
                    : resourcesOfKind(hubRecords(resources, inputs.primary), 'cluster');
            }
            case 'people': {
                const people = inputs.entities?.('people') ?? null;
                return people === null ? null : Object.keys(hubRecords(people, inputs.primary));
            }
            case 'slide_tags': {
                const projects = inputs.projects();
                return projects.length === 0 ? null : slideTagClasses(projects);
            }
            default:
                return null;
        }
    };
    return { hub: inputs.hub, config, items };
}
