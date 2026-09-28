'use strict';
const categories = ['World', 'Politics', 'Business', 'Technology', 'Science', 'Sports'];
let data = window.SIGNAL_NEWS || {stories: [], sources: []};
let active = 'All';
const expanded = new Set();
const $ = id => document.getElementById(id);
const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
function safeUrl(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function link(text, href) { const a = el('a', text); a.href = safeUrl(href) || '#headlines'; a.rel = 'noopener noreferrer'; return a; }
function age(date) { const ms = Date.parse(date); if (!Number.isFinite(ms)) return 'Time unavailable'; const hours = (Date.now() - ms) / 3600000; if (hours < 0) return new Date(ms).toLocaleDateString(); if (hours < 1) return Math.floor(hours * 60) + 'm ago'; if (hours < 24) return Math.floor(hours) + 'h ago'; return new Date(ms).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}); }
function render() {
  const query = $('search').value.toLowerCase().trim();
  const stories = data.stories.filter(s => (active === 'All' || s.category === active) && `${s.title} ${s.source} ${s.category}`.toLowerCase().includes(query));
  $('news-grid').replaceChildren();
  const columns = [0,1,2].map(() => el('div', undefined, 'news-column'));
  $('news-grid').append(...columns);
  for (const category of categories) {
    const items = stories.filter(s => s.category === category);
    if (!items.length) continue;
    const section = el('section', undefined, 'news-section'); section.style.setProperty('--accent', `var(--${category.toLowerCase()})`);
    const heading = el('div', undefined, 'category-heading'); heading.append(el('h3', category), el('span', String(items.length).padStart(2, '0'))); section.append(heading);
    const limit = items.length;
    for (const story of items.slice(0, limit)) {
      const article = el('article', undefined, 'story'); const title = link(story.title, story.url); article.append(title);
      const meta = el('div', undefined, 'story-meta'); meta.append(el('span', story.source || 'Read original'), el('span', '·'), el('span', data.starter ? 'Source guide' : 'Editor selected')); article.append(meta); section.append(article);
    }
    if (false) { const more = el('button', expanded.has(category) ? 'Show fewer ↑' : `More ${category.toLowerCase()} +`, 'more'); more.setAttribute('aria-expanded', String(expanded.has(category))); more.addEventListener('click', () => { expanded.has(category) ? expanded.delete(category) : expanded.add(category); render(); }); section.append(more); }
    columns[categories.indexOf(category) % 3].append(section);
  }
  $('empty').hidden = stories.length !== 0; $('empty').textContent = data.stories.length ? 'No headlines match your search. Try another word or choose All.' : 'Your next edition starts here. Add your first story in the headline editor.';
  $('view-label').textContent = active === 'All' ? 'All stories' : active;
  $('result-count').textContent = `${stories.length} headlines`;
  for (const button of $('filters').children) { const selected = button.textContent === active; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); }
}
function init() {
  data.stories = data.stories.filter(s => s && typeof s.title === 'string' && safeUrl(s.url));
  for (const category of ['All', ...categories]) { const button = el('button', category); button.addEventListener('click', () => { active = category; render(); }); $('filters').append(button); }
  $('search').addEventListener('input', render);
  $('date').textContent = new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}).toUpperCase();
  $('updated').textContent = data.updatedAt ? `Edited ${new Date(data.updatedAt).toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'})} · Manually curated` : 'Manually curated · No automatic feeds';
  if (data.starter) { $('notice').hidden = false; $('notice').textContent = 'STARTER EDITION: Publisher links only. Add your own headlines in the editor.'; }
  const lead = data.starter ? null : data.stories.find(s => s.id === data.lead) || data.stories[0];
  if (lead) { $('hero-label').textContent = `THE LEAD / ${lead.category.toUpperCase()}`; $('hero-title').replaceChildren(link(lead.title, lead.url)); $('hero-source').textContent = `${lead.source || 'Original source'} · Editor selected`; $('hero-link').href = safeUrl(lead.url); $('hero-link').textContent = 'Read the story ↗'; }
  else { $('hero-title').textContent = 'YOUR LEAD HEADLINE GOES HERE'; $('hero-label').textContent = 'MANUAL EDITION'; $('hero-source').textContent = 'Add your headline and link using the headline editor.'; }
  for (const source of [...data.sources].sort((a,b) => categories.indexOf(a.category) - categories.indexOf(b.category))) { const a = link(`${source.name} ↗`, source.home); a.append(el('small', source.category)); $('sources').append(a); }
  render();
}
let dark = false;
try { dark = localStorage.getItem('signal-theme') === 'dark'; } catch {}
function theme() { document.body.classList.toggle('dark', dark); $('theme').lastElementChild.textContent = dark ? 'Light mode' : 'Dark mode'; $('theme').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`); }
$('theme').addEventListener('click', () => { dark = !dark; theme(); try { localStorage.setItem('signal-theme', dark ? 'dark' : 'light'); } catch {} });
theme(); init();
