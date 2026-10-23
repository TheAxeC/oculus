// Layer 1, data. The relation tables of a snapshot and the id lists filled from them: a project's
// venue, funding, datasets, pillars, domains, related projects and team (its lead and its
// collaborators), a scheme's funder and a person's organisations, and the other side of each. A
// pair is written only when both ends are records known to the workspace's hubs: one hub's own
// records and the keys the other hubs hold, which normalise.ts hands in as `known`, so a reference
// that names nothing in any hub reaches no table and no list, and a pair of one hub's build may
// name a key only another hub holds.
//
// One hub's build (normalise.ts) and the merge of the hubs of a workspace (hubs/merge.ts) both fill
// their records here, the merge after it has resolved every reference to the id of the record it
// names, so the two give their tables by one rule.

import type { Funding, Id, Organisation, Person, Relations } from '../../model/index.ts';
import type { Dataset, Domain, Pillar, Project } from '../../model/index.ts';

/** Unique pairs, sorted by the first id then the second. */
function pairs(found: [Id, Id][]): [Id, Id][] {
    const seen = new Set<string>();
    const out: [Id, Id][] = [];
    for (const pair of found) {
        const token = `${pair[0]}\0${pair[1]}`;
        if (seen.has(token)) continue;
        seen.add(token);
        out.push(pair);
    }
    return out.sort((a, b) => (a[0] !== b[0] ? (a[0] < b[0] ? -1 : 1) : a[1] < b[1] ? -1 : 1));
}

/** The second id of every pair whose first is `from`, in the table's own order. */
function targets(table: [Id, Id][], from: Id): Id[] {
    return table.filter((pair) => pair[0] === from).map((pair) => pair[1]);
}

/** The first id of every pair whose second is `to`, in the table's own order. */
function sources(table: [Id, Id][], to: Id): Id[] {
    return table.filter((pair) => pair[1] === to).map((pair) => pair[0]);
}

/** What the four person and organisation tables are built from, beside the projects themselves. */
type Sides = {
    people: Person[];
    schemes: Funding[];
    /** The entries of the joint-work collection, each with the person key its record names. */
    jointWork: { id: Id; person: Id }[];
};

/**
 * The relation tables. A pair is written only when both ends are entities of the snapshot, so a
 * dangling id (which validate has reported) reaches no table and no entity's id list. A project's
 * `projectPerson` pairs are its team, the people its `lead:` names and those its `collaborators:`
 * name, a person on both lists once.
 *
 * `fundingPillar` is the one table with no field behind it: pillars.yml carries no funding key,
 * its `funding:` is prose, so a scheme and a pillar are related here when at least one
 * project names them both.
 */
function relations(
    projects: Project[],
    entities: Record<string, ReadonlySet<Id>>,
    sides: Sides
): Relations {
    const venueTable: [Id, Id][] = [];
    const fundingTable: [Id, Id][] = [];
    const datasetTable: [Id, Id][] = [];
    const pillarTable: [Id, Id][] = [];
    const domainTable: [Id, Id][] = [];
    const relatedTable: [Id, Id][] = [];
    const fundingPillar: [Id, Id][] = [];
    const projectPerson: [Id, Id][] = [];
    const jointWorkPerson: [Id, Id][] = [];
    const personOrganisation: [Id, Id][] = [];
    const fundingOrganisation: [Id, Id][] = [];

    for (const item of projects) {
        for (const id of [...item.lead, ...item.collaborators]) {
            if (entities.people.has(id)) projectPerson.push([item.id, id]);
        }
        if (item.venueId !== undefined && entities.venues.has(item.venueId)) {
            venueTable.push([item.id, item.venueId]);
        }
        for (const id of item.fundingIds) {
            if (entities.funding.has(id)) fundingTable.push([item.id, id]);
        }
        for (const id of item.datasetIds) {
            if (entities.datasets.has(id)) datasetTable.push([item.id, id]);
        }
        for (const id of item.pillarIds) {
            if (entities.pillars.has(id)) pillarTable.push([item.id, id]);
        }
        for (const id of item.domainIds) {
            if (entities.domains.has(id)) domainTable.push([item.id, id]);
        }
        for (const id of item.relatedIds) {
            if (entities.projects.has(id)) relatedTable.push([item.id, id]);
        }
        for (const fund of item.fundingIds) {
            if (!entities.funding.has(fund)) continue;
            for (const line of item.pillarIds) {
                if (entities.pillars.has(line)) fundingPillar.push([fund, line]);
            }
        }
    }

    for (const entry of sides.jointWork) {
        if (entities.people.has(entry.person)) jointWorkPerson.push([entry.id, entry.person]);
    }
    for (const one of sides.people) {
        for (const key of one.affiliations) {
            if (entities.organisations.has(key)) personOrganisation.push([one.id, key]);
        }
    }
    for (const scheme of sides.schemes) {
        if (scheme.funder !== undefined && entities.organisations.has(scheme.funder)) {
            fundingOrganisation.push([scheme.id, scheme.funder]);
        }
    }

    return {
        projectVenue: pairs(venueTable),
        projectFunding: pairs(fundingTable),
        projectDataset: pairs(datasetTable),
        projectPillar: pairs(pillarTable),
        projectDomain: pairs(domainTable),
        projectRelated: pairs(relatedTable),
        fundingPillar: pairs(fundingPillar),
        projectPerson: pairs(projectPerson),
        jointWorkPerson: pairs(jointWorkPerson),
        personOrganisation: pairs(personOrganisation),
        fundingOrganisation: pairs(fundingOrganisation)
    };
}

