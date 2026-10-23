// Layer 1, data. The rules of the integrity gate that a schema cannot state: ids that refer to each
// other across files, identities that must be unique, a status in its vocabulary and a project chip
// that is no stage word and no form. What a file's own `schema:` states (the keys, the types, the
// allowed values, the references and the conditions) is checked by schema/check.ts over the schemas
// schema/run.ts generates, and its findings are merged with these by `sortFindings`. Pure, so it
// can run anywhere: it reads no file, calls no clock, throws nothing, and repairs nothing. One
// problem is one Finding, and the list comes back sorted by file then key, so two runs over one
// tree agree.
//
// The findings the sources already reported (a manifest that does not parse, a registry file that
// is missing, an id that is not its folder name) are passed through untouched, never re-derived:
// this module never opens a file, so it cannot know those on its own.

import type {
    Finding,
    RawManifest,
    RawPortfolio,
    RegistryName,
    SelfCheck,
    ValidationRules,
    Vocabulary
} from '../model/index.ts';
import { domainColorOf } from '../model/index.ts';
import { z } from 'zod';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import {
    clusterFolder,
    itemsShape,
    mapShape,
    readAs,
    readOr,
    rowsShape,
    survivorsShape,
    textOrNumberOnlyShape,
    wordShape
} from '../shapes/shapes.ts';
import { REGISTRY_SHAPES } from '../helpers/hub-names.ts';
import { closestWord } from '../shapes/vocab-keys.ts';
import { isWords } from './schema/check.ts';
import { checkDatasetSources, checkResources } from './validate-kinds.ts';

/** A text, which an id of a relation field must be. */
const idShape = z.string();

/** The ids among a list's items, as the list itself when every item is one. */
const idsShape = survivorsShape(idShape);

/** The names of a schema written as a list of maps, every one with a `field` text. */
const fieldRowsShape = z
    .array(z.object({ field: z.string() }))
    .transform((rows) => rows.map((row) => row.field));

/**
 * The names of a schema written as a list: its texts and the `field` of its maps, in order. A list
 * of maps that all name a field is read by `fieldRowsShape`, the one a schema of the hub is.
 */
const listNamesShape = z.union([
    fieldRowsShape,
    rowsShape(z.union([z.object({ field: z.string() }).transform((row) => row.field), z.string()]))
]);

/**
 * The field names the schema holds, whatever shape the config gives it: a list of names, a list of
 * maps with a `field` key, a map with a `fields` map inside (what the hub's manifest-schema.yml
 * has), or a plain map of names. A schema that names nothing leaves every key unnamed, and every
 * key of every manifest is then a finding; there is no quiet path where the check does not run.
 */
export function fieldNames(schema: unknown): string[] {
    const list = readAs(listNamesShape, schema);
    if (list !== null) return list;
    const map = readAs(mapShape, schema);
    return map === null ? [] : Object.keys(readOr(mapShape, map.fields, map));
}

/**
 * `paths.cluster` names the folder on the cluster that holds the project's code, which Submit
 * copies to and runs from. A value the folder rule refuses (`clusterFolder`) is a finding, and
 * Submit refuses the project for it, so a mistyped folder is reported where it is written.
 */
function checkClusterFolder(
    manifest: RawManifest,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    const paths = readAs(mapShape, manifest.paths);
    if (paths === null || !Object.hasOwn(paths, 'cluster')) return;
    if (clusterFolder(paths.cluster) !== null) return;
    findings.push({
        file: manifest.file,
        key: 'paths.cluster',
        message: findingText(
            catalog,
            'findings.validate.bad_cluster',
            JSON.stringify(paths.cluster)
        )
    });
}

/**
 * The relation fields a manifest may not leave as a bare `key:`, and whether each holds a list or
 * one text. The generated schemas accept null on every field, which is what a bare key reads as.
 * They accept `waiting-on` written as one text while a source of its `from` was not read, since
 * the field is then held to no list of keys, so that case stays a check of its own: once both
 * sources read, the schema reports the one text itself and this check leaves it alone.
 */
const NOT_BARE: { field: string; list: boolean }[] = [
    { field: 'domain', list: false },
    { field: 'pillars', list: true },
    { field: 'datasets', list: true },
    { field: 'related', list: true },
    { field: 'lead', list: true },
    { field: 'collaborators', list: true },
    { field: 'waiting-on', list: true }
];

/** What a relation field must be, in the words of the type sentence. */
function mustBe(catalog: TextCatalog, list: boolean): string {
    if (list) return findingText(catalog, 'findings.schema.is_list');
    return findingText(catalog, 'findings.schema.is_text');
}

