// Layer 3, primitive. One row of ui/forms/choice/QuickPick.svelte, already
// worded: the id a pick hands out, the words drawn, and whether a rule is drawn before the row.

export type Choice = { id: string; label: string; rule?: true };
