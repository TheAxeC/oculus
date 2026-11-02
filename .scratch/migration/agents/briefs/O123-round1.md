# O123, repair round 1

The review is `agents/reviews/O123-refuter.md`. Each item below is one of its findings with its ruling. All are inside the step's part, and the write list is the brief's with these paths included. Every finding below that names a page's behaviour is by reading; the look at landing presses each.

1. **B1, rename on a double press.** `SessionWorkspace.svelte:142`: the handler given to `onpressagain` takes the event and calls `event.preventDefault()` before `onrename`, so the browser's default for that mousedown does not take the focus from the field `NameField` focuses. `TreeItem.svelte` stays as it is.

2. **B4, the rename field.** The field holds what the reader typed in a state of its own, as the base's `typed` did, so a title arriving on the channel does not replace the words. Escape closes the field wherever the focus is, as the base's document-level effect did. Copy that effect's rule from `git show 3e2595261:` of the file that held it.

3. **B2, a second Tab stop.** The `.fold` box takes `tabindex="-1"`, as `Code.svelte:57` has on its `pre`, so a scroller past ten rows is no Tab stop.

4. **B3, `composerTab`'s reach.** Reaching a tab that holds a draft is for New alone, since ruling 4 of `O123-cases.md` names New. `composeAt` for a place and for a task keeps the base's behaviour: it never takes a reading tab, and never ends a reading. For New, a page tab holding a typed `draft` comes first, ahead of any other Terminal tab, so the draft is never left hidden. State the final behaviour in the report's before and after.

5. **ST1, false comments.** `opening.ts:10`, `opening.ts:155`, `landing.ts:3`, `landing.ts:21` say what is true after ruling 5: an opened view is one with `opened: true` or no catalogue group. Say it in the words the code reads; `landing.ts` is added to the write list.

6. **ST2.** `session-list.ts:1-3`: remove the claim that the file is unit-tested, and say why the builders live here on terms that are true. Add no test.

7. **ST3.** `docs/HELP.md`, section Workbenches, second bullet: both sentences say what is true after the change, naming the Sessions list's press in the bottom Terminal tab and the Sessions tab's sections that follow the picked session.

8. **ST5, the report.** Add the list the rule on changing a name asks for: each renamed or reworded thing with the sentences found by grep, marked still true or rewritten. Quote the grep run before writing each of `withDraft`, `keptOf`, `composerTab`, `pressTarget`, `moveToNewTab`, `listRows`, `groupRow`.

9. **S1 and ST4, the record.** The `sed -i` on `docs/HELP.md` falls under the ruling "Unapproved builder scripts" in `plan.md`. List in the report every such command the build ran and the files each changed. Run no such command in this round: use Edit or Write. The full-list count stands as the report gives it; the booking records it.

Run after the change, from the worktree's root: `npm run diagrams`, `npm run test:quick -- --base 3e2595261` once, `LC_ALL=C grep -n '[^ -~]'` over the files changed, `sh utils/unused-exports.sh` against the base copy's list. A failure in a file this step does not change that passes alone is a timing failure under load; quote it and its lone run, and do not run the list again for it. Update the report in place, with its open items part stating `orchestrator-state.md` as it stands now, and add a part "Repair round 1" naming each item with what closed it.
