import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { jsonBlocks, textBlocks, projectZipBlocks } from '../public_src/project_index.mjs';

const require = createRequire(import.meta.url);
require('../public_src/vendor/jszip.min.js');
const JSZip = globalThis.JSZip;

test('JSON arrays of project records become individually addressable passages', () => {
  const blocks = jsonBlocks(JSON.stringify({
    records: [{ id: 'REC-001', title: 'Sample finding', category: 'research', keywords: ['retrieval', 'evidence'] }],
    relationships: [{ id: 'LINK-1', source: 'REC-001', predicate: 'supports', target: 'claim-1', confidence: 0.9 }],
    indices: { ignored: ['large derived lookup'] },
  }));
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].heading, 'records / REC-001');
  assert.equal(blocks[0].location, 'JSON pointer /records/0');
  assert.match(blocks[0].text, /title: Sample finding/);
  assert.equal(blocks[1].heading, 'relationships / LINK-1');
  assert.equal(blocks[1].location, 'JSON pointer /relationships/0');
  assert.match(blocks[2].text, /^\{\}$/);
});

test('source text is chunked with line references and code symbols as headings', () => {
  const blocks = textBlocks('class Atlas:\n    def find_path(self, source, target):\n' + '    value = "x"\n'.repeat(300), 'py');
  assert.equal(blocks[0].heading, 'class Atlas');
  assert.equal(blocks[0].location, 'line 1');
  assert.equal(blocks[1].heading, 'def find_path');
  assert.ok(blocks.every(block => block.text.length <= 2600));
});

test('ZIP indexing reads safe project files and excludes credential files', async () => {
  const zip = new JSZip();
  zip.file('README.md', '# Sample project\nThis file is indexed.');
  zip.file('src/index.js', 'export function answer() { return 42; }');
  zip.file('.env', 'PRIVATE_KEY=do-not-index');
  zip.file('credentials.txt', 'password=do-not-index');
  const archive = await zip.generateAsync({ type: 'uint8array' });
  const { blocks } = await projectZipBlocks({ arrayBuffer: async () => archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) }, JSZip);
  assert.ok(blocks.some(block => /Sample project/.test(block.text)));
  assert.ok(blocks.some(block => /function answer/.test(block.text)));
  assert.ok(blocks.every(block => !/PRIVATE_KEY|do-not-index|password=/.test(block.text)));
});
