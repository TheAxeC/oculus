// Layer 3, primitive. What a caller hands ui/forms/Prompt.svelte: what it asks, the fields it asks
// for, the words of its yes, and what the yes does with what was typed, all already translated.

/**
 * One line a prompt asks for, already translated, and what it holds to begin with. A field with
 * `choices` is a pick from them instead of a typed line, and `value` is the id selected to begin
 * with. `empty` gives such a pick an empty choice with those words, and a pick the prompt
 * `required` keeps the yes off while it holds the empty choice.
 */
export type PromptField = {
    label: string;
    value: string;
    placeholder?: string;
    choices?: { id: string; label: string }[];
    empty?: string;
    required?: boolean;
};

/** One question with its fields; `act` is handed each field's text in the order given. */
export type PromptRequest = {
    message: string;
    detail?: string;
    fields: PromptField[];
    verb: string;
    act: (values: string[]) => void;
};
