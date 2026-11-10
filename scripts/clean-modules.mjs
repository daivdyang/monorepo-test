#!/usr/bin/env node
// 刪除根目錄與所有 workspace 成員的 node_modules。
//
// 為什麼用 Node 腳本而不是 `rm -rf **/node_modules`：
// - 跨平台（Windows 沒有 rm）。
// - 成員清單直接讀 pnpm-workspace.yaml，新增 workspace 目錄時不用改這裡。
// - 只刪「安裝出來的」node_modules，不碰 apps/*/.output/server/node_modules
//   （那是 build 產物的一部分，刪了會讓已建置的伺服器無法啟動）。
//
// 這個腳本只用 Node 內建模組，所以 node_modules 刪掉之後仍可執行。
import { globSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

// 讀出 pnpm-workspace.yaml 中 `packages:` 區塊的 glob（例如 apps/*）
function workspaceGlobs() {
  const yaml = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')
  const block = yaml.match(/^packages:\n((?:[ \t]+-.*\n?)+)/m)
  if (!block) throw new Error('pnpm-workspace.yaml 找不到 packages 區塊')
  return block[1]
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').replace(/['"]/g, '').trim())
    .filter((glob) => glob && !glob.startsWith('!'))
}

const targets = globSync(
  ['node_modules', ...workspaceGlobs().map((glob) => `${glob}/node_modules`)],
  { cwd: root },
)

if (targets.length === 0) {
  console.log('沒有可刪除的 node_modules')
}
else {
  for (const target of targets.sort()) {
    rmSync(join(root, target), { recursive: true, force: true })
    console.log(`已刪除 ${target}`)
  }
  console.log(`\n共 ${targets.length} 個。重新安裝：pnpm install`)
}
