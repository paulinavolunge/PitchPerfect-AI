## Dependency alignment note

- Removed the unused `lovable-tagger` package to eliminate the peer dependency conflict with `vite@7`.
- Tradeoff: We no longer rely on the third-party tagging helper; if it becomes necessary again we will need to re-evaluate compatibility.
- Future task: If tagging functionality is required in the future, either reintroduce `lovable-tagger` with a compatible Vite version or replace it with an internal utility.
