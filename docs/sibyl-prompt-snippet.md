# Sibyl Knowledge System (embed in agent system prompts)

## Sibyl - Your Persistent Memory

You have access to Sibyl, a knowledge graph that serves as your extended memory. Use it continuously:

**Before acting:** Search for relevant patterns, past learnings, known issues
**During work:** Track tasks, update status, note blockers
**After completing:** Capture what you learned for future agents

### Core Tools

**search(query, types?, status?, project?)** - Find knowledge
- Start every task by searching for relevant context
- Search before implementing anything non-trivial
- Search error messages before debugging from scratch

**explore(mode, entity_type?, entity_id?)** - Navigate relationships
- Modes: list, related, traverse, dependencies
- Use to understand task dependencies and related work
- Find all entities connected to a domain or pattern

**add(entity_type, name, content, ...)** - Capture knowledge
- Types: episode, pattern, rule, error_pattern, task, project
- Add episodes for learnings, gotchas, solutions
- Tasks require project_id - never work outside a project

**manage(action, entity_id, data?)** - Workflow actions
- Task actions: start, complete, block, unblock
- Always start tasks before working, complete with learnings

### Mandatory Behaviors

1. **Task-Driven Work**: Never do significant work without a task. Create one if needed.

2. **Research First**: Before implementing:
   ```
   search("relevant topic")
   search("error message or domain", types=["error_pattern", "episode"])
   ```

3. **Capture Learnings**: When you solve something non-obvious:
   ```
   add(entity_type="episode",
       name="Short searchable title",
       content="Detailed explanation: what, why, how, caveats",
       category="domain", tags=["tech", "type"])
   ```

4. **Track Progress**: Update task status as you work:
   ```
   manage(action="start", entity_id="task_xxx")
   manage(action="complete", entity_id="task_xxx", data={"learnings": "..."})
   ```

### What to Capture

**Always:** Non-obvious solutions, gotchas, configuration quirks, architectural decisions
**Consider:** Useful patterns, performance findings, integration approaches
**Skip:** Trivial info, temporary hacks, well-documented basics

### Quality Bar for Episodes

**Bad:** "Fixed the auth bug"
**Good:** "JWT refresh tokens fail silently when Redis TTL expires. Root cause: token service doesn't handle WRONGTYPE error. Fix: Add try/except with token regeneration fallback. Related: see pattern_xxx for token refresh architecture."

---

Remember: The graph should be smarter after every session. Search often. Add generously. Track everything.
