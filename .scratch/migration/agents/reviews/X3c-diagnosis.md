# Diagnosis: an active tab left out of sight in its strip (Q78-look-1)

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading, which names its finding.

## Symptom

From `agents/reviews/owed-looks.md`, the Q78 look (2026-10-02, TEST, the rice palette "mocha" with its wallpaper, then back to "vscode dark modern"): "Q78-look-1: a tab activated while it is scrolled out of its strip stays out of sight: Processes shown in the left pane while the strip shows the inactive "Account setup" tab; VS Code scrolls the active tab into view. Booked into X3c (Z294)."

## Where the probes run

TEST at localhost:8790, tab 812136282, which serves main at 4bc8983b8 (X3c is not served). The probes are page scripts only: no source file is changed, so the step's worktree and main are untouched. The paths redirected under `$TMPDIR`: none.

## Red command

A page script (`__diagRed3(2, 1.3)` in the session transcript): scroll the Focus pane's strip (the third `[data-tab-strip]`, 32 tabs, 175 px wide) so its active tab rests at the strip's start, set the root's `--text-scale` from 1 to 1.3 (what the Text size setting and a theme's font change do to the tabs' widths), wait, read whether the active tab is whole inside the strip, set `--text-scale` back, wait, read again. Red: the active tab not whole after either change.

Runs, 2026-10-03 16:11 local:

```
{"active":"Focus","pre":{"sl":375,"cw":175,"ab":[0,71],"visible":true},"post":{"sl":375,"cw":144,"ab":[104,194],"visible":false},"back":{"sl":375,"cw":175,"ab":[0,71],"visible":true}}
{"active":"Focus","pre":{"sl":375,"cw":175,"ab":[0,71],"visible":true},"post":{"sl":375,"cw":144,"ab":[104,194],"visible":false},"back":{"sl":375,"cw":175,"ab":[0,71],"visible":true}}
{"active":"Focus","pre":{"sl":375,"cw":175,"ab":[0,71],"visible":true},"post":{"sl":479,"cw":144,"ab":[0,90],"visible":true},"back":{"sl":479,"cw":175,"ab":[-104,-33],"visible":false}}
```

These runs do not count as red. A trace of the same run with the page's own `ResizeObserver` and `scroll` listener on the strip and the active tab (tag `DIAG-7c1e`) recorded no resize and no scroll event at all, and a frame count over one second gave `{"vis":"hidden","focus":false,"frames":0}`: the TEST tab is hidden behind other windows, so Chrome draws no frame and runs no resize observer, and the strip's reveal on a change of width (`ui/tabs/tab-scroll.svelte.ts` `resized`, run from the `ResizeObserver` of `ui/tabs/Tabs.svelte:116-127`) cannot run. A screenshot did not bring the tab to the front (`document.visibilityState` still `hidden` after it).

## No red command

So far: way 4 (a page script on TEST) ran only on a hidden tab, which gives no frame and so cannot show the symptom or its absence. Way 1 cannot reach it: the unit suite renders to a string, with no layout and no resize observer. What the diagnosis needs: the Chrome window holding TEST in front on Axel's screen while the same script runs, which needs Axel, since raising his window from here could send a keystroke into whatever he is typing in.

## Shrunk case

Not reached.

## Hypotheses

Not formed: no valid red yet.

## Probes

None.

## Cause

Not yet found; waiting on the window in front.

## Fix and test

Not reached.

## Cleanup

The page scripts are page globals (`__diagStrips`, `__diagRed3`, `__diagTrace`) that a reload removes; `--text-scale` was set back to `1` after every run (each run's "back" read). No file was written.
