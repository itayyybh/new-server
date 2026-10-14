# AI Engineering Command Center

A single-file dashboard showing what you have built, how each pipeline works and
where it stands, what you have learned, and what to do next. Everything in it
comes from an investigation of your repositories, Claude Docs and Claude Code
sessions on 2026-10-14. Every entry links to its evidence.

```
command-center/
  index.html            the dashboard (data embedded; open it directly)
  dashboard-data.json   the same data as a standalone backup / editing file
  data/data.src.js      source of truth for the seed data (commented)
  data/build.js         validates the data and re-embeds it into index.html
```

## Open it

Double-click `index.html`, or drag it into any modern browser. It needs no
server, build step, install, API key or network: no CDN, no fonts, no external
requests.

Keyboard: `/` search · `1`–`9` sections · `t` light/dark · `Esc` closes panels.

## What is in it

| Section | What it shows |
|---|---|
| Overview | Counts, open blockers, the next recommended actions, pipeline progress, recent updates, and the sources the investigation could and could not reach |
| Projects | 8 projects with status, stack, progress, next action, and a detail page for each: verified / in-progress / planned features kept apart, issues, decisions, evidence |
| Pipelines | 9 pipelines (72 stages) drawn stage by stage. Click a stage for tools, validation, issues, concepts, tasks and evidence. Implemented % and verified % are shown separately |
| Knowledge | 103 concepts with explanation, why it matters, status, evidence, your example, gaps and next action. Tabs: library, concept map (prerequisites and related concepts), new to learn, revision queue |
| Learning roadmap | Concepts your open tasks need, ordered by task priority; demonstrated skills vs skills still to learn; a learning path per project; exercises |
| Tasks & blockers | 38 tasks with priority, dependencies, causes of blocks and the concepts each one needs |
| Timeline | Milestones, pipeline changes, decisions and verifications. Status changes you make are logged here automatically |
| Evidence & sources | 49 sources, each marked verified, reported or inferred. Open one to see every dashboard entry that cites it |
| Update data | Forms to add or edit anything, plus export, import and reset |

### How to read the statuses

Pipeline stages:

- ✓ **Completed & verified**: evidence shows it works. Every verified stage has a
  validation statement, and the build fails without one.
- ◐ **Implemented, unverified**: the code exists, but nothing confirms it behaves correctly.
- **In progress**, ○ **Planned**, ■ **Blocked** (always with a cause), △ **Needs investigation**.

Concepts: Encountered → Learning → Practiced → Applied in a project →
Independently understood, plus Needs revision. Each concept also has an
**evidence type**:

- *AI-assisted*: used in your project, with the code produced by an AI assistant you directed.
- *Self-written*: you wrote it unaided. The clearest case is codebase-rag commit 68eb58a.
- *Mixed*: a combination of the two.
- *Plan only*: it appears only in a plan or exercise spec so far.

No concept is marked "Independently understood" yet. Nothing in the accessible
evidence shows you explaining one unaided. Use the self-test questions in your
roadmap doc, then raise the status yourself.

Tasks tagged *suggested* come from the dashboard. Untagged tasks come from your own plans and docs.

## Your edits and where they live

Edits are saved to this browser's **localStorage** (key `aecc.data.v1`):

- They do **not** sync to other browsers, devices, or another copy of the file.
- Clearing site data, private windows and some file:// setups lose them.
- **Export JSON** regularly (Update data → Export). That file is your backup.

Restore: Update data → **Import JSON…** The file is parsed with `JSON.parse` and
never executed. All text is inserted as text, not HTML, and only `http(s)`/`mailto`
links are clickable. Malformed entries are dropped or given safe defaults.
**Reset** (with confirmation) discards local edits and returns to the embedded data.

## Updating it

Everyday updates happen in the UI:

- Add a project, a pipeline (stages one per line, as `Name | status`) or a stage.
- Change a stage's status from its dropdown. The change is written to the timeline.
- Add or update a concept. A concept with the same name is updated, not duplicated.
- Link a concept to a project or a pipeline stage.
- Add evidence and attach it to a project, a concept or a stage.
- Record a milestone. Tick a task done. Mark a concept for revision.

To make your edits the new built-in data (so they ship inside `index.html`):

```bash
# export from the dashboard, then:
node command-center/data/build.js --from-json ~/Downloads/dashboard-data-YYYY-MM-DD.json
```

Or edit `data/data.src.js` directly and run `node command-center/data/build.js`.
The build validates before it writes. It checks for unique ids, duplicate
concept or project names, unknown references between projects, pipelines,
stages, concepts, tasks and evidence, blocked tasks without a cause, verified
stages without validation, and concepts marked practiced, applied or understood
whose only evidence is a plan. Use `--check` to validate without writing.

