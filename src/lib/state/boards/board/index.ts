// Layer 2, client state. The board facade owns the stable public import surface while sibling
// modules keep their implementation constants private to the folder.

export {
    DEADLINE_SOON,
    boardIds,
    FACETS,
    NONE,
    SESSIONS_LIVE,
    SESSIONS_NONE,
    SESSIONS_RECENT,
    daysUntil,
    firstSentence,
    presetFor,
    setting,
    venueText
} from './presets.ts';
export type {
    BoardColumn,
    BoardItem,
    LinkedItem,
    BoardMode,
    BoardPreset,
    BoardState,
    BoardStats,
    BoardTag,
    Facet,
    FacetValue,
    LabelMode,
    QuickFilters,
    SessionsOf,
    StageCount,
    VenueCount
} from './presets.ts';
export {
    absentDocs,
    boardItemFor,
    boardItems,
    markdownDocNames,
    newestDocDate,
    takeContextOf
} from './items.ts';
export { cardSections, facetValues, facets } from './facets.ts';
export {
    facetHeading,
    filterGroups,
    filterLabel,
    filtersInForce,
    valueLabel
} from './filter-menu.ts';
export type { FilterChoice, FilterGroup } from './filter-menu.ts';
export { VENUE_WARN, disseminated, humanSize, stageCounts, stats, waitingLine } from './stats.ts';
export type { Dissemination, WaitingLine } from './stats.ts';
export { STALE_LAG, applyFilters, emptyBoardState, isStale, parseBoardState } from './state.ts';
export { entryRoles } from '../../../data/shapes/boards/roles.ts';
