// Layer 2, client state. The board facade owns the stable public import surface while sibling
// modules keep their implementation constants private to the folder.

export {
    BOARDS,
    DEADLINE_SOON,
    FACETS,
    NONE,
    SESSIONS_LIVE,
    SESSIONS_NONE,
    SESSIONS_RECENT,
    authorLine,
    bucketOf,
    daysUntil,
    firstSentence,
    presetFor,
    slug,
    venueText
} from './presets.ts';
export type {
    BoardColumn,
    BoardItem,
    BoardMode,
    BoardPreset,
    BoardState,
    BoardStats,
    BoardTag,
    Facet,
    FacetValue,
    LabelMode,
    QuickFilters,
    RollupBucket,
    SessionsOf,
    TypeCount,
    VenueCount
} from './presets.ts';
export {
    absentDocs,
    boardItemFor,
    boardItems,
    hasReadme,
    markdownDocNames,
    newestDocDate
} from './items.ts';
export { facetValues, facets } from './facets.ts';
export {
    facetHeading,
    filterGroups,
    filterLabel,
    filtersInForce,
    valueLabel
} from './filter-menu.ts';
export type { FilterChoice, FilterGroup } from './filter-menu.ts';
export { disseminated, humanSize, stats, typeCounts, waitingLine } from './stats.ts';
export type { Dissemination, WaitingLine } from './stats.ts';
export { STALE_LAG, applyFilters, emptyBoardState, isStale, parseBoardState } from './state.ts';
