#!/usr/bin/env node
// Validates data.src.js, writes ../dashboard-data.json and inlines the data into
// ../index.html (between the SEED markers). No dependencies.
//
//   node command-center/data/build.js            # validate + write
//   node command-center/data/build.js --check    # validate only
//   node command-center/data/build.js --from-json ../dashboard-data.json
//        # re-inline an edited/exported JSON instead of data.src.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const fromJson = args.includes('--from-json') ? args[args.indexOf('--from-json') + 1] : null;

const data = fromJson
  ? JSON.parse(fs.readFileSync(path.resolve(process.cwd(), fromJson), 'utf8'))
  : require('./data.src.js');

const errors = [];
const warn = [];

const ids = (list, label) => {
  const seen = new Set();
  for (const x of list) {
    if (!x.id) errors.push(`${label} without id: ${JSON.stringify(x).slice(0, 80)}`);
    if (seen.has(x.id)) errors.push(`duplicate ${label} id ${x.id}`);
    seen.add(x.id);
  }
  return seen;
};

const P = ids(data.projects, 'project');
const PL = ids(data.pipelines, 'pipeline');
const CO = ids(data.concepts, 'concept');
const TA = ids(data.tasks, 'task');
const EV = ids(data.evidence, 'evidence');
ids(data.timeline, 'timeline');

const names = new Map();
for (const c of data.concepts) {
  const k = c.name.toLowerCase();
  if (names.has(k)) errors.push(`duplicate concept name "${c.name}"`);
  names.set(k, c.id);
}
const pnames = new Set();
for (const p of data.projects) {
  if (pnames.has(p.name.toLowerCase())) errors.push(`duplicate project name ${p.name}`);
  pnames.add(p.name.toLowerCase());
}

const refs = (arr, set, where) => (arr || []).forEach((r) => set.has(r) || errors.push(`${where} → unknown ref ${r}`));

const STAGE = ['verified', 'implemented', 'in-progress', 'planned', 'blocked', 'investigate'];
const PSTATUS = ['idea', 'research', 'planning', 'development', 'testing', 'deployed', 'paused', 'abandoned'];
const CSTATUS = ['encountered', 'learning', 'practiced', 'applied', 'understood', 'revise'];
const TSTATUS = ['todo', 'in-progress', 'blocked', 'done'];

