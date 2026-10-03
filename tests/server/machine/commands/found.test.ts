// Layer 4, server test. The commands oculus finds in a repository without being told: CMake
// presets, the scripts of `package.json` and the targets of the top Makefile. Each name from those
// files is one quoted shell word in its line.
//
// What this does NOT cover: CMake presets pulled in with `include`, and a Makefile target a
// `include`d file defines; only the files at the top of the repository are read.

import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import { listCommands } from '../../../../src/lib/server/machine/commands/list.ts';
import { enterHome, leaveHome, plant, plantRepo } from './commands-fixture.ts';

beforeEach(() => {
    enterHome();
});

afterEach(() => {
    leaveHome();
});

const found = (repo: string) => listCommands(repo).commands.filter((one) => one.source === 'found');

describe('found commands', () => {
    it('lists the configure, build and test presets, and leaves out a hidden one', () => {
        const repo = plantRepo({
            'CMakePresets.json': JSON.stringify({
                version: 6,
                configurePresets: [{ name: 'c' }, { name: 'h', hidden: true }],
                buildPresets: [{ name: 'b' }, { name: 'c' }],
                testPresets: [{ name: 't' }]
            }),
            'CMakeUserPresets.json': JSON.stringify({
                version: 6,
                configurePresets: [{ name: 'mine' }]
            })
        });
        expect(found(repo).map((one) => [one.name, one.run])).toEqual([
            ['cmake: c', "cmake --preset 'c'"],
            ['cmake build: b', "cmake --build --preset 'b'"],
            ['cmake build: c', "cmake --build --preset 'c'"],
            ['ctest: t', "ctest --preset 't'"],
            ['cmake: mine', "cmake --preset 'mine'"]
        ]);
    });

    it('lists the scripts of package.json with the package manager its lockfile names', () => {
        const scripts = { dev: 'vite', test: 'vitest', 'a b; c': 'x' };
        const pnpm = plantRepo({
            'package.json': JSON.stringify({ scripts }),
            'pnpm-lock.yaml': ''
        });
        expect(found(pnpm).map((one) => [one.name, one.run])).toEqual([
            ['npm: dev', "pnpm run 'dev'"],
            ['npm: test', "pnpm run 'test'"],
            ['npm: a b; c', "pnpm run 'a b; c'"]
        ]);
        const yarn = plantRepo({ 'package.json': JSON.stringify({ scripts }), 'yarn.lock': '' });
        expect(found(yarn)[0].run).toBe("yarn run 'dev'");
        const plain = plantRepo({ 'package.json': JSON.stringify({ scripts }) });
        expect(found(plain)[0].run).toBe("npm run 'dev'");
    });

    it('lists the targets of a Makefile and nothing that is not a plain target', () => {
        const repo = plantRepo({
            Makefile: [
                'X := 1',
                'X ::= 1',
                'Y :::= 1',
                '.PHONY: all',
                'all:',
                '\techo all',
                'clean:',
                'a b: c',
                '%.o: %.c',
                'dist/app.js: deps',
                ''
            ].join('\n')
        });
        expect(found(repo).map((one) => one.run)).toEqual([
            "make 'all'",
            "make 'clean'",
            "make 'a'",
            "make 'b'",
            "make 'dist/app.js'"
        ]);
        expect(found(repo).map((one) => one.name)).toEqual([
            'make: all',
            'make: clean',
            'make: a',
            'make: b',
            'make: dist/app.js'
        ]);
    });

    it('lists the three kinds together and nothing else for the case of all of them', () => {
        const repo = plantRepo({
            'CMakePresets.json': JSON.stringify({
                configurePresets: [{ name: 'c' }, { name: 'h', hidden: true }],
                buildPresets: [{ name: 'b' }]
            }),
            'package.json': JSON.stringify({ scripts: { dev: 'x', test: 'y', 'a b; c': 'z' } }),
            'pnpm-lock.yaml': '',
            Makefile:
                'all:\nclean:\na b: c\n%.o: %.c\n.PHONY: all\nX := 1\nX ::= 1\ndist/app.js: deps\n'
        });
        expect(found(repo).map((one) => one.run)).toEqual([
            "cmake --preset 'c'",
            "cmake --build --preset 'b'",
            "pnpm run 'dev'",
            "pnpm run 'test'",
            "pnpm run 'a b; c'",
            "make 'all'",
            "make 'clean'",
            "make 'a'",
            "make 'b'",
            "make 'dist/app.js'"
        ]);
    });

    it('reads the makefile and GNUmakefile spellings, GNUmakefile first', () => {
        const repo = plantRepo();
        plant(repo, 'makefile', 'low:\n');
        plant(repo, 'GNUmakefile', 'high:\n');
        expect(found(repo).map((one) => one.run)).toEqual(["make 'high'"]);
    });

    it('makes a finding of a package.json that is not JSON and lists the rest', () => {
        const repo = plantRepo({ 'package.json': '{ nope', Makefile: 'all:\n' });
        const listed = listCommands(repo);
        expect(listed.commands.map((one) => one.run)).toEqual(["make 'all'"]);
        expect(listed.findings).toHaveLength(1);
        expect(listed.findings[0].file.endsWith('package.json')).toBe(true);
    });
});
