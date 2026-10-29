// Layer 3, view support. The sentences of the Literature search that depend on a value: what a
// source's chip says of its state, what a refusal of the route is said as, where a copied entry
// came from, and the labels of the fixed lists. Every catalog key is a literal, as every read of
// the catalog in the tree is, so the key check can see it.

import type { EntrySource } from '$lib/state/feeds/literature/bibtex';
import type {
    DocType,
    HitType,
    LiteratureRefusal,
    LiteratureSort,
    LiteratureSource,
    SourceInfo
} from '$lib/state/feeds/literature/form';
import type { SourceRun } from '$lib/state/feeds/literature/run.svelte';
import { t } from '$lib/state/shared/words/text';

/** A source's name: the `name` of its row as the server lists it, else its key. */
export function sourceName(sources: readonly SourceInfo[], source: LiteratureSource): string {
    return sources.find((one) => one.id === source)?.name ?? source;
}

/** The tooltip of a source the machine cannot ask: the `downloads` row it needs and its help. */
export function keyTip(source: SourceInfo): string | undefined {
    if (source.available) return undefined;
    return t('literature.key_tip', source.key ?? '', source.help ?? '').trim();
}

/** A wait of the source's, in the largest unit that keeps it a small number. */
function waitWords(seconds: number): string {
    if (seconds < 90) return t('literature.wait_s', seconds);
    if (seconds < 5400) return t('literature.wait_min', Math.ceil(seconds / 60));
    return t('literature.wait_h', Math.ceil(seconds / 3600));
}

/** What a source's chip says: its count while it answers, otherwise why it does not. */
export function stateWords(held: SourceRun | undefined, timeoutS: number | null): string {
    if (held === undefined) return '';
    if (held.asking && held.hits.length === 0) return t('literature.state_asking');
    const status = held.status === undefined ? '' : String(held.status);
    switch (held.state) {
        case null:
            return '';
        case 'ok':
            return held.cached
                ? t('literature.state_ok_cached', held.hits.length)
                : t('literature.state_ok', held.hits.length);
        case 'limited':
            if (held.wait === undefined) return t('literature.state_limited');
            return t('literature.state_limited_wait', waitWords(held.wait));
        case 'timeout':
            return timeoutS === null
                ? t('literature.state_timeout_plain')
                : t('literature.state_timeout', timeoutS);
        case 'refused':
            return t('literature.state_refused', status);
        case 'failed':
            return status === ''
                ? t('literature.state_failed_plain')
                : t('literature.state_failed', status);
        case 'no-key':
            return t('literature.state_no_key');
        case 'skipped':
            return t('literature.state_skipped');
    }
}

/** What a refusal of the route, or of the page before it asks, is said as. */
export function refusalWords(word: LiteratureRefusal): string {
    if (word === 'token') return t('literature.refused_token');
    if (word === 'query_empty') return t('literature.refused_query_empty');
    if (word === 'query_long') return t('literature.refused_query_long');
    if (word === 'source') return t('literature.refused_source');
    if (word === 'year') return t('literature.refused_year');
    if (word === 'cites') return t('literature.refused_cites');
    if (word === 'type') return t('literature.refused_type');
    if (word === 'oa') return t('literature.refused_oa');
    if (word === 'venue_long') return t('literature.refused_venue_long');
    if (word === 'author_long') return t('literature.refused_author_long');
    if (word === 'page') return t('literature.refused_page');
    if (word === 'doi') return t('literature.refused_doi');
    return t('literature.refused_id');
}

/** The label of a document type, of the filter or of a card. */
export function typeWords(type: DocType | HitType): string {
    if (type === 'any') return t('literature.type_any');
    if (type === 'article') return t('literature.type_article');
    if (type === 'review') return t('literature.type_review');
    if (type === 'preprint') return t('literature.type_preprint');
    if (type === 'conference') return t('literature.type_conference');
    if (type === 'book') return t('literature.type_book');
    if (type === 'chapter') return t('literature.type_chapter');
    return t('literature.type_other');
}

/** The label of a sort order. */
export function sortWords(sort: LiteratureSort): string {
    if (sort === 'relevance') return t('literature.sort_relevance');
    if (sort === 'date') return t('literature.sort_date');
    return t('literature.sort_citations');
}

/** Where a copied entry came from: the DOI link, a source by its name, or citation-js. */
export function copiedWords(entry: EntrySource): string {
    if (entry.from === 'doi') return t('literature.copied_doi');
    if (entry.from === 'citation_js') return t('literature.copied_citation_js');
    return t('literature.copied_from', entry.name ?? entry.from);
}
