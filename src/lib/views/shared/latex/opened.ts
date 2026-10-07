// Layer 3, shared view partial. The groups of a TeX view section the reader opened are a list of
// ids held by the section; one press adds the id when it is not there and takes it out when it is.

/** The list with `id` added when it is not in it and taken out when it is. */
export function toggled(list: readonly string[], id: string): string[] {
    return list.includes(id) ? list.filter((one) => one !== id) : [...list, id];
}