/**
 * A relation field is not a bare key, and `waiting-on` is a list when it is there. `listed` holds
 * the fields whose `from` sources were all read, which the schema holds to a list itself.
 */
function checkRelationShapes(
    manifest: RawManifest,
    listed: ReadonlySet<string>,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    for (const { field, list } of NOT_BARE) {
        const value = manifest[field];
        if (value === undefined) continue;
        const wrong =
            value === null ||
            (field === 'waiting-on' && !Array.isArray(value) && !listed.has(field));
        if (!wrong) continue;
        findings.push({
            file: manifest.file,
            key: field,
            message: findingText(
                catalog,
                'findings.schema.type',
                field,
                mustBe(catalog, list),
                isWords(catalog, value)
            )
        });
    }
}

/** A project's `related:` names other projects; naming itself draws a card that links to itself. */
function checkSelfRelated(manifest: RawManifest, catalog: TextCatalog, findings: Finding[]): void {
    if (manifest.related === undefined) return;
    for (const item of readOr(itemsShape, manifest.related, [])) {
        if (item !== manifest.id) continue;
        findings.push({
            file: manifest.file,
            key: 'related',
            message: findingText(catalog, 'findings.validate.related_itself', manifest.id)
        });
    }
}

/**
 * Every project folder has a name of its own. The folder name is the project's id, and a
 * repository's id is its root's key, so two manifests under folders of one name are one id: the
 * second card overwrites the first, and the sessions matcher, which finds a project by its folder
 * name, cannot tell the two apart.
 */
function checkFolderNames(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    const byName = new Map<string, RawManifest[]>();
    for (const manifest of raw.manifests) {
        const name =
            manifest.workspaceFolder?.root ??
            manifest.folder
                .split('/')
                .filter((part) => part !== '')
                .pop() ??
            '';
        if (name === '') continue;
        byName.set(name, [...(byName.get(name) ?? []), manifest]);
    }
    for (const [name, held] of byName) {
        if (held.length < 2) continue;
        for (const manifest of held) {
            findings.push({
                file: manifest.file,
                key: 'folder',
                message: findingText(catalog, 'findings.validate.folder_shared', held.length, name)
            });
        }
    }
}

/**
 * `waiting-on` names what a project waits for before it moves: a person of the people registry, or
 * another project by its id; the schema holds each value to those keys, as it does `related`. A
 * project that waits on itself would never move, so that is a finding of its own.
 */
function checkWaitingOn(manifest: RawManifest, catalog: TextCatalog, findings: Finding[]): void {
    if (manifest['waiting-on'] === undefined) return;
    for (const item of readOr(idsShape, manifest['waiting-on'], [])) {
        if (item !== manifest.id) continue;
        findings.push({
            file: manifest.file,
            key: 'waiting-on',
            message: findingText(catalog, 'findings.validate.waiting_on_itself', item)
        });
    }
}

/** The sentence of a status outside its list: the status as shown, and the closest word if any. */
type StatusSaid = (shown: string, closest: string | undefined) => string;

/**
 * The finding of each entry whose `status` is not a word of `words`, naming the closest word of the
 * list, or, for a list with no word, saying so, in the sentence `said` gives. An entry with no
 * status has nothing to check.
 */
function statusFindings(
    file: string,
    entries: Record<string, unknown>[],
    words: string[],
    said: StatusSaid
): Finding[] {
    return entries.flatMap((entry, index) => {
        const status = entry.status;
        if (status === undefined) return [];
        if (typeof status === 'string' && words.includes(status)) return [];
        const shown = JSON.stringify(status);
        const closest = closestWord(typeof status === 'string' ? status : shown, words);
        return [{ file, key: `entries[${index}].status`, message: said(shown, closest) }];
    });
}

/** A collection entry's `status`, when it has one, is a word of `statuses:` of the vocabulary. */
function checkEntryStatus(
    raw: RawPortfolio,
    statuses: string[],
    catalog: TextCatalog,
    findings: Finding[]
): void {
    const said: StatusSaid = (shown, closest) =>
        closest === undefined
            ? findingText(catalog, 'findings.validate.status_no_vocab', shown)
            : findingText(catalog, 'findings.validate.status_not_in_vocab', shown, closest);
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        findings.push(...statusFindings(collection.file, collection.entries, statuses, said));
    }
}

