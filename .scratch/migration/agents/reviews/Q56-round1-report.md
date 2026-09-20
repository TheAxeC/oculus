# Q56 repair round 1 report

DONE: Q56 is complete on main and booked in the migration plan.

## DONE / NOT DONE

| Item | State | Evidence |
| --- | --- | --- |
| Split the Files concerns without size exemptions | DONE | The final tree contains `fs-transport.ts`, `Sections.svelte`, `Failed.svelte`, `fs-channel.test.ts`, `fs-shape.test.ts`, and `files-outcome.test.ts`; the size audit passed in the full node suite. |
| Preserve a pending bookmarks marker beside a later root message | DONE | The state and channel proofs passed, and the revert check reddened the merge removal. |
| Retry failed bookmarks, notes and workspaces reads | DONE | The node and isolated browser suites passed on main. |
| Watch the bookmarks file | DONE | The native watcher tests and two-page browser proof passed. |
| Full node suite | DONE | `npm test -- --reporter=dot`: 263 files and 4,395 tests passed. |
| Type, build, format, lint, ASCII and YAML gates | DONE | `npm run check` reported 0 errors and 0 warnings; build, format and lint passed; ASCII printed nothing; YAML parsed. |
| Node revert proof | DONE | `node bin/revert-check.mjs ...`: 24 red, 0 unproven, 155 unchanged cases unchecked. |
| Browser proof | DONE | The complete isolated Playwright suite passed 271 cases on main. |
| Booking | DONE | `plan.md` points to `agents/reviews/Q56-landing.md`. |

## Visual look

Native Chrome opened Files on TEST. The four roots, empty Bookmarks and Notes sections, and Configured roots were readable and aligned with no overlap or clipping. The controlled failure look from the reviewed candidate showed separate roots, Bookmarks, Notes and Workspaces failure rows, with `read again` on each list failure.
