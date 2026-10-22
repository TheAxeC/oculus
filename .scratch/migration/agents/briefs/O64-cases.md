# O64, cases ruling (round 0)

The builder handed back C8, and with it item 4's line in C9 to C11: a line drawn through `TreeItem`'s `words` snippet sits inside the row's `<button class="main" aria-label={name ?? label}>` (`TreeItem.svelte:211-233`), whose children are presentational, so the line's `role="progressbar"` and its name are not exposed, while item 4 says the line keeps its words as its accessible name.

## Ruling

Option (a). The line stays inside the name's box, drawn through the `words` snippet, as item 4 and decision 7 say; the words reach a screen reader through the row's own accessible name.

1. While an action with words of its own runs on a repository, `RepoList.svelte` hands that row's `TreeItem` its existing `name` prop: the repository's name and the running words, joined by a new key `repositories.row_running: "{0}, {1}"` in `config/text/views/sources/repositories.yml`, placed beside the other `list_` keys of its group. With no action running the row's name is what it is today.
2. `TreeSection.svelte` gains an optional `name` prop handed to its head's `TreeItem`, beside the `words` snippet of decision 7. While the section is folded and an action runs, the head's name is the section's name and the running words through the same key.
3. The `Progress` inside the button keeps `percent={null}` and its label, which costs nothing and is read if a browser exposes it; the brief's sentence "its words as its accessible name" is met by the row's name.
4. C8, C9, C10 and C11 read: the row (or the folded head) whose action runs has the accessible name "<name>, <words>", for example "oculus, Writing the commit message..."; in C11 that is the repository that is not selected.
5. "Paths this step writes" gains `config/text/views/sources/repositories.yml`.

## The status bar's sync item

The builder's reading found that `running(roots)` (`repositories.svelte.ts:274-281`) returns the first root's action that has words, so once `suggest` has words a suggestion on one root of a repository hides a sync running on another root of it from the status bar's sync item (`RepoItems.svelte:122-125`). The step makes this reachable, so it is fixed in the step: the sync item looks for a running action among `SYNC_ACTIONS` over every root of the repository, not at the first running action. The shape of the read (a filter argument to `running`, or the item walking the roots itself) is the builder's, with one rule kept once. "Paths this step writes" gains `src/lib/shell/status/RepoItems.svelte`. A case is added:

- C23. A suggestion runs on one root of a repository while a fetch runs on another root of it (a worktree): the status bar's sync item turns for the fetch.

## Not changed

The terminal palette with icons off draws no glyph, so nothing turns there, as for the Usage Refresh today; `Glyph.svelte` is outside the step. The report names it under the host- or user-visible changes.
