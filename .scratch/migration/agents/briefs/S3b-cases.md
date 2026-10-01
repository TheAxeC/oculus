# S3b, round 0: the rulings on the builder's first run

The builder's first run handed back case 4 and two points it could not do as written. Each ruling stays inside the brief.

1. Case 4, `value: -0`: (a). `-0` is tested on `behavior.yml` `calendar.days_back` (a `number` option whose reader, `calendarSettings` at `settings.ts:61-67`, accepts 0): written as `0`, the file holding `0`, the record's after `0`. Case 3's refusal of `0` on `changes.keep` stays as written. Both rules then hold as the brief states them: `-0` is normalised to `0`, and the readers then judge `0`. The lazy option was (b), dropping the case.
2. `notifyConfig` (`src/lib/server/root/hooks.ts:137-140`) is left out of the readers list. It never throws and gives no finding (`safeParse` with a fallback), so it cannot refuse a value, and `server/edit` may not import from `server/root` (`tests/checks/imports/order.ts`). The report says so with those lines. The list's comment in `config-key.ts` names what the list holds: every reader of the merged config that can refuse a value.
3. `DESIGN.md:313`: add `config-key` to the closed kinds in place, beside `rail` and `audit-mute`, since it writes an engine file as they do.

Go on with the whole brief under these rulings.
