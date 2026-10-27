// Layer 2, client state. The board facade owns the stable public import surface while sibling
// modules keep their implementation constants private to the folder.

export {
    AWAITING_VIEW,
    awaitingPreset,
    DEADLINE_SOON,
    boardIds,
    boardViews,
    boardsSource,
    FACETS,
    NONE,
    SESSIONS_LIVE,
    SESSIONS_NONE,
    SESSIONS_RECENT,
    daysUntil,
    firstSentence,
    mapPreset,
    presetFor,
    RECORD_VIEW,
    recordPreset,
    setting,
    shortWords,
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
    BoardView,
    BoardViews,
    BoardsSource,
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
export { cardSections, facets, sliceGroups } from './facets.ts';
export type { Slice, SliceGroup } from './facets.ts';
export {
    LINE_FACETS,
    blockedBadge,
    deadlineWords,
    facetHeading,
    filterGroups,
    groupWords,
    listCells,
    moreWords,
    pickCell,
    shownWords,
    sliceChoices,
    valueLabel,
    venueWarning,
    waitingWords
} from './filter-menu.ts';
export type { FilterChoice, FilterGroup } from './filter-menu.ts';
export { VENUE_WARN, disseminated, humanSize, stats } from './stats.ts';
export type { Dissemination } from './stats.ts';
export {
    STALE_LAG,
    appliedFilters,
    applyFilters,
    emptyBoardState,
    facetValues,
    isStale,
    offersMine,
    parseBoardState,
    withPick,
    withPicks
} from './state.ts';
export { newProjectTier } from './new-project.ts';
