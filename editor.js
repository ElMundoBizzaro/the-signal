'use strict';
const key = 'signal-editor-v1';
const published = window.SIGNAL_NEWS || {stories: [], sources: [], starter: false, lead: null};
const clone = v => JSON.parse(JSON.stringify(v));
let draft = clone(published), editing = null;
const $ = id => document.getElementById(id);
try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && Array.isArray(saved.stories) && Array.isArray(saved.sources)) draft = saved; } catch {}
function message(text) { $('status').textContent = text; }
function persist() { try { localStorage.setItem(key, JSON.stringify(draft)); } catch { message('Browser storage is unavailable. Download your edition before closing this tab.'); } }
function node(tag, text, cls) { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; return n; }
function button(text, action, label) { const b = node('button', text); b.type = 'button'; if (label) b.setAttribute('aria-label', label); b.addEventListener('click', action); return b; }
function resetForm() { editing = null; $('story-form').reset(); $('form-title').textContent = 'Add a link'; $('save-story').textContent = 'Add link +'; $('cancel').hidden = true; }
function render() {
 $('draft-list').replaceChildren(); $('count').textContent = `(${draft.stories.length})`; $('clear-starters').hidden = !draft.starter;
 if (!draft.stories.length) $('draft-list').append(node('p', 'A clean slate. Add your first headline.', 'blank'));
 draft.stories.forEach((story, index) => {
  const card = node('article', '', 'draft-card'); card.append(node('p', `${story.category.toUpperCase()} / ${story.source}${draft.lead === story.id ? ' / ★ LEAD STORY' : ''}`), node('h3', story.title));
  const actions = node('div', '', 'card-actions');
  actions.append(button('Edit', () => { editing = story.id; for (const field of ['title','url','source','category']) $(field).value = story[field]; $('lead').checked = draft.lead === story.id; $('form-title').textContent = 'Edit headline'; $('save-story').textContent = 'Save changes'; $('cancel').hidden = false; $('title').focus(); }));
  actions.append(button('Make lead', () => { draft.lead = story.id; persist(); render(); }));
  for (const [symbol, delta, label] of [['↑',-1,'Move up'],['↓',1,'Move down']]) { const next = index + delta; const b = button(symbol, () => { [draft.stories[index], draft.stories[next]] = [draft.stories[next], draft.stories[index]]; persist(); render(); }, `${label}: ${story.title}`); b.disabled = next < 0 || next >= draft.stories.length; actions.append(b); }
  actions.append(button('Remove', () => { if (!confirm(`Remove “${story.title}”?`)) return; draft.stories = draft.stories.filter(s => s.id !== story.id); if (draft.lead === story.id) draft.lead = null; if (editing === story.id) resetForm(); persist(); render(); })); card.append(actions); $('draft-list').append(card);
 });
}
$('story-form').addEventListener('submit', event => {
 event.preventDefault(); let url;
 try { url = new URL($('url').value.trim()); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); } catch { message('Enter a complete https:// or http:// article link.'); return; }
 const source = $('source').value.trim() || url.hostname.replace(/^www\./, ''); const title = $('title').value.trim() || source;
 const story = {id: (draft.starter ? null : editing) || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)), title, url: url.href, source, category: $('category').value};
 if (editing) draft.stories = draft.stories.map(s => s.id === editing ? story : s); else draft.stories.unshift(story);
 if ($('lead').checked) draft.lead = story.id; else if (draft.lead === story.id) draft.lead = null;
 // A real headline changes the edition from starter guide to manually curated.
 if (draft.starter) { draft.stories = draft.stories.filter(s => !/^\d+$/.test(s.id)); draft.starter = false; }
 message('Link added. Click Copy & publish when you are ready.'); persist(); resetForm(); render();
});
$('cancel').addEventListener('click', resetForm);
$('clear-starters').addEventListener('click', () => { if (!confirm('Remove the starter publisher links?')) return; draft.stories = []; draft.starter = false; draft.lead = null; resetForm(); persist(); render(); });
$('reset').addEventListener('click', () => { if (!confirm('Discard this browser draft and restore the version included with this page?')) return; draft = clone(published); resetForm(); persist(); render(); message('Published version restored.'); });
$('download').addEventListener('click', () => {
 draft.updatedAt = new Date().toISOString(); persist();
 const contents = 'window.SIGNAL_NEWS = ' + JSON.stringify(draft, null, 2).replace(/</g, '\\u003c') + ';\n';
 const url = URL.createObjectURL(new Blob([contents], {type:'text/javascript'})); const a = document.createElement('a'); a.href = url; a.download = 'headlines.js'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
 message('Downloaded. Replace headlines.js in your GitHub repository and commit to publish.');
});
render();

$('publish').addEventListener('click', async () => {
 draft.updatedAt = new Date().toISOString(); persist();
 const contents = 'window.SIGNAL_NEWS = ' + JSON.stringify(draft, null, 2).replace(/</g, '\\u003c') + ';\n';
 try {
  await navigator.clipboard.writeText(contents);
  message('Copied! In GitHub, select all file contents, paste, then Commit changes.');
  window.open('https://github.com/ElMundoBizzaro/the-signal/edit/main/headlines.js', '_blank', 'noopener,noreferrer');
 } catch {
  message('Copy is unavailable in this browser. Use Download backup, then upload headlines.js to your GitHub repository.');
 }
});
