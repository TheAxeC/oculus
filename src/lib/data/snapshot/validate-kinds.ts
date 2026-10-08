// Layer 1, data. The keys of the resources registry: a key that is not a reserved word. Normalise
// keeps the resources with no fault and this check reports the reserved keys, so the two agree on
// which keys exist. The faults normalise drops an entry for, a `kind:` outside cluster, machine and
// storage and a key an earlier entry has, are the schema's findings: `kind` is a select with those
// options, and a duplicated key is the schema run's. Like validate it is pure and repairs nothing.

import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Finding, RawPortfolio } from '../model/index.ts';
import { resourceFaults } from './normalise.ts';

/**
 * A resource's key is not a reserved word. Normalise leaves out an entry with a reserved key, and a
 * manifest naming its key then has a finding of its own.
 */
export function checkResources(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    const entries = raw.registries.resources.entries;
    resourceFaults(entries).forEach((faults, index) => {
        if (!faults.includes('reserved')) return;
        findings.push({
            file: entries[index].file,
            key: `entries[${index}].key`,
            message: findingText(catalog, 'findings.validate.resource_reserved', entries[index].key)
        });
    });
}