## Data schema (v1)

```jsonc
{
  "meta": { "schemaVersion": 1, "owner": "", "generatedAt": "YYYY-MM-DD",
            "sources": { "accessed": [""], "notAccessed": [""] } },
  "projects": [{
    "id": "tavo", "name": "", "tagline": "", "kind": "",
    "status": "idea|research|planning|development|testing|deployed|paused|abandoned",
    "purpose": "", "problem": "", "users": "", "stack": [""],
    "architecture": [""], "decisions": [""],
    "featuresVerified": [""], "featuresInProgress": [""], "featuresPlanned": [""],
    "issues": [{ "type": "bug|blocker|question", "text": "", "evidence": ["E-…"] }],
    "pipelines": ["pl-…"], "concepts": ["c-…"], "links": [{ "label": "", "url": "" }],
    "started": "", "lastActivity": "", "lastVerified": "", "nextAction": "",
    "unknowns": [""], "evidence": ["E-…"]
  }],
  "pipelines": [{
    "id": "pl-…", "projectId": "", "name": "", "type": "", "purpose": "",
    "input": "", "output": "", "nextTask": "t-…", "evidence": ["E-…"],
    "stages": [{   // array order = real execution order
      "id": "", "name": "",
      "status": "verified|implemented|in-progress|planned|blocked|investigate",
      "description": "", "tools": [""], "concepts": ["c-…"], "dependsOn": ["<stage id>"],
      "validation": "", "issues": [""], "evidence": ["E-…"], "next": ""
    }]
  }],
  "concepts": [{
    "id": "c-…", "name": "", "category": "", "level": 1,   // 1 foundations … 4 advanced
    "status": "encountered|learning|practiced|applied|understood|revise",
    "authorship": "ai-assisted|self-written|mixed|plan-only",
    "explanation": "", "why": "", "example": "", "gaps": "", "next": "",
    "evidence": ["E-…"], "evidenceNote": "", "related": ["c-…"], "prereqs": ["c-…"],
    "revise": false, "isNew": false
  }],
  "tasks": [{
    "id": "t-…", "title": "", "projectId": null, "pipelineId": null, "stageId": null,
    "priority": "P0|P1|P2|P3", "status": "todo|in-progress|blocked|done",
    "blockedBy": "", "dependsOn": ["t-…"], "concepts": ["c-…"],
    "source": "evidence|suggested", "evidence": ["E-…"], "due": "", "notes": ""
  }],
  "timeline": [{ "id": "", "date": "YYYY-MM-DD",
    "type": "milestone|pipeline|concept|task|verification|decision",
    "title": "", "projectId": null, "detail": "", "evidence": ["E-…"] }],
  "evidence": [{ "id": "E-…", "title": "", "type": "repo|commit|file|doc|session|email|note|exercise",
    "ref": "<url or path>", "date": "", "confidence": "verified|reported|inferred", "note": "" }],
  "notes": [{ "id": "", "date": "", "targetId": "<project or concept id>", "text": "" }]
}
```

Derived numbers are computed rather than stored: pipeline progress, "awaiting work",
which concepts are prerequisites for open tasks, and where each concept is used.

## Limits, and an optional sync path

The HTML file cannot read your repositories, local folders or new Claude
conversations by itself. That would need file-system or API access a local
page does not have. Optional ways to automate later:

1. **Repo scanner script**: a small Node or Python script that reads `git log`,
   READMEs and `docs/` across your repos and proposes changes (new commits as
   timeline entries, new docs as evidence) to `dashboard-data.json`. You review
   them, then run `build.js`.
2. **Claude Code session**: ask Claude Code to re-run this investigation and
   update `data/data.src.js` — the same process that produced it.
3. **Hosted version**: publishing the page with a shared data store would sync
   it across devices. It is not needed for the local file.

## Validation performed

Run in headless Chromium with Playwright (80 checks, all passing):

- Every section and every project and pipeline page renders. Stage counts match the data.
- Search finds results, keyboard navigation works, and Enter opens the result.
- Project, technology, knowledge, focus and pipeline filters work.
- Stage expansion and deep links work. Status changes persist across reloads and are logged to the timeline.
- Concept map highlighting, the revision toggle, and the concept, pipeline, milestone and task forms all work.
- A round trip of export → reset → import restores the data. Malformed JSON is rejected, and unusual data is normalised.
- Markup and `javascript:` URLs in the data are neutralised.
- Light and dark themes render. There is no horizontal scroll at 390 px or 820 px width. The mobile menu works.
- There are zero console errors and zero network requests.

Not tested: Safari and Firefox specifically, screen-reader walkthroughs, and print.
