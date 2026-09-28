// Layer 4, test data. The absences a test file asserts with no reason beside them, each keyed on
// the literals its assertion names, or its own text where it names none.
//
// Every file under tests/views carries a reason above each absence, so the list is empty. An entry
// stands for one absence, so explaining one does not buy a new one, and a brand-new absence has no
// entry to stand under. An absence naming no literal long enough to key on stands under its own
// text, so two of them are told apart. An entry goes when its absence gains its reason, and the
// check says so.

export const NEGATIVES: Record<string, string[]> = {};
