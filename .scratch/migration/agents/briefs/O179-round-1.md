# Repair round 1 of O179

Read `agents/reviews/O179-refuter.md` and close these findings. The brief `agents/briefs/O179.md` and `agents/spec.md` stay in force. Paths written: the files of the brief's "Paths this step writes".

1. **S1, a sentence wider than the code.** `src/lib/data/sources/config/catalog/options.ts:84-86` and `config/options/appearance.yml:11` claim the behaviour for every `list` control. It holds only for a list field of a record, drawn by a family card. Both sentences say that.
2. **S2, comment wrap.** `FieldControl.svelte:29` and `options.ts:90` end short: rewrap those paragraphs to 100 columns as `agents/spec.md:45` says.
3. **B1, the focus after Clear.** A press of Clear removes the button that holds the focus. After the press the focus moves to the Add of the same list, in `InlineItems.svelte`. Removing the last item is not changed.
4. **B2, the button's name.** The accessible name of Clear names its field, as the item buttons do: `list_clear: 'Clear {0}'` in `config/text/views/system/workbench.yml`, read with the field's `label` by `t('settings.list_clear', label)`.

Cases, by the program of the brief's "Cases" where it can render them: `value` `[]` shows `Clear` followed by the label given to the render; the five cases of the brief still hold. The focus move is read in the diff and shown at the look.

Run the brief's "Verify before you report" again, except that the known red of `tests/checks/source/keys.test.ts` over `audit.msg_site_differs*` is not this step's and is named as such. Do not touch `tests/data/hubs/hub-portfolio.test.ts`.

Append to `.scratch/migration/agents/reviews/O179-report.md` a section "Repair round 1": each finding with what changed, file and line, and the checks' output. Git: only status, diff and show.
