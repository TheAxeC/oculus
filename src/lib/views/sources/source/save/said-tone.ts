// Layer 3, view partial of Source.svelte. How a line under the editor is drawn: a refusal is an
// alert in the refusal colour, and a status (Submit's progress and success lines) is plain text
// announced politely. The caller says which, so no word is ever matched to tell them apart.

export type SaidTone = 'refusal' | 'status';
