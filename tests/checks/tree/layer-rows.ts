// Layer 4, test helper. The table of what each layer may import, by the row its folder sits in,
// which tests/checks/tree/boundaries.test.ts checks every module under src/lib against; the reason
// each entry outside a layer's own folder is there is written above the table.

// One entry per row of the table. A pattern ending in /** matches the folder and everything under
// it; any other pattern matches exactly. The view registry is a state module under
// `state/workbench/navigation/`, which the shell's row and the views' row both name, so a view
// registers itself without importing another view and the shell draws a view it never imports.
//
// A block two views draw the same way lives under `views/shared/**` once instead of twice, and only
// a view may import it. A file under `views/shared/` is in the views layer itself, so the row binds
// it too and it may reach no other view's partials.
//
// `data/helpers/guards`, `data/accounts/calendar`, `data/accounts/mail`, `data/accounts/connect`,
// `data/helpers/dates`, `data/helpers/files/paths`, `data/helpers/editor/editor`,
// `data/accounts/leads`, `data/helpers/worktrees`, `data/helpers/files/text-kind`,
// `data/helpers/files/opens-in-program`, `data/helpers/files/languages`, `data/helpers/run/tasks`,
// `data/helpers/run/marker`, `data/helpers/search/**`, `data/helpers/finding-text`,
// `data/helpers/editor/code-themes` and `data/helpers/editor/start-theme` join `data/model` in the
// state row as pure helpers with no reader and no I/O. `data/accounts/calendar` and
// `data/accounts/mail` are there because how a connector account is named, and how old a thread
// is, are read by the server that builds the credential file and reads the mailbox and by the page
// that presses Connect and draws the age on a card; `data/accounts/connect` because the rule a new
// account's label and a provider's client half are held to is read by the Add form and the setup
// page before they send and by the server before it writes, and a copy on each side would let them
// disagree; `data/accounts/leads` for the same reason, since the statuses that close a lead are
// read by the Position Leads view, its badge and the ticker on the client, and by the summary the
// snapshot carries on the server; `data/helpers/worktrees` likewise, the Repositories view naming
// the path a worktree will take and the write making it; `data/helpers/files/text-kind`, the file
// browser deciding which tab a file opens in and the source route refusing a save over bytes no
// editor could have read; `data/helpers/files/save-text`, the trim and the final newline a save
// applies to a source tab's text; `data/helpers/files/opens-in-program`, the open endpoint opening
// only a file whose extension `open.program_ext` lists and the cards and the file view offering
// the control for that name alone; `data/helpers/files/languages`, the reader of the `languages:`
// map: the server words its findings from it, and the file browser, the source tab and the diff
// and merge views read a file's language through it, so the two cannot disagree about which
// entries the map dropped; `data/helpers/files/nesting`, the reader of the `patterns:` map of
// file-nesting.yml and the rule that nests a folder's names: the server words its findings from it
// and the Files view nests the rows it draws through it, so the two cannot disagree about which
// patterns were dropped; `data/helpers/run/tasks`, the server starting an update task and the tray
// listing the four; `data/helpers/run/schedules` and `data/helpers/run/cron`, the rule for one
// entry of the schedules file and the runs a cron pattern has: the schedule dialog checks an entry
// and previews a pattern before it sends, and the server reads the file and runs the timer by the
// same rule, so the two cannot disagree on what runs; `data/helpers/run/marker`, the line a
// project command's chain prints before each command, which the server writes into the chain's
// line and the page reads the task's output by; `data/helpers/run/chain`, the chain a press of a
// project command runs, which the server resolves a press and approves a save by and the command
// form draws under its fields, so the lines the form shows are the lines its Save approves;
// `data/helpers/run/limiter`, the sliding-window count of the app limits, which the page applies
// to a frame's calls and the server to a host's, so the two count by one rule;
// `data/helpers/editor`, the order that resolves a tab's editor options (`resolveEditor`) and their
// types, which the source tab and the diff view resolve a tab's options through; and
// `data/helpers/search/**`, the Search view refusing a query before it sends it and the search
// route refusing the same query when it arrives, from one rule and one argument list (`query`), and
// the Search view drawing the replacement of each hit with the rules the server writes it by
// (`replace`); and `data/helpers/finding-text`, whose placeholder rule is the one the client's t()
// fills a catalog string with and the one the server words every finding with before the snapshot
// carries it; `data/helpers/editor/code-themes`, the code themes read from `code_themes.vscode`
// and Shiki's bundled themes, each with its group, which the server words the finding for a bad
// `code_theme:` from, the appearance store checks a saved pick against and the Settings view offers
// on its Code theme row; `data/helpers/editor/start-theme`, the rule over the `theme` and
// `app_theme` options that picks the theme a window starts on, which the appearance store reads
// for the theme a page shows and the desktop host for the colours a window takes before its page
// paints, so the two start on one theme; and `data/sources/config/rail`, the rule over the `rail:`
// list of config/defaults/layout.yml, which the page drawing the rail, the Settings view editing it
// and the server writing it and wording its findings all read, so the three agree on which entries
// are pages; and the seven files of `data/sources/config/settings/`, the typed readers of single
// settings, which the page reads by the rule the server reads by: the Files view
// `files.confirm_delete`, so a delete asks only while the setting says so, and `lint.writing`, the
// source editor the paint limit, the cards and the file view the `open.program_ext` map, the Usage
// view the refresh cadence, the apps' frames their limits and the LaTeX tab what a build is set
// by; and `data/sources/config/settings/rows/grammar`, `rows/links` and `rows/read`, the grammar
// of a reader row, the addresses of the `links` rows and the readers of `links` and
// `literature.prefer`, which the Literature page reads by the rule the server reads them by, so
// the links it draws and the order its merge takes a paper's fields in are the server's; and
// `data/sources/config/catalog/value-rule`, the rule a value of an option is wrong by (its
// control, `min`, `max` and values), which the Settings view refuses a value by before it is sent
// and the server's write and readers by after it, so the three agree; and
// `data/sources/config/editor-options`, the reader of the editor's options and of a repository's
// `.oculus/settings.yml` by that rule, which the source tab, the diff view and the Settings view's
// lines under `editor.languages` read; and `data/sources/config/catalog/options`, the options
// catalog's types and the reader of it from the merged config, which the Settings view's rows are
// made from, so the rows and the server's write of one option
// (server/edit/writes/config/config-key.ts) read one description of what an option is; and
// `data/places/hub-address`, the rule telling a path of the hub from a web address, which the
// collection card reads to decide what a click opens and the Audit reads to decide which links to
// look for on disk, and the one check of an address the page opens, which an app's `open` and the
// linters' documentation links read; and `data/prose/literature`, the rules of the literature
// search that both sides read: how a DOI, a PubMed id and an arXiv id are written the one way and
// the bounds of a request, which the Literature search refuses a query by before it sends it and
// the route refuses the same query by when it arrives, and the rule by which Lit Watch holds a
// paper already. `data/helpers/files/paths` holds the `/` path rules (a path's last name, the path
// under a folder, the deepest folder holding a target) that the file browser, the source tab and
// the status bar read a root or a repository by, so the three agree on which one holds a file.
// `data/helpers/files/address` holds the one address `/api/file` answers a file at, which the
// page's reads and downloads, the editor's picture addresses and a Present slide's figure all
// build, so the escaping of a name is one rule. `data/helpers/files/apps/` holds what an app may
// name (the channels it reads, the write kinds it asks for, the confirmations) and the two rules a
// file path an app names is judged by (the segment rule and the `closed_paths` match): the page
// refuses an app's request by them before it sends it and the server refuses the same request by
// them when it arrives, so a copy on each side would let the two disagree. It imports no node
// module. `data/shapes/shapes` holds the zod helpers (a schema that answers its input, the map and
// number schemas, the quick path) that the server's, the state layer's, the views' and the shell's
// readers of untyped input share, so all four read by one rule. `data/file-ops` holds what a file
// or folder name may be, the name a copy takes, the sizes of an upload and of a comparison, and the
// shapes of a file operation and its answer, which the Files view checks while a name is typed and
// the server checks when the name arrives. The model's own concern modules (`data/model-*`) are
// reached through the facade only, which is why they are not listed here.
//
// `data/helpers/hub-names` holds how a record names its hub: every record, the primary's included,
// carries its hub's folder name as root and has the internal id `<hub>:<key>`. The file server, the
// file browser's place vocabulary, the schema set, the write routes and the page's lookups each
// read it, so the rule is written once.
// `data/helpers/files/private-folders` holds the folders no YAML language server is given a file
// of, the `secrets` folder of every hub and `~/.oculus`, which the relay refuses by and the page
// refuses a tab by, so the two agree. `data/shapes/vocab-keys` reads the keys of a vocabulary key
// of vocab.yml, which the schema check and the entry forms read the same way.
// `data/shapes/config-save` is the Save of one Settings scope, its body, its changes and the
// digest of the text it was read as, which the Settings view sends and the server writes and
// checks the digest by, so the shape of a save and the hash are one rule on both sides.
// `data/shapes/hub-keys` names the keys of the hub list each hub's own settings file is read for,
// and `data/sources/config/settings/hub-slice` the slice of one hub's merged settings they make:
// the server's write refuses a hub other than the primary on any other key and answers the slice,
// and the Settings view offers the hub on those rows alone and lays the slice over the primary's
// config, by one list.
// `data/helpers/hub-names` also holds which folders a project scan enters and whether a folder lies
// in a scan folder: the scan reader, the server's check of a new project's folder and the page's
// new-project form ask the same question, so they cannot disagree.
// `data/shapes/boards/**` holds which projects a board of `boards:` takes, a project's category of
// `categories:` and the user's role on a project or a collection entry of `roles:`: the boards, the
// rail, the Pillars view and the collections on the page, and the audit and the New project write
// on the server, read them through it, so a board, a category and a role are one rule on both
// sides. It holds the Focus board's sections of `focus.sections` too, which the Focus view draws
// and the config check words its findings from.
//
// `data/prose/markdown/**` is in the primitives' row, the one folder of layer 1 there: a Markdown
// document is rendered by the document route on the server and by ui/html.ts on the page, and the
// heading ids and the table of contents are one rule for both, so a document reads the same in the
// doc view and in the source tab's preview; a note's links, embeds and tags are drawn by its
// note-render.ts on the page. It is in the state row too, because the Notes section, the notes'
// moves and the language servers' edits take the rule of a note's name and the reading of its
// links from note-names.ts and note-links.ts, the rules the server's notes reader takes. It holds
// no reader and no I/O. `data/prose/languages`,
// the highlighter, is in the state row for the same reason: the server paints a document's and a
// transcript turn's code with it, and the page reaches it through state/shared/words/languages.ts.
// `data/prose/latex`, the reader of a LaTeX text (magic comments, sections, includes), is in the
// state row because the server's outline and the Files Outline read the same sections through it,
// the LaTeX store takes the list of programs from it, and the answers module takes the words a
// LaTeX request is refused with; it takes a string and a parser and does no I/O, and imports no
// parser of its own. `data/prose/bib` is there for the same reason: the server lists the citations
// of a bibliography through it and the page aligns and sorts a `.bib` file through it, over a
// parser it is handed. `data/sources/config/catalog/latex-tables` reads the tables of
// config/catalogs/latex.yml: the editor's commands and the TeX view read them, and the server words
// one finding for each list that lost a row from the same read. The same module reads the symbols
// of config/catalogs/unimath.yml the same way for the editor's completion.
//
// `state/shared/words/appearance` is in the primitives' row because the theme list it holds names
// the body class of an app's colour theme, which ui/theme converts a theme file into a block for
// and the editor's token rules are read by, so the class is written once.
//
// The shell's row names the state modules the workbench is made of, one at a time, and the folder
// `state/workbench/navigation/`, whose modules (the rail's pages, the view catalogue and its keys,
// what a page is called and what closing it asks) the shell and the views both read. The one drag
// in progress is the drag store's, which the shell's strips start and draw and the Pages view
// starts for a page carried out of its list. A shell component reaches those stores through the
// client object (`state/client/context`, read with `state/client/use`), which names every store
// there is, so the row alone would not hold the shell to its own: the stores a shell file may
// take out of the object are SHELL_STORES of boundaries.test.ts, and the second rule checks each
// destructuring against that list.
//
// `state/forms/new-entry` and `state/forms/page-entry` are in the shell's row because the palette's
// Add Task command (`:task-add <title>`) makes the task a title gives and opens the page of the
// entry it wrote, the same rules the Add boxes of the views use.
//
// `state/system/machine/lsp/lsp.svelte` and `state/system/machine/lsp/symbols` are in the shell's
// row because the status bar's language server items and the palette's choice rows draw the
// server states and the choices the relay sends, and the pane strip's breadcrumb draws the symbols
// around the caret that the symbols module orders. `state/sessions/latex/latex-state`,
// `state/shared/words/format` and `data/prose/latex` are in it because the status bar's LaTeX item
// reads the root and the build of the file in front, words the time the build ended and tells a
// LaTeX file from another by name. `state/system/machine/lsp/clangd/cpp-form` is in it because the
// compile database list of the palette edits the repository's `.oculus/cpp.yml` in a form raised
// over its rows, and the module makes that form's fields and the changes its answers write.
//
// `data/prose/lsp-servers` is one entry per language server (its languages, its words, its choices
// and its own commands), which the relay's registry on the server and the page's kit, status bar,
// palette and tab actions all read, so a server is declared once; `data/prose/lsp-addresses` is the
// address a file has on a language server channel, which the editor kit and the page's edit of
// files read the one way; `data/prose/text-edits` is the protocol's text edit applied to a text,
// which the server's `lsp-edit` and the page's edit of an open tab apply by one rule and whose
// catalog keys the page words a refusal with; `data/prose/symbol-kinds` names the protocol's symbol
// kinds, which the palette's `#` list words. `state/sessions/source/draft` is the source tab's
// state, which a row of that list opens a file in, and `state/system/machine/lsp/workspace-symbols`
// the rows it draws. `state/system/machine/lint/lint-model` and `lint-words` are in it because the
// status bar's linter items and the palette's ESLint configuration list draw the linters' states
// and names.
//
// `data/helpers/keys/oculus/**` is the code that takes the workbench's keys, free of the DOM: the
// key resolver, the palette's keys, the debugger's keys, the editor's presses and the desktop
// menu's accelerators. The workbench, the terminal grid, the editor and the menu answer a press
// through it, and the audit of an app's keybindings (the rest of `data/helpers/keys/`, in the state
// row) resolves a key through the same code, so the keys oculus takes are written once.
//
// `data/helpers/files/apps/choices` and `data/helpers/files/languages` are in the ui row because
// the app colour theme's class and the file icon theme's `languageIds` rules are drawn by
// primitives: `ui/theme/app-theme.ts` tells an app theme with no offers before the `apps` channel
// arrives (`NO_OFFERS`), and `ui/display/icon-theme/held.svelte.ts` looks a file name's language
// up (`languageOf`). Both are pure functions over the data they are handed.
// `data/helpers/files/apps/tools/language-kit` is there because the editor's kit registers the
// languages, grammars and snippets that acting apps add: it takes the kit's types and the schema
// glob rule from this module, which holds no reader and no I/O.
// `data/helpers/editor/start-theme` is there as it is in the state row, a pure helper with no
// reader and no I/O: `ui/theme/theme.ts` joins the body class string a theme lands on the document
// as through its `bodyClass`, by which the server writes the same string into the page's first
// HTML, so the page's first draw and the HTML it was sent with carry one class.
// `data/shapes/boards/columns` is there because a list's columns are built in client state and
// drawn by the table primitive (`fittedColumns`), and the module holds only their one type.
//
// `data/snapshot/place` is the place of any project's folder: the server finds the folder for the
// chat, the document route and the file listing through it, and the page draws a project's card,
// project view and manifest form from the same function, so the two cannot disagree about where a
// repository's folder is.
//
// `state/client/context` is where the client's stores are wired together, and it names nothing of
// layer 3: the view registry is a state module, and the page root makes the primitives' tooltip
// counter beside the client object, so the state row reaches no layer above it.
export const ALLOWED: Record<string, string[]> = {
    ui: [
        'ui/**',
        'themes/**',
        'state/shared/words/text',
        'state/shared/words/appearance',
        'data/prose/markdown/**',
        'data/prose/lsp-servers',
        'data/prose/lsp-addresses',
        'data/prose/text-edits',
        'data/helpers/keys/oculus/**',
        'data/helpers/files/apps/choices',
        'data/helpers/files/apps/tools/language-kit',
        'data/helpers/files/languages',
        'data/helpers/editor/start-theme',
        'data/shapes/boards/columns'
    ],
    shell: [
        'shell/**',
        'ui/**',
        'state/client/context',
        'state/client/use',
        'state/client/instance-context',
        'state/workbench/layout',
        'state/workbench/drag',
        'state/workbench/ui',
        'state/shared/words/text',
        'state/shared/words/appearance',
        'state/workbench/palette',
        'state/workbench/palette-source',
        'state/forms/new-entry',
        'state/forms/page-entry',
        'state/workbench/selection',
        'state/workbench/navigation/**',
        'state/system/machine/lsp/lsp.svelte',
        'state/system/machine/lsp/symbols',
        'state/system/machine/lsp/workspace-symbols',
        'state/system/machine/lsp/clangd/cpp-form',
        'state/system/machine/lint/lint-model',
        'state/system/machine/lint/lint-words',
        'state/sessions/terminals',
        'state/sessions/source/draft',
        'state/sessions/latex/latex-state',
        'state/shared/words/format',
        'data/prose/latex',
        'data/shapes/shapes',
        'data/prose/lsp-servers',
        'data/prose/symbol-kinds',
        'data/helpers/keys/oculus/**'
    ],
    views: [
        'ui/**',
        'state/**',
        'views/shared/**',
        'data/shapes/shapes',
        'data/prose/linkedin-idea',
        'data/prose/lsp-servers',
        'data/prose/text-edits',
        'data/helpers/keys/oculus/**'
    ],
    state: [
        'state/**',
        'data/model',
        'data/helpers/guards',
        'data/shapes/shapes',
        'data/accounts/calendar',
        'data/accounts/mail',
        'data/accounts/connect',
        'data/helpers/dates',
        'data/helpers/files/paths',
        'data/helpers/files/address',
        'data/helpers/files/apps/**',
        'data/helpers/keys/**',
        'data/helpers/files/private-folders',
        'data/helpers/hub-names',
        'data/snapshot/place',
        'data/shapes/vocab-keys',
        'data/shapes/hub-keys',
        'data/shapes/config-save',
        'data/shapes/boards/**',
        'data/accounts/leads',
        'data/helpers/worktrees',
        'data/helpers/files/text-kind',
        'data/helpers/files/save-text',
        'data/helpers/files/opens-in-program',
        'data/helpers/files/languages',
        'data/helpers/files/yaml/collection-text',
        'data/prose/latex',
        'data/prose/bib',
        'data/prose/markdown/**',
        'data/helpers/files/nesting',
        'data/helpers/run/tasks',
        'data/helpers/run/schedules',
        'data/helpers/run/cron',
        'data/helpers/run/marker',
        'data/helpers/run/chain',
        'data/helpers/run/limiter',
        'data/helpers/editor/editor',
        'data/helpers/search/**',
        'data/file-ops',
        'data/helpers/editor/code-themes',
        'data/helpers/editor/start-theme',
        'data/helpers/finding-text',
        'data/sources/config/rail',
        'data/sources/config/settings/connectors',
        'data/sources/config/settings/files',
        'data/sources/config/settings/latex',
        'data/sources/config/settings/lint',
        'data/sources/config/settings/machine',
        'data/sources/config/settings/problems',
        'data/sources/config/settings/reader',
        'data/sources/config/settings/rows/grammar',
        'data/sources/config/settings/rows/links',
        'data/sources/config/settings/rows/read',
        'data/sources/config/editor-options',
        'data/sources/config/catalog/latex-tables',
        'data/sources/config/catalog/options',
        'data/sources/config/catalog/value-rule',
        'data/sources/config/settings/hub-slice',
        'data/places/hub-address',
        'data/prose/languages',
        'data/prose/literature',
        'data/prose/lsp-servers',
        'data/prose/lsp-addresses',
        'data/prose/text-edits'
    ],
    data: ['data/**'],
    server: ['server/**', 'data/**'],
    'server/transcripts': ['server/transcripts/**', 'data/**'],
    themes: ['themes/**']
};
