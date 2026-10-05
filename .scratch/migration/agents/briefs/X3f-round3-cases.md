# X3f round 3: the cases ruling

The orchestrator's ruling on the builder's hand-back before any code change. Each ruling stays inside the round's brief.

1. Open in Program appears in the breadcrumb bar only on a file whose extension `open.program_ext` maps, the rule `src/lib/data/helpers/files/opens-in-program.ts` already holds for the row menu and the server (`src/lib/server/files/open.ts:16-22`). "Where they apply" in item 1 means exactly that. Cases 1, 3, 4 and 5 read: Open in Program is drawn when the file's extension is mapped, and not otherwise; with the shipped `config/behavior.yml` none of `.md`, `.png`, `.pdf`, `.html` is mapped, so none of those tabs draws it. The rule and `open.program_ext` are not changed.
2. Toggle Blame appears only on a tab with a line gutter: a working source tab of a file in a repository, a HEAD tab and an index tab. Cases 3 and 4 read: the star, and Open in Program when the extension is mapped. The status bar's caret-line blame is shown for a source tab, HEAD and index tabs included.
3. Open Preview in the breadcrumb bar is the row menu's Open Preview: the file's `markdown-preview` tab, kept, in the same pane, as VS Code's "Markdown: Open Preview". The rendered-half toggle stays in the palette.

## Widened by Axel (Z533)

4. A file tab draws its file's icon, as VS Code's tabs draw the file icon theme's icon: the icon `src/lib/ui/display/FileIcon.svelte` with `file-icons.ts` gives the same file in the Files tree. Today every source tab draws the view's icon, `edit: pencil` (`config/catalogs/icons.yml:27`). This holds for every tab showing a file (source, HEAD and index, picture, document, PDF, download, Doc, Markdown preview) in the tab row, the Open Editors list and anywhere else the tab's icon is drawn; a tab showing no file keeps its view's icon. Case 13: tabs of `README.md`, `build.py`, `package.json`, `layers.svg` and `main.pdf` each draw the icon their row draws in the Files tree, and a terminal tab keeps its view icon.