/**
 * The findings of the Position Leads file: a lead's `status`, when it has one, is a word of
 * `lead_statuses:` of the vocabulary, `words`. The feed reader calls it, since the leads file is no
 * collection of the raw portfolio.
 */
export function leadStatusFindings(
    file: string,
    entries: Record<string, unknown>[],
    words: string[],
    catalog: TextCatalog
): Finding[] {
    const said: StatusSaid = (shown, closest) =>
        closest === undefined
            ? findingText(catalog, 'findings.validate.lead_status_no_vocab', shown)
            : findingText(catalog, 'findings.validate.lead_status_not_in_vocab', shown, closest);
    return statusFindings(file, entries, words, said);
}

/** The chips of a manifest's `status.chips`, each with its place in the list. */
function manifestChips(manifest: RawManifest): [string, number][] {
    const status = readAs(mapShape, manifest.status);
    const chips = readOr(itemsShape, status?.chips, []);
    return chips.flatMap((chip, index): [string, number][] =>
        typeof chip === 'string' ? [[chip, index]] : []
    );
}

/**
 * A project chip is no stage word and no form: a word of `stages:` belongs in the manifest's
 * `stage:` and a word of `forms:` in its `form:`, and each such chip is one finding naming the
 * field. `withoutStageChips` keeps the schema from naming the same chip as a value outside the
 * chips.
 */
function checkStageChips(
    manifest: RawManifest,
    vocab: Vocabulary,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    for (const [chip, index] of manifestChips(manifest)) {
        const message = vocab.stages.includes(chip)
            ? findingText(catalog, 'findings.validate.chip_is_stage', chip)
            : vocab.forms.includes(chip)
              ? findingText(catalog, 'findings.validate.chip_is_form', chip)
              : null;
        if (message === null) continue;
        findings.push({ file: manifest.file, key: `status.chips[${index}]`, message });
    }
}

/**
 * The schema's findings with those on a chip that is a stage word or a form left out, since
 * `checkStageChips` gives that chip its one finding.
 */
export function withoutStageChips(
    schema: Finding[],
    raw: RawPortfolio,
    vocab: Vocabulary
): Finding[] {
    const taken = new Set(
        raw.manifests.flatMap((manifest) =>
            manifestChips(manifest)
                .filter(([chip]) => vocab.stages.includes(chip) || vocab.forms.includes(chip))
                .map(([, index]) => `${manifest.file}\nstatus.chips[${index}]`)
        )
    );
    return schema.filter((finding) => !taken.has(`${finding.file}\n${finding.key}`));
}

/** The field a file's entries are addressed by: its schema's first field, `title` without one. */
export function identityFieldOf(schema: unknown): string {
    const names = fieldNames(schema);
    return names.length > 0 ? names[0] : 'title';
}

/**
 * The identity findings of one file's entries. The identity field is the schema's first, `title`
 * where the file has no schema, and it is what a write addresses an entry by: an entry with no
 * value there can be addressed by nothing, and with two of one value an edit reaches the first and
 * the second can be neither edited nor removed. Each entry gives at most one finding:
 * `identity_empty` for an empty value (two empty values are not a shared one), `identity_shared`
 * for a value another entry also holds. Closed entries are checked like the rest, so a caller
 * passes every entry of the file.
 */
