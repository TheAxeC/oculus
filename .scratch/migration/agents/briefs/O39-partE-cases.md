# O39 part E, cases ruling (round 0)

The builder handed back C15, C6 and C10 after the first run on the unchanged tree, before any change under `src/`. Each ruling below stays inside the step's part.

## C15

`parseColour` (`src/lib/themes/vscode-map.ts:283-290`) accepts only `#` and hex digits, and every other value in the converted block comes from `settle` and `hexOf`, from oculus's shipped `tokens.css` and `themes.css`, or from the literals `dark`, `none` and `transparent`, so no theme file can put `<` into the block.

Ruling: option (a). Item 1's guard stays: a block whose text holds `<` is not sent. Its comment says it covers the text of the two shipped sheets, the one source a `<` could come from. C15 now reads:

- C15. An app theme whose file holds `</style>` in a colour value, chosen by `theme`: the body's class attribute is `app-theme`, and the head holds one style element with the shared id whose text holds no `<`, the colour falling back to the value the conversion gives without it. Test.

No row mocks the sheets to reach the guard. Option (c), dropping the guard and C15, was the lazy option.

## C6

`drawConfiguredTheme` passes `crt: false` (`src/lib/ui/theme/app-theme.ts:221`; its comment at `:205-206` says the overlay belongs to the workbench), while the workbench draws `crt` from `ui.crt()` (`src/lib/state/workbench/ui.svelte.ts:298-300`). Sending `/`'s class to the find, audience and print pages would show the overlay there until their script draws.

Ruling: option (a). The request's start function of item 2 takes a fourth input, whether the page draws the CRT overlay; the hook passes `event.route.id === '/'`, which covers `/` and `/?float=<id>`. Item 1's rule is unchanged: each page is sent the class its own first draw sets. C6 now reads:

- C6. For the same config and mark, `/?float=<id>` gets the same body class and style element as `/`; `/find`, `/present/show` and `/present/print` get the same style element as `/` and the same body class except the CRT class. With `crt.on: true`, `/` and `/?float=<id>` carry the CRT class and the other three do not. Test.

Option (b), sending `crt` to every route, was the lazy option and breaks item 1 on those pages.

## C10

`loadConfig`'s findings are merge findings only (`src/lib/data/sources/config/merge/merge.ts:123-189`); `themeFindings` runs in `READER_FINDINGS` outside the read and names only `app_theme`. A `theme` naming no row gives the read no finding.

Ruling: the builder's row stands. C10 now reads:

- C10. `theme` names no row and no app theme, and the read answers with one finding (given in the test, since the hook never reads the findings): the body carries the start theme `startOf` gives (C1's without the mark, C2's with it), the title is replaced as today, and the answer is the page, not an error. Test.

## Names

The names the hand-back lists stand: `APP_THEME_STYLE_ID` and `themeSheet(theme, ui, { tokens, themes }, cls)` in `vscode-map.ts`; `DESKTOP_MARK`, `bodyClass(classes, looks)`, `CRT_CLASS`, `RICE_PLAIN_CLASS`, `RICE_SANS_CLASS` and the reader of `crt.on`, `rice.brackets` and `rice.monospace` in `start-theme.ts`; `requestStart(held, config, marked, crt)` in `theme.ts`, its fourth input the C6 ruling's.