for (const p of data.projects) {
  if (!PSTATUS.includes(p.status)) errors.push(`project ${p.id} bad status ${p.status}`);
  refs(p.pipelines, PL, `project ${p.id}.pipelines`);
  refs(p.concepts, CO, `project ${p.id}.concepts`);
  refs(p.evidence, EV, `project ${p.id}.evidence`);
  (p.issues || []).forEach((i, n) => refs(i.evidence, EV, `project ${p.id}.issues[${n}]`));
  for (const plId of p.pipelines || []) {
    const pl = data.pipelines.find((x) => x.id === plId);
    if (pl && pl.projectId !== p.id) errors.push(`pipeline ${plId} listed on ${p.id} but belongs to ${pl.projectId}`);
  }
}
for (const pl of data.pipelines) {
  if (!P.has(pl.projectId)) errors.push(`pipeline ${pl.id} unknown project ${pl.projectId}`);
  const proj = data.projects.find((p) => p.id === pl.projectId);
  if (proj && !(proj.pipelines || []).includes(pl.id)) errors.push(`pipeline ${pl.id} missing from project ${proj.id}.pipelines`);
  refs(pl.evidence, EV, `pipeline ${pl.id}.evidence`);
  if (pl.nextTask && !TA.has(pl.nextTask)) errors.push(`pipeline ${pl.id}.nextTask unknown ${pl.nextTask}`);
  const sids = new Set();
  for (const s of pl.stages) {
    if (sids.has(s.id)) errors.push(`duplicate stage ${pl.id}/${s.id}`);
    sids.add(s.id);
    if (!STAGE.includes(s.status)) errors.push(`stage ${pl.id}/${s.id} bad status ${s.status}`);
    refs(s.concepts, CO, `stage ${pl.id}/${s.id}.concepts`);
    refs(s.evidence, EV, `stage ${pl.id}/${s.id}.evidence`);
    if (!s.evidence || !s.evidence.length) warn.push(`stage ${pl.id}/${s.id} has no evidence`);
    if (s.status === 'verified' && !s.validation) errors.push(`stage ${pl.id}/${s.id} is verified but states no validation`);
  }
  for (const s of pl.stages) (s.dependsOn || []).forEach((d) => sids.has(d) || errors.push(`stage ${pl.id}/${s.id} depends on unknown ${d}`));
  // A "verified" stage should not depend on an unverified one.
  for (const s of pl.stages) {
    if (s.status !== 'verified') continue;
    for (const d of s.dependsOn || []) {
      const dep = pl.stages.find((x) => x.id === d);
      if (dep && dep.status !== 'verified') warn.push(`stage ${pl.id}/${s.id} verified but depends on ${d} (${dep.status})`);
    }
  }
}
for (const c of data.concepts) {
  if (!CSTATUS.includes(c.status)) errors.push(`concept ${c.id} bad status ${c.status}`);
  refs(c.related, CO, `concept ${c.id}.related`);
  refs(c.prereqs, CO, `concept ${c.id}.prereqs`);
  refs(c.evidence, EV, `concept ${c.id}.evidence`);
  if (!c.explanation) errors.push(`concept ${c.id} missing explanation`);
  if (!c.evidence.length) warn.push(`concept ${c.id} has no evidence`);
  if (['applied', 'understood', 'practiced'].includes(c.status) && c.authorship === 'plan-only')
    errors.push(`concept ${c.id} is ${c.status} but its only evidence is a plan`);
}
for (const t of data.tasks) {
  if (!TSTATUS.includes(t.status)) errors.push(`task ${t.id} bad status ${t.status}`);
  if (t.projectId && !P.has(t.projectId)) errors.push(`task ${t.id} unknown project ${t.projectId}`);
  if (t.pipelineId) {
    const pl = data.pipelines.find((x) => x.id === t.pipelineId);
    if (!pl) errors.push(`task ${t.id} unknown pipeline ${t.pipelineId}`);
    else if (t.stageId && !pl.stages.some((s) => s.id === t.stageId)) errors.push(`task ${t.id} unknown stage ${t.stageId}`);
  }
  refs(t.dependsOn, TA, `task ${t.id}.dependsOn`);
  refs(t.concepts, CO, `task ${t.id}.concepts`);
  refs(t.evidence, EV, `task ${t.id}.evidence`);
  if (t.status === 'blocked' && !t.blockedBy) errors.push(`task ${t.id} blocked without a cause`);
}
for (const tl of data.timeline) {
  if (tl.projectId && !P.has(tl.projectId)) errors.push(`timeline ${tl.id} unknown project`);
  refs(tl.evidence, EV, `timeline ${tl.id}`);
}
const used = new Set();
const collect = (x) => (x || []).forEach((e) => used.add(e));
data.projects.forEach((p) => { collect(p.evidence); (p.issues || []).forEach((i) => collect(i.evidence)); });
data.pipelines.forEach((pl) => { collect(pl.evidence); pl.stages.forEach((s) => collect(s.evidence)); });
data.concepts.forEach((c) => collect(c.evidence));
data.tasks.forEach((t) => collect(t.evidence));
data.timeline.forEach((t) => collect(t.evidence));
data.evidence.forEach((e) => used.has(e.id) || warn.push(`evidence ${e.id} is never referenced`));
const usedConcepts = new Set();
data.projects.forEach((p) => (p.concepts || []).forEach((c) => usedConcepts.add(c)));
data.pipelines.forEach((pl) => pl.stages.forEach((s) => (s.concepts || []).forEach((c) => usedConcepts.add(c))));
data.tasks.forEach((t) => (t.concepts || []).forEach((c) => usedConcepts.add(c)));
data.concepts.forEach((c) => usedConcepts.has(c.id) || warn.push(`concept ${c.id} not linked to any project, stage or task`));

warn.forEach((w) => console.log('warn  ', w));
if (errors.length) {
  errors.forEach((e) => console.error('ERROR ', e));
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}
const counts = `${data.projects.length} projects, ${data.pipelines.length} pipelines (${data.pipelines.reduce((n, p) => n + p.stages.length, 0)} stages), ${data.concepts.length} concepts, ${data.tasks.length} tasks, ${data.evidence.length} evidence items`;
console.log(`OK: ${counts}; ${warn.length} warning(s).`);
if (args.includes('--check')) process.exit(0);

const json = JSON.stringify(data, null, 2);
fs.writeFileSync(path.join(root, 'dashboard-data.json'), json + '\n');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const start = '<script type="application/json" id="seed-data">';
const end = '</script><!--/SEED-->';
const a = html.indexOf(start);
const b = html.indexOf(end);
if (a < 0 || b < 0) throw new Error('SEED markers not found in index.html');
// "</" is escaped so the data can never close the script element early.
const safe = JSON.stringify(data).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
fs.writeFileSync(htmlPath, html.slice(0, a + start.length) + safe + html.slice(b));
console.log('wrote dashboard-data.json and inlined data into index.html');
