// Layer 3, primitive. One row of ui/forms/choice/QuickPick.svelte, already worded: the id a pick
// hands out, the words drawn, whether a rule is drawn before the row, the glyph drawn before the
// words, and a description drawn dimmed after them, which the typed text is matched against as the
// words are, as VS Code's quick pick matches a row's description.

export type Choice = {
    id: string;
    label: string;
    rule?: true;
    glyph?: string;
    description?: string;
};
