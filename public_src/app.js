import { sourceExts, textBlocks, projectZipBlocks } from './project_index.js';
import * as pdfjsLib from './vendor/pdf.min.js';
pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';
const $ = id => document.getElementById(id);
let documentState = null, demo = null, lastQuery = '', lastEvaluation = null, selectedQuestion = null;
let accessState = { limit: 10, used: 0, remaining: 10 };
const MAX_EVALUATION_BLOCKS = 1200, MAX_EVALUATION_CHARACTERS = 1500000, MAX_EVALUATION_BYTES = 1800000;
function evaluationLimit(state) {
  if (state.blocks.length > MAX_EVALUATION_BLOCKS) return `This document has ${state.blocks.length} blocks; the evaluation limit is ${MAX_EVALUATION_BLOCKS}. Try a smaller source.`;
  if (state.blocks.reduce((total, block) => total + block.text.length, 0) > MAX_EVALUATION_CHARACTERS) return 'This document exceeds the 1.5 million character evaluation limit. Try a smaller source.';
  return null;
}
const hash = async data => [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map(x => x.toString(16).padStart(2, '0')).join('');
const pageFrom = location => { const m = location?.match(/(?:PDF page|page)\s+(\d+)/i); return m ? Number(m[1]) : null; };
function makeBlocks(source, filename) {
  let section = filename;
  return source.filter(b => b.text?.trim()).map((b, index) => {
    if (b.heading) section = b.heading;
    return { id: `b${String(index + 1).padStart(5, '0')}`, title: `${filename} / ${section}`, section, location: b.location || `block ${index + 1}`, page: pageFrom(b.location), text: b.text.slice(0, 3500), index };
  });
}
async function pdfBlocks(file) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const blocks = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p), content = await page.getTextContent(), items = content.items.filter(x => x.str?.trim());
    const lines = [];
    let line = '', oldY = null;
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (oldY !== null && Math.abs(oldY - y) > 3) { if (line.trim()) lines.push(line.trim()); line = ''; }
      line += (line ? ' ' : '') + item.str; oldY = y;
    }
    if (line.trim()) lines.push(line.trim());
    let chunk = [], start = 1;
    const flush = () => {
      if (!chunk.length) return;
      blocks.push({ text: chunk.join(' '), location: `PDF page ${p} · lines ${start}–${start + chunk.length - 1}` });
      start += chunk.length; chunk = [];
    };
    for (const text of lines) {
      if (chunk.length && (chunk.length >= 8 || chunk.join(' ').length + text.length + 1 > 900)) flush();
      chunk.push(text);
    }
    flush();
  }
  return blocks;
}
async function docxBlocks(file) {
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer()), part = zip.file('word/document.xml');
  if (!part) throw Error('DOCX has no recognizable content');
  const xml = new DOMParser().parseFromString(await part.async('string'), 'application/xml'), blocks = [];
  for (const p of xml.getElementsByTagNameNS('*', 'p')) {
    const text = [...p.getElementsByTagNameNS('*', 't')].map(x => x.textContent).join('').trim();
    if (!text) continue;
    const style = p.getElementsByTagNameNS('*', 'pStyle')[0];
    const heading = style && /heading|titulo|title/i.test(style.getAttribute('w:val') || style.getAttribute('val') || '');
    const inTable = p.parentNode?.localName === 'tc';
    blocks.push({ ...(heading ? { heading: text } : {}), text, location: `${inTable ? 'table cell' : 'paragraph'} ${blocks.length + 1}` });
  }
  return blocks;
}
function activateDocument(state) {
  documentState = state; lastEvaluation = null; lastQuery = ''; selectedQuestion = null;
  $('query').value = ''; $('results').replaceChildren(); $('jevOutput').replaceChildren(); $('answerOutput').textContent = '';
  $('corpusCount').textContent = `${state.blocks.length} blocks · ${state.name}`;
  $('caseTitle').textContent = state.name;
  $('caseDescription').textContent = state.note || 'Document structure extracted locally in your browser.';
  const isResearchCase = state.mode === 'curated';
  $('caseSource').hidden = !isResearchCase;
  $('footerSource').hidden = !isResearchCase;
  if (isResearchCase) {
    $('documentFile').value = '';
    $('uploadStatus').textContent = 'Your document or ZIP project is structured in this browser. Jev receives the blocks when you request an evaluation.';
  }
  $('query').placeholder = isResearchCase ? 'What does the paper say about information in the middle?' : 'Ask a question about your document';
  $('retrieverState').textContent = `${state.blocks.length} structural blocks · no retrieval filter`;
  const limit = evaluationLimit(state);
  $('exportTrace').disabled = true; $('evaluate').disabled = !!limit;
  $('searchStatus').textContent = limit || 'Choose a question. Jev will evaluate the document structure when requested.';
  renderManifest();
}
async function loadDemo() {
  if (!demo) { const response = await fetch('./demo.json'); if (!response.ok) throw Error('Could not load the research case'); demo = await response.json(); }
  const encoded = new TextEncoder().encode(JSON.stringify(demo));
  const blocks = demo.sections.map((s, index) => ({ id: s.id, title: s.path, section: s.path, location: s.location, page: pageFrom(s.location), text: s.text, index }));
  activateDocument({ name: demo.title, id: 'research-case', bytes: encoded.byteLength, sha256: await hash(encoded), blocks, mode: 'curated', source_url: demo.url, note: demo.note });
  $('examples').replaceChildren();
  for (const q of demo.questions) { const b = document.createElement('button'); b.type = 'button'; b.textContent = `${q.id.toUpperCase()} · ${q.question}`; b.onclick = () => { selectedQuestion = q; prepareQuestion(q.question); }; $('examples').append(b); }
  return demo;
}
async function loadFile(file) {
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) throw Error('File limit: 100 MB');
  const ext = file.name.split('.').pop().toLowerCase(), digest = await hash(await file.arrayBuffer());
  let source, files = null, bytes = file.size;
  if (ext === 'zip') { const indexed = await projectZipBlocks(file, window.JSZip); source = indexed.blocks; files = indexed.files; bytes = indexed.bytes; }
  else if (ext === 'pdf') source = await pdfBlocks(file);
  else if (ext === 'docx') source = await docxBlocks(file);
  else if (sourceExts.has(ext)) source = textBlocks(await file.text(), ext);
  else throw Error('Supported formats: PDF, DOCX, text/code, JSON or ZIP');
  const blocks = makeBlocks(source, file.name);
  if (!blocks.length) throw Error('No text was extracted; scanned PDFs need OCR');
  activateDocument({ name: file.name, id: digest, bytes, sha256: digest, blocks, mode: ext === 'zip' ? 'project' : 'user' });
  $('examples').textContent = 'Ask a question about this document or source-code project.';
  $('uploadStatus').textContent = `Structured locally: ${file.name}${files ? ` · ${files} files` : ''} · ${blocks.length} blocks · SHA-256 ${digest.slice(0, 16)}… . ${evaluationLimit(documentState) || 'Jev receives structured text only when you evaluate.'}`;
}
function showSource(block) {
  $('dialogTitle').textContent = block.title || block.section;
  $('dialogMeta').textContent = `${block.location || block.paragraph || ''} · ${documentState.name} · ${block.id || block.block_id}`;
  $('sourceText').textContent = block.text;
  $('rawLink').hidden = !documentState.source_url;
  if (documentState.source_url) $('rawLink').href = documentState.source_url + (block.page ? `#page=${block.page}` : '');
  $('sourceDialog').showModal();
}
function addCard(block, label, score) {
  const card = document.createElement('article'); card.className = 'result';
  const top = document.createElement('div'); top.className = 'resultTop'; top.textContent = label;
  const heading = document.createElement('h3'); heading.textContent = block.title || block.section;
  const location = document.createElement('div'); location.className = 'path'; location.textContent = `${block.location || block.paragraph || ''} · ${block.id || block.block_id}${score === undefined ? '' : ` · Jev support ${score.toFixed(2)}`}`;
  const excerpt = document.createElement('p'); excerpt.className = 'excerpt'; excerpt.textContent = block.text.slice(0, 580);
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Inspect block and source ↗'; button.onclick = () => showSource(block);
  card.append(top, heading, location, excerpt, button); $('results').append(card);
}
function renderManifest() {
  if (!documentState) return;
  $('results').replaceChildren();
  for (const block of documentState.blocks.slice(0, 40)) addCard(block, `DOCUMENT BLOCK · ${block.id}`);
  if (documentState.blocks.length > 40) {
    const note = document.createElement('p'); note.className = 'status'; note.textContent = `${documentState.blocks.length - 40} more blocks in the document. The preview shows the first 40; the evaluation trace reports which blocks Jev inspected.`; $('results').append(note);
  }
}
function prepareQuestion(question) {
  lastQuery = question.trim(); $('query').value = lastQuery;
  lastEvaluation = null; $('jevOutput').replaceChildren(); $('answerOutput').textContent = ''; $('exportTrace').disabled = true;
  renderManifest();
  const limit = evaluationLimit(documentState);
  $('searchStatus').textContent = limit || `${documentState.blocks.length} blocks in this document. Jev decides which blocks support the question; no lexical search excludes them.`;
  $('evaluate').disabled = !!limit;
}
function updateAccess(value) {
  accessState = { ...accessState, ...value };
  accessState.limit = value.usage_limit ?? value.limit ?? accessState.limit;
  accessState.used = value.usage_used ?? value.used ?? accessState.used;
  accessState.remaining = value.usage_remaining ?? value.remaining ?? accessState.remaining;
  $('freeUsage').textContent = `${accessState.used} / 10 Jev evaluations used today · resets 00:00 UTC`;
}
async function checkJev() {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
  try { const response = await fetch('./api/status', { signal: controller.signal, cache: 'no-store' }); if (!response.ok) throw Error('Status unavailable'); const value = await response.json(); updateAccess(value); $('jevState').textContent = value.jev_available ? 'Jev available · document evaluation' : 'Jev is not configured'; $('evaluate').hidden = !value.jev_available; }
  catch { $('jevState').textContent = 'Jev is unavailable'; }
  finally { clearTimeout(timeout); }
}
function showDailyLimit() { if (!$('betaLimitDialog').open) $('betaLimitDialog').showModal(); }
function renderEvaluation(data) {
  $('jevOutput').replaceChildren(); $('results').replaceChildren();
  const verdict = document.createElement('div'); verdict.className = 'verdict';
  verdict.textContent = data.status === 'supported' ? `${data.evidence.length} evidence blocks selected by Jev.` : data.status === 'evaluation_incomplete' ? `Evaluation incomplete: ${data.reason}` : 'Insufficient evidence in the evaluated document.';
  $('jevOutput').append(verdict);
  const metrics = document.createElement('p'); metrics.textContent = `Document blocks: ${data.metrics.document_blocks} · inspected: ${data.metrics.blocks_inspected} · full block scores: ${data.metrics.blocks_evaluated} · Jev calls: ${data.metrics.jev_calls} · selected: ${data.metrics.evidence_blocks_selected} · instruction-bearing blocks flagged: ${data.metrics.prompt_injection_blocks_flagged || 0} · latency: ${data.metrics.latency_ms} ms · estimated cost: unavailable`;
  $('jevOutput').append(metrics);
  if (data.trace?.stage1?.length) { const note = document.createElement('small'); note.textContent = `Hierarchical Jev scan: ${data.trace.stage1.length} structural previews judged; each preview contains up to 225 characters from every member block. Full blocks in Jev-selected groups were judged next.`; $('jevOutput').append(note); }
  if (data.status === 'supported') for (const evidence of data.evidence) addCard({ ...evidence, id: evidence.block_id, title: evidence.section, location: evidence.paragraph }, 'JEV EVIDENCE · DOCUMENT → PAGE → SECTION → BLOCK', evidence.jev_score);
  else renderManifest();
  $('answerOutput').textContent = data.status === 'supported' ? 'Evidence set ready for the calling LLM. Cite these block IDs; if sources conflict or the question is ambiguous, explain the conflict or ask for clarification. TraceDocs has not generated an answer.' : 'Answer: none. No supported answer should be generated from this evaluation.';
  if (data.metrics.prompt_injection_blocks_flagged) { const warning = document.createElement('p'); warning.textContent = 'Document instructions were flagged and excluded from selected evidence. This check does not guarantee that all prompt injections are detected.'; $('jevOutput').append(warning); }
  $('exportTrace').disabled = false;
}
async function evaluateJev() {
  if (!documentState || !lastQuery) throw Error('Choose a document and question first');
  const limit = evaluationLimit(documentState); if (limit) throw Error(limit);
  if (accessState.remaining <= 0) { showDailyLimit(); throw Error('Daily Jev limit reached. You can run 10 Jev evaluations per day. The limit resets tomorrow.'); }
  $('evaluate').disabled = true; $('jevOutput').textContent = 'Jev is evaluating document blocks…';
  try {
    const body = JSON.stringify({ question: lastQuery, document_id: documentState.id, document_name: documentState.name, source_url: documentState.source_url || null, blocks: documentState.blocks.map(({ id, title, section, location, page, text }) => ({ id, title, section, location, page, text })) });
    if (new TextEncoder().encode(body).byteLength > MAX_EVALUATION_BYTES) throw Error('This evaluation exceeds the 1.8 MB request limit. Try a smaller source.');
    const response = await fetch('./api/evaluate', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    const data = await response.json();
    if (response.status === 429 && data.code === 'daily_quota_exhausted') { updateAccess(data.usage || { used: 10, remaining: 0 }); showDailyLimit(); throw Error(data.error); }
    if (!response.ok) throw Error(data.error || 'Jev did not respond');
    lastEvaluation = data;
    if (data.usage) updateAccess(data.usage);
    renderEvaluation(data);
    if (accessState.remaining === 0) showDailyLimit();
    return data;
  } catch (error) { $('jevOutput').textContent = error.message; throw error; }
  finally { $('evaluate').disabled = !!evaluationLimit(documentState); }
}
let traceUrl = null;
function exportTrace() {
  if (!lastEvaluation) return;
  const trace = { ...lastEvaluation.trace, created_at: new Date().toISOString(), source_sha256: documentState.sha256, source_size_bytes: documentState.bytes, usage: lastEvaluation.usage, selected_case: selectedQuestion ? { id: selectedQuestion.id, expected_section: selectedQuestion.expected } : null };
  const json = JSON.stringify(trace, null, 2);
  if (traceUrl) URL.revokeObjectURL(traceUrl);
  traceUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  $('traceJson').value = json;
  $('traceDownload').href = traceUrl;
  $('traceCopyStatus').textContent = 'The trace contains your document references and question.';
  $('traceDialog').showModal();
}
$('traceClose').onclick = () => $('traceDialog').close();
$('traceDialog').onclose = () => {
  if (traceUrl) URL.revokeObjectURL(traceUrl);
  traceUrl = null;
  $('traceDownload').removeAttribute('href');
};
$('traceCopy').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('traceJson').value);
    $('traceCopyStatus').textContent = 'JSON copied.';
  } catch {
    $('traceJson').select();
    $('traceCopyStatus').textContent = 'Select and copy the highlighted JSON.';
  }
};
$('loadDemo').onclick = () => loadDemo().catch(e => $('searchStatus').textContent = e.message);
$('documentFile').addEventListener('change', async e => { try { $('uploadStatus').textContent = 'Extracting document structure…'; await loadFile(e.target.files[0]); } catch (err) { $('uploadStatus').textContent = `Could not load file: ${err.message}`; } });
$('searchForm').addEventListener('submit', e => { e.preventDefault(); if (!documentState) { $('searchStatus').textContent = 'Open the case or upload a document.'; return; } selectedQuestion = null; prepareQuestion($('query').value); });
$('closeDialog').onclick = $('dialogClose2').onclick = () => $('sourceDialog').close();
$('evaluate').onclick = () => evaluateJev().catch(() => {});
$('exportTrace').onclick = exportTrace;
$('betaLimitClose').onclick = () => $('betaLimitDialog').close();
checkJev();
// Browser WebMCP uses the same document and service endpoint as the visible workflow.
if (document.modelContext?.registerTool) {
  const controller = new AbortController();
  const register = tool => Promise.resolve(document.modelContext.registerTool(tool, { signal: controller.signal })).catch(() => {});
  const inputSchema = { type: 'object', properties: { question: { type: 'string', minLength: 3, maxLength: 500 }, document_id: { type: 'string' } }, required: ['question'], additionalProperties: false };
  register({ name: 'inspect_document', title: 'Inspect document structure', description: 'Return the complete document block manifest and references; no retrieval filter.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, async execute() { if (!documentState) await loadDemo(); return { document_id: documentState.id, name: documentState.name, block_count: documentState.blocks.length, blocks: documentState.blocks.map(({ id, title, section, location, page, index }) => ({ id, title, section, location, page, index })), retrieval_filter: false }; } });
  register({ name: 'evaluate_document_evidence', title: 'Let Jev judge the document', description: 'Jev evaluates all small-document blocks, or every structural group before scoring Jev-selected blocks. Returns evidence and coverage. Consumes one of ten daily evaluations per IP.', inputSchema, annotations: { readOnlyHint: false, untrustedContentHint: true }, async execute(input) { if (typeof input?.question !== 'string' || input.question.trim().length < 3 || input.question.length > 500) throw Error('Invalid question'); if (!documentState) await loadDemo(); if (input.document_id && input.document_id !== documentState.id) throw Error('Document ID does not match the open document'); selectedQuestion = null; prepareQuestion(input.question); return evaluateJev(); } });
  register({ name: 'get_evidence', title: 'Get selected evidence', description: 'Return evidence blocks from the last Jev evaluation, with section and page references.', inputSchema: { type: 'object', properties: { block_id: { type: 'string' } }, additionalProperties: false }, annotations: { readOnlyHint: true }, async execute(input) { if (!lastEvaluation) throw Error('Evaluate a question first'); return { status: lastEvaluation.status, evidence: input?.block_id ? lastEvaluation.evidence.filter(e => e.block_id === input.block_id) : lastEvaluation.evidence }; } });
  register({ name: 'get_trace', title: 'Get evidence trace', description: 'Return the last evaluation trace and full Jev coverage metrics.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, async execute() { if (!lastEvaluation) throw Error('Evaluate a question first'); return lastEvaluation.trace; } });
  register({ name: 'verify_claim', title: 'Verify a cited claim with Jev', description: 'Check one proposed answer claim against a selected evidence block. Consumes a daily evaluation and adds the check to the trace.', inputSchema: { type: 'object', properties: { claim: { type: 'string', minLength: 3, maxLength: 500 }, block_id: { type: 'string' } }, required: ['claim', 'block_id'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, async execute(input) {
    if (!lastEvaluation || typeof input?.claim !== 'string' || input.claim.trim().length < 3 || input.claim.length > 500) throw Error('Evaluate a document and supply a valid claim first');
    const source = lastEvaluation.evidence.find(e => e.block_id === input.block_id);
    if (!source) throw Error('The block is not in the selected evidence set');
    const response = await fetch('./api/evaluate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: input.claim, document_id: documentState.id, document_name: documentState.name, blocks: [{ id: source.block_id, title: source.section, location: source.paragraph || 'source block', page: source.page ?? undefined, text: source.text }] }) });
    const data = await response.json();
    if (response.status === 429) { updateAccess(data.usage || { used: 10, remaining: 0 }); showDailyLimit(); throw Error(data.error); }
    if (!response.ok) throw Error(data.error || 'Claim verification failed');
    updateAccess(data.usage);
    const verified = { claim: input.claim, evidence_block_id: source.block_id, supported: data.status === 'supported', evidence: data.evidence, signals: data.trace.block_scores[0]?.answers };
    lastEvaluation.trace.claims ||= [];
    lastEvaluation.trace.claims.push(verified);
    lastEvaluation.usage = data.usage;
    return verified;
  } });
  register({ name: 'search_document_evidence', title: 'Inspect document blocks', description: 'Compatibility alias. Return the document block manifest; no search filter controls what Jev can see.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, additionalProperties: false }, annotations: { readOnlyHint: true }, async execute() { if (!documentState) await loadDemo(); return { block_count: documentState.blocks.length, blocks: documentState.blocks.map(({ id, title, location, page }) => ({ id, title, location, page })), retrieval_filter: false }; } });
}
