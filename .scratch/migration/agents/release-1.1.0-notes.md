Oculus 1.1.0 is the second public release of oculus, a local research workbench: the projects, manuscripts, grants, data and code of a research hub in one VS Code-like app. Oculus is under the MIT license.

What is new since 1.0.0:

- The user's setup and data are configuration: the values oculus took as fixed (folder names, website fields, CV sections and period words, the stage umbrella of a project's administrative parents) are config keys a hub sets, and Settings tells an absent list from an empty one.
- Every research project has a slide deck. The Present view arranges a deck in its Overview, filters the project decks with the boards' filters, and orders them by the deck order; a slide lays out its figures and text from their proportions, in a 16:9 frame with no pixel size, with the project's facts in a strip at its foot. The Slides view is retired.
- Every record page (a project's, a person's, and each collection entry's) is one design, and a card's links open their page. A long field keeps its newlines and paragraphs, and a cut field ends at the last line or block that fits whole.
- Boards and record lists are drawn whole: list mode draws a group's column header once, a nested group's heading sits one level down, and every collection sorts by its sort fields. Cards cost less to build, so Lit Watch and the portfolio Overview stay usable at their full size.
- The Help page, the data map and the decks guide are rewritten, and the Decks guide is a tab of the Help page.
- Findings shows the hub of each finding's file and takes in the Audit; the Status view takes in the Gallery.
- One Terminal view serves a session: a running agent's terminal takes the whole height of the Live view, the tab's bar keeps its height when its session links, and the Transcript reads as a conversation, loading older turns as it scrolls up.
- Every tree indents as the Files view does, and Live HPC shows its refresh running.
- Every file of the Settings groups Catalogs, Schemas and Texts opens from its row: Show File reads oculus's own copy in a tab that saves nothing, in the app as in the development server, Open file edits it where a folder of the workspace holds oculus's checkout, and each catalog and the texts say where the workspace sets its own values.
- Interview and offered are statuses after applied, stopped is a status the Funding template offers, and a note has an Add Front Matter command.
- The server parses again only the config files whose text changed.

Archives:

- `oculus-1.1.0-darwin-arm64.zip`: the macOS app for Apple silicon.
- `oculus-1.1.0-linux-arm64.tar.gz` and `oculus-1.1.0-linux-x64.tar.gz`: the Linux app folder, started by its `oculus` program.

None of the archives is signed by a developer identity. The macOS bundle is signed ad hoc, so macOS asks for confirmation the first time it opens (right-click the app, then Open). The Linux archives carry no signature.

The app names, at its first window, any program it needs and cannot find (the Claude CLI, and on Linux `zenity` and `xdg-open`), with what does not work without it.

The archives bundle two programs under other licenses, cloc (GPL-2.0) and 7z-wasm (LGPL-2.1 with the unRAR restriction), as separate programs. `docs/third-party.md` names their terms and sources.
