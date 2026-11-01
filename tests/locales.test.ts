// Run with `npm test`. Every locale must have exactly en_US's keys and no "(xx_XX)" placeholder values.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(tree)) {
		if (typeof value === 'string') {
			out[prefix + key] = value;
		} else {
			Object.assign(out, flatten(value, `${prefix}${key}.`));
		}
	}
	return out;
}

const load = (name: string): Record<string, string> => flatten(JSON.parse(readFileSync(new URL(`../locales/${name}.json`, import.meta.url), 'utf8')) as Tree);
const en = load('en_US');

describe('locales', () => {
	for (const locale of ['es_ES', 'ja_JP']) {
		const strings = load(locale);

		it(`${locale} has the same keys as en_US`, () => {
			assert.deepEqual(Object.keys(en).filter(key => !(key in strings)), [], 'missing keys');
			assert.deepEqual(Object.keys(strings).filter(key => !(key in en)), [], 'extra keys');
		});

		it(`${locale} has no placeholder values`, () => {
			assert.deepEqual(Object.entries(strings).filter(([, value]) => /^\([a-z]{2}_[A-Z]{2}\)/.test(value)).map(([key]) => key), []);
		});
	}
});
