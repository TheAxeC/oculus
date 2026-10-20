// Layer 1, data. The faults normalise drops a registry row for and the schema check cannot state.
// The keys of the resources registry: a key that is not a reserved word. Normalise keeps the
// resources with no fault and this check reports the reserved keys, so the two agree on which keys
// exist. The faults normalise drops an entry for, a `kind:` outside cluster, machine and storage
// and a key an earlier entry has, are the schema's findings: `kind` is a select with those options,
// and a duplicated key is the schema run's. The sources of the datasets registry: a source the
// registry read leaves out (`leftOutSources` of normalise-parts/retrieval.ts, the read normalise
// uses) is one finding, since a set holding one is no set Recover runs and the schema check states
// neither the form of an archive's folder nor a field that holds only beside another. Like validate
// it is pure and repairs nothing.

import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Finding, RawPortfolio } from '../model/index.ts';
import { resourceFaults } from './normalise.ts';
import { leftOutSources } from './normalise-parts/retrieval.ts';

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

/**
 * Each source of a dataset fits its kind. A source that does not is left out of the dataset's
 * `retrieval` and the set is not one Recover runs, so each is a finding on its row, naming the
 * dataset, the source's place in the list (counted from 1) and its kind. An entry with no key has
 * none, since the reader reports it and normalise drops it.
 */
export function checkDatasetSources(
    raw: RawPortfolio,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    raw.registries.datasets.entries.forEach((entry, index) => {
        if (entry.key.length === 0) return;
        for (const { at, kind } of leftOutSources(entry.retrieval)) {
            findings.push({
                file: entry.file,
                key: `entries[${index}].retrieval[${at}]`,
                message: findingText(
                    catalog,
                    'findings.validate.source_left_out',
                    entry.key,
                    at + 1,
                    kind
                )
            });
        }
    });
}
