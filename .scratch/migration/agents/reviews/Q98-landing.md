# Q98 landing

Oculus migration (tools/oculus/.scratch/migration). Plan step Q98: what the owed looks found (Z28 to Z31). Next: `/spec` Q92, with Q89 and Q80 in flight.

## Open items

None.

## The check before the landing

The runner's agent listing (ListAgents) showed one subagent of this session running, the Q80 builder (adfd1cde92313bcfc). Q98's builder (acf138bc046aa572e) and both reviewers (aeed9e709ec6a8e7f, ab3d474312821ace6) had ended.

## Not done

Nothing inside the brief. The live Audit list holds one finding and its message has no backticked word, so the Audit view's code drawing was not seen on screen; `tests/views/system/audit.test.ts` proves it.

## What landed

- `src/lib/views/feeds/radar/RadarCard.svelte`: each linked project in a `span.link` with the whole title as its `title`. `src/lib/ui/controls/ToolButton.svelte` gains a `cut` prop (`max-width: 100%`, the label ending in an ellipsis), since the boundaries check refuses a view's `:global` rule on the button.
- `src/lib/server/sessions/record.ts`: a session whose first prompt is a slash command is titled `/<command> <args>` through a private `slashCommand`.
- `src/lib/ui/html.ts` gains `codeSpans`, and the new `src/lib/ui/display/CodeText.svelte` draws a catalog line with its backticked words as code, used by `Config.svelte`, `Audit.svelte` and `Empty.svelte` (the Person view's empty text).
- `config/text/views/personal/calendar.yml` gains `days_one` and `days_n`; `Calendar.svelte` chooses by `dayCount`.
- Tests: `transcript-fixture.ts` and `code-text.test.ts` new; `html`, `transcripts`, `sessions` (two clones folded, two lines out of `allow-duplication.txt`), `radar`, `calendar`, `audit`, `config`, `person` and `type-scale` extended.
- One fix at landing: the report's open-items section replaced with the current list.

## Checks on main

```
$ sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md   (from tools/oculus), exit 0
 Test Files  339 passed (339)
      Tests  5325 passed (5325)
verify: 6 commands passed
$ npm run diagrams   -> exit 0, no file under docs/diagrams changed beyond the step's own
```

## The look (the page named TEST on 8790, Axel's Chrome)

- Lit Watch: the long project link ends "Dimension-Free Privac..." inside its button, the whole title as its tooltip.
- Config: `behavior.yml`'s description draws `editor.paint_limit_kb` and the other keys as code.
- Calendar: the footer reads "Read-only over 1 day back and 14 days ahead".
- Sessions: four sessions titled "/research-cockpit litwatch" and "/research-cockpit scout".
- Audit: one finding, no backticked message on screen.

## Next

`/spec` Q92 (the Inbox card, entities, the calendar views, the published-link provider), Q89's repair round, and Q80's review when its builder reports.
