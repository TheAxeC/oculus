// Layer 3, primitive. What a caller hands ui/forms/Prompt.svelte: what it asks, the fields it asks
// for, the words of its yes, and what the yes does with what was typed and picked, all already
// translated, and the one rule of whether the yes is on (`answered`). A field is a typed line, a
// pick of one of its choices, or a multi-pick of any number of them: the chosen ones as chips and
// a box that filters the rest (ui/forms/choice/MultiSelect.svelte), with no free text.

/** One choice of a pick or a multi-pick: its id, its words, and the group or hub it is under. */
type PromptChoice = { id: string; label: string; group?: string; hub?: string };

/**
 * One line a prompt asks for, already translated, and what it holds to begin with. A field with
 * no `choices` is a typed line, and a typed line marked `required` keeps the yes off while its
 * text, trimmed, is empty. A typed line with `split` is a list of the parts its text holds between
 * those separators, and marked `required` it keeps the yes off while no part, trimmed, holds text.
 * A field with `choices` is a pick from them instead, and `value` is the
 * id selected to begin with. `empty` gives such a pick an empty choice with those words, and a pick
 * marked `required` keeps the yes off while it holds the empty choice. A field with `choices` and
 * `picked` is a multi-pick of the choices, `picked` the ids picked to begin with, and a multi-pick
 * marked `required` keeps the yes off while it holds none.
 */
export type PromptField = {
    label: string;
    value: string;
    placeholder?: string;
    choices?: PromptChoice[];
    empty?: string;
    required?: boolean;
    picked?: string[];
    split?: string;
};

/** The words a multi-pick draws, already translated: MultiSelect.svelte's own words. */
export type PickWords = {
    search: string;
    remove: string;
    removeGlyph: string;
    none: string;
    more: (count: number) => string;
};

/**
 * One question with its fields; `act` is handed each field's text in the order given and each
 * field's picks (`picked[at]`, empty for a field that is no multi-pick). A request with a
 * multi-pick gives the words it draws (`pickWords`), since the prompt translates nothing.
 */
export type PromptRequest = {
    message: string;
    detail?: string;
    fields: PromptField[];
    verb: string;
    pickWords?: PickWords;
    act: (values: string[], picked: string[][]) => void;
};

/**
 * Whether the yes of a prompt is on for what its fields hold: off while a `required` typed line
 * holds only spaces, a `required` list (`split`) holds no part with text, a `required` pick holds
 * the empty choice or a `required` multi-pick holds no pick, on otherwise. A field not marked
 * `required` never keeps it off.
 */
export function answered(
    fields: readonly PromptField[],
    values: readonly string[],
    picked: readonly (readonly string[])[]
): boolean {
    return fields.every((field, at) => {
        if (field.required !== true) return true;
        if (field.picked !== undefined) return (picked[at] ?? []).length > 0;
        const value = values[at] ?? '';
        if (field.choices !== undefined) return value !== '';
        const parts = field.split === undefined ? [value] : value.split(field.split);
        return parts.some((part) => part.trim() !== '');
    });
}
