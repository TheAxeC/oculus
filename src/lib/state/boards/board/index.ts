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
export { cardSections, facets } from './facets.ts';
export {
    facetHeading,
    filterChips,
    filterGroups,
    filterLabel,
    filtersInForce,
    valueLabel
} from './filter-menu.ts';
export type { FilterChoice, FilterGroup, InForceChip } from './filter-menu.ts';
export { VENUE_WARN, disseminated, humanSize, stats, waitingLine } from './stats.ts';
export type { Dissemination, WaitingLine } from './stats.ts';
export {
    STALE_LAG,
    applyFilters,
    emptyBoardState,
    facetValues,
    isStale,
    offersMine,
    parseBoardState
} from './state.ts';
export { entryRoles } from '../../../data/shapes/boards/roles.ts';
