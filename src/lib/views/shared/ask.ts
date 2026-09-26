// Layer 3, shared view partial. What a view hands views/shared/AskConfirm.svelte before a write:
// the question, the line under it, and what a yes does.

/** One question a view asks before a write, already translated, and what the yes runs. */
export type Ask = { message: string; detail: string; act: () => void };
