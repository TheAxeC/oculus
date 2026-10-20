# O46 landing

Position: roadmap entry the cockpit-to-oculus migration; step O46 (every key the editor completes carries its description, with settings and state out of browser storage), the second-to-last open step; next: O39, oculus in its own repository.

Open items: none.

## Check of Steps 1

The builder ad671d432685ef684 and the reviewers a30b10287abc30449 and acdfb1e37017e0013 had ended before the landing began: each had sent its completion notice, and none was running.

## NOT DONE

- The look did not cover three states the brief names. The Schedule... dialog's chain list was not looked at: no repository holds a `.oculus/commands.yml`, so no entry offers Schedule..., and making one writes a real repository. The map labels after the `Labels.svelte` split were not looked at: TEST holds no map, and opening the Map tab of Axel's Pillars page changes his page. The composer pickers were not looked at.
- The debugger's breakpoints and watches were not carried: Axel's paste did not include `oculus.debug.v1`, so `~/.oculus/debug.json` starts empty.

## What landed

O46 from base a28047138, the whole range `a28047138..migration-O46`. The booking in `plan.md` under O46 gives the parts; in short: the settings kept per browser are options written to the open workspace file's `settings:` (a key of the hub list to the hub's `config.yml`), oculus's values in `config/defaults/`, the options catalog split into `config/options/`, the pages, view states and debugger records in `~/.oculus`, keyed lists merged by key, `bookmarks`, `schedules` and `apps_dir` in the hub's `config.yml`, every completed key with its description, Add Command... writing the repository's `.oculus/commands.yml`, Schedule... approving its chain, the Z960 edges and the Z961 lift, `Labels.svelte` and `EntryCard.svelte` split.

Point 9 of ruling 180, by hand: Axel's 7 settings that differ from the defaults in `research-hub.yml`'s `settings:`, his 14 pages and the unsaved layout in `~/.oculus/layouts.json`, 48 view states in `~/.oculus/views.json`, read from his DevTools paste in the Chrome profile `Default`; the download deleted. `~/.oculus/commands.json` and its 12 stale entries removed (ruling 181).

## What was found

The builder's first report did not pass its bar: the review's findings inside O46 went to repair round 1. The review over round 1 found the chain Schedule... approves (Z965) and the tests no guarded entry asked for (Z966), both ruled under self-rule and fixed here.

Fixes at landing, eleven: the listed chain checked at the save and the approval after the commit (Z965), with two rows in `approval.test.ts` seen failing on the round's code and one row in `schedule-dialog.test.ts` written after the change; six tests removed and the new tests placed under guarded entries, G117 new (Z966); 14 stale test titles and three moved paths in `agents/guarded.md`; `config-key.test.ts`'s mtime check restored; `rail.test.ts`'s drag row asserting every other byte; the wallpaper row of `routes/edit/config-key.test.ts` writing `rice`; five sentences of `HELP.md` and one of `memories.yml`; history words in four comments; `routes.ts:286` `late ??= approve();`; `appearance.svelte.ts` drawing no image address while `wallpaper.image` is empty (Axel's `GET /api/wallpaper?v=` 404). `holdsText` kept as built. `config/defaults/appearance.yml` keeps Axel's committed wallpaper values; `Surface.svelte` takes O46's copy; `DESIGN.md` line 248 keeps O44's text; the diagrams regenerated.

Builder departures: `utils/folder-check.sh` run once, one read-only `sed -n`, `test:checks` run twice in the round.

## Verification

In the gate `.agents/worktrees/gate` at main's head 9d98d2b88 with the range and the fixes, `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (1.5 s)
ok      npm run format:check (44.7 s): All matched files use Prettier code style!
ok      npm run lint (50.5 s)
ok      npm run check, without its type sync (77.8 s): 4242 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      npm run test:checks (179.2 s)
ok      npm test (393.8 s)
ok      npm run test:slow (442.7 s)
ok      npm run build (472.0 s)
test:landing: 472.0 s; every command passed
```

Main's staged diff equals the gate's: `git diff --cached --binary` hash `67089243` on both, same name-status list. No A/B: the configuration names no bench.

## The look

On 127.0.0.1:8790 under onedark with the wallpaper, read only, after Axel restarted the server (open item 184): the page drew Axel's settings and his 14 pages, TEST among them in the Pages view; TEST's FWO entry with the card and the edit section each on a surface and the cards lifted; TEST's Data with the intro and the count line each on a surface; Add Command... from TEST's Repositories tab opens with no repository picker, and Cancel wrote nothing; the Settings view on Axel's System page with its subject headers, Open Settings File, Show Defaults and its long rows folded; no console error after the reload. The tab was put back on Focus.

## Agents

- Builder ad671d432685ef684 (claude-opus-5-5): first run 338,643 tokens, 77 tool uses, 12.4 min; resumed after Z959 179,105 tokens, 1,319 tool uses, 140.0 min; resumed under the work account 351,779 tokens, 941 tool uses, 89.2 min; resumed, finished 350,456 tokens, 1,776 tool uses, 221.8 min; round 1 323,588 tokens, 551 tool uses, 77.9 min.
- Brief check ace0f9728a3a95951 (claude-opus-5-5): 252,351 tokens, 87 tool uses, 11.6 min.
- Reviewer a30b10287abc30449 (claude-opus-5-5): 126,695 tokens, 134 tool uses, 19.4 min.
- Reviewer over round 1 acdfb1e37017e0013 (claude-opus-5-5): 85,744 tokens, 108 tool uses, 22.2 min.

## Next

O39, oculus in its own repository.
