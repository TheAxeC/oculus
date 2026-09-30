# oculus equivalents of tasks.json, launch.json, c_cpp_properties.json and settings.json

The question (Axel, 2026-09-30): what is oculus's equivalent of c_cpp_properties, launch.json, settings.json, tasks.json and the options within them. This inventory lists every option VS Code offers in each file, whether cathedra or game-engine uses it, and what oculus has, plans or lacks for it. oculus never reads a `.vscode` folder; its equivalents live in its own `config/*.yml` (appearance, behavior, layout, present, sources) or in a repository's own `.oculus/` folder (`.oculus/commands.yml`, `.oculus/project.yml`). The two `.vscode` folders were read only to fill the Used column.

Every `plan.md:<line>` in this file is a line of `plan.md` at commit ec651c39. The counts of C and C++ files in section 4l and in "Missing, grouped" are files on disk, vendored and built ones included; the tracked ones (`git ls-files`) are 698 in cathedra and 251 in game-engine.

Forms in the oculus column: "has" (with the file and line), "has, fixed" (the behaviour exists with no setting), "has as a rule" (a DESIGN.md rule covers it), "planned" (the step and its plan.md line; "planned in effect" when a planned step brings it without naming it), "missing" (with where oculus would keep it, a location and never a decided key), "excluded" (a ruling rules it out, cited), "not needed" (the reason given), "not verified". A "leaves Monaco's default" row is a Monaco option oculus does not set. VS Code version read: 1.137.0 (`/Applications/Visual Studio Code.app/Contents/Resources/app/package.json`). Line numbers of `plan.md` are as read on 2026-09-30 after the Z72 and Z74 rulings were booked (D17 :342-343, D23 :346-348, D23b :349, D25 :351, D26 :352, rulings Z72 :520 and Z74 :522). Rows already in `agents/reviews/vscode-parity.md` are pointed to by line, not repeated.

Settled rulings this inventory takes as given: D11 debugs rite over `rite_dap` only, never lldb (plan.md:495, plan.md:435); D23 runs pyright and clangd, finds the compile database itself and links it from `~/.oculus/lsp/<root>/` with a status bar picker, keeps servers 60 s after a page closes, passes `--header-insertion=never`, and offers every feature both servers have across D23 and D23b (plan.md:348-349); D25 per-language indentation in oculus's config with a Settings control (plan.md:351); D26 the rite language in oculus's own tree with `.rite` mapped in its own config (plan.md:352); D17 widened with dependencies, a default build and test on keys, open-file placeholders and clickable compiler errors (plan.md:343).

## 1. tasks.json

VS Code side read from the installed app (`out/vs/workbench/workbench.desktop.main.js`, the task schema around `runOn:{type:"string",enum:["default","folderOpen","worktreeCreated"]`, the presentation schema around `preserveTerminalName`, the group enum `["build","test","none"]`, and the bundled matcher names), from https://code.visualstudio.com/docs/reference/tasks-appendix and https://code.visualstudio.com/docs/debugtest/tasks , and from cpptools `package.json` (`problemMatchers` gcc, iar, armcc5; `taskDefinitions` cppbuild). Used: cathedra has `.vscode/tasks.json` (7 tasks); game-engine has no tasks.json.

oculus's equivalent is D17, project commands in the repository's own `.oculus/commands.yml`, a list of `{ name, run, cwd? }` run as task terminals (plan.md:342), widened by Z74 (3) with dependencies, a default build and a default test command each on a key, placeholders for the open file and clickable compiler errors, approval taken on the command text with its placeholders (plan.md:343). D17 is not built. What runs today as a task: the four update tasks (`server/machine/pty/routes.ts:70`, `:277-313`, `config/behavior.yml:88-90`) and the LaTeX build and clean (`routes.ts:322-325`, the log parsed by `server/content/latex.ts:257`). Every command from a repository runs only after its exact text is approved, in a visible pane, and is stopped only behind a confirmation (`DESIGN.md:148`).

### 1a. Task properties

| Option | What it does | Used | oculus |
|---|---|---|---|
| version | schema version of the file | yes (cathedra) | missing; would live in `.oculus/commands.yml` (no version key ruled) |
| tasks[] | the list of tasks | yes (cathedra) | planned: D17 `commands:` list, plan.md:342 |
| label | name in the picker and for dependsOn | yes (cathedra) | planned: D17 `name`, plan.md:342 |
| type: shell | run as a shell command line | yes (cathedra) | planned: D17 `run` is a full shell line, plan.md:435 |
| type: process | run an executable with no shell | no | missing; would live in `.oculus/commands.yml` |
| type: npm, cppbuild, ... (contributed) | a task type an extension defines | no | missing; oculus has no task providers |
| command | the program or command line | yes (cathedra) | planned: D17 `run`, plan.md:342 |
| args | arguments appended to command | yes (cathedra) | planned in part: placeholders for the open file inside `run`, plan.md:343; a separate argument list missing |
| args[].quoting (escape, strong, weak) | how one argument is quoted | no | missing; would live in `.oculus/commands.yml` |
| options.cwd | working directory | yes (cathedra) | planned: D17 `cwd?`, plan.md:342 |
| options.env | environment variables for the task | no | missing; would live in `.oculus/commands.yml`; today a terminal start takes no environment beyond the account folders, `server/machine/pty/sessions.ts:122`, `:283-293` |
| options.shell.executable, options.shell.args | the shell used and its arguments | no | missing; would live in `.oculus/commands.yml`; tmux starts terminals, `sessions.ts:152` reads `$SHELL` |
| group: build, test, none | the task category | yes (cathedra) | planned: a default build and a default test command, plan.md:343 |
| group.isDefault | the one run by Run Build or Run Test Task | yes (cathedra) | planned: each on a key, plan.md:343 |
| dependsOn | tasks run before this one | yes (cathedra) | planned: a command may depend on others, plan.md:343 |
| dependsOrder: parallel, sequence | order of the dependencies | no | missing; would live in `.oculus/commands.yml` (the order is not ruled) |
| isBackground | a watcher that keeps running; matcher tracks begin and end | no | missing; would live in `.oculus/commands.yml` |
| problemMatcher | turns output lines into problems with file and line | yes (cathedra: `$gcc`, `[]`) | planned: compiler errors in output made clickable, plan.md:343; has for LaTeX only, `latex.ts:257`, `routes.ts:322-325` (`-file-line-error`) |
| promptOnClose | confirm before a running task is ended | no | has as a rule: oculus stops what it started only behind a confirmation, DESIGN.md:148 |
| icon.id, icon.color | the task terminal's icon and colour | no | missing; would live in `.oculus/commands.yml`; terminal icon and colour are "new" in vscode-parity.md:285 |
| hide | leave the task out of the picker | no | missing; would live in `.oculus/commands.yml` |
| detail | a second line in the picker | no | missing; would live in `.oculus/commands.yml` |
| windows, osx, linux | per-OS overrides of any property | no | missing; oculus runs on one Mac (no location needed) |
| runOptions.runOn: default, folderOpen, worktreeCreated | run when the folder opens or a worktree is made | no | missing for commands; the update tasks get a cron-style `schedule:` (A3, plan.md:358, plan.md:529); location for commands `.oculus/commands.yml` |
| runOptions.reevaluateOnRerun | re-read variables on Rerun | no | missing; would live in `.oculus/commands.yml` |
| runOptions.instanceLimit | how many copies may run at once | no | missing; would live in `.oculus/commands.yml` |
| runOptions.instancePolicy: terminateNewest, terminateOldest, prompt, warn, silent | what happens at the limit | no | missing; would live in `.oculus/commands.yml` |

### 1b. presentation

| Option | What it does | Used | oculus |
|---|---|---|---|
| presentation.reveal: always, silent, never | whether the terminal is brought to front | yes (cathedra) | planned in part: D17 runs a command as a task terminal (plan.md:342) in a visible pane (DESIGN.md:148); a reveal choice missing, `never` is barred for repository text by that rule |
| presentation.revealProblems: always, onProblem, never | whether the Problems panel is shown | no | missing; the Findings view is the nearest (vscode-parity.md:35); location `.oculus/commands.yml` |
| presentation.echo | print the command before running it | no | missing; would live in `.oculus/commands.yml` |
| presentation.focus | give the terminal the keyboard | no | missing; would live in `.oculus/commands.yml` |
| presentation.panel: shared, dedicated, new | reuse a terminal or open a new one | yes (cathedra) | missing; would live in `.oculus/commands.yml` (terminal reuse for D17 not ruled) |
| presentation.showReuseMessage | the "press any key to close" line | no | missing; would live in `.oculus/commands.yml` |
| presentation.clear | clear the terminal before the run | yes (cathedra) | missing; would live in `.oculus/commands.yml` |
| presentation.close | close the terminal when the task exits | no | missing; would live in `.oculus/commands.yml` |
| presentation.group | split task terminals of one group together | no | missing; would live in `.oculus/commands.yml`; Split exists (vscode-parity.md:181) |
| presentation.preserveTerminalName | keep the terminal title when reused | no | has for update tasks: fixed name `task <kind>`, `routes.ts:305`; for D17 not ruled |

### 1c. problemMatcher

| Option | What it does | Used | oculus |
|---|---|---|---|
| base | extend a named matcher | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| owner | the problem owner (language service id) | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| source | the words shown as the problem source | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| severity | default severity: error, warning, info | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| fileLocation: absolute, relative, autodetect, search | how a matched file name resolves | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| pattern.regexp | the line regular expression | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| pattern.kind: file, location | whole-file or located problem | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| pattern.file, location, line, column, endLine, endColumn | match groups for the position | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| pattern.severity, code, message | match groups for the rest | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| pattern.loop | repeat the last pattern over several lines | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| background.activeOnStart | watcher starts active | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| background.beginsPattern, endsPattern | when a watch cycle begins and ends | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| named: $gcc (cpptools; also $iar, $armcc5) | gcc and clang diagnostics | yes (cathedra) | planned: this is the format D17's clickable errors need for cathedra, plan.md:343 (format not ruled) |
| named: $tsc, $tsc-watch, $jshint, $jshint-stylish, $eslint-compact, $eslint-stylish, $go, $msCompile, $lessc, $node-sass | bundled matchers | no | missing; D17's clickable compiler errors (plan.md:343) decide the formats read, not ruled; location `.oculus/commands.yml` or oculus's own code |
| LaTeX log (LaTeX Workshop, not a matcher) | errors with file and line | no | has: `latex.ts:257` parses `latexmk -file-line-error` output (`routes.ts:322-325`); vscode-parity.md:158 |

### 1d. inputs

| Option | What it does | Used | oculus |
|---|---|---|---|
| inputs[].id | name a `${input:id}` refers to | no | missing; would live in `.oculus/commands.yml` |
| type: promptString (description, default, password) | ask for a string | no | missing; would live in `.oculus/commands.yml` |
| type: pickString (description, options, default) | pick from a list | no | missing; would live in `.oculus/commands.yml` |
| type: command (command, args) | value from a command | no | missing; would live in `.oculus/commands.yml` |

### 1e. Variables (tasks.json and launch.json)

Source: https://code.visualstudio.com/docs/reference/variables-reference . oculus: Z74 (3) rules "placeholders for the open file" (plan.md:343); which placeholders and their spelling are not ruled.

| Option | What it does | Used | oculus |
|---|---|---|---|
| ${file} | the open file | yes (cathedra) | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${fileBasename} | its name | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${fileBasenameNoExtension} | its name without extension | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${fileExtname} | its extension | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${fileDirname} | its folder | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${fileDirnameBasename} | its folder's name | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${relativeFile} | path under the workspace folder | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${relativeFileDirname} | folder under the workspace folder | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${fileWorkspaceFolder} | the folder holding the file | no | planned: a placeholder for the open file, plan.md:343 (spelling not ruled) |
| ${workspaceFolder} | the workspace folder | yes (cathedra) | planned in effect: a command runs in its repository with `cwd?` under it, plan.md:342; a placeholder not ruled |
| ${workspaceFolderBasename} | its name | no | missing; would live in `.oculus/commands.yml` |
| ${workspaceFolder:name} | a named root in a multi-root workspace | no | missing; would live in `.oculus/commands.yml` |
| ${lineNumber}, ${columnNumber} | the caret position | no | missing; would live in `.oculus/commands.yml` (not in "the open file" ruling) |
| ${selectedText} | the selection | no | missing; would live in `.oculus/commands.yml` |
| ${userHome} | home folder | no | missing; would live in `.oculus/commands.yml` |
| ${cwd} | the task runner's start directory | no | missing; would live in `.oculus/commands.yml` |
| ${execPath} | the VS Code binary | no | missing; no counterpart (oculus is a server and a page) |
| ${defaultBuildTask} | name of the default build task | no | missing; would live in `.oculus/commands.yml` |
| ${pathSeparator}, ${/} | the path separator | no | missing; would live in `.oculus/commands.yml` |
| ${env:NAME} | an environment variable | no | missing as a placeholder; `run` is a full shell line (plan.md:435), so the shell expands `$NAME` itself |
| ${config:NAME} | a settings value | no | missing; would live in `.oculus/commands.yml` |
| ${command:ID} | the result of a command | no | missing; would live in `.oculus/commands.yml` |
| ${input:ID} | an input from 1d | no | missing; would live in `.oculus/commands.yml` |

### 1f. Tasks commands and UI

| Option | What it does | Used | oculus |
|---|---|---|---|
| Tasks: Run Task (quick pick) | pick any task and run it | yes (cathedra) | planned: buttons on the project card, the Repositories view and the file browser, plan.md:342; a palette entry not ruled |
| Tasks: Run Build Task (Cmd+Shift+B) | run the default build | yes (cathedra) | planned: default build on a key, plan.md:343 |
| Tasks: Run Test Task | run the default test | yes (cathedra: suggested Cmd+R) | planned: default test on a key, plan.md:343 |
| Tasks: Terminate Task | stop a running task | no | has for terminals: Kill (vscode-parity.md:280), behind a confirmation (DESIGN.md:148) |
| Tasks: Restart Task | stop and run again | no | missing; location oculus's own palette and the command buttons |
| Tasks: Rerun Last Task | run the last task again | no | missing; same location |
| Tasks: Show Running Tasks | list running tasks | no | part: the Sessions list and the Terminal tab list; planned: D18 Processes view, plan.md:344 |
| Tasks: Configure Task, Configure Default Build Task, Configure Default Test Task | write or pick entries of tasks.json | no | missing; `.oculus/commands.yml` is edited in the source tab; a picker for the defaults not ruled |
| Task terminal status icon (check or cross) | a finished task's result on its tab | no | see vscode-parity.md:177 (left out; revisit with D17) |
| Problems panel fed by matchers | problems listed with file and line | no | see vscode-parity.md:35 (Findings) and :158 (LaTeX) |
| Automatic tasks trust (`task.allowAutomaticTasks`) | asks before auto-running workspace tasks | no | has as a rule: approval of the exact text, kept under `~/.oculus/`, DESIGN.md:148, plan.md:435 |
| Auto-detected tasks: npm, Gulp, Grunt, Jake, TypeScript | tasks read from package.json and build files | no | missing; location oculus's own code (a provider per tool) |
| cpptools cppbuild provider (build the active file) | compile the open C or C++ file | no | missing |
| CMake Tools tasks and build | configure and build a CMake project | yes (installed extension; cathedra builds with cmake by task) | excluded: "CMake tooling" not built by Axel's word, plan.md:494 |
| oculus-only: the four update tasks | run `/research-cockpit <kind>` in a Claude terminal | no | has: `routes.ts:70`, `:277-313`; `behavior.yml:88-90`; schedule planned A3, plan.md:358 |
| oculus-only: LaTeX build and clean | latexmk as a task terminal, log parsed | no | has: `routes.ts:322-325`, `latex.ts:257`; D14 widens it, plan.md:339 |

## 2. launch.json

VS Code side from https://code.visualstudio.com/docs/debugtest/debugging-configuration , the cpptools `package.json` `contributes.debuggers` (`cppdbg`, `cppvsdbg`), the debugpy `package.json` (`debugpy`), and ms-python.python `package.json` (`python`). Used: cathedra has `.vscode/launch.json` with one `rite` configuration and three `cppdbg` (lldb) ones; game-engine has none.

oculus's equivalent is D11 (plan.md:327): a Debug Adapter Protocol client over cathedra's `rite_dap`, never lldb (plan.md:495); it debugs rite programs only, the adapter's path in `config/local.yml`, launched from oculus's own form (plan.md:435). The plan line as booked: breakpoints from the source editor's gutter on a `.rite` file, a Debug view with the call stack, the frame's variables and the stepping controls, the debuggee's output in a terminal pane (`agents/briefs/D11.md:7`). D11 is not built; the gutter it needs is (`ui/controls/editor/Editor.svelte:86-87`, `:170`, `:254-255`, `:339`). The Run and Debug UI rows (views, breakpoint kinds, toolbar, console, picker, inline values, status bar colour) are in vscode-parity.md:136-146 and are not repeated here.

### 2a. Attributes every configuration has, compounds, inputs

| Option | What it does | Used | oculus |
|---|---|---|---|
| version | schema version | yes (cathedra) | missing; no file (D11 is a form, plan.md:435) |
| configurations[] | the saved launch configurations | yes (cathedra) | planned in part: one launch from D11's form, plan.md:435; saving several is missing and would live in the same form or a repository's `.oculus/` folder |
| type | which debugger | yes (cathedra: `rite`, `cppdbg`) | planned: rite only, plan.md:327, plan.md:495 |
| request: launch, attach | start the program or join a running one | yes (cathedra: launch) | planned: launch; `rite_dap` answers attach as launch (cathedra `src/rite/src/tools/debug_dap.cpp:392-393`) |
| name | label in the configuration picker | yes (cathedra) | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| presentation.order, group, hidden | place in the picker | no | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| preLaunchTask | a task run before the session | yes (cathedra: `rite: build (debug)`) | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config; D17 commands (plan.md:342-343) are what it would name |
| postDebugTask | a task run after the session | no | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| internalConsoleOptions: neverOpen, openOnSessionStart, openOnFirstSessionStart | when the Debug Console opens | no | planned in part: D11 has a console (plan.md:327); when it opens missing |
| debugServer | connect to an adapter on a port | no | missing; D11 runs `rite_dap` over stdio (D11.md:7) |
| serverReadyAction.pattern, uriFormat, action, webRoot, killOnServerStop, name, config | act when output shows a server is up | no | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| windows, osx, linux | per-OS overrides | no | missing; one Mac (no location needed) |
| compounds[].name, configurations, preLaunchTask, stopAll, presentation | start several configurations together | no | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| inputs | as tasks.json (1d) | no | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| variables | as tasks.json (1e) | yes (cathedra: `${file}`, `${workspaceFolder}`) | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config; the form fills the open `.rite` file itself (D11.md:7) |
| `launch` in settings.json | configurations for every workspace | no | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| Add Configuration, snippets, dynamic configurations | write configurations from templates | no | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |

### 2b. The `rite` debugger (cathedra `utils/vscode-rite/package.json`, adapter `rite_dap`)

