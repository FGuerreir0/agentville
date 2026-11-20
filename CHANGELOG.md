# Changelog

## 1.0.3 (2026-11-20)

- Windows: finds Claude Code when npm or nvm only put shims on the PATH (`claude`,
  `claude.cmd`), and when Claude Code's own folder isn't on the PATH VS Code sees. Installing
  the plugin and the chat no longer fail there; no need to set `agentville.claudePath`.
- New setting, **Hidden files** in the ⚙ menu (`agentville.showHiddenFiles`): also turn files
  and folders whose names start with a dot (`.github`, `.env`, `.superpowers`…) into
  buildings. Off by default; generated folders such as `.git` always stay out.
- Files with errors (the same ones as in the Problems panel) turn their building red, with a
  slow throb, until they're fixed; hovering one shows how many.
- Adding your API key for the first time gets a proper thank-you, and the city celebrates at HQ.
- Shell commands show what they touch: cyan lasers to the files and folders a command names,
  and, when it finishes, amber lasers to the files it changed on disk, which keep the edit mark.
- The Explorer view no longer starts zoomed out into the dark when it was collapsed at startup,
  and it frames the city closer.
- City life, each part with its own switch in the ⚙ menu: buildings rise for new files, come
  down for deleted ones and grow with their files; Git markers over uncommitted files,
  fireworks on a commit and the branch at HQ; worn paths where agents walk and districts that
  warm up; traffic on the streets; buildings that stay lit after use; a sky that follows the
  time of day.
- The city now starts in the Explorer, under your folders. Switching to the editor tab (with
  the chat) from the ⚙ menu is remembered, so it opens there from then on.

## 1.0.2 (2026-11-19)

- Store page: support contact instead of a donation link.

## 1.0.1 (2026-11-19)

- Store page: install instructions for VS Code, Cursor and Windsurf.

## 1.0.0 (2026-11-19)

First release, on [Open VSX](https://open-vsx.org/extension/fguerreir0/agentville) for Cursor,
Windsurf and VSCodium. The VS Code Marketplace listing is on its way.

- A live 3D city of your workspace: folders become districts, files become buildings, with
  wide streets between them.
- Claude and its subagents as orbs that walk the streets to read, edit, search, run commands
  and reach the web. Four landmarks stand on blocks of their own: the HQ tower, the bank, the
  radar dish and the rocket launch site, and each comes alive while an agent is there.
- Follow an agent with the camera; leave it alone for a moment and it slowly circles them.
- Built-in chat running your installed Claude Code on your own Anthropic API key: model,
  effort, permission mode, budget, history, and permission cards with diffs. Time, tokens and
  cost for every run, and the context window.
- Two views, one or the other: an editor tab with the chat, or a small minimap in the Explorer
  under your folders, for Claude Code sessions you run in a terminal.
- The Claude Code plugin ships inside the extension, installed and kept up to date with one
  click.
- Settings from the ⚙ button: view, opening on session start, idle camera, glow, buildings.
- Free for a week of use, then €2,99 once for a lifetime license for 1.x.
