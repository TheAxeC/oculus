// Layer 2, client state, pure. The one rule every list of picked or hidden words turns a press
// over by: the Focus filter's checklists, the theme toggles of the Data and Venues views, the
// session list's filter, the closed groups of the settings contents and the opened groups of a TeX
// view section.

/** A list with one entry taken out when it holds it and put in when it does not. */
export function toggled<T>(list: readonly T[], one: T): T[] {
    return list.includes(one) ? list.filter((item) => item !== one) : [...list, one];
}