| Option | What it does | Used | oculus |
|---|---|---|---|
| program | the `.rite` file run under the debugger | yes (cathedra) | planned: the file of the tab, `rite_dap <file.rite>` (D11.md:7); `rite_dap` ignores the launch request's arguments (`debug_dap.cpp:197`) |
| cwd | folder that imports and search roots resolve from | yes (cathedra) | missing; would live in D11's launch form (plan.md:435) and, if kept, `.oculus/` in the repository or oculus's config |
| adapter executable (the extension's `program: ./extension.js`) | how VS Code finds the adapter | yes (extension installed from cathedra) | planned: the adapter's path in `config/local.yml`, plan.md:435 |
| breakpoints contribution `{ language: rite }` | lets the gutter take breakpoints in rite files | yes (cathedra) | planned: gutter breakpoints on `.rite` (D11.md:7); the glyph margin is on (`Editor.svelte:170`); the rite language is D26, plan.md:352 |

What `rite_dap` answers (cathedra `src/rite/src/tools/debug_dap.cpp`): capabilities at `:182-191` (configurationDone, function breakpoints and evaluate for hovers true; conditional, hit-count, set variable, step back and restart frame false); requests at `:390-410` (initialize, launch, attach, configurationDone, threads, setExceptionBreakpoints, setBreakpoints, setFunctionBreakpoints, stackTrace, scopes, variables, evaluate, finishFrame, continue, next, stepIn, stepOut, pause, disconnect, terminate). So of the breakpoint kinds in vscode-parity.md:141, conditional, hit-count and logpoints have no adapter support today.

### 2c. `cppdbg` (lldb or gdb through cpptools)

| Option | What it does | Used | oculus |
|---|---|---|---|
| launch: program | Full path to program executable | yes (cathedra) | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: args | Command line arguments passed to the program | yes (cathedra) | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: targetArchitecture | The architecture of the debuggee | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: cwd | The working directory of the target | yes (cathedra) | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: setupCommands | One or more GDB/LLDB commands to execute in order to setup the underlying ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: postRemoteConnectCommands | One or more commands that execute after remote connection to a debug server | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: customLaunchSetupCommands | If provided, this replaces the default commands used to launch a target with ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: launchCompleteCommand | The command to execute after the debugger is fully setup in order to cause the ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: visualizerFile | .natvis file to be used when debugging this process | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: svdPath | The full path to an embedded device's SVD file | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: showDisplayString | When a visualizerFile is specified, showDisplayString will enable the display ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: environment | Environment variables to add to the environment for the program | yes (cathedra) | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: envFile | Absolute path to a file containing environment variable definitions | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: additionalSOLibSearchPath | Semicolon separated list of directories to use to search for .so files | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: MIMode | Indicates the console debugger that the MIDebugEngine will connect to | yes (cathedra) | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: miDebuggerPath | The path to the MI debugger (such as gdb) | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: miDebuggerArgs | Additional arguments for the MI debugger (such as gdb) | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: miDebuggerServerAddress | Network address of the MI Debugger Server to connect to (example: ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: useExtendedRemote | Connect to the MI Debugger Server with target extended-remote mode | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: stopAtEntry | Optional parameter | yes (cathedra) | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: debugServerPath | Optional full path to the debug server to launch | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: debugServerArgs | Optional debug server args | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: serverStarted | Optional server-started pattern to look for in the debug server output | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: filterStdout | Search stdout stream for server-started pattern and log stdout to debug output | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: filterStderr | Search stderr stream for server-started pattern and log stderr to debug output | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: serverLaunchTimeout | Optional time, in milliseconds, for the debugger to wait for the debugServer to ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: coreDumpPath | Optional full path to a core dump file for the specified program | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: externalConsole | If true, a console is launched for the debuggee | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: avoidWindowsConsoleRedirection | If true, disables debuggee console redirection that is required for Integrated ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: sourceFileMap | Optional source file mappings passed to the debug engine | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: logging | Optional flags to determine what types of messages should be logged to the ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: pipeTransport | When present, this tells the debugger to connect to a remote computer using ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: symbolLoadInfo | Explicit control of symbol loading | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: stopAtConnect | If true, the debugger should stop after connecting to the target | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: hardwareBreakpoints | Explicit control of hardware breakpoint behavior for remote targets | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: unknownBreakpointHandling | Controls how breakpoints set externally (usually via raw GDB commands) are ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: debuginfod | Controls GDB's debuginfod behavior for downloading debug symbols from ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: variables | Variables for recursive substitution in this launch configuration | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: deploySteps | Steps needed to deploy the application | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: ignoreRunWithoutDebuggingWarnings | If true, no warning will be logged when run without debugging fails to launch ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| attach: processId | Optional process ID to attach the debugger to | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| attach: processFilter | Optional regular expression used to match remote attach candidates by label, ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |

### 2d. `cppvsdbg` (the Windows debugger)

| Option | What it does | Used | oculus |
|---|---|---|---|
| launch: program | Full path to program executable | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: args | Command line arguments passed to the program | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: cwd | The working directory of the target | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: environment | Environment variables to add to the environment for the program | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: envFile | Absolute path to a file containing environment variable definitions | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: symbolSearchPath | Semicolon separated list of directories to use to search for symbol (that is, ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: stopAtEntry | Optional parameter | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: dumpPath | Optional full path to a dump file for the specified program | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: visualizerFile | .natvis file to be used when debugging this process | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: externalConsole | [Deprecated by 'console'] If true, a console is launched for the debuggee | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: console | Where to launch the debug target | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: sourceFileMap | Optional source file mappings passed to the debug engine | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: enableDebugHeap | If false, the process will be launched with debug heap disabled | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: logging | Optional flags to determine what types of messages should be logged to the ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: requireExactSource | Optional flag to require current source code to match the pdb | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: symbolOptions | Options to control how symbols (.pdb files) are found and loaded | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| launch: ignoreRunWithoutDebuggingWarnings | If true, no warning will be logged when run without debugging fails to launch ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |
| attach: processId | Optional process ID to attach the debugger to | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494); Windows only |

### 2e. `debugpy` (Python)

| Option | What it does | Used | oculus |
|---|---|---|---|
| launch: args | Command line arguments passed to the program | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: autoReload | Configures automatic reload of code on edit | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: console | Where to launch the debug target: internal console, integrated terminal, or ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: cwd | Absolute path to the working directory of the program being debugged | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: debugAdapterPath | Path (fully qualified) to the Python debug adapter executable | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: autoStartBrowser | Open external browser to launch the application | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: django | Django debugging | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: env | Environment variables defined as a key value pair | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: envFile | Absolute path to a file containing environment variable definitions | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: gevent | Enable debugging of gevent monkey-patched code | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: jinja | Jinja template debugging (e.g | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: justMyCode | Debug only user-written code | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: logToFile | Enable logging of debugger events to a log file | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: terminalQuoteCharacter | The quoting character to be used by the debugger when quoting terminal commands | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: module | Name of the module to be debugged | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: pathMappings |  | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: program | Absolute path to the program | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: code | Python code to execute in string form | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: purpose | Tells extension to use this configuration for test debugging, or when using ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: pyramid | Whether debugging Pyramid applications | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: python | Absolute path to the Python interpreter executable; overrides workspace ... | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: pythonArgs | Command-line arguments passed to the Python interpreter | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: redirectOutput | Redirect output | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: showReturnValue | Show return value of functions when stepping | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: stopOnEntry | Automatically stop after launch | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: subProcess | Whether to enable Sub Process debugging | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: sudo | Running debug program under elevated permissions (on Unix) | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: guiEventLoop | The GUI event loop that's going to run | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: consoleName | Display name of the debug console or terminal | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| launch: clientOS | OS that VS code is using | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| attach: connect |  | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| attach: listen |  | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| attach: processId |  | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |
| type `python` (ms-python.python, 27 launch and 14 attach attributes) | the older name of the same debugger | no | excluded: debugging is over cathedra's `rite_dap` only, never lldb (plan.md:495); Python and C++ debuggers not built (plan.md:494) |

## 3. c_cpp_properties.json

VS Code side from `~/.vscode/extensions/ms-vscode.cpptools-1.34.4-darwin-arm64/c_cpp_properties.schema.json` (top level: `configurations`, `env`, `version`, `enableConfigurationSquiggles`; each configuration's properties as listed) and https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference (not fetched; the installed schema was read instead). clangd side from `/usr/bin/clangd --help` (Apple clangd 17.0.0). Used: cathedra's configuration "Mac" sets `includePath`, `defines`, `cStandard` c17, `cppStandard` c++20, `intelliSenseMode` macos-clang-arm64, `compileCommands` build/debug; game-engine's "macOS (missal)" sets `compileCommands` build/debug, `compilerPath` /usr/bin/clang++, `cStandard`, `cppStandard`, `intelliSenseMode`.

oculus's equivalent is D23 with clangd (plan.md:346), not built. Ruled 2026-09-30 (plan.md:348, plan.md:520, plan.md:522): clangd is oculus's own command, from PATH, without `--query-driver`; oculus finds the compile database itself (the root, then `build/*/`, a folder named `debug` first, else the newest), links it from `~/.oculus/lsp/<root>/` and passes that folder to clangd so the index is written there and never into a repository; the status bar names the database with a picker whose choice oculus remembers; `--header-insertion=never`; servers kept 60 s after a page closes; every feature clangd offers (D23 the ones that edit only the open file, D23b the rest, plan.md:349). Today C and C++ are not oculus languages: `data/prose/languages.ts:57-77` registers no `c` or `cpp`, so `state/sources/file-type.ts:60-72` answers `plaintext` for `.c`, `.cpp`, `.h` and `.hpp`, and the editor's grammar table has neither (`ui/controls/editor/kit/grammars.ts:10-29`) and paints any name outside it as plaintext (`:38-40`); a count of the three repositories is in 4l; the draft D23 brief adds both (scratchpad `D23-brief-draft.md:54`, a draft, not a ruling).

| Property | What it does | Used | clangd equivalent | oculus |
|---|---|---|---|---|
| version | schema version | yes (both) | not needed: clangd has no such setting | not needed |
| configurations[].name | names a configuration; Mac, Linux, Win32 picked by platform | yes (both) | none; one compile database per clangd process | planned: the status-bar picker between the compile databases found, plan.md:348 |
| includePath | header search paths, `**` recursive | yes (cathedra) | `-I` in each entry of compile_commands.json, or a line of compile_flags.txt, or `.clangd` `CompileFlags.Add` | planned: D23, from the compile database oculus finds, plan.md:348; a hand list missing |
| defines | preprocessor definitions | yes (cathedra, empty) | `-D` in the compile database; `.clangd` `CompileFlags.Add` | planned: D23, from the compile database oculus finds, plan.md:348 |
| macFrameworkPath | framework search paths on macOS | no | `-F` in the compile database; clang's driver adds the SDK's | planned: D23, from the compile database oculus finds, plan.md:348 |
| compilerPath | the compiler whose built-in includes and defines are read | yes (game-engine) | the driver named in each database entry; clangd runs it only when `--query-driver` allows | planned: no `--query-driver`, plan.md:520 (clangd uses its own built-ins and never runs the database's compiler) |
| compilerArgs | extra compiler arguments | no | arguments in the database; `.clangd` `CompileFlags.Add` and `Remove` | planned: D23, from the compile database oculus finds, plan.md:348; extra flags missing, missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| cStandard | C standard for IntelliSense | yes (both) | `-std=` in the database entry of a .c file | planned: D23, from the compile database oculus finds, plan.md:348 |
| cppStandard | C++ standard for IntelliSense | yes (both) | `-std=` in the database entry | planned: D23, from the compile database oculus finds, plan.md:348 |
| intelliSenseMode | compiler family and architecture to emulate | yes (both) | none; clang parses as the target in the flags | not needed |
| compileCommands | path to compile_commands.json | yes (both) | `--compile-commands-dir=<dir>`; else clangd searches the file's parent folders and their `build/` | planned: oculus finds it (root, `build/*/`, `debug` first, else newest) and links it from `~/.oculus/lsp/<root>/`, plan.md:348 |
| forcedInclude | headers included before every file | no | `-include <file>` in flags or `.clangd` | planned: D23, from the compile database oculus finds, plan.md:348; a hand list missing |
| configurationProvider | an extension (CMake Tools) supplies configurations | no | none; CMake writes compile_commands.json | excluded in effect: CMake tooling not built, plan.md:494; the database CMake writes is what oculus reads |
| mergeConfigurations | merge this file's paths with the provider's | no | not needed: clangd has no such setting | not needed |
| browse.path | folders indexed for workspace symbols and Go to Definition | no | `--background-index` indexes every file in the database | planned: the index under `~/.oculus/lsp/<root>/`, plan.md:348; workspace symbols in D23b, plan.md:349 |
| browse.limitSymbolsToIncludedHeaders | index only included headers | no | none; the index follows the database | not needed |
| browse.databaseFilename | where the symbol database is written | no | the index folder `.cache/clangd/index` beside the database | planned: under `~/.oculus/lsp/<root>/`, never in the repository, plan.md:348 |
| recursiveIncludes.priority | recursive include paths before or after system ones | no | not needed: clangd has no such setting | not needed |
| recursiveIncludes.order | search order of subfolders | no | not needed: clangd has no such setting | not needed |
| recursiveIncludes.reduce (setting `C_Cpp.default.recursiveIncludes.reduce`) | drop unused recursive paths | no | not needed: clangd has no such setting | not needed |
| customConfigurationVariables | values for `${cpptools:activeConfigCustomVariable}` | no | not needed: clangd has no such setting | not needed |
| env | variables usable as `${name}` in this file | no | not needed: clangd has no such setting | not needed |
| enableConfigurationSquiggles | report errors in this file itself | no | clangd reports errors in `.clangd` files it reads | missing: oculus shows no error for a bad compile database; the status bar names the database in use, plan.md:348 |
| windowsSdkVersion | Windows SDK include version | no | not needed: clangd has no such setting | not needed (Windows only) |
| dotConfig | Kconfig .config file of defines | no | not needed: clangd has no such setting | not needed |
| systemIncludePath (setting `C_Cpp.default.systemIncludePath` only) | system header paths | no | `-isystem` in flags, or the driver's | planned: D23, from the compile database oculus finds, plan.md:348 |

### 3a. clangd's own configuration and flags

How clangd is told what c_cpp_properties.json tells cpptools: `compile_commands.json` (per-file commands; written by CMake with `CMAKE_EXPORT_COMPILE_COMMANDS`), `compile_flags.txt` (one flag list for every file of a folder), a `.clangd` YAML file in the repository and `~/Library/Preferences/clangd/config.yaml` (both read by default: `clangd --check` on a scratch file beside a `.clangd` adding `-DZ74PROBE` printed that flag in its command, Apple clangd 17.0.0; `--enable-config` is the flag, `clangd --help`), and the command line below. game-engine passes three flags through `clangd.arguments` (`--compile-commands-dir=${workspaceFolder}/build/debug`, `--background-index`, `--header-insertion=never`).

| clangd input | What it does | Used | oculus |
|---|---|---|---|
| compile_commands.json | per-file compile commands | yes (both) | planned: found by oculus and linked, plan.md:348 |
| compile_flags.txt | one flag list for a folder | no | planned in effect: clangd reads it itself when no database is linked; the draft D23 brief proves clangd on a compile_flags.txt project (draft, `D23-brief-draft.md:38`) |
| .clangd (repository) | CompileFlags, Diagnostics, Index, InlayHints, Hover, Completion blocks | no | planned in effect: clangd reads it itself; oculus neither writes nor overrides it (not ruled) |
| --compile-commands-dir | where to look for the database | yes (game-engine) | planned: `~/.oculus/lsp/<root>/`, plan.md:348 |
| --query-driver | globs of compilers clangd may run for built-ins | no | planned: not passed, plan.md:520 |
| --background-index | index the project and keep it on disk | yes (game-engine) | planned: index kept, written under `~/.oculus/lsp/<root>/`, plan.md:348 |
| --background-index-priority | thread priority of indexing | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --header-insertion=iwyu, never | add #include on completion | yes (game-engine) | planned: never, plan.md:522 |
| --header-insertion-decorators | mark completions that insert an include | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --import-insertions | Objective-C #import insertion | no | not needed |
| --clang-tidy | clang-tidy diagnostics | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` (not passed in the draft D23 brief, `D23-brief-draft.md:42`) |
| --completion-style=detailed, bundled | one item per overload or bundled | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --function-arg-placeholders | argument placeholders in completions | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --all-scopes-completion | complete symbols from other namespaces | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --fallback-style | clang-format style with no .clang-format | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/`; formatting of the open file is in D23 by Z72 (4), plan.md:348 |
| --limit-references, --limit-results, --rename-file-limit | result caps | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --pch-storage=disk, memory | where preambles are kept | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --log=error, info, verbose | stderr verbosity | no | missing; the draft brief keeps the last 4 KiB of stderr (`D23-brief-draft.md:42`) |
| --enable-config | read .clangd and the user config | no | planned in effect: clangd's default |
| --experimental-modules-support | C++ modules | no | missing; would live in oculus's own config (a clangd area of `behavior.yml`) or the repository's `.oculus/` |
| --offset-encoding, --path-mappings, --pretty, --check | protocol and diagnosis switches | no | not needed |

## 4. settings.json

Grouped by VS Code's key prefix. Each group lists every key the installed app or extension registers; groups for features oculus has no step for are one row each in 4r.

### 4a. Text Editor (`editor.*`)

Monaco 0.57 registers these settings (dumped with Node from `node_modules/monaco-editor/esm/vs/editor/common/config/editorConfigurationSchema.js`, the configuration registry after load: 279 `editor.*` and 20 `diffEditor.*`); VS Code adds the ones in the second table (keys registered in `workbench.desktop.main.js`). oculus builds the source editor in `ui/controls/editor/Editor.svelte:168-176` with `automaticLayout`, `glyphMargin`, `readOnly`, `contextmenu`, `detectIndentation`, `ariaLabel`, `model` and the font of `kit/look.ts:22-29`, and changes per model `tabSize`, `indentSize`, `insertSpaces` (`:270-274`, `:326`), and `readOnly` (`:330`), `lineNumbers` and `lineNumbersMinChars` (`:342-343`); `grep -rn updateOptions src/lib/ui/controls/editor` finds only these, `commands.ts:24` (the indentation again) and `kit/look.ts:62` (the font again). Every setting below not named there is left at Monaco's default and has no control in oculus. Settings whose feature needs a language provider are marked for D23. Used: cathedra sets `editor.tabSize` 2 and `editor.insertSpaces` true under `[rite]`; nothing else here is set by either repository.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| editor.acceptSuggestionOnCommitCharacter | Controls whether suggestions should be accepted on commit characters | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.acceptSuggestionOnEnter | Controls whether suggestions should be accepted on `Enter`, in addition to `Tab` | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.accessibilityPageSize | Controls the number of lines in the editor that can be read out by a screen reader ... | no | leaves Monaco's default; not exposed |
| editor.accessibilitySupport | Controls if the UI should run in a mode where it is optimized for screen readers | no | leaves Monaco's default; not exposed |
| editor.allowVariableFonts | Controls whether to allow using variable fonts in the editor | no | leaves Monaco's default; not exposed |
| editor.allowVariableFontsInAccessibilityMode | Controls whether to allow using variable fonts in the editor in the accessibility ... | no | leaves Monaco's default; not exposed |
| editor.allowVariableLineHeights | Controls whether to allow using variable line heights in the editor | no | leaves Monaco's default; not exposed |
| editor.autoClosingBrackets | Controls whether the editor should automatically close brackets after the user adds ... | no | leaves Monaco's default; not exposed |
| editor.autoClosingComments | Controls whether the editor should automatically close comments after the user adds ... | no | leaves Monaco's default; not exposed |
| editor.autoClosingDelete | Controls whether the editor should remove adjacent closing quotes or brackets when ... | no | leaves Monaco's default; not exposed |
| editor.autoClosingOvertype | Controls whether the editor should type over closing quotes or brackets | no | leaves Monaco's default; not exposed |
| editor.autoClosingQuotes | Controls whether the editor should automatically close quotes after the user adds an ... | no | leaves Monaco's default; not exposed |
| editor.autoIndent | Controls whether the editor should automatically adjust the indentation when users ... | no | leaves Monaco's default; not exposed |
| editor.autoIndentOnPaste | Controls whether the editor should automatically auto-indent the pasted content | no | leaves Monaco's default; not exposed |
| editor.autoIndentOnPasteWithinString | Controls whether the editor should automatically auto-indent the pasted content when ... | no | leaves Monaco's default; not exposed |
| editor.autoSurround | Controls whether the editor should automatically surround selections when typing ... | no | leaves Monaco's default; not exposed |
| editor.bracketPairColorization.enabled | Controls whether bracket pair colorization is enabled or not | no | leaves Monaco's default; not exposed |
| editor.bracketPairColorization.independentColorPoolPerBracketType | Controls whether each bracket type has its own independent color pool | no | leaves Monaco's default; not exposed |
| editor.codeLens | Controls whether the editor shows CodeLens | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.codeLensFontFamily | Controls the font family for CodeLens | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.codeLensFontSize | Controls the font size in pixels for CodeLens | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.colorDecorators | Controls whether the editor should render the inline color decorators and color ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.colorDecoratorsActivatedOn | Controls the condition to make a color picker appear from a color decorator | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.colorDecoratorsLimit | Controls the max number of color decorators that can be rendered in an editor at once | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.columnSelection | Enable that the selection with the mouse and keys is doing column selection | no | leaves Monaco's default; not exposed |
| editor.comments.ignoreEmptyLines | Controls if empty lines should be ignored with toggle, add or remove actions for ... | no | leaves Monaco's default; not exposed |
| editor.comments.insertSpace | Controls whether a space character is inserted when commenting | no | leaves Monaco's default; not exposed |
| editor.copyWithSyntaxHighlighting | Controls whether syntax highlighting should be copied into the clipboard | no | leaves Monaco's default; not exposed |
| editor.cursorBlinking | Control the cursor animation style | no | leaves Monaco's default; not exposed |
| editor.cursorHeight | Controls the height of the cursor when `editor.cursorStyle` is set to `line` | no | leaves Monaco's default; not exposed |
| editor.cursorSmoothCaretAnimation | Controls whether the smooth caret animation should be enabled | no | leaves Monaco's default; not exposed |
| editor.cursorStyle | Controls the cursor style in insert input mode | no | leaves Monaco's default; not exposed |
| editor.cursorSurroundingLines | Controls the minimal number of visible leading lines (minimum 0) and trailing lines ... | no | leaves Monaco's default; not exposed |
| editor.cursorSurroundingLinesStyle | Controls when `editor.cursorSurroundingLines` should be enforced | no | leaves Monaco's default; not exposed |
| editor.cursorWidth | Controls the width of the cursor when `editor.cursorStyle` is set to `line` | no | leaves Monaco's default; not exposed |
| editor.defaultColorDecorators | Controls whether inline color decorations should be shown using the default document ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.definitionLinkOpensInPeek | Controls whether the Go to Definition mouse gesture always opens the peek widget | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.detectIndentation | Controls whether `editor.tabSize` and `editor.insertSpaces` will be automatically ... | no | sets: off; oculus detects the indentation itself, `Editor.svelte:173`, `state/workbench/navigation/editor-text.ts:36-63` |
| editor.doubleClickSelectsBlock | Controls whether double-clicking next to a bracket or quote selects the content ... | no | leaves Monaco's default; not exposed |
| editor.dragAndDrop | Controls whether the editor should allow moving selections via drag and drop | no | leaves Monaco's default; not exposed |
| editor.dropIntoEditor.enabled | Controls whether you can drag and drop a file into a text editor by holding down the ... | no | leaves Monaco's default; not exposed |
| editor.dropIntoEditor.showDropSelector | Controls if a widget is shown when dropping files into the editor | no | leaves Monaco's default; not exposed |
| editor.editContext | Sets whether the EditContext API should be used instead of the text area to power ... | no | leaves Monaco's default (on); oculus reads EditContext input as typing, plan.md:329 |
| editor.emptySelectionClipboard | Controls whether copying without a selection copies the current line | no | leaves Monaco's default; not exposed |
| editor.experimental.asyncTokenization | Controls whether the tokenization should happen asynchronously on a web worker | no | leaves Monaco's default; not exposed |
| editor.experimental.asyncTokenizationLogging | Controls whether async tokenization should be logged | no | leaves Monaco's default; not exposed |
| editor.experimental.asyncTokenizationVerification | Controls whether async tokenization should be verified against legacy background ... | no | leaves Monaco's default; not exposed |
| editor.experimental.preferTreeSitter.css | Controls whether tree sitter parsing should be turned on for css | no | leaves Monaco's default; not exposed |
| editor.experimental.preferTreeSitter.ini | Controls whether tree sitter parsing should be turned on for ini | no | leaves Monaco's default; not exposed |
| editor.experimental.preferTreeSitter.regex | Controls whether tree sitter parsing should be turned on for regex | no | leaves Monaco's default; not exposed |
| editor.experimental.preferTreeSitter.typescript | Controls whether tree sitter parsing should be turned on for typescript | no | leaves Monaco's default; not exposed |
| editor.experimental.treeSitterTelemetry | Controls whether tree sitter parsing should be turned on and telemetry collected | no | leaves Monaco's default; not exposed |
| editor.experimentalGpuAcceleration | Controls whether to use the experimental GPU acceleration to render the editor | no | leaves Monaco's default; not exposed |
| editor.experimentalWhitespaceRendering | Controls whether whitespace is rendered with a new, experimental method | no | leaves Monaco's default; not exposed |
| editor.fastScrollSensitivity | Scrolling speed multiplier when pressing `Alt` | no | leaves Monaco's default; not exposed |
| editor.find.addExtraSpaceOnTop | Controls whether the Find Widget should add extra lines on top of the editor | no | leaves Monaco's default; not exposed |
| editor.find.autoFindInSelection | Controls the condition for turning on Find in Selection automatically | no | leaves Monaco's default; not exposed |
| editor.find.closeOnResult | Controls whether the Find Widget closes after an explicit find navigation command ... | no | leaves Monaco's default; not exposed |
| editor.find.cursorMoveOnType | Controls whether the cursor should jump to find matches while typing | no | leaves Monaco's default; not exposed |
| editor.find.findOnType | Controls whether the Find Widget should search as you type | no | leaves Monaco's default; not exposed |
| editor.find.globalFindClipboard | Controls whether the Find Widget should read or modify the shared find clipboard on ... | no | leaves Monaco's default; not exposed |
| editor.find.history | Controls how the find widget history should be stored | no | leaves Monaco's default; not exposed |
| editor.find.loop | Controls whether the search automatically restarts from the beginning (or the end) ... | no | leaves Monaco's default; not exposed |
| editor.find.replaceHistory | Controls how the replace widget history should be stored | no | leaves Monaco's default; not exposed |
| editor.find.seedSearchStringFromSelection | Controls whether the search string in the Find Widget is seeded from the editor ... | no | leaves Monaco's default; not exposed |
| editor.folding | Controls whether the editor has code folding enabled | no | leaves Monaco's default; not exposed |
| editor.foldingHighlight | Controls whether the editor should highlight folded ranges | no | leaves Monaco's default; not exposed |
| editor.foldingImportsByDefault | Controls whether the editor automatically collapses import ranges | no | leaves Monaco's default; not exposed |
| editor.foldingMaximumRegions | The maximum number of foldable regions | no | leaves Monaco's default; not exposed |
| editor.foldingStrategy | Controls the strategy for computing folding ranges | no | leaves Monaco's default; not exposed |
| editor.fontFamily | Controls the font family | no | sets: the `--font-mono` token, `kit/look.ts:26`; not exposed |
| editor.fontLigatures | Configures font ligatures or font features | no | leaves Monaco's default; not exposed |
| editor.fontSize | Controls the font size in pixels | no | sets and exposes: the host's computed size, which follows the Settings text size, `kit/look.ts:23-27`, HELP.md:145 |
| editor.fontVariations | Configures font variations | no | leaves Monaco's default; not exposed |
| editor.fontWeight | Controls the font weight | no | leaves Monaco's default; not exposed |
| editor.formatOnPaste | Controls whether the editor should automatically format the pasted content | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.formatOnType | Controls whether the editor should automatically format the line after typing | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.fullwidthCharacterWidth | Controls the width used to render full-width characters | no | leaves Monaco's default; not exposed |
| editor.glyphMargin | Controls whether the editor should render the vertical glyph margin | no | sets: on, for D11's breakpoints, `Editor.svelte:170` |
| editor.gotoLocation.alternativeDeclarationCommand | Alternative command id that is being executed when the result of 'Go to Declaration' ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.alternativeDefinitionCommand | Alternative command id that is being executed when the result of 'Go to Definition' ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.alternativeImplementationCommand | Alternative command id that is being executed when the result of 'Go to ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.alternativeReferenceCommand | Alternative command id that is being executed when the result of 'Go to Reference' ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.alternativeTypeDefinitionCommand | Alternative command id that is being executed when the result of 'Go to Type ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.multiple | deprecated; the multiple* settings below replace it | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.multipleDeclarations | Controls the behavior the 'Go to Declaration'-command when multiple target locations ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.multipleDefinitions | Controls the behavior the 'Go to Definition'-command when multiple target locations ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.multipleImplementations | Controls the behavior the 'Go to Implementations'-command when multiple target ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.multipleReferences | Controls the behavior the 'Go to References'-command when multiple target locations ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.gotoLocation.multipleTypeDefinitions | Controls the behavior the 'Go to Type Definition'-command when multiple target ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.guides.bracketPairs | Controls whether bracket pair guides are enabled or not | no | leaves Monaco's default; not exposed |
| editor.guides.bracketPairsHorizontal | Controls whether horizontal bracket pair guides are enabled or not | no | leaves Monaco's default; not exposed |
| editor.guides.highlightActiveBracketPair | Controls whether the editor should highlight the active bracket pair | no | leaves Monaco's default; not exposed |
| editor.guides.highlightActiveIndentation | Controls whether the editor should highlight the active indent guide | no | leaves Monaco's default; not exposed |
| editor.guides.indentation | Controls whether the editor should render indent guides | no | leaves Monaco's default; not exposed |
| editor.hideCursorInOverviewRuler | Controls whether the cursor should be hidden in the overview ruler | no | leaves Monaco's default; not exposed |
| editor.hover.above | Prefer showing hovers above the line, if there's space | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.hover.delay | Controls the delay in milliseconds after which the hover is shown | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.hover.enabled | Controls whether the hover is shown | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.hover.hidingDelay | Controls the delay in milliseconds after which the hover is hidden | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.hover.showLongLineWarning | Controls whether long line warning hovers are shown, such as when tokenization is ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.hover.sticky | Controls whether the hover should remain visible when mouse is moved over it | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.indentSize | The number of spaces used for indentation or `"tabSize"` to use the value from ... | no | sets: equal to the tab size, `Editor.svelte:270-274`, `:326` |
| editor.inertialScroll | Make scrolling inertial - mostly useful with touchpad on linux | no | leaves Monaco's default; not exposed |
| editor.inlayHints.enabled | Enables the inlay hints in the editor | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.inlayHints.fontFamily | Controls font family of inlay hints in the editor | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.inlayHints.fontSize | Controls font size of inlay hints in the editor | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.inlayHints.maximumLength | Maximum overall length of inlay hints, for a single line, before they get truncated ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.inlayHints.padding | Enables the padding around the inlay hints in the editor | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.inlineCompletionsAccessibilityVerbose | Controls whether the accessibility hint should be provided to screen reader users ... | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.edits.allowCodeShifting | Controls whether showing a suggestion will shift the code to make space for the ... | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.edits.longDistanceHintContextLineCount | Controls how many lines of surrounding context are shown above and below the target ... | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.edits.renderSideBySide | Controls whether larger suggestions can be shown side by side | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.edits.showCollapsed | Controls whether the suggestion will show as collapsed until jumping to it | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.edits.showLongDistanceHint | Controls whether long distance inline suggestions are shown | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.enabled | Controls whether to automatically show inline suggestions in the editor | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.experimental.emptyResponseInformation | Controls whether to send request information from the inline suggestion provider | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.experimental.showOnSuggestConflict | Controls whether to show inline suggestions when there is a suggest conflict | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.experimental.suppressInlineSuggestions | Suppresses inline completions for specified extension IDs -- comma separated | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.fontFamily | Controls the font family of the inline suggestions | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.minShowDelay | Controls the minimal delay in milliseconds after which inline suggestions are shown ... | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.showToolbar | Controls when to show the inline suggestion toolbar | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.suppressInSnippetMode | Controls whether inline suggestions are suppressed when in snippet mode | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.suppressSuggestions | Controls how inline suggestions interact with the suggest widget | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.syntaxHighlightingEnabled | Controls whether to show syntax highlighting for inline suggestions in the editor | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.inlineSuggest.triggerCommandOnProviderChange | Controls whether to trigger a command when the inline suggestion provider changes | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.insertSpaces | Insert spaces when pressing `Tab` | yes (cathedra, `[rite]`) | sets and exposes: spaces or tabs from the file or the indentation menu, with Convert, `Editor.svelte:270-274`, `commands.ts:22-29`; per-language default planned, D25 plan.md:351 |
| editor.language.brackets | Defines the bracket symbols that increase or decrease the indentation | no | leaves Monaco's default; not exposed |
| editor.language.colorizedBracketPairs | Defines the bracket pairs that are colorized by their nesting level if bracket pair ... | no | leaves Monaco's default; not exposed |
| editor.largeFileOptimizations | Special handling for large files to disable certain memory intensive features | no | leaves Monaco's default; not exposed; oculus paints a file over `editor.paint_limit_kb` as plaintext, `behavior.yml:116-117`, `editor-text.ts:80-82` |
| editor.letterSpacing | Controls the letter spacing in pixels | no | leaves Monaco's default; not exposed |
| editor.lightbulb.enabled | Enables the Code Action lightbulb in the editor | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.lineHeight | Controls the line height | no | sets: 1.45 times the font size, `kit/look.ts:11`, `:28`; not exposed |
| editor.lineNumbers | Controls the display of line numbers | no | sets: on, or the blame column while Blame is on, `Editor.svelte:342-343` |
| editor.linkedEditing | Controls whether the editor has linked editing enabled | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.links | Controls whether the editor should detect links and make them clickable | no | leaves Monaco's default; not exposed |
| editor.matchBrackets | Highlight matching brackets | no | leaves Monaco's default; not exposed |
| editor.maxTokenizationLineLength | Lines above this length will not be tokenized for performance reasons | no | leaves Monaco's default; not exposed; see `editor.paint_limit_kb`, `behavior.yml:116-117` |
| editor.minimap.autohide | Controls whether the minimap is hidden automatically | no | leaves Monaco's default; not exposed |
| editor.minimap.enabled | Controls whether the minimap is shown | no | leaves Monaco's default; not exposed (on); `zones.ts:46-49` sizes line bars around it |
| editor.minimap.markSectionHeaderRegex | Defines the regular expression used to find section headers in comments | no | leaves Monaco's default; not exposed |
| editor.minimap.maxColumn | Limit the width of the minimap to render at most a certain number of columns | no | leaves Monaco's default; not exposed |
| editor.minimap.renderCharacters | Render the actual characters on a line as opposed to color blocks | no | leaves Monaco's default; not exposed |
| editor.minimap.scale | Scale of content drawn in the minimap: 1, 2 or 3 | no | leaves Monaco's default; not exposed |
| editor.minimap.sectionHeaderFontSize | Controls the font size of section headers in the minimap | no | leaves Monaco's default; not exposed |
| editor.minimap.sectionHeaderLetterSpacing | Controls the amount of space (in pixels) between characters of section header | no | leaves Monaco's default; not exposed |
| editor.minimap.showMarkSectionHeaders | Controls whether MARK: comments are shown as section headers in the minimap | no | leaves Monaco's default; not exposed |
| editor.minimap.showRegionSectionHeaders | Controls whether named regions are shown as section headers in the minimap | no | leaves Monaco's default; not exposed |
| editor.minimap.showSlider | Controls when the minimap slider is shown | no | leaves Monaco's default; not exposed |
| editor.minimap.side | Controls the side where to render the minimap | no | leaves Monaco's default; not exposed |
| editor.minimap.size | Controls the size of the minimap | no | leaves Monaco's default; not exposed |
| editor.mouseMiddleClickAction | Controls what happens when middle mouse button is clicked in the editor | no | leaves Monaco's default; not exposed |
| editor.mouseWheelScrollSensitivity | A multiplier to be used on the `deltaX` and `deltaY` of mouse wheel scroll events | no | leaves Monaco's default; not exposed |
| editor.mouseWheelZoom | Zoom the font of the editor when using mouse wheel and holding `Cmd` | no | leaves Monaco's default; not exposed |
| editor.multiCursorLimit | Controls the max number of cursors that can be in an active editor at once | no | leaves Monaco's default; not exposed |
| editor.multiCursorMergeOverlapping | Merge multiple cursors when they are overlapping | no | leaves Monaco's default; not exposed |
| editor.multiCursorModifier | The modifier to be used to add multiple cursors with the mouse | no | leaves Monaco's default; not exposed |
| editor.multiCursorPaste | Controls pasting when the line count of the pasted text matches the cursor count | no | leaves Monaco's default; not exposed |
| editor.occurrencesHighlight | Controls whether occurrences should be highlighted across open files | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.occurrencesHighlightDelay | Controls the delay in milliseconds after which occurrences are highlighted | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.overtypeCursorStyle | Controls the cursor style in overtype input mode | no | leaves Monaco's default; not exposed |
| editor.overtypeOnPaste | Controls whether pasting should overtype | no | leaves Monaco's default; not exposed |
| editor.overviewRulerBorder | Controls whether a border should be drawn around the overview ruler | no | leaves Monaco's default; not exposed |
| editor.padding.bottom | Controls the amount of space between the bottom edge of the editor and the last line | no | leaves Monaco's default; not exposed |
| editor.padding.top | Controls the amount of space between the top edge of the editor and the first line | no | leaves Monaco's default; not exposed |
| editor.parameterHints.cycle | Controls whether the parameter hints menu cycles or closes when reaching the end of ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.parameterHints.enabled | Enables a pop-up that shows parameter documentation and type information as you type | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.pasteAs.enabled | Controls whether you can paste content in different ways | no | leaves Monaco's default; not exposed |
| editor.pasteAs.showPasteSelector | Controls if a widget is shown when pasting content in to the editor | no | leaves Monaco's default; not exposed |
| editor.peekWidgetDefaultFocus | Controls whether to focus the inline editor or the tree in the peek widget | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.quickSuggestions | Controls whether suggestions should automatically show up while typing | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.quickSuggestionsDelay | Controls the delay in milliseconds after which quick suggestions will show up | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.renameOnType | Controls whether the editor auto renames on type | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.renderControlCharacters | Controls whether the editor should render control characters | no | leaves Monaco's default; not exposed |
| editor.renderFinalNewline | Render last line number when the file ends with a newline | no | leaves Monaco's default; not exposed |
| editor.renderLineHighlight | Controls how the editor should render the current line highlight | no | leaves Monaco's default; not exposed |
| editor.renderLineHighlightOnlyWhenFocus | Controls if the editor should render the current line highlight only when the editor ... | no | leaves Monaco's default; not exposed |
| editor.renderRichScreenReaderContent | Whether to render rich screen reader content when the `editor.editContext` setting ... | no | leaves Monaco's default; not exposed |
| editor.renderWhitespace | Controls how the editor should render whitespace characters | no | leaves Monaco's default; not exposed |
| editor.roundedSelection | Controls whether selections should have rounded corners | no | leaves Monaco's default; not exposed |
| editor.rulers | Render vertical rulers after a certain number of monospace characters | no | leaves Monaco's default; not exposed |
| editor.screenReaderAnnounceInlineSuggestion | Control whether inline suggestions are announced by a screen reader | no | leaves Monaco's default; not exposed; oculus has no inline completion provider |
| editor.scrollBeyondLastColumn | Controls the number of extra characters beyond which the editor will scroll ... | no | leaves Monaco's default; not exposed |
| editor.scrollBeyondLastLine | Controls whether the editor will scroll beyond the last line | no | leaves Monaco's default in the source tab; the diff editor sets it off when sized to content, `DiffEditor.svelte:145` |
| editor.scrollOnMiddleClick | Controls whether the editor will scroll when the middle button is pressed | no | leaves Monaco's default; not exposed |
| editor.scrollPredominantAxis | Scroll only along the predominant axis when scrolling both vertically and ... | no | leaves Monaco's default; not exposed |
| editor.scrollbar.horizontal | Controls the visibility of the horizontal scrollbar | no | leaves Monaco's default; not exposed |
| editor.scrollbar.horizontalScrollbarSize | The height of the horizontal scrollbar | no | leaves Monaco's default; not exposed |
| editor.scrollbar.ignoreHorizontalScrollbarInContentHeight | When set, the horizontal scrollbar will not increase the size of the editor's content | no | leaves Monaco's default; not exposed |
| editor.scrollbar.scrollByPage | Controls whether clicks scroll by page or jump to click position | no | leaves Monaco's default; not exposed |
| editor.scrollbar.vertical | Controls the visibility of the vertical scrollbar | no | leaves Monaco's default; not exposed |
| editor.scrollbar.verticalScrollbarSize | The width of the vertical scrollbar | no | leaves Monaco's default; not exposed |
| editor.selectionHighlight | Controls whether the editor should highlight matches similar to the selection | no | leaves Monaco's default; not exposed |
| editor.selectionHighlightMaxLength | Controls how many characters can be in the selection before similar matches are not ... | no | leaves Monaco's default; not exposed |
| editor.selectionHighlightMultiline | Controls whether the editor should highlight selection matches that span multiple ... | no | leaves Monaco's default; not exposed |
| editor.semanticHighlighting.enabled | Controls whether the semanticHighlighting is shown for the languages that support it | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.showDeprecated | Controls strikethrough deprecated variables | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.showFoldingControls | Controls when the folding controls on the gutter are shown | no | leaves Monaco's default; not exposed |
| editor.showUnused | Controls fading out of unused code | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.smartSelect.selectLeadingAndTrailingWhitespace | Whether leading and trailing whitespace should always be selected | no | leaves Monaco's default; not exposed |
| editor.smartSelect.selectSubwords | Whether subwords (like 'foo' in 'fooBar' or 'foo_bar') should be selected | no | leaves Monaco's default; not exposed |
| editor.smoothScrolling | Controls whether the editor will scroll using an animation | no | leaves Monaco's default; not exposed |
| editor.snippetSuggestions | Controls whether snippets are shown with other suggestions and how they are sorted | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.stablePeek | Keep peek editors open even when double-clicking their content or when hitting ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.stickyScroll.defaultModel | Defines the model to use for determining which lines to stick | no | leaves Monaco's default; not exposed |
| editor.stickyScroll.enabled | Shows the nested current scopes during the scroll at the top of the editor | no | leaves Monaco's default; not exposed |
| editor.stickyScroll.maxLineCount | Defines the maximum number of sticky lines to show | no | leaves Monaco's default; not exposed |
| editor.stickyScroll.scrollWithEditor | Enable scrolling of Sticky Scroll with the editor's horizontal scrollbar | no | leaves Monaco's default; not exposed |
| editor.stickyTabStops | Emulate selection behavior of tab characters when using spaces for indentation | no | leaves Monaco's default; not exposed |
| editor.suggest.filterGraceful | Controls whether filtering and sorting suggestions accounts for small typos | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.filteredTypes | deprecated; the suggest.show* settings replace it | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.insertMode | Controls whether words are overwritten when accepting completions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.localityBonus | Controls whether sorting favors words that appear close to the cursor | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.matchOnWordStartOnly | When enabled IntelliSense filtering requires that the first character matches on a ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.preview | Controls whether to preview the suggestion outcome in the editor | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.selectionMode | Controls whether a suggestion is selected when the widget shows | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.shareSuggestSelections | Controls whether remembered suggestion selections are shared between multiple ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showClasses | When enabled IntelliSense shows `class`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showColors | When enabled IntelliSense shows `color`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showConstants | When enabled IntelliSense shows `constant`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showConstructors | When enabled IntelliSense shows `constructor`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showCustomcolors | When enabled IntelliSense shows `customcolor`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showDeprecated | When enabled IntelliSense shows `deprecated`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showEnumMembers | When enabled IntelliSense shows `enumMember`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showEnums | When enabled IntelliSense shows `enum`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showEvents | When enabled IntelliSense shows `event`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showFields | When enabled IntelliSense shows `field`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showFiles | When enabled IntelliSense shows `file`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showFolders | When enabled IntelliSense shows `folder`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showFunctions | When enabled IntelliSense shows `function`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showIcons | Controls whether to show or hide icons in suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showInlineDetails | Controls whether suggest details show inline with the label or only in the details ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showInterfaces | When enabled IntelliSense shows `interface`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showIssues | When enabled IntelliSense shows `issues`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showKeywords | When enabled IntelliSense shows `keyword`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showMethods | When enabled IntelliSense shows `method`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showModules | When enabled IntelliSense shows `module`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showOperators | When enabled IntelliSense shows `operator`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showProperties | When enabled IntelliSense shows `property`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showReferences | When enabled IntelliSense shows `reference`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showSnippets | When enabled IntelliSense shows `snippet`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showStatusBar | Controls the visibility of the status bar at the bottom of the suggest widget | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showStructs | When enabled IntelliSense shows `struct`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showTypeParameters | When enabled IntelliSense shows `typeParameter`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showUnits | When enabled IntelliSense shows `unit`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showUsers | When enabled IntelliSense shows `user`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showValues | When enabled IntelliSense shows `value`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showVariables | When enabled IntelliSense shows `variable`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.showWords | When enabled IntelliSense shows `text`-suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggest.snippetsPreventQuickSuggestions | Controls whether an active snippet prevents quick suggestions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggestFontSize | Font size for the suggest widget | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggestLineHeight | Line height for the suggest widget | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggestOnTriggerCharacters | Controls whether suggestions should automatically show up when typing trigger ... | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.suggestSelection | Controls how suggestions are pre-selected when showing the suggest list | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.tabCompletion | Enables tab completions | no | leaves Monaco's default; the provider arrives with D23 or D23b (plan.md:346, plan.md:349) |
| editor.tabFocusMode | Controls whether the editor receives tabs or defers them to the workbench for ... | no | has its own rule: Escape then Tab leaves the editor, `ui/controls/editor/tab-out.ts`, DESIGN.md:295 |
| editor.tabSize | The number of spaces a tab is equal to | yes (cathedra, `[rite]`) | sets and exposes: per model from the file or the status bar indentation menu (2, 4, 8), `Editor.svelte:270-274`, `:326`, `shell/status/SourceItems.svelte:52-74`, `editor-text.ts:18-22`; a per-language default planned, D25 plan.md:351 |
| editor.trimAutoWhitespace | Remove trailing auto inserted whitespace | no | leaves Monaco's default; not exposed |
| editor.trimWhitespaceOnDelete | Controls whether the editor will also delete the next line's indentation whitespace ... | no | leaves Monaco's default; not exposed |
| editor.unfoldOnClickAfterEndOfLine | Controls whether clicking on the empty content after a folded line will unfold the ... | no | leaves Monaco's default; not exposed |
| editor.unicodeHighlight.allowedCharacters | Defines allowed characters that are not being highlighted | no | leaves Monaco's default; not exposed |
| editor.unicodeHighlight.allowedLocales | Unicode characters that are common in allowed locales are not being highlighted | no | leaves Monaco's default; not exposed |
| editor.unicodeHighlight.ambiguousCharacters | Controls whether characters are highlighted that can be confused with basic ASCII ... | no | leaves Monaco's default; not exposed |
| editor.unicodeHighlight.includeComments | Controls whether characters in comments should also be subject to Unicode ... | no | leaves Monaco's default; not exposed |
| editor.unicodeHighlight.includeStrings | Controls whether characters in strings should also be subject to Unicode highlighting | no | leaves Monaco's default; not exposed |
| editor.unicodeHighlight.invisibleCharacters | Controls whether characters that just reserve space or have no width at all are ... | no | leaves Monaco's default; not exposed |
| editor.unicodeHighlight.nonBasicASCII | Controls whether all non-basic ASCII characters are highlighted | no | leaves Monaco's default; not exposed |
| editor.unusualLineTerminators | Remove unusual line terminators that might cause problems | no | leaves Monaco's default; not exposed |
| editor.useTabStops | Spaces and tabs are inserted and deleted in alignment with tab stops | no | leaves Monaco's default; not exposed |
| editor.wordBasedSuggestions | Controls whether completions should be computed based on words in the document and ... | no | leaves Monaco's default; completion from language servers in D23 (plan.md:348) |
| editor.wordBreak | Controls the word break rules used for Chinese/Japanese/Korean (CJK) text | no | leaves Monaco's default; not exposed |
| editor.wordSegmenterLocales | Locales to be used for word segmentation when doing word related navigations or ... | no | leaves Monaco's default; not exposed |
| editor.wordSeparators | Characters that will be used as word separators when doing word related navigations ... | no | leaves Monaco's default; not exposed |
| editor.wordWrap | Controls how lines should wrap | no | leaves Monaco's default; not exposed; missing as a control (location `behavior.yml` `editor:` area (`behavior.yml:116-117`) or `appearance.yml`) |
| editor.wordWrapColumn | Controls the wrapping column of the editor when `editor.wordWrap` is ... | no | leaves Monaco's default; not exposed |
| editor.wordWrapIndicator | Controls whether an indicator is rendered at the wrapping column of lines that wrap | no | leaves Monaco's default; not exposed |
| editor.wrapOnEscapedLineFeeds | Controls whether literal `\n` shall trigger a wordWrap when `editor.wordWrap` is ... | no | leaves Monaco's default; not exposed |
| editor.wrappingIndent | Controls the indentation of wrapped lines | no | leaves Monaco's default; not exposed |
| editor.wrappingStrategy | Controls the algorithm that computes wrapping points | no | leaves Monaco's default; not exposed |

VS Code-only `editor.*` settings (not in Monaco):

| Setting | What it does | Used | oculus |
|---|---|---|---|
| editor.formatOnSave | format the file when it is saved | no | missing; formatting of the open file is in D23 (plan.md:348); format on save would live in `behavior.yml` `editor:` area (`behavior.yml:116-117`) or `appearance.yml` or the per-language settings of D25 |
| editor.formatOnSaveMode | whole file or modified lines only | no | missing; same location |
| editor.codeActionsOnSave | code actions run at save (organize imports, fix all) | no | missing; code actions are D23b (plan.md:349) |
| editor.defaultFormatter | which extension formats a language | no | not needed: one server per language (plan.md:346) |
| editor.codeActions.triggerOnFocusChange | run code actions when focus leaves | no | missing; D23b |
| editor.codeActionWidget.includeNearbyQuickFixes | quick fixes near the caret | no | planned: D23b, plan.md:349 |
| editor.codeActionWidget.showHeaders | group headers in the action menu | no | planned: D23b, plan.md:349 |
| editor.rename.enablePreview | preview a rename before applying | no | planned in part: rename in D23b through oculus's write chain (plan.md:349); a preview not ruled |
| editor.snippets.codeActions.enabled | snippets as code actions | no | missing |
| editor.tokenColorCustomizations | override syntax colours | no | has in part: `code_theme:` picks the syntax colours, `appearance.yml:64-66`, DESIGN.md:289; per-scope overrides missing |
| editor.semanticTokenColorCustomizations | override semantic token colours | no | missing; would live in `appearance.yml` beside `code_theme:` |

### 4b. Diff editor (`diffEditor.*`)

oculus builds every single-file diff in `ui/controls/editor/DiffEditor.svelte:128-148` (D13b, plan.md:333). The rows it does not name are left at Monaco's default with no control.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| diffEditor.codeLens | Controls whether the editor shows CodeLens | no | leaves Monaco's default; not exposed |
| diffEditor.diffAlgorithm | the diff algorithm: legacy or advanced | no | leaves Monaco's default; not exposed |
| diffEditor.experimental.showEmptyDecorations | Controls whether the diff editor shows empty decorations to see where characters got ... | no | leaves Monaco's default; not exposed |
| diffEditor.experimental.showMoves | Controls whether the diff editor should show detected code moves | no | leaves Monaco's default; not exposed |
| diffEditor.experimental.useTrueInlineView | If enabled and the editor uses the inline view, word changes are rendered inline | no | leaves Monaco's default; not exposed |
| diffEditor.hideOriginalLineNumbers | Controls whether original line numbers are hidden in inline diffs | no | leaves Monaco's default; not exposed |
| diffEditor.hideUnchangedRegions.contextLineCount | Controls how many lines are used as context when comparing unchanged regions | no | sets: the caller's `context`, `DiffEditor.svelte:140`, `DiffSection.svelte:263` |
| diffEditor.hideUnchangedRegions.enabled | Controls whether the diff editor shows unchanged regions | no | sets: on except for a line-endings-only diff, `DiffEditor.svelte:138-142`, `views/sources/repositories/diff/DiffSection.svelte:264` |
| diffEditor.hideUnchangedRegions.minimumLineCount | Controls how many lines are used as a minimum for unchanged regions | no | sets: 1, `DiffEditor.svelte:99`, `:141` |
| diffEditor.hideUnchangedRegions.revealLineCount | Controls how many lines are used for unchanged regions | no | leaves Monaco's default; not exposed |
| diffEditor.ignoreTrimWhitespace | When enabled, the diff editor ignores changes in leading or trailing whitespace | no | sets: off (whitespace changes shown), `DiffEditor.svelte:134` |
| diffEditor.maxComputationTime | Timeout in milliseconds after which diff computation is cancelled | no | sets: 0 (no timeout), `DiffEditor.svelte:137` |
| diffEditor.maxFileSize | Maximum file size in MB for which to compute diffs | no | leaves Monaco's default; not exposed |
| diffEditor.renderGutterMenu | When enabled, the diff editor shows a special gutter for revert and stage actions | no | sets: off, `DiffEditor.svelte:135` |
| diffEditor.renderIndicators | Controls whether the diff editor shows +/- indicators for added/removed changes | no | leaves Monaco's default; not exposed |
| diffEditor.renderMarginRevertIcon | When enabled, the diff editor shows arrows in its glyph margin to revert changes | no | sets: off, `DiffEditor.svelte:136` |
| diffEditor.renderSideBySide | Controls whether the diff editor shows the diff side by side or inline | no | sets and exposes: Side by Side or Inline, `DiffEditor.svelte:132`, `:285` |
| diffEditor.renderSideBySideInlineBreakpoint | If the diff editor width is smaller than this value, the inline view is used | no | leaves Monaco's default; not exposed |
| diffEditor.useInlineViewWhenSpaceIsLimited | If enabled and the editor width is too small, the inline view is used | no | sets: off, `DiffEditor.svelte:133` |
| diffEditor.wordWrap | word wrap inside the diff editor | no | leaves Monaco's default; not exposed |

### 4c. Files (`files.*`)

Keys registered in `workbench.desktop.main.js` (21 found as `"files.x":{`, 8 more registered through constants and found by name). Used: cathedra sets `files.associations` `{ "*.rite": "rite" }`.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| files.associations | map file patterns to languages | yes (cathedra) | has in code, not config: the extension map of `state/sources/file-type.ts:28-45` and highlight.js aliases; `.rite` to rite in oculus's own config planned, D26 plan.md:352; a general map missing, location `behavior.yml` (a files area) or `sources.yml` |
| files.autoGuessEncoding | When enabled, the editor will attempt to guess the character set encoding when ... | no | missing: every file is read and written as UTF-8, `config/text/statusbar.yml:66-67`, `shell/status/SourceItems.svelte:89-96` |
| files.autoSave | Controls auto save of editors that have unsaved changes | no | missing for source files: Save on the pane bar, `views/sources/source/Source.svelte:332`; scratch notes save after `notes.autosave_ms`, `behavior.yml:128-129`; location `behavior.yml` (a files area) or `sources.yml` |
| files.autoSaveDelay | Controls the delay in milliseconds after which an editor with unsaved changes is ... | no | missing; notes only (`behavior.yml:128-129`) |
| files.autoSaveWhenNoErrors | When enabled, will limit auto save of editors to files that have no errors reported ... | no | missing |
| files.autoSaveWorkspaceFilesOnly | When enabled, will limit auto save of editors to files that are inside the opened ... | no | missing |
| files.candidateGuessEncodings | List of character set encodings that the editor should attempt to guess in the order ... | no | missing: UTF-8 only (same lines) |
| files.defaultLanguage | The default language identifier that is assigned to new files | no | missing: there is no new untitled file (vscode-parity.md:264) |
| files.dialog.defaultPath | Default path for file dialogs, overriding user's home path | no | missing: no file dialogs |
| files.enableTrash | Moves files/folders to the OS trash (recycle bin on Windows) when deleting | no | planned: delete to the macOS Trash through `trash`, X3a plan.md:165 |
| files.encoding | The default character set encoding to use when reading and writing files | no | has, fixed: UTF-8, `statusbar.yml:66-67`; not configurable |
| files.eol | The default end of line character | no | has, fixed: a file keeps its own ending, a new ending from the status bar, `editor-text.ts:66-68`, `commands.ts:30-31`; no default setting |
| files.exclude | hide files and folders from the explorer and search | no | has in part: dotfiles, `node_modules`, `__pycache__`, `.git` hidden unless the Files toggle asks, `server/files/fs.ts:80`, `:266`, `state/sources/fs.ts:62-65`; the list is code, not config; location `behavior.yml` (a files area) or `sources.yml` |
| files.hotExit | keep unsaved editors across a restart | no | has, fixed: an unsaved edit is kept in the browser's storage and laid over the disk's copy after a reload, `state/sessions/source.svelte.ts:206-210`, `:231-233` |
| files.insertFinalNewline | When enabled, insert a final new line at the end of the file when saving it | no | missing; location `behavior.yml` (a files area) or `sources.yml` or D25's per-language settings |
| files.openTimeline | the Timeline view for a file | no | see vscode-parity.md:67 (Timeline, X3) |
| files.participants.timeout | Timeout in milliseconds after which file participants for create, rename, and delete ... | no | missing: no create or rename participants |
| files.readonlyExclude | exempt files from readonlyInclude | no | missing |
| files.readonlyFromPermissions | read-only when the file mode says so | no | has, fixed: a file this machine's mode locks opens read-only, `Source.svelte:20-23`, HELP.md:156 |
| files.readonlyInclude | mark matching files read-only | no | missing; location `behavior.yml` (a files area) or `sources.yml` |
| files.refactoring.autoSave | Controls if files that were part of a refactoring are saved automatically | no | missing; rename across files is D23b (plan.md:349) |
| files.restoreUndoStack | Restore the undo stack when a file is reopened | no | has in part: undo lasts while the tab stays mounted, which a tab switch keeps (`shell/panes/PaneView.svelte:9-12`); a page switch, a reload or a close makes the model again (`shell/Workbench.svelte:272-274`, `Editor.svelte:260-291`) and the undo stack is gone; missing beyond that, no step |
| files.saveConflictResolution | A save conflict can occur when a file is saved to disk that was changed by another ... | no | missing: a save sends root, path and content only (`state/sessions/source.svelte.ts:338`) and the server writes it over the file with no check that the disk changed since the read (`server/files/source.ts:117-149`); no step |
| files.simpleDialog.enable | Enables the simple file dialog for opening and saving files and folders | no | missing: no file dialogs |
| files.trimFinalNewlines | When enabled, will trim all new lines after the final new line at the end of the ... | no | missing; same location |
| files.trimTrailingWhitespace | When enabled, will trim trailing whitespace when saving a file | no | missing on save; Monaco's Trim Trailing Whitespace action is in the palette (`chords.ts:46`) |
| files.trimTrailingWhitespaceInRegexAndStrings | When enabled, trailing whitespace will be removed from multiline strings and regexes ... | no | missing |
| files.watcherExclude | Configure paths or glob patterns to exclude from file watching | no | missing; the tree reads a folder when opened, `server/files/fs.ts:10-16` |
| files.watcherInclude | Configure extra paths to watch for changes inside the workspace | no | missing |

### 4d. Search (`search.*`)

oculus's Search view runs the bundled ripgrep (`server/files/search.ts`, arguments in `data/helpers/search.ts:102-114`), with word, case and regex toggles and `search.max_hits` and `search.timeout_s` in `behavior.yml:146-148`; files over 2 MB and hidden files are skipped (`search.ts:25-29`, HELP.md:164).

| Setting | What it does | Used | oculus |
|---|---|---|---|
| search.actionsPosition | Controls the positioning of the actionbar on rows in the Search view | no | missing |
| search.collapseResults | Controls whether the search results will be collapsed or expanded | no | missing |
| search.decorations.badges | Controls whether search file decorations should use badges | no | missing |
| search.decorations.colors | Controls whether search file decorations should use colors | no | missing |
| search.defaultViewMode | Controls the default search result view mode | no | missing |
| search.exclude | hide paths from search results | no | has in part: `node_modules`, `.git`, `.svelte-kit` always skipped, `data/helpers/search.ts:28-29`; a configurable list missing, location `behavior.yml` `search:` (`behavior.yml:146-148`) |
| search.experimental.closedNotebookRichContentResults | Show notebook editor rich content results for closed notebooks | no | missing (search editor, notebook or AI search: no counterpart) |
| search.experimental.useIgnoreFilesInFindFiles | When enabled, the legacy `findFiles` extension API honors the user's ... | no | missing (search editor, notebook or AI search: no counterpart) |
| search.followSymlinks | Controls whether to follow symlinks while searching | no | has, fixed: ripgrep's default (no `--follow` in `search.ts:102-114`) |
| search.globalFindClipboard | Controls whether the Search view should read or modify the shared find clipboard on ... | no | missing |
| search.maxResults | Controls the maximum number of search results, this can be set to `null` (empty) to ... | no | has: `search.max_hits`, `behavior.yml:147` |
| search.mode | search in the view or a new editor | no | missing: no search editor |
| search.quickAccess.preserveInput | Controls whether the last typed input to Quick Search should be restored when ... | no | missing |
| search.quickOpen.history.filterSortOrder | Controls sorting order of editor history in quick open when filtering | no | missing |
| search.quickOpen.includeHistory | Whether to include results from recently opened files in the file results for Quick ... | no | missing; the palette (HELP.md:90) is the quick open |
| search.quickOpen.includeSymbols | Whether to include results from a global symbol search in the file results for Quick ... | no | planned in effect: workspace symbols are D23b, plan.md:349 |
| search.ripgrep.maxThreads | Number of threads to use for searching | no | missing; location `behavior.yml` `search:` (`behavior.yml:146-148`) |
| search.searchEditor.defaultNumberOfContextLines | The default number of surrounding context lines to use when creating new Search ... | no | missing (search editor, notebook or AI search: no counterpart) |
| search.searchEditor.doubleClickBehaviour | Configure effect of double-clicking a result in a search editor | no | missing (search editor, notebook or AI search: no counterpart) |
| search.searchEditor.focusResultsOnSearch | When a search is triggered, focus the Search Editor results instead of the Search ... | no | missing (search editor, notebook or AI search: no counterpart) |
| search.searchEditor.reusePriorSearchConfiguration | When enabled, new Search Editors will reuse the includes, excludes, and flags of the ... | no | missing (search editor, notebook or AI search: no counterpart) |
| search.searchEditor.singleClickBehaviour | Configure effect of single-clicking a result in a search editor | no | missing (search editor, notebook or AI search: no counterpart) |
| search.searchOnType | Search all files as you type | no | has, fixed off: typing runs nothing, HELP.md:168 |
| search.searchOnTypeDebouncePeriod | When {0} is enabled, controls the timeout in milliseconds between a character being ... | no | not needed (no search on type) |
| search.searchView.keywordSuggestions | Enable keyword suggestions in the Search view | no | missing (search editor, notebook or AI search: no counterpart) |
| search.searchView.semanticSearchBehavior | Controls the behavior of the semantic search results displayed in the Search view | no | missing (search editor, notebook or AI search: no counterpart) |
| search.seedOnFocus | Update the search query to the editor's selected text when focusing the Search view | no | missing |
| search.seedWithNearestWord | Enable seeding search from the word nearest the cursor when the active editor has no ... | no | missing |
| search.showLineNumbers | Controls whether to show line numbers for search results | no | has, fixed: every hit row shows its line number, `views/sources/search/Results.svelte:79` |
| search.smartCase | Search case-insensitively if the pattern is all lowercase, otherwise, search ... | no | missing: the `case` toggle only, `search.ts:112` |
| search.sortOrder | Controls sorting order of search results | no | missing |
| search.useGlobalIgnoreFiles | Controls whether to use your global gitignore file (for example, from ... | no | has, fixed: on; the arguments (`data/helpers/search.ts:103-113`) pass no `--no-ignore-global`, and ripgrep 15.0.0 then respects git's `core.excludesFile` (its `--help`, run from `@vscode/ripgrep`) |
| search.useIgnoreFiles | Controls whether to use `.gitignore` and `.ignore` files when searching for files | no | has, fixed: ripgrep honours `.gitignore` and `.ignore`, HELP.md:164 |
| search.useParentIgnoreFiles | Controls whether to use `.gitignore` and `.ignore` files in parent directories when ... | no | has, fixed: on; the arguments (`data/helpers/search.ts:103-113`) pass no `--no-ignore-parent`, and ripgrep 15.0.0 then reads ignore files of parent directories (its `--help`) |
| search.useReplacePreview | Controls whether to open Replace Preview when selecting or replacing a match | no | missing: no replace |

### 4e. Explorer (`explorer.*`)

The explorer rows are in vscode-parity.md:46-69; X3a (plan.md:165) owns the gaps.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| explorer.autoOpenDroppedFile | Controls whether the Explorer should automatically open a file when it is dropped ... | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.autoReveal | Controls whether the Explorer should automatically reveal and select files when ... | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.autoRevealExclude | Configure paths or glob patterns for excluding files and folders from being revealed ... | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.compactFolders | Controls whether the Explorer should render folders in a compact form | no | planned: X3a (vscode-parity.md:60) |
| explorer.confirmDelete | Controls whether the Explorer should ask for confirmation when deleting files and ... | no | planned: X3a delete to trash, plan.md:165 (confirm not ruled) |
| explorer.confirmDragAndDrop | Controls whether the Explorer should ask for confirmation to move files and folders ... | no | planned: X3a (confirm not ruled) |
| explorer.confirmPasteNative | Controls whether the Explorer should ask for confirmation when pasting native files ... | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.confirmUndo | Controls whether the Explorer should ask for confirmation when undoing | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.copyPathSeparator | The path separation character used when copying file paths | no | not needed (one platform) |
| explorer.copyRelativePathSeparator | The path separation character used when copying relative file paths | no | not needed (one platform) |
| explorer.decorations.badges | Controls whether file decorations should use badges | no | planned: X3a git decorations (vscode-parity.md:58) |
| explorer.decorations.colors | Controls whether file decorations should use colors | no | planned: X3a (vscode-parity.md:58) |
| explorer.enableDragAndDrop | Controls whether the Explorer should allow to move files and folders via drag and ... | no | planned: X3a move by drag (vscode-parity.md:52) |
| explorer.enableUndo | Controls whether the Explorer should support undoing file and folder operations | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.excludeGitIgnore | Controls whether entries in .gitignore should be parsed and excluded from the ... | no | has: ignored entries hidden unless the Files toggle asks, `state/sources/fs.ts:62-65`, `server/files/fs.ts:10-16` |
| explorer.expandSingleFolderWorkspaces | Controls whether the Explorer should expand multi-root workspaces containing only ... | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.fileNesting.enabled | Controls whether file nesting is enabled in the Explorer | no | planned: X3a, nesting patterns in a new catalog `config/catalogs/file-nesting.yml`, plan.md:165, plan.md:414 |
| explorer.fileNesting.expand | Controls whether file nests are automatically expanded | no | planned: X3a, plan.md:165 |
| explorer.fileNesting.patterns | Controls nesting of files in the Explorer | no | planned: X3a, `config/catalogs/file-nesting.yml`, plan.md:414 |
| explorer.incrementalNaming | Controls which naming strategy to use when giving a new name to a duplicated ... | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.openEditors.minVisible | The minimum number of editor slots pre-allocated in the Open Editors pane | no | planned: X3a (vscode-parity.md:65) |
| explorer.openEditors.sortOrder | Controls the sorting order of editors in the Open Editors pane | no | planned: X3a (vscode-parity.md:65) |
| explorer.openEditors.visible | The initial maximum number of editors shown in the Open Editors pane | no | planned: X3a Open Editors (vscode-parity.md:65) |
| explorer.sortOrder | Controls the property-based sorting of files and folders in the Explorer | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.sortOrderLexicographicOptions | Controls the lexicographic sorting of file and folder names in the Explorer | no | missing; would live in `layout.yml` or the Files view's own state |
| explorer.sortOrderReverse | Controls whether the file and folder sort order, should be reversed | no | missing; would live in `layout.yml` or the Files view's own state |

### 4f. Editor management and tabs (`workbench.editor.*`)

The tab rows are in vscode-parity.md:96-107 and the pane header menu at :260-271; X3c (plan.md:173) and Z70 (plan.md:256) own the gaps.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| workbench.editor.alwaysShowEditorActions | Controls whether to always show the editor actions, even when the editor group is ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.autoLockGroups | If an editor matching one of the listed types is opened as the first in an editor ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.centeredLayoutAutoResize | Controls if the centered layout should automatically resize to maximum width when ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.centeredLayoutFixedWidth | Controls whether the centered layout tries to maintain constant width when the ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.closeEmptyGroups | Controls the behavior of empty editor groups when the last tab in the group is closed | no | has, fixed: an empty pane stays (HELP.md:43 offers Close) |
| workbench.editor.closeOnFileDelete | Controls whether editors showing a file that was opened during the session should ... | no | missing: nothing closes the tab; a save over a file that is gone answers "the file is not there" (`server/files/source.ts:131-132`); oculus deletes no file until X3a (plan.md:165, vscode-parity.md:51) |
| workbench.editor.decorations.badges | Controls whether editor file decorations should use badges | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.decorations.colors | Controls whether editor file decorations should use colors | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.defaultBinaryEditor | The default editor for files detected as binary | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.doubleClickTabToToggleEditorGroupSizes | Controls how the editor group is resized when double clicking on a tab | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.dragToOpenWindow | Controls if editors can be dragged out of the window to open them in a new window | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.editorActionsLocation | Controls where the editor actions are shown | no | planned: `editor_actions: strip / hidden` in `appearance.yml`, Z70, plan.md:256 |
| workbench.editor.empty.hint | Controls if the empty editor text hint should be visible in the editor | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.enablePreview | Controls whether preview mode is used when editors open | no | has, always on: preview tabs, HELP.md:158; not configurable |
| workbench.editor.enablePreviewFromCodeNavigation | Controls whether editors remain in preview when a code navigation is started from ... | no | planned in effect with D23 go to definition (plan.md:346); not ruled |
| workbench.editor.enablePreviewFromQuickOpen | Controls whether editors opened from Quick Open show as preview editors | no | missing: oculus has no Quick Open for files; the palette lists views, projects, collection and feed entries (HELP.md:90); no step |
| workbench.editor.focusRecentEditorAfterClose | Controls whether editors are closed in most recently used order or from left to right | no | has, fixed: the neighbour in strip order takes the focus (VS Code's `false`), `state/workbench/layout/tree.ts:167-169`; most recently used order missing, no step |
| workbench.editor.highlightModifiedTabs | Controls whether a top border is drawn on tabs for editors that have unsaved changes | no | has, fixed: the unsaved dot, HELP.md:45 |
| workbench.editor.historyBasedLanguageDetection | Enables use of editor history in language detection | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.labelFormat | Controls the format of the label for an editor | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.languageDetection | Controls whether the language in a text editor is automatically detected unless the ... | no | missing: the language comes from the file name, `file-type.ts:60-72` |
| workbench.editor.languageDetectionHints | When enabled, shows a status bar Quick Fix when the editor language doesn't match ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.limit.enabled | Controls if the number of opened editors should be limited or not | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.limit.excludeDirty | Controls if the maximum number of opened editors should exclude dirty editors for ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.limit.perEditorGroup | Controls if the limit of maximum opened editors should apply per editor group or ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.limit.value | Controls the maximum number of opened editors | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.navigationScope | Controls the scope of history navigation in editors for commands such as 'Go Back' ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.openPositioning | Controls where editors open | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.openSideBySideDirection | Controls the default direction of editors that are opened side by side (for example, ... | no | has in part: Split right on the strip (HELP.md:45); a direction setting missing |
| workbench.editor.pinnedTabSizing | Controls the size of pinned editor tabs | no | planned: pinned tabs, X3c, plan.md:173 |
| workbench.editor.pinnedTabsOnSeparateRow | When enabled, displays pinned tabs in a separate row above all other tabs | no | planned in part: X3c pinned tabs, plan.md:173; separate row not ruled |
| workbench.editor.preferHistoryBasedLanguageDetection | When enabled, a language detection model that takes into account editor history will ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.preventPinnedEditorClose | Controls whether pinned editors should close when keyboard or middle mouse click is ... | no | planned in part: X3c, plan.md:173 |
| workbench.editor.restoreEditors | Controls whether editors are restored on startup | no | has, fixed: the layout is saved as changed, HELP.md:47 |
| workbench.editor.restoreViewState | Restores the last editor view state (such as scroll position) when re-opening ... | no | has in part: a tab switch keeps the view mounted with its scroll and caret (`shell/panes/PaneView.svelte:9-12`); a page switch or a reload mounts the view again (`shell/Workbench.svelte:272-274`) and a closed file reopens at the top; missing beyond that, no step |
| workbench.editor.revealIfOpen | Controls whether an editor is revealed in any of the visible groups if opened | no | has, fixed: on; a file open anywhere on the page is activated in its pane, `state/workbench/layout/open/opening.ts:169-193`, keyed by root and path (`layout/instance.ts:97-104`) |
| workbench.editor.scrollToSwitchTabs | Controls whether scrolling over tabs will open them or not | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.sharedViewState | Preserves the most recent editor view state (such as scroll position) across all ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.showIcons | Controls whether opened editors should show with an icon or not | no | planned: X3a file icons from seti-ui, plan.md:165 |
| workbench.editor.showTabIndex | When enabled, will show the tab index | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.showTabs | Controls whether opened editors should show as individual tabs, one single large tab ... | no | planned: `show_tabs: multiple / single / none` in `appearance.yml`, Z70, plan.md:256 |
| workbench.editor.splitInGroupLayout | Controls the layout for when an editor is split in an editor group to be either ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.splitOnDragAndDrop | Controls if editor groups can be split from drag and drop operations by dropping an ... | no | has: splitting by drag (vscode-parity.md:104) |
| workbench.editor.splitSizing | Controls the size of editor groups when splitting them | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.swipeToNavigate | Navigate between open files using three-finger swipe horizontally | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.tabActionCloseVisibility | Controls the visibility of the tab close action button | no | has, fixed: close on the shown tab and under the pointer, HELP.md:45 |
| workbench.editor.tabActionLocation | Controls the position of the editor's tabs action buttons (close, unpin) | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.tabActionReserveSpace | Controls whether Modern UI editor tabs always reserve space for tab action buttons | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.tabActionUnpinVisibility | Controls the visibility of the tab unpin action button | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.tabSizing | Controls the size of editor tabs | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.tabSizingFixedMaxWidth | Controls the maximum width of tabs when {0} size is set to {1} | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.tabSizingFixedMinWidth | Controls the minimum width of tabs when {0} size is set to {1} | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.titleScrollbarSizing | Controls the height of the scrollbars used for tabs and breadcrumbs in the editor ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.titleScrollbarVisibility | Controls the visibility of the scrollbars used for tabs and breadcrumbs in the ... | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.untitled.labelFormat | Controls the format of the label for an untitled editor | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.useModal | Controls whether editors open in a modal overlay | no | missing; would live in `appearance.yml` or `layout.yml` beside the X3c keys |
| workbench.editor.wrapTabs | Controls whether tabs should be wrapped over multiple lines when exceeding available ... | no | planned: `wrap_tabs: false` in `appearance.yml`, X3c, plan.md:173 |

### 4g. Terminal (`terminal.integrated.*`)

The terminal rows are in vscode-parity.md:165-199 (Q89, landed); a terminal is xterm over tmux (`server/machine/pty/tmux.ts:1-14`), built in `views/sessions/terminal/TerminalGrid.svelte` with the fit, search, web-links and unicode11 addons (`:263-276`) and the options of `grid-look.ts:60-66`.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| terminal.integrated.accessibleViewFocusOnCommandExecution | Focus the terminal accessible view when a command is executed | no | missing (no accessible view) |
| terminal.integrated.accessibleViewPreserveCursorPosition | Controls whether the cursor position is preserved in the terminal's accessible view | no | missing (no accessible view) |
| terminal.integrated.agentHostProfile.linux | The terminal profile to use on Linux for agent host terminals, including shells ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.agentHostProfile.osx | The terminal profile to use on macOS for agent host terminals, including shells ... | no | has in part: the composer's agent kinds (same) |
| terminal.integrated.agentHostProfile.windows | The terminal profile to use on Windows for agent host terminals, including shells ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.allowChords | Whether or not to allow chord keybindings in the terminal | no | not needed: oculus's chords are plain letters, which a focused grid sends to the shell (`shell/keys/keys.ts:113-115`, `workbench-keys.svelte.ts:418-425`) |
| terminal.integrated.allowInUntrustedWorkspace | Controls whether terminals can be created in an untrusted workspace | no | not needed: no workspace trust |
| terminal.integrated.allowMnemonics | Whether to allow menubar mnemonics (for example Alt+F) to trigger the open of the ... | no | not needed (no menubar) |
| terminal.integrated.allowedLinkSchemes | An array of strings containing the URI schemes that the terminal is allowed to open ... | no | has in part: URLs through the web-links addon, `TerminalGrid.svelte:275`; the scheme list is code |
| terminal.integrated.altClickMovesCursor | If enabled, alt/option + click will reposition the prompt cursor to underneath the ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.autoReplies | A set of messages that, when encountered in the terminal, will be automatically ... | no | missing |
| terminal.integrated.automationProfile.linux | The terminal profile to use on Linux for automation-related terminal usage like ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.automationProfile.osx | The terminal profile to use on macOS for automation-related terminal usage like ... | no | has in part: update tasks and LaTeX run in tmux terminals, `routes.ts:277-313`, `:322-325` |
| terminal.integrated.automationProfile.windows | The terminal profile to use for automation-related terminal usage like tasks and ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.bellDuration | The number of milliseconds to show the bell within a terminal tab when triggered | no | has, fixed: 1000 ms, `views/sessions/terminal/terminal-list.ts:31-32` |
| terminal.integrated.commandsToSkipShell | A set of command IDs whose keybindings will not be sent to the shell but instead ... | no | has, fixed: the workbench counts the grid's textarea as typing (`shell/keys/workbench-keys.svelte.ts:418-425`) and xterm stops each key it sends to the shell (`@xterm/xterm` 6.0.0 `lib/xterm.js`, `_keyDown` ends in `cancel(e,!0)`), so with the grid focused the workbench takes only Cmd-K or Ctrl-K (`workbench-keys.svelte.ts:93-98`), Ctrl+1, Ctrl+2 and Ctrl+9 (`shell/keys/keys.ts:92-94`; xterm sends Ctrl+3 to Ctrl+8 to the shell), the find keys (`TerminalGrid.svelte:279-287`) and the menu keys (`terminal-list.ts:158-164`); no list to change |
| terminal.integrated.confirmOnExit | Controls whether to confirm when the window closes if there are active terminal ... | no | not needed: terminals survive the page in tmux |
| terminal.integrated.confirmOnKill | Controls whether to confirm killing terminals when they have child processes | no | has, fixed: stopping asks first (DESIGN.md:148) |
| terminal.integrated.copyOnSelection | Controls whether text selected in the terminal will be copied to the clipboard | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.cursorBlinking | Controls whether the terminal cursor blinks | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.cursorStyle | Controls the style of terminal cursor when the terminal is focused | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.cursorStyleInactive | Controls the style of terminal cursor when the terminal is not focused | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.cursorWidth | Controls the width of the cursor when {0} is set to {1} | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.customGlyphs | Whether to draw custom glyphs instead of using the font for the following unicode ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.cwd | An explicit start path where the terminal will be launched, this is used as the ... | no | has: the composer's workspace picker (vscode-parity.md:119) |
| terminal.integrated.defaultLocation | Controls where newly created terminals will appear | no | has in effect: a Terminal tab opens in any pane (vscode-parity.md:186) |
| terminal.integrated.defaultProfile.linux | The default terminal profile on Linux | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.defaultProfile.osx | The default terminal profile on macOS | no | has: the login `$SHELL`, `server/machine/pty/sessions.ts:152`; the composer picks shell, Claude or Codex (vscode-parity.md:180) |
| terminal.integrated.defaultProfile.windows | The default terminal profile on Windows | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.detectLocale | Controls whether to detect and set the `$LANG` environment variable to a UTF-8 ... | no | has in effect: tmux runs with `-u`, `tmux.ts:36-45` |
| terminal.integrated.developer.devMode | Enable developer mode for the terminal | no | not needed (VS Code internals or remote echo) |
| terminal.integrated.developer.ptyHost.latency | Simulated latency in milliseconds applied to all calls made to the pty host | no | not needed (VS Code internals or remote echo) |
| terminal.integrated.developer.ptyHost.startupDelay | Simulated startup delay in milliseconds for the pty host process | no | not needed (VS Code internals or remote echo) |
| terminal.integrated.drawBoldTextInBrightColors | Controls whether bold text in the terminal will always use the "bright" ANSI color ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.enableBell | Controls whether the visual terminal bell is enabled | no | has, fixed on: the bell mark on the row, `TerminalList.svelte:340-344` |
| terminal.integrated.enableFileLinks | Whether to enable file links in terminals | no | missing: file paths left out (vscode-parity.md:189) |
| terminal.integrated.enableImages | Enables image support in the terminal, this will only work when {0} is enabled | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) (no image addon) |
| terminal.integrated.enableKittyKeyboardProtocol | Whether to enable the kitty keyboard protocol, which allows a program in the ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.enableMultiLinePasteWarning | Controls whether to show a warning dialog when pasting multiple lines into the ... | no | has, fixed on: `TerminalGrid.svelte:121-122`, `:198-208` |
| terminal.integrated.enableNotifications | Controls whether notifications sent from the terminal via OSC 99 are shown | no | missing; notifications come from Claude hooks instead, `behavior.yml:106-111` |
| terminal.integrated.enablePersistentSessions | Persist terminal sessions/history for the workspace across window reloads | no | has: terminals live in tmux and are reattached, `server/machine/pty/tmux.ts:1-14` |
| terminal.integrated.enableVisualBell | Controls whether the visual terminal bell is enabled | no | has, fixed on (same) |
| terminal.integrated.enableWin32InputMode | Whether to enable the win32 input mode, which provides enhanced keyboard input ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.env.linux | Object with environment variables that will be added to the VS Code process to be ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.env.osx | Object with environment variables that will be added to the VS Code process to be ... | no | missing: a start carries only account folders, `sessions.ts:122`, `:283-293`; location `behavior.yml` |
| terminal.integrated.env.windows | Object with environment variables that will be added to the VS Code process to be ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.environmentChangesRelaunch | Whether to relaunch terminals automatically if extensions want to contribute to ... | no | not needed: no extensions |
| terminal.integrated.fastScrollSensitivity | Scrolling speed multiplier when pressing `Alt` | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.focusAfterRun | Controls whether the terminal, accessible buffer, or neither will be focused after ... | no | missing: no run-selection (vscode-parity.md:194) |
| terminal.integrated.fontFamily | Controls the font family of the terminal | no | has: the `--font-mono` token, `views/sessions/terminal/grid-look.ts:55` |
| terminal.integrated.fontLigatures.enabled | Controls whether font ligatures are enabled in the terminal | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.fontLigatures.fallbackLigatures | When {0} is enabled and the particular {1} cannot be parsed, this is the set of ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.fontLigatures.featureSettings | Controls what font feature settings are used when ligatures are enabled, in the ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.fontSize | Controls the font size in pixels of the terminal | no | has: `terminal.font_px`, `appearance.yml:31-32` |
| terminal.integrated.fontWeight | The font weight to use within the terminal for non-bold text | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.fontWeightBold | The font weight to use within the terminal for bold text | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.gpuAcceleration | Controls whether the terminal will leverage the GPU to do its rendering | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.hideOnLastClosed | Whether to hide the terminal view when the last terminal is closed | no | not needed: a pane holds Terminal tabs |
| terminal.integrated.hideOnStartup | Whether to hide the terminal view on startup, avoiding creating a terminal when ... | no | not needed (same) |
| terminal.integrated.ignoreBracketedPasteMode | Controls whether the terminal will ignore bracketed paste mode even if the terminal ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.ignoreProcessNames | A set of process names to ignore when using the {0} setting | no | not needed |
| terminal.integrated.inheritEnv | Whether new shells should inherit their environment from VS Code, which may source a ... | no | has, fixed: tmux's server environment |
| terminal.integrated.initialHint | Controls if the first terminal without input will show a hint about available ... | no | missing (no hint) |
| terminal.integrated.letterSpacing | Controls the letter spacing of the terminal | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.lineHeight | Controls the line height of the terminal | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.localEchoEnabled | When local echo should be enabled | no | not needed (VS Code internals or remote echo) |
| terminal.integrated.localEchoExcludePrograms | Local echo will be disabled when any of these program names are found in the ... | no | not needed (VS Code internals or remote echo) |
| terminal.integrated.localEchoLatencyThreshold | Length of network delay, in milliseconds, where local edits will be echoed on the ... | no | not needed (VS Code internals or remote echo) |
| terminal.integrated.localEchoStyle | Terminal style of locally echoed text; either a font style or an RGB color | no | not needed (VS Code internals or remote echo) |
| terminal.integrated.macOptionClickForcesSelection | Controls whether to force selection when using Option+click on macOS | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.macOptionIsMeta | Controls whether to treat the option key as the meta key in the terminal on macOS | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.middleClickBehavior | Controls how terminal reacts to middle click | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.minimumContrastRatio | When set, the foreground color of each cell will change to try meet the contrast ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.mouseWheelScrollSensitivity | A multiplier to be used on the `deltaY` of mouse wheel scroll events | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.mouseWheelZoom | zoom the terminal font with Cmd and the wheel | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.persistentSessionReviveProcess | When the terminal process must be shut down (for example on window or application ... | no | has in effect: tmux keeps the process running (same) |
| terminal.integrated.persistentSessionScrollback | Controls the maximum amount of lines that will be restored when reconnecting to a ... | no | has in effect: the grid is repainted from tmux's history (vscode-parity.md:279) |
| terminal.integrated.profiles.linux | shell profiles on Linux | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.profiles.osx | shell profiles on macOS | no | has in part: the composer's agent kinds from `config/catalogs/agents.yml`; custom shells missing |
| terminal.integrated.profiles.windows | shell profiles on Windows | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.rescaleOverlappingGlyphs | Whether to rescale glyphs horizontally that are a single cell wide but have glyphs ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.resizeDimensionsOverlay.enabled | Whether to show a visual overlay with the terminal's columns and rows when it is ... | no | missing; tmux owns the size (vscode-parity.md:195) |
| terminal.integrated.rightClickBehavior | Controls how terminal reacts to right click | no | has, fixed: the menu of vscode-parity.md:277-287 (Q88) |
| terminal.integrated.scrollback | Controls the maximum number of lines the terminal keeps in its buffer | no | part: tmux's history, vscode-parity.md:197 |
| terminal.integrated.sendKeybindingsToShell | Dispatches most keybindings to the terminal instead of the workbench, overriding ... | no | has, fixed: the workbench counts the grid's textarea as typing (`shell/keys/workbench-keys.svelte.ts:418-425`) and xterm stops each key it sends to the shell (`@xterm/xterm` 6.0.0 `lib/xterm.js`, `_keyDown` ends in `cancel(e,!0)`), so with the grid focused the workbench takes only Cmd-K or Ctrl-K (`workbench-keys.svelte.ts:93-98`), Ctrl+1, Ctrl+2 and Ctrl+9 (`shell/keys/keys.ts:92-94`; xterm sends Ctrl+3 to Ctrl+8 to the shell), the find keys (`TerminalGrid.svelte:279-287`) and the menu keys (`terminal-list.ts:158-164`); no switch |
| terminal.integrated.shellIntegration.decorationsEnabled | When shell integration is enabled, adds a decoration for each command | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.shellIntegration.enabled | Determines whether or not shell integration is auto-injected to support features ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.shellIntegration.environmentReporting | Controls whether to report the shell environment, enabling its use in features such ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.shellIntegration.history | Controls the number of recently used commands to keep in the terminal command history | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.shellIntegration.quickFixEnabled | When shell integration is enabled, enables quick fixes for terminal commands that ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.shellIntegration.showCommandGuide | Whether to show the command guide when hovering over a command in the terminal | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.shellIntegration.timeout | Configures the duration in milliseconds to wait for shell integration after launch ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.showExitAlert | Controls whether to show the alert "The terminal process terminated with exit code" ... | no | has, fixed: no alert (VS Code's `false`); an ended terminal is taken out of its tab, `state/sessions/terminals.svelte.ts:316-331`, `Terminal.svelte:18-19` |
| terminal.integrated.showLinkHover | Whether to show hovers for links in the terminal output | no | has, fixed: no hover text; the web links addon is loaded with a click handler and no hover option (`TerminalGrid.svelte:275`, `terminal-list.ts:429-443`) |
| terminal.integrated.smoothScrolling | Controls whether the terminal will scroll using an animation | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.splitCwd | Controls the working directory a split terminal starts with | no | has: Split opens in the row's own folder, Q89 plan.md:213 |
| terminal.integrated.stickyScroll.enabled | Shows the current command at the top of the terminal | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.stickyScroll.ignoredCommands | A list of commands that should not trigger sticky scroll | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.stickyScroll.maxLineCount | Defines the maximum number of sticky lines to show | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.cdPath | Controls whether to enable $CDPATH support which exposes children of the folders in ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.enabled | Enables terminal IntelliSense suggestions (also known as autocomplete) for supported ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.inlineSuggestion | Controls whether the shell's inline suggestion should be detected and how it is ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.insertTrailingSpace | Controls whether a space is automatically inserted after accepting a suggestion and ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.providers | Providers are enabled by default | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.quickSuggestions | Controls whether suggestions should automatically show up while typing | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.runOnEnter | Controls whether suggestions should run immediately when `Enter` (not `Tab`) is used ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.selectionMode | Controls how suggestion selection works in the integrated terminal | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.showStatusBar | Controls whether the terminal suggestions status bar should be shown | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.suggestOnTriggerCharacters | Controls whether suggestions should automatically show up when typing trigger ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.upArrowNavigatesHistory | Determines whether the up arrow key navigates the command history when focus is on ... | no | missing: needs shell integration, left out (vscode-parity.md:192-193) |
| terminal.integrated.suggest.windowsExecutableExtensions | A set of windows command executable extensions that will be included as suggestions ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.tabStopWidth | The number of cells in a tab stop | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.tabs.allowAgentCliTitle | Controls whether agentic CLIs (such as Claude Code, Codex, Command Code, GitHub ... | no | has, fixed: an agent terminal takes its CLI's title (Q89) |
| terminal.integrated.tabs.defaultColor | A theme color ID to associate with terminal icons by default | no | missing: terminal colour is "new" (vscode-parity.md:285); location `appearance.yml` `terminal:` |
| terminal.integrated.tabs.defaultIcon | A codicon ID to associate with terminal icons by default | no | missing: terminal icon is "new" (vscode-parity.md:285) |
| terminal.integrated.tabs.description | the terminal tab description template | no | has, fixed (vscode-parity.md:175) |
| terminal.integrated.tabs.enableAnimation | Controls whether terminal tab statuses support animation (eg | no | not needed: a row carries a bell mark and no animated status (`TerminalList.svelte:2-6`; `grep -n -i animat TerminalList.svelte` and `grep -n @keyframes TerminalList.svelte` find none) |
| terminal.integrated.tabs.enabled | Controls whether terminal tabs display as a list to the side of the terminal | no | has, fixed: the list of terminals (Q89, vscode-parity.md:171) |
| terminal.integrated.tabs.focusMode | Controls whether focusing the terminal of a tab happens on double or single click | no | has, fixed: a single press shows the row and hands the keyboard to its grid (VS Code's `singleClick`), `TerminalList.svelte:8-10`, `:19-20`, `:200` |
| terminal.integrated.tabs.hideCondition | Controls whether the terminal tabs view will hide under certain conditions | no | has, fixed: the list from two terminals on (vscode-parity.md:171) |
| terminal.integrated.tabs.location | Controls the location of the terminal tabs, either to the left or right of the ... | no | has, fixed: right (vscode-parity.md:171) |
| terminal.integrated.tabs.separator | Separator used by {0} and {1} | no | not needed (the title is not a template) |
| terminal.integrated.tabs.showActions | Controls whether terminal split and kill buttons are displays next to the new ... | no | has, fixed: split and kill on the row (vscode-parity.md:179) |
| terminal.integrated.tabs.showActiveTerminal | Shows the active terminal information in the view | no | has, fixed (vscode-parity.md:172) |
| terminal.integrated.tabs.title | the terminal tab title template | no | has, fixed: named after what runs, `TerminalTitle.svelte`, vscode-parity.md:174 |
| terminal.integrated.textBlinking | Controls whether text blinking is enabled in the terminal | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |
| terminal.integrated.unicodeVersion | Controls what version of Unicode to use when evaluating the width of characters in ... | no | has, fixed: the unicode11 addon, `TerminalGrid.svelte:276` |
| terminal.integrated.useWslProfiles | Controls whether or not WSL distros are shown in the terminal dropdown | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.windowsUseConptyDll | Whether to use the conpty.dll (v1.25.260303002) shipped with VS Code, instead of the ... | no | missing; Windows or Linux only (no location needed) |
| terminal.integrated.wordSeparators | A string containing all characters to be considered word separators when ... | no | missing; xterm's default; would live in `appearance.yml` `terminal:` (`appearance.yml:29-32`) |

### 4h. Git (`git.*`)

Keys from the built-in git extension, `extensions/git/package.json` (104). The Source Control rows are in vscode-parity.md:71-94 and :234-258; X3b landed (plan.md:169). No repository sets any. Rows marked "has, fixed" are behaviour oculus has with no setting.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| git.addAICoAuthor | Controls whether a 'Co-authored-by' trailer is automatically added to the commit ... | no | not needed: the suggested message's instruction asks for no trailer and no tool or model name (`config/text/views/sessions/changes.yml:37`); the answer is not filtered (`server/git/git-message.ts:79`) and is handed to the box to edit before the commit (`git-message.ts:1-2`) |
| git.allowForcePush | Controls whether force push (with or without lease) is enabled | no | has, fixed off (same) |
| git.allowNoVerifyCommit | Controls whether commits without running pre-commit and commit-msg hooks are allowed | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.alwaysShowStagedChangesResourceGroup | Always show the Staged Changes resource group | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.alwaysSignOff | Controls the signoff flag for all commits | no | missing |
| git.autoRepositoryDetection | Configures when repositories should be automatically detected | no | has, fixed (same) |
| git.autoStash | Stash any changes before pulling and restore them after successful pull | no | missing |
| git.autofetch | When set to true, commits will automatically be fetched from the default remote of ... | no | missing: Fetch runs only when asked (`server/git/git-routes.ts:212`, `git-remote.ts:40-43`); `grep -rn -i autofetch src/lib config` finds nothing; no step; would live in `config/behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.autofetchPeriod | Duration in seconds between each automatic git fetch, when `git.autofetch` is enabled | no | missing with `git.autofetch`; same location |
| git.autorefresh | Whether auto refreshing is enabled | no | has: the git watcher, `server/root/watch/git.ts` |
| git.blame.editorDecoration.disableHover | Controls whether to disable the blame information editor decoration hover | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.blame.editorDecoration.enabled | Controls whether to show blame information in the editor using editor decorations | no | has: Blame toggle in the gutter, `state/sessions/source.svelte.ts:47-48` |
| git.blame.editorDecoration.template | Template for the blame information editor decoration | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.blame.ignoreWhitespace | Controls whether to ignore whitespace changes when computing blame information | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.blame.statusBarItem.enabled | Controls whether to show blame information in the status bar | no | has: the blame status item while Blame is on, DESIGN.md:318 |
| git.blame.statusBarItem.template | Template for the blame information status bar item | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.branchPrefix | Prefix used when creating a new branch | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.branchProtection | List of protected branches | no | missing |
| git.branchProtectionPrompt | Controls whether a prompt is being shown before changes are committed to a protected ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.branchRandomName.dictionary | List of dictionaries used for the randomly generated branch name | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.branchRandomName.enable | Controls whether a random name is generated when creating a new branch | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.branchSortOrder | Controls the sort order for branches | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.branchValidationRegex | A regular expression to validate new branch names | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.branchWhitespaceChar | The character to replace whitespace in new branch names, and to separate segments of ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.checkoutType | Controls what type of Git refs are listed when running `Checkout to...` | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.closeDiffOnOperation | Controls whether the diff editor should be automatically closed when changes are ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.commandsToLog | List of git commands (ex: commit, push) that would have their `stdout` logged to the ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.commitShortHashLength | Controls the length of the commit short hash | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.confirmCommittedDelete | Confirm before deleting committed files with Git | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.confirmEmptyCommits | Always confirm the creation of empty commits for the 'Git: Commit Empty' command | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.confirmForcePush | Controls whether to ask for confirmation before force-pushing | no | not needed: no force push in `git-routes.ts:57-91` |
| git.confirmNoVerifyCommit | Controls whether to ask for confirmation before committing without verification | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.confirmSync | Confirm before synchronizing Git repositories | no | has, fixed on: sync asks first, `server/git/git-routes.ts:117-137` |
| git.countBadge | Controls the Git count badge | no | has, fixed: change counts per repository row, HELP.md:112 |
| git.decorations.enabled | Controls whether Git contributes colors and badges to the Explorer and the Open ... | no | planned: X3a git decorations (vscode-parity.md:58) |
| git.defaultBranchName | The name of the default branch (example: main, trunk, development) when initializing ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.defaultCloneDirectory | The default location to clone a Git repository | no | missing: no clone |
| git.detectSubmodules | Controls whether to automatically detect Git submodules | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.detectSubmodulesLimit | Controls the limit of Git submodules detected | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.detectWorktrees | Controls whether to automatically detect Git worktrees | no | has: worktrees listed (vscode-parity.md:93) |
| git.detectWorktreesLimit | Controls the limit of Git worktrees detected | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.diagnosticsCommitHook.enabled | Controls whether to check for unresolved diagnostics before committing | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.diagnosticsCommitHook.sources | Controls the list of sources (**Item**) and the minimum severity (**Value**) to be ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.discardUntrackedChangesToTrash | Controls whether discarding untracked changes moves the file(s) to the Recycle Bin ... | no | not needed: discarding an untracked path is refused, `server/git/git-write.ts:204-224` |
| git.enableCommitSigning | Enables commit signing with GPG, X.509, or SSH | no | has, fixed: git's own config decides |
| git.enableSmartCommit | Commit all changes when there are no staged changes | no | missing |
| git.enableStatusBarSync | Controls whether the Git Sync command appears in the status bar | no | has, fixed on: the sync item, DESIGN.md:318 |
| git.enabled | Whether Git is enabled | no | has: the git channel over every root, HELP.md:112 |
| git.fetchOnPull | When enabled, fetch all branches when pulling | no | has, fixed: off; plain `git pull` with the repository's own configuration, `server/git/git-write.ts:585-588` |
| git.followTagsWhenSync | Push all annotated tags when running the sync command | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.githubAuthentication | GitHub sign-in for git over HTTPS | no | not needed |
| git.ignoreLegacyWarning | Ignores the legacy Git warning | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.ignoreLimitWarning | Ignores the warning when there are too many changes in a repository | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.ignoreMissingGitWarning | Ignores the warning when Git is missing | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.ignoreRebaseWarning | Ignores the warning when it looks like the branch might have been rebased when ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.ignoreSubmodules | Ignore modifications to submodules in the file tree | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.ignoreWindowsGit27Warning | Ignores the warning when Git 2.25 - 2.26 is installed on Windows | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.ignoredRepositories | List of Git repositories to ignore | no | missing: every root of the git channel is listed (vscode-parity.md:248) |
| git.inputValidation | Controls whether to show commit message input validation diagnostics | no | missing |
| git.inputValidationLength | Controls the commit message length threshold for showing a warning | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.inputValidationSubjectLength | Controls the commit message subject length threshold for showing a warning | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.mergeEditor | Open the merge editor for files that are currently under conflict | no | has: the three-way merge on Monaco, D13b plan.md:333 |
| git.openAfterClone | Controls whether to open a repository automatically after cloning | no | missing: no clone |
| git.openDiffOnClick | Controls whether the diff editor should be opened when clicking a change | no | has, fixed: a row opens its diff (vscode-parity.md:238) |
| git.openRepositoryInParentFolders | Control whether a repository in parent folders of workspaces or open files should be ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.optimisticUpdate | Controls whether to optimistically update the state of the Source Control view after ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.path | Path and filename of the git executable, e.g | no | has, fixed: `git` on PATH, `server/core/git.ts:115` |
| git.postCommitCommand | Run a git command after a successful commit | no | missing; commit and push are separate actions (vscode-parity.md:83) |
| git.promptToSaveFilesBeforeCommit | Controls whether Git should check for unsaved files before committing | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.promptToSaveFilesBeforeStash | Controls whether Git should check for unsaved files before stashing changes | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.pruneOnFetch | Prune when fetching | no | has, fixed: on; `git fetch --prune`, `server/git/git-write.ts:590-593` |
| git.pullBeforeCheckout | Controls whether a branch that does not have outgoing commits is fast-forwarded ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.pullTags | Fetch all tags when pulling | no | has, fixed: plain `git pull`, no `--tags` (VS Code's `false`), `server/git/git-write.ts:585-588` |
| git.rebaseWhenSync | Force Git to use rebase when running the sync command | no | has, fixed: off; sync is pull with the repository's own configuration, then push, and imposes no strategy (`server/git/git-remote.ts:6-7`, `:45-55`) |
| git.rememberPostCommitCommand | Remember the last git command that ran after a commit | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.replaceTagsWhenPull | Automatically replace the local tags with the remote tags in case of a conflict when ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.repositoryScanIgnoredFolders | List of folders that are ignored while scanning for Git repositories when ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.repositoryScanMaxDepth | Controls the depth used when scanning workspace folders for Git repositories when ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.requireGitUserConfig | Controls whether to require explicit Git user configuration or allow Git to guess if ... | no | has, fixed: no check of its own; the commit is plain `git commit` (`server/git/git-write.ts:575-578`), so git's own `user.useConfigOnly` decides |
| git.scanRepositories | List of paths to search for Git repositories in | no | has in effect: the Files roots and session workspaces, HELP.md:112 |
| git.showActionButton | Controls whether an action button is shown in the Source Control view | no | has, fixed: the commit button (vscode-parity.md:82) |
| git.showCommitInput | Controls whether to show the commit input in the Git source control panel | no | has, fixed on (same) |
| git.showInlineOpenFileAction | Controls whether to show an inline Open File action in the Git changes view | no | has, fixed: Open File (vscode-parity.md:239) |
| git.showProgress | Controls whether Git actions should show progress | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.showPushSuccessNotification | Controls whether to show a notification when a push is successful | no | has, fixed: a git write that succeeds says the catalog's `git.done` on the repository (a line, no notification), `state/sources/repositories/repositories.svelte.ts:187` |
| git.showReferenceDetails | Controls whether to show the details of the last commit for Git refs in the ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.similarityThreshold | Controls the threshold of the similarity index (the amount of additions/deletions ... | no | has, fixed: git's default (50%); the diffs pass `-M` with no value, `server/core/git.ts:330`, `:343`, `:368` |
| git.smartCommitChanges | Control which changes are automatically staged by Smart Commit | no | missing |
| git.statusLimit | Controls how to limit the number of changes that can be parsed from Git status ... | no | has, fixed: 200 entries per change list, `server/core/git.ts:123`, `:617` |
| git.suggestSmartCommit | Suggests to enable smart commit (commit all changes when there are no staged changes) | no | missing |
| git.supportCancellation | Controls whether a notification comes up when running the Sync action, which allows ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.terminalAuthentication | Controls whether to enable VS Code to be the authentication handler for Git ... | no | not needed |
| git.terminalGitEditor | Controls whether to enable VS Code to be the Git editor for Git processes spawned in ... | no | not needed |
| git.timeline.date | Controls which date to use for items in the Timeline view | no | missing: no Timeline (vscode-parity.md:67) |
| git.timeline.showAuthor | Controls whether to show the commit author in the Timeline view | no | missing: no Timeline |
| git.timeline.showUncommitted | Controls whether to show uncommitted changes in the Timeline view | no | missing: no Timeline |
| git.untrackedChanges | Controls how untracked changes behave | no | has, fixed: untracked in Changes with Stage All Untracked (vscode-parity.md:242) |
| git.useCommitInputAsStashMessage | Controls whether to use the message from the commit input box as the default stash ... | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.useEditorAsCommitInput | Controls whether a full text editor will be used to author commit messages, whenever ... | no | missing |
| git.useForcePushIfIncludes | Controls whether force pushing uses the safer force-if-includes variant | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.useForcePushWithLease | Controls whether force pushing uses the safer force-with-lease variant | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.useIntegratedAskPass | Controls whether GIT_ASKPASS should be overwritten to use the integrated version | no | not needed |
| git.verboseCommit | Enable verbose output when `git.useEditorAsCommitInput` is enabled | no | missing; would live in `behavior.yml` `git:` (`behavior.yml:140-141`) |
| git.worktreeIncludeFiles | Configure glob patterns for files and folders that are included when creating a new ... | no | missing |

### 4i. Source Control (`scm.*`)

Keys registered in `workbench.desktop.main.js`.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| scm.alwaysShowActions | Controls whether inline actions are always visible in the Source Control view | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.alwaysShowRepositories | Controls whether repositories should always be visible in the Source Control view | no | has, fixed: the Repositories section on top, HELP.md:112 |
| scm.autoReveal | Controls whether the Source Control view should automatically reveal and select ... | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.compactFolders | Controls whether the Source Control view should render folders in a compact form | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.countBadge | Controls the count badge on the Source Control icon on the Activity Bar | no | has in part: rail badges (vscode-parity.md:20) |
| scm.defaultViewMode | Controls the default Source Control repository view mode | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.defaultViewSortKey | Controls the default Source Control repository changes sort order when viewed as a ... | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.diffDecorations | Controls diff decorations in the editor | no | has: quick diff marks in the gutter, `Editor.svelte:339`, `Source.svelte` (gutter against the index) |
| scm.diffDecorationsGutterAction | Controls the behavior of Source Control diff gutter decorations | no | has, fixed: a press opens the file's diff, `Editor.svelte:248-250` |
| scm.diffDecorationsGutterPattern | Controls whether a pattern is used for the diff decorations in gutter | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.diffDecorationsGutterVisibility | Controls the visibility of the Source Control diff decorator in the gutter | no | has, fixed |
| scm.diffDecorationsGutterWidth | Controls the width(px) of diff decorations in gutter (added & modified) | no | has, fixed: 3 px, `Editor.svelte:465` |
| scm.diffDecorationsIgnoreTrimWhitespace | Controls whether leading and trailing whitespace is ignored in Source Control diff ... | no | has, fixed: off (whitespace changes are marked); the marks are `git diff -U0` with no whitespace flag, `server/core/git.ts:502-513` |
| scm.graph.badges | Controls which badges are shown in the Source Control Graph view | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.graph.pageOnScroll | Controls whether the Source Control Graph view will load the next page of items when ... | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.graph.pageSize | The number of items to show in the Source Control Graph view by default and when ... | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.graph.showIncomingChanges | Controls whether to show incoming changes in the Source Control Graph view | no | has in part: the graph (vscode-parity.md:91) |
| scm.graph.showOutgoingChanges | Controls whether to show outgoing changes in the Source Control Graph view | no | has in part (same) |
| scm.inputFontFamily | Controls the font for the input message | no | missing |
| scm.inputFontSize | Controls the font size for the input message in pixels | no | missing |
| scm.inputMaxLineCount | Controls the maximum number of lines that the input will auto-grow to | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.inputMinLineCount | Controls the minimum number of lines that the input will auto-grow from | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.providerCountBadge | Controls the count badges on Source Control Provider headers | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.repositories.explorer | Controls whether to show repository artifacts in the Source Control Repositories view | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.repositories.selectionMode | Controls the selection mode of the repositories in the Source Control Repositories ... | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.repositories.sortOrder | Controls the sort order of the repositories in the source control repositories view | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.repositories.visible | Controls how many repositories are visible in the Source Control Repositories section | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.showActionButton | Controls whether an action button can be shown in the Source Control view | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.showInputActionButton | Controls whether an action button can be shown in the Source Control input | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.workingSets.default | Controls the default working set to use when switching to a source control history ... | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |
| scm.workingSets.enabled | Controls whether to store editor working sets when switching between source control ... | no | missing; would live in `layout.yml` or `behavior.yml` `git:` |

### 4j. Debug (`debug.*`)

Keys registered in `workbench.desktop.main.js`. D11 (plan.md:327) owns them; its UI rows are vscode-parity.md:136-146. Used: cathedra sets `debug.allowBreakpointsEverywhere` true.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| debug.allowBreakpointsEverywhere | Allow setting breakpoints in any file | yes (cathedra) | planned in effect: breakpoints in the gutter of `.rite` files, the only language D11 debugs (D11.md:7, plan.md:435) |
| debug.autoExpandLazyVariables | Controls whether variables that are lazily resolved, such as getters, are ... | no | not needed: `rite_dap` declares no lazy variables (debug_dap.cpp:182-191) |
| debug.breakpointsView.presentation | Controls whether breakpoints are displayed in a tree view grouped by file, or as a ... | no | planned: D11 breakpoints list, vscode-parity.md:140 |
| debug.closeReadonlyTabsOnEnd | At the end of a debug session, all the read-only tabs associated with that session ... | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.confirmOnExit | Controls whether to confirm when the window closes if there are active debug sessions | no | has as a rule: stopping asks first, DESIGN.md:148 |
| debug.console.acceptSuggestionOnEnter | Controls whether suggestions should be accepted on Enter in the Debug Console | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.closeOnEnd | Controls if the Debug Console should be automatically closed when the debug session ... | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.collapseIdenticalLines | Controls if the Debug Console should collapse identical lines and show a number of ... | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.fontFamily | Controls the font family in the Debug Console | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.fontSize | Controls the font size in pixels in the Debug Console | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.historySuggestions | Controls if the Debug Console should suggest previously typed input | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.lineHeight | Controls the line height in pixels in the Debug Console | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.maximumLines | Controls the maximum number of lines in the Debug Console | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.console.wordWrap | Controls if the lines should wrap in the Debug Console | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.disassemblyView.showSourceCode | Show Source Code in Disassembly View | no | not needed: `rite_dap` has no disassembly (debug_dap.cpp:390-410) |
| debug.enableStatusBarColor | Color of the status bar when the debugger is active | no | planned: D11 and L6, vscode-parity.md:43, :146 |
| debug.focusEditorOnBreak | Controls whether the editor should be focused when the debugger breaks | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.focusWindowOnBreak | Controls whether the workbench window should be focused when the debugger breaks | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.gutterMiddleClickAction | Controls the action to perform when clicking the editor gutter with the middle mouse ... | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.hideLauncherWhileDebugging | Hide 'Start Debugging' control in title bar of 'Run and Debug' view while debugging ... | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.hideSlowPreLaunchWarning | Hide the warning shown when a `preLaunchTask` has been running for a while | no | missing: no preLaunchTask |
| debug.inlineValues | Show variable values inline in editor while debugging | no | planned: D11, vscode-parity.md:145 |
| debug.internalConsoleOptions | when the Debug Console opens | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.onTaskErrors | Controls what to do when errors are encountered after running a preLaunchTask | no | missing: no preLaunchTask (section 2a) |
| debug.openDebug | Controls when the debug view should open | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.openExplorerOnEnd | Automatically open the explorer view at the end of a debug session | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.saveBeforeStart | Controls what editors to save before starting a debug session | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.showBreakpointsInOverviewRuler | Controls whether breakpoints should be shown in the overview ruler | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.showInStatusBar | Controls when the debug status bar item should be visible | no | planned: the configuration picker on the status bar, vscode-parity.md:146 |
| debug.showInlineBreakpointCandidates | Controls whether inline breakpoints candidate decorations should be shown in the ... | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.showSubSessionsInToolBar | Controls whether the debug sub-sessions are shown in the debug tool bar | no | not needed: one session |
| debug.showVariableTypes | Show variable type in variable pane during debug session | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.terminal.clearBeforeReusing | Before starting a new debug session in an integrated or external terminal, clear the ... | no | missing; would live in D11's Debug view settings (`behavior.yml` or the launch form, plan.md:435) |
| debug.toolBarLocation | Controls the location of the debug toolbar | no | planned: D11 toolbar, vscode-parity.md:142; its place not ruled |

### 4k. Tasks (`task.*`)

Keys registered in `workbench.desktop.main.js`. D17 (plan.md:342-343) owns them.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| task.allowAutomaticTasks | Enable automatic tasks - note that tasks won't run in an untrusted workspace | no | has as a rule: nothing from a repository runs without approval of its exact text, DESIGN.md:148 |
| task.autoDetect | Controls enablement of `provideTasks` for all task provider extension | no | missing: no task providers (section 1f) |
| task.notifyWindowOnTaskCompletion | Controls the minimum task runtime in milliseconds before showing an OS notification ... | no | missing; would live in `behavior.yml` `tasks:` (`behavior.yml:88-90`) |
| task.problemMatchers.neverPrompt | Configures whether to show the problem matcher prompt when running a task | no | not needed |
| task.quickOpen.detail | Controls whether to show the task detail for tasks that have a detail in task quick ... | no | missing; would live in `behavior.yml` `tasks:` (`behavior.yml:88-90`) |
| task.quickOpen.history | Controls the number of recent items tracked in task quick open dialog | no | missing; would live in `behavior.yml` `tasks:` (`behavior.yml:88-90`) |
| task.quickOpen.showAll | Causes the Tasks: Run Task command to use the slower "show all" behavior instead of ... | no | missing; would live in `behavior.yml` `tasks:` (`behavior.yml:88-90`) |
| task.quickOpen.skip | Controls whether the task quick pick is skipped when there is only one task to pick ... | no | missing; would live in `behavior.yml` `tasks:` (`behavior.yml:88-90`) |
| task.reconnection | On window reload, reconnect to tasks that have problem matchers | no | has in effect: task terminals live in tmux and are reattached (`tmux.ts:1-14`) |
| task.saveBeforeRun | Save all dirty editors before running a task | no | missing; would live in `.oculus/commands.yml` or `behavior.yml` `tasks:` (`behavior.yml:88-90`) |
| task.slowProviderWarning | Configures whether a warning is shown when a provider is slow | no | not needed |
| task.verboseLogging | Enable verbose logging for tasks | no | not needed |

### 4l. Language-specific overrides (`[language]`)

| Setting | What it does | Used | oculus |
|---|---|---|---|
| `[rite]` editor.tabSize, editor.insertSpaces | indentation for one language | yes (cathedra: 2, spaces) | planned: per-language tab size and spaces or tabs in oculus's own config with a Settings control, used when a file gives nothing to detect, D25 plan.md:351; rite itself is D26, plan.md:352 |
| `[language]` any other editor or files setting (formatOnSave, wordWrap, rulers, insertFinalNewline, ...) | per-language value of any setting | no | missing: D25 covers indentation only; would live beside D25's per-language area |
| `files.associations` for rite | the `.rite` language | yes (cathedra) | planned: `.rite` mapped to rite in oculus's own config, D26 plan.md:352 |
| rite language configuration (comments `;`, brackets, auto-closing pairs, word pattern) | from cathedra `utils/vscode-rite/language-configuration.json` | yes (cathedra extension) | planned: grammar and language settings (comments, brackets) in oculus's own tree, D26 plan.md:352 |

Files that open as plaintext today. The source tab paints a file in `languageOf(path)` (`views/sources/source/Source.svelte:133`, `state/sources/file-type.ts:60-72`), which knows the 19 languages of `data/prose/languages.ts:57-77` by highlight.js's names and aliases plus the extensions of `file-type.ts:28-37`, and the editor paints any other name as plaintext (`ui/controls/editor/kit/grammars.ts:10-29`, `:38-40`). Counted by `node plain.mjs` in the scratchpad (the same lookup run with oculus's highlight.js over every file under `~/workspace/cathedra`, `~/workspace/game-engine` and the hub, folders named `node_modules`, `build` and `.git` left out; a file counts when its first 8000 bytes hold no NUL byte). Listed: every extension with more than 20 such files. The counts include agent worktrees (`.agents/worktrees`, cathedra's `.claude/worktrees`) and vendored trees: most of the hub's `.h`, `.inc`, `.cuh` and `.typed` sit under `projects/active/linfoot-estimator/code`, and its `.rb`, `.text`, `.options`, `.tt` and `.1` under `theaxec.github.io/vendor/bundle`. Extensions over 20 files that are painted: `.py`, `.html`, `.md`, `.js`, `.ts`, `.json`, `.yml`, `.svelte`, `.tex`, `.slurm`, `.svg`, `.yaml`, `.sh`, `.bib`, `.css`, `.sty`, `.cls`, `.mjs`, `.m`.

| Option | What it is | Files | oculus |
|---|---|---|---|
| `.h` | C and C++ header | 20868 text files; all files: cathedra 1220, game-engine 69, hub 19579 | plaintext; the draft D23 brief adds `c` and `cpp` (scratchpad `D23-brief-draft.md:54`, a draft, not a ruling) |
| `.rb` | Ruby | 4106 text files; all files: cathedra 32, game-engine 0, hub 4074 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.cpp` | C++ | 1450 text files; all files: cathedra 1282, game-engine 119, hub 49 | plaintext; the draft D23 brief adds `c` and `cpp` (scratchpad `D23-brief-draft.md:54`, a draft, not a ruling) |
| (none) | no extension (`Makefile` is painted) | 1243 text files; all files: cathedra 499, game-engine 44, hub 1306 | plaintext, which fits the content |
| `.txt` | plain text, `CMakeLists.txt` included | 950 text files; all files: cathedra 324, game-engine 49, hub 577 | plaintext, which fits the content |
| `.inc` | C and C++ include | 828 text files; all files: cathedra 12, game-engine 0, hub 816 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.csv` | comma-separated data | 575 text files; all files: cathedra 0, game-engine 0, hub 575 | plaintext, which fits the content |
| `.pyi` | Python type stubs | 406 text files; all files: cathedra 0, game-engine 0, hub 406 | plaintext; missing: highlight.js's Python has no `pyi` alias; an extension line in `state/sources/file-type.ts:28-37`; no step |
| `.hpp` | C++ header | 388 text files; all files: cathedra 256, game-engine 63, hub 69 | plaintext; the draft D23 brief adds `c` and `cpp` (scratchpad `D23-brief-draft.md:54`, a draft, not a ruling) |
| `.c` | C | 307 text files; all files: cathedra 47, game-engine 0, hub 260 | plaintext; the draft D23 brief adds `c` and `cpp` (scratchpad `D23-brief-draft.md:54`, a draft, not a ruling) |
| `.text` | plain text | 227 text files; all files: cathedra 0, game-engine 0, hub 227 | plaintext, which fits the content |
| `.gemspec` | Ruby gem spec | 165 text files; all files: cathedra 0, game-engine 0, hub 171 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.done` | marker files | 150 text files; all files: cathedra 0, game-engine 0, hub 150 | plaintext, which fits the content |
| `.scss` | Sass stylesheet | 123 text files; all files: cathedra 0, game-engine 0, hub 123 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.conf` | configuration | 117 text files; all files: cathedra 0, game-engine 0, hub 117 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.dot` | Graphviz graph | 108 text files; all files: cathedra 64, game-engine 11, hub 33 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.rdoc` | Ruby docs | 100 text files; all files: cathedra 0, game-engine 0, hub 100 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.rbs` | Ruby signatures | 68 text files; all files: cathedra 0, game-engine 0, hub 68 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.cmake` | CMake | 66 text files; all files: cathedra 28, game-engine 8, hub 30 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.java` | Java | 66 text files; all files: cathedra 0, game-engine 0, hub 66 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.f90` | Fortran | 62 text files; all files: cathedra 0, game-engine 0, hub 62 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.options` | options file | 62 text files; all files: cathedra 0, game-engine 0, hub 62 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.wren` | Wren | 60 text files; all files: cathedra 60, game-engine 0, hub 0 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.cuh` | CUDA header | 60 text files; all files: cathedra 0, game-engine 0, hub 60 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.rite` | rite | 59 text files; all files: cathedra 52, game-engine 7, hub 0 | plaintext; planned: D26, plan.md:352 |
| `.clo` | LaTeX class options | 42 text files; all files: cathedra 0, game-engine 0, hub 42 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.typed` | marker files | 41 text files; all files: cathedra 0, game-engine 0, hub 41 | plaintext, which fits the content |
| `.1` | manual page | 34 text files; all files: cathedra 0, game-engine 0, hub 34 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.ronn` | manual page source | 33 text files; all files: cathedra 0, game-engine 0, hub 33 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.tt` | template | 33 text files; all files: cathedra 0, game-engine 0, hub 33 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.lua` | Lua | 32 text files; all files: cathedra 32, game-engine 0, hub 0 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.cc` | C++ | 30 text files; all files: cathedra 0, game-engine 0, hub 30 | plaintext; the draft D23 brief adds `c` and `cpp` (scratchpad `D23-brief-draft.md:54`, a draft, not a ruling) |
| `.bbl` | LaTeX bibliography output | 29 text files; all files: cathedra 0, game-engine 0, hub 29 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.f` | Fortran | 25 text files; all files: cathedra 0, game-engine 0, hub 25 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.dart` | Dart | 24 text files; all files: cathedra 24, game-engine 0, hub 0 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.aux` | LaTeX build output | 24 text files; all files: cathedra 0, game-engine 0, hub 24 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.fdb_latexmk` | LaTeX build output | 24 text files; all files: cathedra 0, game-engine 0, hub 24 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.fls` | LaTeX build output | 24 text files; all files: cathedra 0, game-engine 0, hub 24 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.log` | log | 24 text files; all files: cathedra 0, game-engine 0, hub 24 | plaintext, which fits the content |
| `.in` | template input | 23 text files; all files: cathedra 20, game-engine 2, hub 1 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.eps` | PostScript figure | 21 text files; all files: cathedra 0, game-engine 0, hub 27 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.jinja` | Jinja template | 21 text files; all files: cathedra 0, game-engine 0, hub 21 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |
| `.rake` | Ruby rake | 21 text files; all files: cathedra 0, game-engine 0, hub 21 | plaintext; a language is a grammar in `kit/grammars.ts` and a registration in `data/prose/languages.ts`; no step |

### 4m. C/C++ extension (`C_Cpp.*`)

From cpptools `package.json` (164 keys). oculus uses clangd (plan.md:346), so each row says what clangd does for it. Used: game-engine sets `C_Cpp.default.compileCommands` and `C_Cpp.default.cppStandard`.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| C_Cpp.addNodeAddonIncludePaths | Add include paths from `nan` and `node-addon-api` when they are dependencies | no | not needed: cpptools or platform specific |
| C_Cpp.autoAddFileAssociations | Controls whether files are automatically added to `files.associations` when they are ... | no | not needed: cpptools or platform specific |
| C_Cpp.autocomplete | Controls the auto-completion provider | no | planned: completion, D23 (plan.md:348) |
| C_Cpp.autocompleteAddParentheses | If `true`, autocomplete will automatically add `(` after function calls, in which ... | no | planned: D23 completion; clangd `--function-arg-placeholders` (section 3a) |
| C_Cpp.caseSensitiveFileSupport | If set to `default`, the file system of the workspace is assumed to be case ... | no | not needed: cpptools or platform specific |
| C_Cpp.clang_format_fallbackStyle | Name of the predefined style used as a fallback in case `clang-format` is invoked ... | no | missing; clangd `--fallback-style` (section 3a) |
| C_Cpp.clang_format_path | The full path of the `clang-format` executable | no | not needed: clangd formats in process |
| C_Cpp.clang_format_sortIncludes | If set, overrides the include sorting behavior determined by the `SortIncludes` ... | no | not needed: `.clang-format` `SortIncludes` |
| C_Cpp.clang_format_style | Coding style, currently supports: `Visual Studio`, `LLVM`, `Google`, `Chromium`, ... | no | missing; clangd reads `.clang-format`; `--fallback-style` (section 3a) |
| C_Cpp.codeAnalysis.clangTidy.args | Additional command line arguments to pass to `clang-tidy` | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.checks.disabled | List of disabled `clang-tidy` checks | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.checks.enabled | List of enabled `clang-tidy` checks | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.codeAction.formatFixes | If `true`, formatting will be run on the lines changed by 'Fix' code actions | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.codeAction.showClear | Controls which 'Clear' code analysis problem code action options are available | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.codeAction.showDisable | If `true`, the 'Disable' code action will be shown when available (the next time ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.codeAction.showDocumentation | If `true`, the 'Show Documentation for' code action will be shown when available ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.config | Specifies a `clang-tidy` configuration in YAML/JSON format: `{Checks: ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.enabled | If `true`, code analysis using `clang-tidy` will be enabled and will run after a ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.fallbackConfig | Specifies a `clang-tidy` configuration in YAML/JSON format to be used as a fallback ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.headerFilter | A POSIX extended regular expression (ERE) matching the names of the headers to ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.path | The full path of the `clang-tidy` executable | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.clangTidy.useBuildPath | If `true` and `compileCommands` is set, the `-p=<build-path>` argument is passed to ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.exclude | Configure glob patterns for excluding folders and files for code analysis | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.maxConcurrentThreads | The maximum number of concurrent threads to use for code analysis | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.maxMemory | Fewer code analysis processes will run concurrently after this memory usage (in MB) ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.runAutomatically | If `true`, code analysis will run automatically on a file after it is opened or saved | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeAnalysis.updateDelay | Controls the delay in milliseconds before code analysis starts processing after a ... | no | missing; clangd runs clang-tidy with `--clang-tidy` or a `.clangd` block (section 3a); would live in oculus's clangd arguments |
| C_Cpp.codeFolding | If enabled, code folding ranges are provided by the language server | no | leaves Monaco's default; clangd folding ranges arrive with D23 (plan.md:348) |
| C_Cpp.commentContinuationPatterns | Defines the editor behavior for when the Enter key is pressed inside a multiline or ... | no | missing: cpptools only, no clangd counterpart |
| C_Cpp.configurationWarnings | Determines whether pop up notifications will be shown when a configuration provider ... | no | missing |
| C_Cpp.copilotHover | If `disabled`, no 'Generate Copilot summary' option will appear on hover | no | not needed: cpptools or platform specific |
| C_Cpp.debugShortcut | Show the "Run and Debug" play button and "Add Debug Configuration" gear in the ... | no | excluded: C++ debuggers not built, plan.md:494 |
| C_Cpp.debugger.useBacktickCommandSubstitution | If `true`, debugger shell command substitution will use obsolete backtick ``(`)`` | no | excluded: plan.md:494 |
| C_Cpp.default.browse.databaseFilename | The value to use in a configuration if `browse.databaseFilename` is either not ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.browse.limitSymbolsToIncludedHeaders | The value to use in a configuration if `browse.limitSymbolsToIncludedHeaders` is ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.browse.path | The value to use in a configuration if `browse.path` is not specified, or the values ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.cStandard | The value to use in a configuration if `cStandard` is either not specified or set to ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.compileCommands | The value to use in a configuration if `compileCommands` is either not specified, or ... | yes (game-engine) | planned: found by oculus, plan.md:348 (section 3) |
| C_Cpp.default.compilerArgs | The value to use in configuration if `compilerArgs` is either not specified or set ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.compilerPath | The value to use in a configuration if `compilerPath` is either not specified or set ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.configurationProvider | The value to use in a configuration if `configurationProvider` is either not ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.cppStandard | The value to use in a configuration if `cppStandard` is either not specified or set ... | yes (game-engine) | planned: from the compile database (section 3) |
| C_Cpp.default.customConfigurationVariables | The value to use in a configuration if `customConfigurationVariables` is not set, or ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.defines | The value to use in a configuration if `defines` is not specified, or the values to ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.dotConfig | The value to use in a configuration if `dotConfig` is either not specified or set to ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.enableConfigurationSquiggles | Controls whether the extension will report errors detected in `c_cpp_properties.json` | no | see section 3 (the same property as a user default) |
| C_Cpp.default.forcedInclude | The value to use in a configuration if `forcedInclude` is not specified, or the ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.includePath | The value to use in a configuration if `includePath` is not specified in ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.intelliSenseMode | The value to use in a configuration if `intelliSenseMode` is either not specified or ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.macFrameworkPath | The value to use in a configuration if `macFrameworkPath` is not specified, or the ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.mergeConfigurations | The value to use in a configuration if `mergeConfigurations` is either not specified ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.recursiveIncludes.order | The value to use in a configuration if `recursiveIncludes.order` is either not ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.recursiveIncludes.priority | The value to use in a configuration if `recursiveIncludes.priority` is either not ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.recursiveIncludes.reduce | The value to use in a configuration if `recursiveIncludes.reduce` is either not ... | no | see section 3 (the same property as a user default) |
| C_Cpp.default.systemIncludePath | The value to use for the system include path | no | see section 3 (the same property as a user default) |
| C_Cpp.default.windowsSdkVersion | Version of the Windows SDK include path to use on Windows, e.g | no | see section 3 (the same property as a user default) |
| C_Cpp.dimInactiveRegions | Controls whether inactive preprocessor blocks are colored differently than active ... | no | missing: clangd sends inactive regions as its own protocol extension (https://clangd.llvm.org/extensions), which Monaco's lsp client does not read (`grep -c -i inactiveRegions` on `node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js` prints 0); no step |
| C_Cpp.doxygen.generateOnCodeAction | Controls whether the code action to generate a Doxygen comment is enabled | no | missing: cpptools only, no clangd counterpart |
| C_Cpp.doxygen.generateOnType | Controls whether to automatically insert the Doxygen comment after typing the chosen ... | no | missing: cpptools only, no clangd counterpart |
| C_Cpp.doxygen.generatedStyle | The string of characters used as the starting line of the Doxygen comment | no | missing: cpptools only, no clangd counterpart |
| C_Cpp.doxygen.sectionTags | Select the Doxygen section tags that you would like to appear on hover in the ... | no | missing: cpptools only, no clangd counterpart |
| C_Cpp.enhancedColorization | If enabled, code is colorized based on IntelliSense | no | planned in part: Monaco's lsp client, the one D23 uses (plan.md:346), has a semantic tokens feature (`node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js`:2485); oculus sets no `editor.semanticHighlighting.enabled` and its theme no semantic highlighting (`grep -rn -i semanticHighlighting src/lib/ui/controls/editor` finds none), so Monaco's default `configuredByTheme` leaves the tokens unpainted; that switch is missing, location `appearance.yml` beside `code_theme:` |
| C_Cpp.errorSquiggles | Controls whether suspected compile errors detected by the IntelliSense engine will ... | no | planned: diagnostics, D23 (plan.md:346) |
| C_Cpp.exclusionPolicy | Instructs the extension when to use the `files.exclude` (and `C_Cpp.files.exclude`) ... | no | not needed |
| C_Cpp.experimentalFeatures | Controls whether "experimental" features are usable | no | not needed: cpptools or platform specific |
| C_Cpp.files.exclude | Configure glob patterns for excluding folders (and files if `C_Cpp.exclusionPolicy` ... | no | missing: clangd indexes what the compile database lists |
| C_Cpp.formatting | Configures the formatting engine | no | planned: formatting of the open file through clangd, D23 (plan.md:348); clangd formats with the repository's `.clang-format` |
| C_Cpp.hover | If disabled, hover details are no longer provided by the language server | no | planned: hover, D23 (plan.md:346) |
| C_Cpp.inactiveRegionBackgroundColor | Controls the background coloring of inactive preprocessor blocks | no | missing (same) |
| C_Cpp.inactiveRegionForegroundColor | Controls the font coloring of inactive preprocessor blocks | no | missing (same) |
| C_Cpp.inactiveRegionOpacity | Controls the opacity of inactive preprocessor blocks | no | missing (same) |
| C_Cpp.inlayHints.autoDeclarationTypes.enabled | Display inlay hints for deduced type when `auto` is used in a declaration: ```cpp ... | no | planned: inlay hints edit nothing, so D23 (plan.md:348); clangd's `.clangd` `InlayHints` block sets the kinds |
| C_Cpp.inlayHints.autoDeclarationTypes.showOnLeft | Display inlay hints for deduced type when `auto` is used in a declaration on the ... | no | planned: inlay hints edit nothing, so D23 (plan.md:348); clangd's `.clangd` `InlayHints` block sets the kinds |
| C_Cpp.inlayHints.parameterNames.enabled | Display inlay hints for parameter names: ```cpp int a = getArea(/* width: */ x, /* ... | no | planned: inlay hints edit nothing, so D23 (plan.md:348); clangd's `.clangd` `InlayHints` block sets the kinds |
| C_Cpp.inlayHints.parameterNames.hideLeadingUnderscores | Hide leading `_` in parameter name hints | no | planned: inlay hints edit nothing, so D23 (plan.md:348); clangd's `.clangd` `InlayHints` block sets the kinds |
| C_Cpp.inlayHints.parameterNames.suppressWhenArgumentContainsName | Suppress parameter name hints when the argument text or inline comment contains the ... | no | planned: inlay hints edit nothing, so D23 (plan.md:348); clangd's `.clangd` `InlayHints` block sets the kinds |
| C_Cpp.inlayHints.referenceOperator.enabled | Display the inlay hint reference operator `&` for parameters passed by non-const ... | no | planned: inlay hints edit nothing, so D23 (plan.md:348); clangd's `.clangd` `InlayHints` block sets the kinds |
| C_Cpp.inlayHints.referenceOperator.showSpace | Controls whether a space is shown after `&` for parameters passed by non-const ... | no | planned: inlay hints edit nothing, so D23 (plan.md:348); clangd's `.clangd` `InlayHints` block sets the kinds |
| C_Cpp.intelliSense.maxCachedProcesses | The maximum number of IntelliSense processes to keep running | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.intelliSense.maxMemory | Older IntelliSense processes will shut down before new processes are created after ... | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.intelliSenseCachePath | Defines the folder path for cached precompiled headers used by IntelliSense | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.intelliSenseCacheSize | Maximum size of the per-workspace hard drive space in megabytes (MB) for cached ... | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.intelliSenseEngine | Controls the IntelliSense provider | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.intelliSenseMemoryLimit | Memory usage limit in megabytes (MB) of an IntelliSense process | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.intelliSenseUpdateDelay | Controls the delay in milliseconds before IntelliSense starts updating after a ... | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.legacyCompilerArgsBehavior | Enable pre-v1.10.0 behavior for how shell escaping is handled in compiler arg ... | no | not needed: cpptools or platform specific |
| C_Cpp.loggingLevel | The verbosity of logging in the Output Panel | no | missing; clangd `--log` (section 3a) |
| C_Cpp.markdownInComments | Select whether markdown will be available in the hover tooltip | no | missing: cpptools only, no clangd counterpart |
| C_Cpp.maxCachedProcesses | The maximum number of cached processes to use for language service processing | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.maxConcurrentThreads | The maximum number of concurrent threads to use for language service processing | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.maxMemory | The maximum memory (in MB) available for language service processing | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.maxSymbolSearchResults | The maximum number of results to show for 'Go to Symbol in Workspace' | no | planned in part: D23b workspace symbols; clangd `--limit-results` (section 3a) |
| C_Cpp.persistVsDeveloperEnvironment | Remember the last used Visual Studio developer environment for the current workspace | no | not needed: cpptools or platform specific |
| C_Cpp.preferredPathSeparator | The character used as a path separator for generated user paths | no | not needed: cpptools or platform specific |
| C_Cpp.refactoring.includeHeader | Controls whether to include the header file of a refactored function/symbol to its ... | no | planned: code actions, D23b (plan.md:349) |
| C_Cpp.references.maxCachedProcesses | The maximum number of processes to keep in memory for 'Find All References' and ... | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.references.maxConcurrentThreads | The maximum number of concurrent threads to use for 'Find All References' and ... | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.references.maxMemory | Fewer 'Find All References' and 'Rename' processes will be cached and run ... | no | not needed: the cpptools engine's limits; clangd has its own |
| C_Cpp.renameRequiresIdentifier | If `true`, 'Rename Symbol' will require a valid C/C++ identifier | no | planned: rename, D23b (plan.md:349) |
| C_Cpp.simplifyStructuredComments | If `true`, tooltips of hover and auto-complete will only display certain labels of ... | no | missing: cpptools only, no clangd counterpart |
| C_Cpp.sshTargetsView | Controls whether the SSH Targets view is visible | no | not needed: cpptools or platform specific |
| C_Cpp.suggestSnippets | If `true`, snippets are provided by the language server | no | planned: D23 completion |
| C_Cpp.vcFormat.indent.accessSpecifiers | Access specifiers are indented relative to class or struct definitions by the amount ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.braces | Braces are indented by the amount specified in the `editor.tabSize` setting | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.caseContents | Code inside a `case` block is indented relative to its label by the amount specified ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.caseContentsWhenBlock | Indent braces following a case statement by the amount specified in the ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.caseLabels | Labels are indented relative to switch statements by the amount specified in the ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.gotoLabels | The position of goto labels | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.lambdaBracesWhenParameter | Indent braces of lambdas used as function parameters relative to the start of the ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.multiLineRelativeTo | Determines what new line indentation is relative to | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.namespaceContents | Code is indented relative to its enclosing namespace by the amount specified in the ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.preprocessor | The position of preprocessor directives | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.preserveComments | Indentation of comments is not changed during formatting operations | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.preserveWithinParentheses | In existing code, preserve the existing indent alignment of new lines within ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.indent.withinParentheses | When a new line is typed, it is aligned under the opening parenthesis or based on ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeCatch | Place `catch` and similar keywords on a new line | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeElse | Place `else` on a new line | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeOpenBrace.block | The position of opening braces for control blocks | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeOpenBrace.function | The position of opening braces for functions | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeOpenBrace.lambda | The position of opening braces for lambda functions | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeOpenBrace.namespace | The position of opening braces for namespaces | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeOpenBrace.type | The position of opening braces for type definitions | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.beforeWhileInDoWhile | Place `while` in a `do`-`while` loop on a new line | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.closeBraceSameLine.emptyFunction | For empty function bodies, move closing braces to the same line as opening braces | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.closeBraceSameLine.emptyType | For empty types, move closing braces to the same line as opening braces | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.newLine.scopeBracesOnSeparateLines | Place opening and closing braces for scopes on separate lines | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.afterCastCloseParenthesis | A space is added after the closing parenthesis of a C-style cast | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.afterComma | A space is added after every comma | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.afterKeywordsInControlFlowStatements | A space is added between the keyword and opening parenthesis in control flow ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.aroundAssignmentOperator | Spaces around assignment operators | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.aroundBinaryOperator | Spaces around binary operators | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.aroundTernaryOperator | Spaces around conditional operators | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeBlockOpenBrace | A space is added before the opening braces of scope blocks | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeComma | A space is added before every comma | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeConstructorColon | A space is added before the colon in constructor definitions | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeEmptySquareBrackets | When square brackets are empty, a space is added before the opening bracket | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeFunctionOpenParenthesis | Spacing between function names and opening parentheses of argument lists | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeInheritanceColon | A space is added before the colon for inherited types in class definitions | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeInitializerListOpenBrace | A space is added before the opening brace of uniform initialization and initializer ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeLambdaOpenParenthesis | A space is added before the opening parenthesis of lambda argument lists | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.beforeOpenSquareBracket | A space is added before opening square brackets | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.betweenEmptyBraces | When braces are empty and on the same line, a space is inserted between them | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.betweenEmptyLambdaBrackets | When square brackets are empty, a space is inserted between them | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.betweenEmptyParameterListParentheses | When a function parameter list is empty, a space is inserted between its parentheses | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.betweenEmptySquareBrackets | When square brackets are empty, a space is inserted between them | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.groupSquareBrackets | For multi-dimensional arrays, all space between brackets is removed | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.insertAfterSemicolon | A space is inserted after every semicolon | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.pointerReferenceAlignment | Spaces around pointer and reference operators | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.preserveInInitializerList | Spaces around commas are preserved inside uniform initialization and initializer ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.removeAroundMemberOperators | Spaces around member access operators, pointer-to-member operators, and scope ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.removeAroundUnaryOperator | Spaces between unary operators and operands are removed | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.removeBeforeSemicolon | Spaces are removed before every semicolon | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.withinCastParentheses | A space is added after the opening parenthesis and also before the closing ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.withinControlFlowStatementParentheses | A space is added after the opening parenthesis and also before the closing ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.withinExpressionParentheses | A space is added after the opening parenthesis and also before the closing ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.withinInitializerListBraces | A space is added after the opening brace and also before the closing brace of ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.withinLambdaBrackets | A space is added after the opening square bracket and also before the closing square ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.withinParameterListParentheses | A space is added after the opening parenthesis and also before the closing ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.space.withinSquareBrackets | A space is added after the opening square bracket and also before the closing square ... | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcFormat.wrap.preserveBlocks | Wrapping options for blocks | no | not needed: clangd formats only through `.clang-format`; formatting planned in D23 (plan.md:348) |
| C_Cpp.vcpkg.enabled | Enable integration services for the vcpkg dependency manager | no | not needed: cpptools or platform specific |
| C_Cpp.windowsErrorReportingMode | If `disabled`, Windows Error Reporting will be disabled | no | not needed: cpptools or platform specific |
| C_Cpp.workspaceParsingPriority | Controls whether parsing of the non-active workspace files uses sleeps to avoid ... | no | not needed: clangd `--background-index-priority` (section 3a) |
| C_Cpp.workspaceSymbols | The symbols to include in the query results when 'Go to Symbol in Workspace' is ... | no | planned: workspace symbols, D23b (plan.md:349) |

### 4n. clangd extension (`clangd.*`)

Not installed here; keys read from https://raw.githubusercontent.com/clangd/vscode-clangd/master/package.json (17). Used: game-engine sets `clangd.arguments`.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| clangd.path | the clangd binary | no | has as a ruling: clangd from PATH, plan.md:520 |
| clangd.arguments | arguments passed to clangd | yes (game-engine) | planned: oculus's own fixed arguments (`--compile-commands-dir` to `~/.oculus/lsp/<root>/`, `--header-insertion=never`), plan.md:348, plan.md:520, plan.md:522; more arguments missing |
| clangd.fallbackFlags | flags for a file with no database entry | no | missing; would live in oculus's clangd area of `behavior.yml` |
| clangd.enable | the extension on or off | no | planned: one server per root and language, D23 (plan.md:346) |
| clangd.enableCodeCompletion | completion on or off | no | planned: every feature, D23 (plan.md:348) |
| clangd.enableHover | hover on or off | no | planned: D23 (plan.md:346) |
| clangd.onConfigChanged | prompt, restart or ignore on a config change | no | missing: restart on a changed `.clangd` or database |
| clangd.restartAfterCrash | restart up to four times | no | missing |
| clangd.trace | a trace file of the protocol | no | missing |
| clangd.inactiveRegions.useBackgroundHighlight | shade inactive code | no | missing (as C_Cpp.dimInactiveRegions) |
| clangd.inactiveRegions.opacity | opacity of inactive code | no | missing |
| clangd.semanticHighlighting | deprecated, use editor.semanticHighlighting | no | not needed: deprecated |
| clangd.serverCompletionRanking | rank completions in clangd | no | not needed |
| clangd.checkUpdates | check for a newer clangd | no | not needed |
| clangd.onConfigChangedForceEnable | force the config watcher | no | not needed |
| clangd.detectExtensionConflicts | warn about conflicting extensions | no | not needed |
| clangd.useScriptAsExecutable | allow a script as the binary | no | not needed |

### 4o. Python extension (`python.*`)

From ms-python.python 2026.6.0 `package.json` (41 keys). oculus runs pyright for Python (plan.md:346); no Python debugger (plan.md:494). No repository sets any.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| python.REPL.enableREPLSmartSend | Toggle Smart Send for the Python REPL | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.REPL.provideVariables | Toggle to provide variables for the REPL variable view for the native REPL | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.REPL.sendToNativeREPL | Toggle to send code to Python REPL instead of the terminal on execution | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.activeStateToolPath | Path to the State Tool executable for ActiveState runtimes (version 0.36+) | no | not needed |
| python.autoComplete.extraPaths | List of paths to libraries and the like that need to be imported by auto complete ... | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.condaPath | Path to the conda executable to use for activation (version 4.4+) | no | missing |
| python.createEnvironment.contentButton | Show or hide Create Environment button in the editor for `requirements.txt` or other ... | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.createEnvironment.trigger | Detect if environment creation is required for the current project | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.defaultInterpreterPath | Path to default Python to use when extension loads up for the first time, no longer ... | no | missing: pyright runs `python3` from PATH in the root to learn its search paths (draft `D23-brief-draft.md:24`); a choice would live in `behavior.yml` or `.oculus/` |
| python.envFile | Absolute path to a file containing environment variable definitions | no | missing |
| python.experiments.enabled | Enables A/B tests experiments in the Python extension | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.experiments.optInto | List of experiments to opt into | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.experiments.optOutFrom | List of experiments to opt out of | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.globalModuleInstallation | Whether to install Python modules globally when not using an environment | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.interpreter.infoVisibility | Controls when to display information of selected interpreter in the status bar | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.languageServer | Defines type of the language server | no | has as a ruling: pyright, plan.md:346 |
| python.locator | [Experimental] Select implementation of environment locators | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.logging.level | The logging level the extension logs at, defaults to 'error' | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.missingPackage.severity | Set severity of missing packages in requirements.txt or pyproject.toml | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.pipenvPath | Path to the pipenv executable to use for activation | no | missing |
| python.pixiToolPath | Path to the pixi executable | no | missing |
| python.poetryPath | Path to the poetry executable | no | missing |
| python.terminal.activateEnvInCurrentTerminal | Activate Python Environment in the current Terminal on load of the Extension | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.terminal.activateEnvironment | Activate Python Environment in all Terminals created | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.terminal.executeInFileDir | When executing a file in the terminal, whether to use execute in the file's ... | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.terminal.focusAfterLaunch | When launching a python terminal, whether to focus the cursor on the terminal | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.terminal.launchArgs | Python launch arguments to use when executing a file in the terminal | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.terminal.shellIntegration.enabled | Enable shell integration for the terminals running python | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.autoTestDiscoverOnSaveEnabled | Enable auto run test discovery when saving a test file | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.autoTestDiscoverOnSavePattern | Glob pattern used to determine which files are used by autoTestDiscoverOnSaveEnabled | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.cwd | Optional working directory for tests | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.debugPort | Port number used for debugging of tests | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.promptToConfigure | Prompt to configure a test framework if potential tests directories are discovered | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.pytestArgs | Arguments passed in | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.pytestEnabled | Enable testing using pytest | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.pytestPath | Path to pytest | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.unittestArgs | Arguments passed in | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.testing.unittestEnabled | Enable testing using unittest | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.useEnvironmentsExtension | Enables the Python Environments extension | no | missing; no step (REPL, testing, terminal activation, environments) |
| python.venvFolders | Folders in your home directory to look into for virtual environments (supports ... | no | missing (same) |
| python.venvPath | Path to folder with a list of Virtual Environments (e.g | no | missing: pyright reads `venvPath` from `pyrightconfig.json` itself; the relay sends no client setting (draft `D23-brief-draft.md:51`) |

### 4p. Pylance and pyright analysis (`python.analysis.*`)

From ms-python.vscode-pylance 2026.3.1 `package.json` (86 keys). pyright reads a subset as client settings: `python.pythonPath`, `python.venvPath`, and `python.analysis` `typeshedPaths`, `stubPath`, `diagnosticSeverityOverrides`, `diagnosticMode`, `useLibraryCodeForTypes`, `logLevel`, `autoSearchPaths`, `extraPaths`, `include`, `exclude`, `ignore`, `typeCheckingMode`, `autoImportCompletions`, and `pyright` `openFilesOnly`, `disableLanguageServices`, `disableTaggedHints`, `disableOrganizeImports`, `typeCheckingMode` (the packed pyright 1.1.414, scratchpad `D23-check/package/dist/pyright-internal.js`, the function around `getConfiguration(e.rootUri,"python")`).

| Setting | What it does | Used | oculus |
|---|---|---|---|
| python.analysis.addExtraPathsForPythonProjects | **Experimental.** When enabled, Pylance will automatically add the source root of ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.addFoldersForPythonProjects | When enabled, Pylance will add a virtual workspace folder for each project declared ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.aiCodeActions | Enable/disable AI-assisted code actions | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.aiHoverSummaries | Enable/disable AI assistance to show copilot-generated summaries in the hover tooltip | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.autoFormatStrings | When typing a `{` in a string, automatically prefix the string with an `f` | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.autoImportCompletions | Enable auto-import completions | no | missing: a pyright client setting and the relay sends none (draft `D23-brief-draft.md:51`); would live in oculus's pyright area of `behavior.yml` |
| python.analysis.autoIndent | Automatically adjust indentation based on language semantics when typing Python code | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.autoSearchPaths | Automatically add common search paths like `src` | no | missing: a pyright client setting and the relay sends none (draft `D23-brief-draft.md:51`); would live in oculus's pyright area of `behavior.yml` |
| python.analysis.autoSplitStrings | Automatically add quote and line continuation characters when splitting strings | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.autoTranslateDocstrings | Automatically translate Python docstrings in hover tooltips to your preferred ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.completeFunctionParens | Add parentheses to function completions | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.diagnosticMode | Analysis scope for showing diagnostics | no | missing: a pyright client setting and the relay sends none (draft `D23-brief-draft.md:51`); would live in oculus's pyright area of `behavior.yml` |
| python.analysis.diagnosticSeverityOverrides | Allows a user to override the severity levels for individual diagnostics | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `the report* rules` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.diagnosticsSource | Allows specifying a different type checker to use for diagnostics | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.disableTaggedHints | Disable hint diagnostics with special hints for grayed-out or strike-through text | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.displayEnglishDiagnostics | Display diagnostics in English regardless of VS Code's display language | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableAsyncProgram | Enable/disable async communication with internal Type Server | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableColorPicker | Enable/disable color picker in the editor for '#RRGGBB' and '#RRGGBBAA' strings | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableDjangoSupport | Enables Django support in Pylance | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableEditableInstalls | Enable support for editable installs of packages as described in PEP 660 when using ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableExternalTypeServer | Enable/disable using an external Type Server | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableMangleName | Enable/disable experimental manged name context | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableParallelIndexing | **Experimental.** Enable parallel indexing using a faster Rust-based out-of-process ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enablePerfTelemetry | Enables internal perf telemetry if telemetry is enabled in VS Code | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enablePyreflyNotification | Enable/disable showing the notification that lets the user switch to Pyrefly as the ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enablePytestSupport | Enables pytest support in Pylance | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableSnippetExtraTelemetry | Enable/disable extra telemetry for running code snippets | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.enableTroubleshootMissingImports | Enable/disable the Quick Fix for troubleshooting missing imports | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.exclude | Paths of directories or files that should not be included | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `exclude` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.excludeLibraryDiagnostics | Suppress diagnostics for library files such as standard library, site-packages, and ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.extraCommitChars | Allow using '.', '(' as commit characters when applicable | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.extraPaths | Additional import search resolution paths | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `extraPaths` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.extraPathsForPythonProjects | **Experimental.** A manual map of folder  `extraPaths`, applied to the per-project ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.findRefsInBackgroundThread | Enable/disable running Find All References on the background thread | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.fixAll | source fixes to run in fix all | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.generateWithTypeAnnotation | Add type annotations when generating code | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.gotoDefinitionInStringLiteral | For string literals that look like module names, enables go to definition to go to ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.gotoOverrideCodeLens | Enable/disable a CodeLens on methods that override a base-class member | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.ignore | Paths of directories or files whose diagnostic output (errors and warnings) should ... | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `ignore` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.importFormat | Defines the default format for importing modules | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.include | Paths of directories or files that should be included | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `include` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.includeAliasesFromUserFiles | Include alias symbols from user files | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.includeExtraPathSymbolsInSymbolSearch | Include symbols from `python.analysis.extraPaths` in Workspace Symbol search | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.includeVenvInWorkspaceSymbols | Include symbols from installed packages in the active virtual environment ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.indexing | Enable indexing of installed third party libraries and user files for language ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.inlayHints.callArgumentNames | Enable/disable inlay hints for call argument names: ```python datetime('year='2019, ... | no | missing: pyright 1.1.414 serves no inlay hints (its capabilities name no `inlayHintProvider`; `grep -o "[a-zA-Z]*Provider:" dist/pyright-internal.js` lists 13 others); Monaco's lsp client has the feature (`node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js`:2372); no step |
| python.analysis.inlayHints.functionReturnTypes | Enable/disable inlay hints for function return types: ```python def foo(x:int) '-> ... | no | missing: pyright 1.1.414 serves no inlay hints (its capabilities name no `inlayHintProvider`; `grep -o "[a-zA-Z]*Provider:" dist/pyright-internal.js` lists 13 others); Monaco's lsp client has the feature (`node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js`:2372); no step |
| python.analysis.inlayHints.pytestParameters | Enable/disable inlay hints for pytest function parameter types: ```python def ... | no | missing: pyright 1.1.414 serves no inlay hints (its capabilities name no `inlayHintProvider`; `grep -o "[a-zA-Z]*Provider:" dist/pyright-internal.js` lists 13 others); Monaco's lsp client has the feature (`node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js`:2372); no step |
| python.analysis.inlayHints.variableTypes | Enable/disable inlay hints for variable types | no | missing: pyright 1.1.414 serves no inlay hints (its capabilities name no `inlayHintProvider`; `grep -o "[a-zA-Z]*Provider:" dist/pyright-internal.js` lists 13 others); Monaco's lsp client has the feature (`node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js`:2372); no step |
| python.analysis.installPythonDependencyRemediation | Enable/disable automatic installation of the Python Dependency Remediation extension | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.languageServerMode | Select a predefined set of values for settings | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.logLevel | Specifies the level of logging for the Output panel | no | missing: a pyright client setting and the relay sends none (draft `D23-brief-draft.md:51`); would live in oculus's pyright area of `behavior.yml` |
| python.analysis.logTypeServerMessages | Enable/disable logging of all Type Server Protocol (TSP) messages to the output ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.nodeArguments | Extra arguments to pass to a Node.js executable to use for running the language ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.nodeExecutable | Path to a Node.js executable to use for running the language server | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.packageIndexDepths | Used to override how many levels under installed packages to index on a per package ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.persistAllIndices | Indices for all third party libraries will be persisted to disk | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.pyreflyVersion | Specifies the version of Pyrefly to use for diagnostics | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.pyrightVersion | Specifies the version of Pyright to use for diagnostics | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.referencesCodeLens | Enable/disable references CodeLens in Python files | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.regenerateStdLibIndices | Instead of relying on the shared stdlib.json indices for all Python versions, ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.reportExtraTelemetry | Report extra telemetry [Experimental] | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.showOnlyDirectDependenciesInAutoImport | Show only direct dependencies declared in `requirements.txt` or `pyproject.toml` in ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.stubPath | Path to directory containing custom type stub files | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `stubPath` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.supportAllPythonDocuments | Enable/disable support for all Python documents | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.supportDocstringTemplate | Enable/disable reStructuredText docstring generation | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.supportRestructuredText | Enable/disable support for reStructuredText in docstrings | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeCheckingMode | Type checking modes Basic, Standard, and Strict : / Feature / Basic / Standard / ... | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `typeCheckingMode` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.typeEvaluation.analyzeUnannotatedFunctions | Analyze and report errors for functions and methods that have no type annotations ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.deprecateTypingAliases | PEP 585 indicates that aliases to types in standard collections that were introduced ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.disableBytesTypePromotions | Disables legacy behavior where `bytearray` and `memoryview` are considered subtypes ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.enableExperimentalFeatures | Enables a set of experimental (mostly undocumented) features that correspond to ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.enableReachabilityAnalysis | If enabled, code that is determined to be unreachable by type analysis is reported ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.enableTypeIgnoreComments | PEP 484 defines support for `# type: ignore` comments | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.strictDictionaryInference | When inferring the type of a dictionary's keys and values, use strict type ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.strictListInference | When inferring the type of a list, use strict type assumptions | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.strictParameterNoneValue | PEP 484 indicates that when a function parameter is assigned a default value of ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeEvaluation.strictSetInference | When inferring the type of a set, use strict type assumptions | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeServerArguments | Arguments to pass to the type server | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeServerExecutable | Path to a custom type server | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.typeshedPaths | Paths to look for typeshed modules | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `typeshedPath` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.useLibraryCodeForTypes | Use library implementations to extract type information when type stub is not present | no | planned in effect: once D23 runs pyright (plan.md:346), pyright reads `useLibraryCodeForTypes` from the repository's `pyrightconfig.json` or the `[tool.pyright]` table of `pyproject.toml` itself (`initializeFromJson` and `_parsePyprojectTomlFile` in pyright 1.1.414 `dist/pyright-internal.js`); the relay answers client settings with null (draft `D23-brief-draft.md:51`) |
| python.analysis.useNearestConfiguration | **Experimental.** When enabled, Pylance will search for and use pyrightconfig.json ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.usePerProjectEnvironments | When enabled, Pylance will use a separate Python environment (interpreter) for each ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.userFileIndexFollowSymlinkedFolders | When enabled, user-file indexing will follow files under symlinked folders in the ... | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |
| python.analysis.userFileIndexingLimit | Maximum number of user files to index in the workspace | no | not needed: Pylance only; oculus runs pyright (plan.md:346) |

### 4q. debugpy extension settings

From debugpy `package.json`.

| Setting | What it does | Used | oculus |
|---|---|---|---|
| debugpy.debugJustMyCode | When debugging only step through user-written code | no | excluded: Python debuggers not built, plan.md:494 |
| debugpy.showPythonInlineValues | Whether to display inline values in the editor while debugging | no | excluded: Python debuggers not built, plan.md:494 |

### 4r. Groups with one row each

| Group | What it covers | Used | oculus |
|---|---|---|---|
| Workbench appearance (`workbench.colorTheme`, `iconTheme`, `productIconTheme`, `colorCustomizations`) | themes, icons, colour overrides | no | has: themes in `appearance.yml:9-26`, icons in `config/catalogs/icons.yml`, Monaco colours from tokens `kit/colours.ts`; per-colour overrides missing |
| Workbench layout (`workbench.activityBar.*`, `statusBar.*`, `sideBar.*`, `panel.*`) | the bars and their places | no | see vscode-parity.md:13-44 (L5, L6 landed) |
| Breadcrumbs (`breadcrumbs.*`) | the path bar over an editor | no | planned: X3c breadcrumbs over a file tab, symbols after D23, plan.md:173, plan.md:571 (Z47 4) |
| Outline (`outline.*`) | the symbol outline | no | planned: X3a Outline section (vscode-parity.md:66); symbols from D23 |
| Problems (`problems.*`) | the Problems panel | no | part: the Findings view (vscode-parity.md:35); language diagnostics from D23 show in the editor |
| Timeline (`timeline.*`) | per-file history | no | see vscode-parity.md:67 (X3) |
| Security and workspace trust (`security.workspace.trust.*`) | what a folder may run | no | has as a rule: approval of exact text, DESIGN.md:148 |
| Keyboard (`keyboard.*`, keybindings.json) | key dispatch and custom bindings | no | has fixed bindings (HELP.md:59-88, `shell/keys/keys.ts`); rebinding missing, no step |
| Merge conflicts (`merge-conflict.*`, `mergeEditor.*`) | conflict decorations and the merge editor | no | has: D13b merge on Monaco, plan.md:333 |
| Markdown (`markdown.*`) | preview and language features | no | has: the preview beside the source (DESIGN.md:284); language features missing, no step |
| LaTeX Workshop (`latex-workshop.*`) | LaTeX build, view, lint | no | see vscode-parity.md:148-163 (D5, D14, D15) |
| CMake Tools (`cmake.*`) | CMake configure, build, kits | no | excluded: CMake tooling not built, plan.md:494 |
| TypeScript and JavaScript (`typescript.*`, `javascript.*`, `js/ts.*`) | language features | no | missing, no step; Monaco's built-in TS worker runs syntax checks only, `kit/load.ts:122-124` |
| JSON, YAML, CSS, HTML, Emmet (`json.*`, `yaml.*`, `css.*`, `html.*`, `emmet.*`) | language features | no | missing, no step |
| npm (`npm.*`) | scripts view and task detection | no | missing, no step (section 1f) |
| Testing (`testing.*`) | the test explorer | no | missing, no step |
| Output and logs (`output.*`) | the Output panel | no | missing, no step |
| Comments (`comments.*`) | review comment threads | no | planned in part: A1 review comments on a diff line, plan.md:354, vscode-parity.md:129 |
| Window (`window.*`) | the native window, title, zoom, restore | no | not needed: oculus is one browser tab; a native window is O30, plan.md:400 |
| Zen mode, screencast mode (`zenMode.*`, `screencastMode.*`) | presentation modes | no | missing, no step |
| Accessibility and signals (`accessibility.*`, `accessibility.signals.*`) | screen reader and sounds | no | missing, no step |
| Extensions (`extensions.*`) | the extension marketplace | no | no step; E1 designs apps added while oculus runs, plan.md:353 |
| Remote (`remote.*`, tunnels) | remote hosts and tunnels | no | no step: loopback only by design (vscode-parity.md:134) |
| Notebooks and Jupyter (`notebook.*`, `jupyter.*`) | notebook editor | no | no step |
| Chat and Copilot (`chat.*`, `inlineChat.*`, `github.copilot.*`) | AI chat in the editor | no | no step: agents run in terminals (vscode-parity.md:198) |
| Telemetry (`telemetry.*`) | usage data | no | no step: nothing leaves the machine |
| Accounts and Settings Sync (`settingsSync.*`) | sign-in and sync | no | no step |
| Update (`update.*`) | app updates | no | no step |
| HTTP and proxy (`http.*`) | network proxy | no | no step |
| Simple Browser, Live Preview | a browser in a tab | no | no step |
| Interactive window and REPL (`interactiveWindow.*`, `python.REPL.*`) | send code to a REPL | no | no step (a terminal runs any REPL) |

## Missing, grouped

The "missing" rows above, grouped into items Axel would decide on. No recommendation here.

| Item | What it would add |
|---|---|
| D17 command options beyond `{ name, run, cwd? }` and Z74 (3) | environment, process-or-shell, dependency order, reveal, clear, reuse, close, focus, echo, hide, detail, icon, instance limit and policy, rerun and restart, a picker for the default build and test (sections 1a, 1b, 1f, 4k) |
| Error formats for D17's clickable compiler errors | which output formats are read ($gcc for cathedra, others), background begin and end patterns, whether errors feed the Findings view (section 1c) |
| Placeholders beyond the open file | caret line and column, selection, repository root and name, home, environment, config value, prompts and picks (`inputs`) (sections 1d, 1e) |
| Run on open or on a new worktree | a command run when a root is added or a worktree is made (runOn); A3 covers the update tasks only (section 1a) |
| Task auto-detection | commands read from package.json, Makefile and similar, and a build-the-open-file command (section 1f) |
| D11 launch form contents | saved configurations and names, working directory, a D17 command before and after the session, when the console opens, environment, compounds, server-ready action (sections 2a, 2b, 4j) |
| D11 Debug view settings | console font, wrap, line limit, clear on reuse, close on end (section 4j) |
| Editor settings exposed in Settings | word wrap, rulers, whitespace, minimap, cursor, font ligatures, sticky scroll, bracket guides and the rest left at Monaco's default (section 4a) |
| Save-time actions | format on save, trim trailing whitespace, insert or trim the final newline, code actions on save, per language (sections 4a, 4c, 4l) |
| Per-language overrides beyond indentation | any editor or files setting per language; D25 covers tab size and spaces only (section 4l) |
| Languages that open as plaintext | a grammar and a registration for C and C++ (2,175 text files of `.cpp`, `.hpp`, `.c`, `.cc` and 20,868 of `.h` across the three repositories), CMake, Lua, Wren, Dart, Java, Fortran, Ruby, SCSS, Graphviz and Jinja, and an extension line for `.pyi`; rite is D26 (section 4l) |
| File type associations as configuration | a general pattern-to-language map in oculus's config; D26 maps `.rite` only (section 4c) |
| Hidden and read-only patterns | a configurable exclude list for the Files tree and Search, read-only include and exclude patterns (sections 4c, 4d) |
| Auto save for source tabs | save after a delay or on focus change, as notes already do (section 4c) |
| Encodings other than UTF-8 | guessing and choosing an encoding (section 4c) |
| Search options | smart case, sort order, collapse, thread count, seeding from the selection, replace (section 4d) |
| Explorer and tab options outside X3a, X3c and Z70 | sort order, confirm settings, preview on or off, open position, editor limit, label format (sections 4e, 4f) |
| Terminal appearance and behaviour | cursor style and blink, line height, letter spacing, weight, ligatures, copy on selection, Option as Meta, word separators, default icon and colour, environment (section 4g) |
| Git options | auto fetch and period, smart commit, post-commit push, blame templates, ignored repositories, branch protection, commit input checks (section 4h) |
| clangd extras | fallback flags, clang-tidy, completion style, extra arguments, restart on config change, inactive-region shading, hand include paths, defines and forced includes on top of the database (sections 3, 3a, 4m, 4n) |
| pyright client settings and the interpreter | which Python and virtual environment pyright uses, diagnostic mode, auto search paths, auto-import completions; today the relay sends no client setting (sections 4o, 4p) |
| Groups with no step | the rows of section 4r marked "no step" |

## Cut under the Settings ruling

Each item of "Missing, grouped", and what it became on 2026-09-30 under the Settings ruling (an option is a key only where the answer differs between files, repositories or languages, or is taste). A decision is an open item in `orchestrator-state.md`; a fixed choice is one behaviour with no key.

| Item | What it became |
|---|---|
| D17 command options | Z85 for where commands live, found commands and placeholders. Fixed: a command is a full shell line, so its environment is in the line; every run opens and shows its task terminal. Dependency order and the default build and test keys are ruled (Z74 (3)). |
| Error formats for D17 | Fixed: one pattern for `path:line[:column]` followed by error or warning, which is what gcc and clang print. Whether the errors are listed is Z86. |
| Placeholders beyond the open file | Z85 (3). Prompts and picks are not built. |
| Run on open or on a new worktree | Fixed: nothing runs by itself; a scheduled run is A3. |
| Task auto-detection | Z85 (2). |
| D11 launch form contents | Z87. Compounds and a server-ready action are not built: one session, no server. |
| D11 Debug view settings | Fixed: the console uses the terminal's font and wraps; the editor takes the focus on a break. |
| Editor settings exposed in Settings | Z81. Every other editor setting stays at Monaco's default. |
| Save-time actions | Z79 (3) and (4). Code actions on save are not built. |
| Per-language overrides beyond indentation | Z79 (3), (4) and Z81 put their per-language keys in D25's area; no general override of any setting per language. |
| Languages that open as plaintext | Z78 (1). |
| File type associations as configuration | Z78 (2). |
| Hidden and read-only patterns | Fixed: the Files tree leaves out what git ignores and the hidden folders, with the two toggles Z76 keeps; Search runs ripgrep with no `--hidden` and no `--no-ignore`, so it leaves out the same, plus a fixed skip list (`src/lib/data/helpers/search.ts:101-116`); a file is read-only by its own mode. |
| Auto save for source tabs | Z79 (2). |
| Encodings other than UTF-8 | Fixed: UTF-8 only; a file whose first 8,192 bytes are not UTF-8 opens as binary and its save is refused (`src/lib/data/helpers/files/text-kind.ts`). |
| Search options | Z84 for replace. Fixed: the order ripgrep gives, no smart case key. |
| Explorer and tab options outside X3a, X3c and Z70 | Fixed at VS Code's defaults, by X3a and X3c. |
| Terminal appearance and behaviour | Z82. Line height, letter spacing, weight and ligatures stay fixed. |
| Git options | Z83 for auto fetch. Fixed at VS Code's defaults by X3d: the rest of sections 4b, 4h and 4i. Nothing pushes after a commit. |
| clangd extras | No decision. Inactive-region shading and semantic colouring are features clangd offers, so they are inside D23 by Z72 (4) (b1). Fixed: oculus's own arguments as ruled (Z72, Z74 (4)); clang-tidy and the inlay hint kinds are read by clangd from a repository's own `.clang-tidy` and `.clangd` when it has them. |
| pyright client settings and the interpreter | Z80 for the interpreter. Fixed: every other setting at pyright's default; pyright reads a repository's own `pyrightconfig.json` or `pyproject.toml`. pyright 1.1.414 serves no inlay hints. |
| Groups with no step | Z88. |
