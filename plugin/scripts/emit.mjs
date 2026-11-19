#!/usr/bin/env node
// Agentville hook. Reads a Claude Code hook payload on stdin, cuts it down to what the
// city shows, and posts it to every Agentville window that registered itself in
// ~/.agentville/servers. Always exits 0: the hook runs async and must never get in
// Claude's way, whether or not VS Code is open.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { pathToFileURL } from 'node:url'

const STDIN_LIMIT = 4 * 1024 * 1024
const POST_TIMEOUT_MS = 800

export function registryDir() {
  return process.env.AGENTVILLE_DIR || path.join(os.homedir(), '.agentville', 'servers')
}

function cut(value, max) {
  if (typeof value !== 'string' || value === '') return undefined
  const flat = value.replace(/\s+/g, ' ').trim()
  return flat.length > max ? flat.slice(0, max - 1) + '…' : flat
}

/** The fields of a hook payload the city uses. Never file contents or tool output. */
export function compact(payload, now = Date.now()) {
  const input = payload.tool_input && typeof payload.tool_input === 'object' ? payload.tool_input : {}
  const event = {
    v: 1,
    ts: now,
    event: payload.hook_event_name,
    session: payload.session_id,
    agent: payload.agent_id,
    agentType: payload.agent_type,
    cwd: payload.cwd,
    tool: payload.tool_name,
    file: input.file_path ?? input.notebook_path,
    dir: typeof input.path === 'string' ? input.path : undefined,
    pattern: cut(input.pattern, 80),
    command: cut(input.command, 120),
    description: cut(input.description, 100),
    subagentType: cut(input.subagent_type, 40),
    query: cut(input.query, 80),
    notification: payload.notification_type,
    message: cut(payload.message, 140),
    source: payload.source,
  }
  if (typeof input.url === 'string') {
    try { event.url = new URL(input.url).host } catch { /* not a URL */ }
  }
  if (payload.hook_event_name === 'UserPromptSubmit') event.prompt = cut(payload.prompt, 80)
  if (payload.hook_event_name === 'PostToolUseFailure' || payload.hook_event_name === 'StopFailure') event.error = true
  for (const key of Object.keys(event)) {
    if (event[key] === undefined || event[key] === null) delete event[key]
    else if (key !== 'v' && key !== 'ts' && key !== 'error' && typeof event[key] !== 'string') delete event[key]
  }
  return event
}

function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
      if (data.length > STDIN_LIMIT) { process.stdin.destroy(); resolve('') }
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(''))
  })
}

function post(server, body) {
  return new Promise((resolve) => {
    const req = http.request({
      host: '127.0.0.1',
      port: server.port,
      path: '/event',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-agentville-token': server.token, 'content-length': Buffer.byteLength(body) },
      timeout: POST_TIMEOUT_MS,
    }, (res) => { res.resume(); res.on('end', () => resolve(true)) })
    req.on('timeout', () => { req.destroy(); resolve(true) })
    // Nothing listening: that window is gone, so forget it
    req.on('error', (err) => resolve(err.code !== 'ECONNREFUSED'))
    req.end(body)
  })
}

const LOG_LIMIT = 256 * 1024

/** One line per hook run in ~/.agentville/hook.log, to tell "hook never ran" from "nothing received it". */
function logLine(event, delivered, windows, dir = registryDir()) {
  try {
    const file = path.join(path.dirname(dir), 'hook.log')
    try { if (fs.statSync(file).size > LOG_LIMIT) fs.renameSync(file, file + '.1') } catch { /* no log yet */ }
    const what = [event.event, event.tool, event.agentType && `agent=${event.agentType}`].filter(Boolean).join(' ')
    fs.appendFileSync(file, `${new Date(event.ts).toISOString()} ${what} cwd=${event.cwd ?? '?'} → ${delivered}/${windows} window(s)\n`)
  } catch { /* logging must never break the hook */ }
}

export async function deliver(event, dir = registryDir()) {
  let entries
  try { entries = fs.readdirSync(dir).filter(f => f.endsWith('.json')) } catch { logLine(event, 0, 0, dir); return 0 }
  const body = JSON.stringify(event)
  let delivered = 0
  await Promise.all(entries.map(async (name) => {
    const file = path.join(dir, name)
    let server
    try { server = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return }
    if (!server || typeof server.port !== 'number' || typeof server.token !== 'string') return
    const alive = await post(server, body)
    if (alive) delivered++
    else { try { fs.unlinkSync(file) } catch { /* already gone */ } }
  }))
  logLine(event, delivered, entries.length, dir)
  return delivered
}

async function main() {
  const raw = await readStdin()
  if (!raw.trim()) return
  let payload
  try { payload = JSON.parse(raw) } catch { return }
  if (!payload || typeof payload.hook_event_name !== 'string' || typeof payload.session_id !== 'string') return
  await deliver(compact(payload))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {}).finally(() => process.exit(0))
}