/** The records whose lists the tables fill. */
export type Linked = {
    projects: Project[];
    datasets: Dataset[];
    pillars: Pillar[];
    domains: Domain[];
    schemes: Funding[];
    people: Person[];
    organisations: Organisation[];
};

/**
 * The relation tables of the records, each record's id lists filled from them: a project keeps the
 * references `known` holds, a scheme its funder and a person its organisations when `known` holds
 * them, and every other list is the other side of a table. `known` holds the ids of each kind of
 * record by its source name; `jointWork` the entries of the joint-work collection, each with the id
 * of the person it names.
 */
export function linked(
    records: Linked,
    known: Record<string, ReadonlySet<Id>>,
    jointWork: { id: Id; person: Id }[]
): Relations {
    const { projects, datasets, pillars, domains, schemes, people, organisations } = records;
    const tables = relations(projects, known, { people, schemes, jointWork });

    for (const item of projects) {
        item.relatedIds = targets(tables.projectRelated, item.id);
        item.fundingIds = targets(tables.projectFunding, item.id);
        item.datasetIds = targets(tables.projectDataset, item.id);
        item.pillarIds = targets(tables.projectPillar, item.id);
        item.domainIds = targets(tables.projectDomain, item.id);
        // The lead keeps the manifest's order, since its first person is the first author.
        const team = targets(tables.projectPerson, item.id);
        item.lead = [...new Set(item.lead)].filter((id) => team.includes(id));
        item.collaborators = team.filter((id) => item.collaborators.includes(id));
        item.resourceIds = [...new Set(item.resourceIds)].filter((id) => known.resources.has(id));
        if (item.venueId !== undefined && !known.venues.has(item.venueId)) delete item.venueId;
    }
    for (const item of datasets) item.projectIds = sources(tables.projectDataset, item.id);
    for (const item of domains) item.projectIds = sources(tables.projectDomain, item.id);
    for (const item of pillars) {
        item.projectIds = sources(tables.projectPillar, item.id);
        item.fundingIds = sources(tables.fundingPillar, item.id);
    }
    for (const item of schemes) {
        item.projectIds = sources(tables.projectFunding, item.id);
        item.pillarIds = targets(tables.fundingPillar, item.id);
        if (item.funder !== undefined && !known.organisations.has(item.funder)) delete item.funder;
    }
    for (const item of people) {
        item.projectIds = sources(tables.projectPerson, item.id);
        item.jointWorkIds = sources(tables.jointWorkPerson, item.id);
        item.affiliations = item.affiliations.filter((key) => known.organisations.has(key));
    }
    for (const item of organisations) {
        item.personIds = sources(tables.personOrganisation, item.id);
        item.fundingIds = sources(tables.fundingOrganisation, item.id);
    }
    return tables;
}
