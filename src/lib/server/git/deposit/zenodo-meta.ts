// Layer 2, server. The creators and the funding a Publish to Zenodo names, from the project's own
// hub: its people file, organisations file and funding file, read as the snapshot reads them
// (data/sources/registries.ts). The creators are the manifest's `lead`, `collaborators` and
// `supervisors` in that order, each person once, as personal creators in InvenioRDM's metadata
// shape: `family_name` from the person's `family`, `given_name` the part of `name` before it, the
// ORCID as an identifier, the affiliations by the names of their organisations. The funding is one
// row per key of the manifest's `funding:`, the funder by its organisation's name and, when the
// scheme has an `award`, the award by the scheme's `title` and that number.
//
// A person who is no key of the people file, a person with no `family`, a `name` that does not end
// with its `family`, a funding key with no entry, and an entry with no `funder` or one whose funder
// is no organisation each refuse the press, naming the key, before any request is sent.

import { scalar, strings } from '../../../data/helpers/guards.ts';
import type { RawRegistryEntry } from '../../../data/model/index.ts';
import { readRegistries, registryKeys } from '../../../data/sources/registries.ts';
import type { PrimaryTarget } from '../../edit/writes.ts';
import { words } from '../../core/words.ts';

/** One creator of a record, as InvenioRDM's metadata takes it. */
export type Creator = {
    person_or_org:
        | {
              type: 'personal';
              given_name?: string;
              family_name: string;
              identifiers?: { scheme: 'orcid'; identifier: string }[];
          }
        | { type: 'organizational'; name: string };
    affiliations?: { name: string }[];
};

/** One funding row of a record: the funder by name, and the award by its title and number. */
export type FundingRow = {
    funder: { name: string };
    award?: { title: { en: string }; number: string };
};

/** What a Publish credits, or the refusal of the first key that cannot be credited. */
export type Credits = { creators: Creator[]; funding: FundingRow[] } | { error: string };

/** The entries of one registry of the hub, by key. */
type Keyed = Map<string, RawRegistryEntry>;

/** The text of an entry's field, trimmed, the empty text for one that holds none. */
function field(entry: RawRegistryEntry, name: string): string {
    return scalar(entry[name]).trim();
}

/** The creators and funding of a manifest, read from the files of the hub `into` names. */
export function creditsOf(
    manifest: Record<string, unknown>,
    into: PrimaryTarget,
    text: Record<string, string>
): Credits {
    const read = readRegistries(
        into.hub,
        into.config.registries,
        into.config.text,
        [],
        registryKeys(into.config.collections)
    );
    const byKey = (entries: RawRegistryEntry[]): Keyed =>
        new Map(entries.map((one) => [one.key, one]));
    const people = byKey(read.people.entries);
    const organisations = byKey(read.organisations.entries);
    const schemes = byKey(read.funding.entries);
    const team = [
        ...new Set([
            ...strings(manifest.lead),
            ...strings(manifest.collaborators),
            ...strings(manifest.supervisors)
        ])
    ];
    const creators: Creator[] = [];
    for (const key of team) {
        const made = creatorOf(key, people, organisations, text);
        if ('error' in made) return made;
        creators.push(made);
    }
    const funding: FundingRow[] = [];
    for (const key of strings(manifest.funding)) {
        const made = fundingOf(key, schemes, organisations, text);
        if ('error' in made) return made;
        funding.push(made);
    }
    return { creators, funding };
}

/** One person of the team as a personal creator, or the refusal naming the key. */
function creatorOf(
    key: string,
    people: Keyed,
    organisations: Keyed,
    text: Record<string, string>
): Creator | { error: string } {
    const person = people.get(key);
    if (person === undefined) return { error: words(text, 'server.zenodo.person_unknown', key) };
    const family = field(person, 'family');
    if (family === '') return { error: words(text, 'server.zenodo.person_no_family', key) };
    const name = field(person, 'name');
    if (!name.endsWith(family)) return { error: words(text, 'server.zenodo.person_name', key) };
    const orcid = field(person, 'orcid');
    const given = name.slice(0, name.length - family.length).trim();
    const affiliations = strings(person.affiliations)
        .map((one) => organisations.get(one))
        .filter((one) => one !== undefined)
        .map((one) => ({ name: field(one, 'name') }))
        .filter((one) => one.name !== '');
    return {
        person_or_org: {
            type: 'personal',
            ...(given === '' ? {} : { given_name: given }),
            family_name: family,
            ...(orcid === '' ? {} : { identifiers: [{ scheme: 'orcid', identifier: orcid }] })
        },
        ...(affiliations.length === 0 ? {} : { affiliations })
    };
}

/** One funding key as a funding row, or the refusal naming the key. */
function fundingOf(
    key: string,
    schemes: Keyed,
    organisations: Keyed,
    text: Record<string, string>
): FundingRow | { error: string } {
    const scheme = schemes.get(key);
    if (scheme === undefined) return { error: words(text, 'server.zenodo.funding_unknown', key) };
    const funder = field(scheme, 'funder');
    if (funder === '') return { error: words(text, 'server.zenodo.funding_no_funder', key) };
    const organisation = organisations.get(funder);
    if (organisation === undefined) {
        return { error: words(text, 'server.zenodo.funder_unknown', key) };
    }
    const award = field(scheme, 'award');
    return {
        funder: { name: field(organisation, 'name') },
        ...(award === '' ? {} : { award: { title: { en: field(scheme, 'title') }, number: award } })
    };
}
