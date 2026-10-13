// Layer 2, server. The languages two apps may both name. A language id is shared on purpose: an app
// that names an id that exists adds its extensions, file names and globs to it. What is not shared
// is an ending or a glob that two languages claim, a language configuration file for an id that
// already has one, and a grammar scope name another app already registered. The app that comes
// later in the Views list's order loses the rule, with a finding that names the language it lost
// it to, and the rule is taken out of its row, so the server's `onLanguage:` events and the page
// read the same join (`joinLanguages`). Only an app that is approved, enabled and unchanged adds
// a rule, since a rule of an app that does not act is not in force.

import { join } from 'node:path';
import { appActive } from '../../../../../data/helpers/files/apps/apps.ts';
import { joinLanguages } from '../../../../../data/helpers/files/apps/tools/languages.ts';
import { findingText, type TextCatalog } from '../../../../../data/helpers/finding-text.ts';
import type { LanguageMap } from '../../../../../data/helpers/files/languages.ts';
import type { Finding } from '../../../../../data/model/index.ts';
import { findingKey } from '../manifest.ts';
import type { AppsHeld } from '../held.ts';

/**
 * Take, in place, the rules that lost out of the rows of the acting apps, and add a finding for
 * each. `base` is the map of `config/sources.yml`.
 */
export function dropTakenLanguages(held: AppsHeld, base: LanguageMap, catalog: TextCatalog): void {
    const acting = held.apps.filter((app) => appActive(app.row));
    const say = (id: string, message: string): void => {
        const app = held.apps.find((one) => one.id === id);
        if (app === undefined) return;
        held.findings.push({
            file: join(app.row.folder, 'app.yml'),
            key: findingKey(app.row.root, app.row.name),
            message
        } satisfies Finding);
    };
    const { lost } = joinLanguages(
        base,
        acting.map((app) => ({ app: app.id, languages: app.row.contributes.languages }))
    );
    const lostBy = new Map<string, Set<string>>();
    for (const one of lost) {
        say(
            one.app,
            findingText(
                catalog,
                'findings.apps.language_taken',
                one.app,
                one.language,
                one.rule,
                one.first
            )
        );
        const rules = lostBy.get(`${one.app}\n${one.language}`) ?? new Set<string>();
        rules.add(one.rule);
        lostBy.set(`${one.app}\n${one.language}`, rules);
    }
    const configured = new Set<string>();
    const scopes = new Set<string>();
    for (const app of acting) {
        const contributes = app.row.contributes;
        contributes.languages = contributes.languages.map((language) => {
            const gone = lostBy.get(`${app.id}\n${language.id}`);
            const kept = {
                ...language,
                extensions: language.extensions.filter((one) => !gone?.has(one)),
                filenames: language.filenames.filter((one) => !gone?.has(one)),
                filenamePatterns: language.filenamePatterns.filter((one) => !gone?.has(one))
            };
            if (language.configuration === '') return kept;
            if (configured.has(language.id)) {
                say(
                    app.id,
                    findingText(
                        catalog,
                        'findings.apps.language_configuration_taken',
                        language.id,
                        language.configuration
                    )
                );
                return { ...kept, configuration: '' };
            }
            configured.add(language.id);
            return kept;
        });
        contributes.grammars = contributes.grammars.filter((grammar) => {
            if (!scopes.has(grammar.scopeName)) {
                scopes.add(grammar.scopeName);
                return true;
            }
            say(
                app.id,
                findingText(catalog, 'findings.apps.grammar_taken', grammar.path, grammar.scopeName)
            );
            return false;
        });
    }
}
