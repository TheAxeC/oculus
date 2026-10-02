// Layer 1, data. The registries whose entries carry a `kind:` word, against the words the entity is
// defined over: organisations (five words) and resources (three words, a key that is not a reserved
// word, and a key no earlier entry has). Normalise keeps the resources with none of the three
// faults and this check reports the rest, so the two agree on which keys exist. It has its own
// module so that validate.ts stays within the file size limit; like validate it is pure and repairs
// nothing.

import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Finding, RawPortfolio } from '../model/index.ts';
import { resourceFaults } from './normalise.ts';

/**
 * What an organisation's `kind:` may say. It is a fixed list rather than a configured vocabulary
 * because it is what the entity means rather than how it is drawn, and nothing in
 * config/catalogs/vocab.yml names it.
 */
const ORGANISATION_KINDS = ['university', 'hospital', 'funder', 'company', 'other'];

/** An organisation's `kind:` is one of the five words the entity is defined over. */
export function checkOrganisations(
    raw: RawPortfolio,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    raw.registries.organisations.entries.forEach((entry, index) => {
        const kind = entry.kind;
        if (kind === undefined) return;
        if (typeof kind === 'string' && ORGANISATION_KINDS.includes(kind)) return;
        findings.push({
            file: entry.file,
            key: `entries[${index}].kind`,
            message: findingText(
                catalog,
                'findings.validate.kind_not_organisation',
                JSON.stringify(kind)
            )
        });
    });
}

/**
 * A resource's `kind:` is one of the three words, its key is not a reserved word, and no earlier
 * entry has the key. Normalise leaves out an entry with any of the three, and a manifest naming its
 * key then has a finding of its own.
 */
export function checkResources(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    const entries = raw.registries.resources.entries;
    resourceFaults(entries).forEach((faults, index) => {
        const entry = entries[index];
        const at = (field: string): string => `entries[${index}].${field}`;
        for (const fault of faults) {
            const key = fault === 'kind' ? at('kind') : at('key');
            const message =
                fault === 'kind'
                    ? findingText(
                          catalog,
                          'findings.validate.kind_not_resource',
                          JSON.stringify(entry.kind ?? null)
                      )
                    : fault === 'reserved'
                      ? findingText(catalog, 'findings.validate.resource_reserved', entry.key)
                      : findingText(catalog, 'findings.validate.resource_duplicate', entry.key);
            findings.push({ file: entry.file, key, message });
        }
    });
}
