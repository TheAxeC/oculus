// Layer 3, primitive helper. The hues a drawing cycles through when it tells several things apart
// by colour alone: the lanes of a repository graph, the accounts of the calendar. Each is a tone
// every theme defines as `--c-<hue>`, `--on-c-<hue>` and `--c-<hue>-txt`, so a caller builds its
// colour from the name and no colour is written here.
//
// One list, so two drawings that colour things apart start from the same hue and walk them in the
// same order.

/** The hues, in the order a drawing hands them out. */
export const HUES: readonly string[] = ['blue', 'green', 'amber', 'violet', 'red', 'teal'];
