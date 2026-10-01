# Q85c, repair round 1

The refuter report is `agents/reviews/Q85c-refuter.md`. Each ruling below says what to change; nothing else of the step changes. Scoped tests while working; the full verify list runs once after the last change (`agents/spec.md:25`); a failed command is rerun alone, then the full list once more; the report counts every run of `npm test`, `npm run test:checks` and the full list, opens with what is not done, and names each ruling with the command that proves it.

1. **Spec 1, schemas built at each call.** `rowsShape(...)` at `index.ts:64`, `:75`, `:101`, `snapshot/normalise.ts:79` and `sources/present.ts:135`, `:140` becomes a module-level const each (`scanRulesShape`, `collectionFilesShape`, `vocabKeysShape`, `collectionKeysShape`, `specsShape`, `panelsShape`), read by the function.
2. **Spec 2, three maps built from a hub file's keys (Z173, the orchestrator, automode).** The `meta` loops of `sources/collections.ts:47-49` and `sources/registries.ts:80-82` and the `fields` loop of `snapshot/normalise.ts:485-487` skip an own `__proto__` key, as `DESIGN.md:148` says a map built from an outside map's keys does. One case each, in the module's own test file: a registry file and a collection file whose top holds `__proto__:` with a map under it give a `meta` whose prototype is `Object.prototype` and which carries no inherited key; a collection entry `{"__proto__":{"injected":"yes"},"title":"t"}` through `normalise` gives `fields` with no `injected`. Each case is run on the tree before this change and its failure quoted.
3. **Spec 3, the literal gate.** Accepted as built: `feeds.ts`, `manifests.ts`, `career.ts` and `options.ts` read through `readOr`, `optionalText` and `readYamlMap`, which parse through a schema inside. No padding call is added.
4. **Standards.**
   - `DESIGN.md:148`: the opening scope sentence names `src/lib/data` beside the server folders and `state/`.
   - `snapshot/validate-themes.ts:14`: the local `wordShape` is renamed (`themeWordShape`), so no two schemas share a name with different answers.
   - `sources/config/settings.ts:154-158`: the dead `?? ['']` branch is removed; the first failing entry is found without a fallback that cannot run.
   - `snapshot/normalise.ts:121`: the re-export `export { career }` is removed and `tests/data/sources/career.test.ts:9` imports `career` from `snapshot/normalise-career.ts`.
   - `snapshot/normalise-career.ts:119`: `strip` is renamed to `situation`.
   - `helpers/files/opens-in-program.ts`: `isBundleId` answers `bundleIdShape.safeParse(value).success`, so the bundle-id rule exists once.
   - `shapes/shapes.ts:1-7`: the head comment names the helpers this step added (`readOr`, `filledText`, `optionalText`, `keysOfShape`, `valuesOfShape`, `optionalItemsShape`, `textOrNumberOnlyShape`).
5. **Behaviour 1, the changed answers.** The report's list of changed answers states every one with its before and after: `flattenText`, the text catalog through `textCatalog` and `portfolioConfigFrom(...).text`, `loadConfig` (the map case and the `__proto__: x` text case and the second file's `defined_twice` finding), and the three maps of ruling 2.