export function identityFindings(
    file: string,
    ident: string,
    entries: readonly Record<string, unknown>[],
    catalog: TextCatalog
): Finding[] {
    const values = entries.map((entry) => readAs(textOrNumberOnlyShape, entry[ident]));
    const counts = new Map<string, number>();
    for (const value of values) {
        if (value !== null && value !== '') counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const findings: Finding[] = [];
    values.forEach((value, index) => {
        const key = `entries[${index}].${ident}`;
        if (value === null || value === '') {
            const message = findingText(catalog, 'findings.validate.identity_empty', ident);
            findings.push({ file, key, message });
            return;
        }
        if ((counts.get(value) ?? 0) < 2) return;
        const message = findingText(catalog, 'findings.validate.identity_shared', ident, value);
        findings.push({ file, key, message });
    });
    return findings;
}

/**
 * The identity findings of every collection. A collection that is a registry whose schema opens
 * with the registry's own id field is left to the schema's duplicate-key rule (schema/lists.ts) and
 * to the registry reader's missing-id finding; venues open with `name`, so their write identity is
 * checked here.
 */
function checkEntryIdentity(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    const idFields = new Map(
        (Object.keys(REGISTRY_SHAPES) as RegistryName[]).flatMap((name) =>
            raw.registries[name].entries.map((one) => [one.file, REGISTRY_SHAPES[name].idField])
        )
    );
    for (const key of Object.keys(raw.collections).sort()) {
        const collection = raw.collections[key];
        const ident = identityFieldOf(collection.meta.schema);
        if (idFields.get(collection.file) === ident) continue;
        findings.push(...identityFindings(collection.file, ident, collection.entries, catalog));
    }
}

/**
 * The workspace setting `self` names a person of the people registry, which is how the hub knows
 * which person is the user: a key no entry carries marks nobody, and is one finding on the people
 * file. An empty setting is no finding, and a people file that did not read gives none, since its
 * own finding names the cause.
 */
function checkSelf(
    raw: RawPortfolio,
    self: SelfCheck | undefined,
    catalog: TextCatalog,
    findings: Finding[]
): void {
    if (self === undefined || self.key === '' || !self.read) return;
    if (raw.registries.people.entries.some((entry) => entry.key === self.key)) return;
    findings.push({
        file: self.file,
        key: 'entries',
        message: findingText(catalog, 'findings.validate.self_unknown', self.key)
    });
}

/** The two texts of a funding entry the acknowledgment check reads, the empty text when wrong. */
const fundingRowShape = z.object({ status: wordShape, title: wordShape });

/**
 * A funding entry whose status carries `acknowledged` (awarded or contributing) is one a manuscript
 * acknowledges, so it needs a `statement` the manuscript pastes. An application gets one when it is
 * granted; until then none is asked for. The status is compared as written.
 */
function checkFundingStatements(
    raw: RawPortfolio,
    acknowledged: readonly string[],
    catalog: TextCatalog,
    findings: Finding[]
): void {
    raw.registries.funding.entries.forEach((entry, index) => {
        const { status, title } = readOr(fundingRowShape, entry, { status: '', title: '' });
        if (!acknowledged.includes(status)) return;
        const name = entry.key.length > 0 ? entry.key : title;
        const statement = entry.statement;
        if (typeof statement !== 'string' || statement.trim().length === 0) {
            findings.push({
                file: entry.file,
                key: `entries[${index}]`,
                message: findingText(
                    catalog,
                    'findings.validate.funding_no_statement',
                    name,
                    status
                )
            });
        }
    });
}

/** By file then key, and by nothing else: the sort is stable, so equal pairs keep their order. */
export function sortFindings(findings: Finding[]): Finding[] {
    return findings.sort((a, b) => {
        if (a.file !== b.file) return a.file < b.file ? -1 : 1;
        if (a.key !== b.key) return a.key < b.key ? -1 : 1;
        return 0;
    });
}

/** A domain whose `color` is there and not written `#rrggbb` is one finding, on the entry. */
function checkDomainColors(raw: RawPortfolio, catalog: TextCatalog, findings: Finding[]): void {
    raw.registries.domains.entries.forEach((entry, index) => {
        if (entry.color === undefined || entry.color === null) return;
        if (domainColorOf(entry) !== undefined) return;
        findings.push({
            file: entry.file,
            key: `entries[${index}].color`,
            message: findingText(
                catalog,
                'findings.validate.domain_color',
                entry.key,
                typeof entry.color === 'string' ? entry.color : JSON.stringify(entry.color)
            )
        });
    });
}

/**
 * Every problem in one raw portfolio, the sources' own findings among them, sorted by file then
 * key. Nothing is thrown and nothing is repaired: a caller decides what a finding means, and the
 * snapshot carries the list so the app can show it.
 */
export function validate(raw: RawPortfolio, rules: ValidationRules): Finding[] {
    const findings: Finding[] = [...raw.findings];
    const catalog = rules.text;
    const listed = rules.listed ?? new Set<string>();

    for (const manifest of raw.manifests) {
        checkRelationShapes(manifest, listed, catalog, findings);
        checkSelfRelated(manifest, catalog, findings);
        checkClusterFolder(manifest, catalog, findings);
        checkWaitingOn(manifest, catalog, findings);
        checkStageChips(manifest, rules.vocab, catalog, findings);
    }
    checkFolderNames(raw, catalog, findings);
    checkSelf(raw, rules.self, catalog, findings);
    checkResources(raw, catalog, findings);
    checkDatasetSources(raw, catalog, findings);
    checkFundingStatements(raw, rules.vocab.acknowledged, catalog, findings);
    checkEntryStatus(raw, rules.vocab.statuses, catalog, findings);
    checkEntryIdentity(raw, catalog, findings);
    checkDomainColors(raw, catalog, findings);

    return sortFindings(findings);
}
