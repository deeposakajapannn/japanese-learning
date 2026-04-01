/**
 * 将 public/data/sentences_n2_supplement_*.json 按 id 顺序合并进 sentences.json
 * 用法: node scripts/merge_n2_supplement.mjs
 *
 * 合并前请人工审阅：批量生成的句子易出现模板重复、口吻单一，不建议未审核直接入库。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataDir = path.join(root, 'public', 'data')
const mainFile = path.join(dataDir, 'sentences.json')

const main = JSON.parse(fs.readFileSync(mainFile, 'utf8'))
const maxId = Math.max(...main.map((x) => x.id))
const words = new Set(main.map((x) => x.word.trim()))

const supplementFiles = fs
  .readdirSync(dataDir)
  .filter((f) => f.startsWith('sentences_n2_supplement_') && f.endsWith('.json'))
  .sort()

if (supplementFiles.length === 0) {
  console.error('No sentences_n2_supplement_*.json found in public/data')
  process.exit(1)
}

let added = []
for (const f of supplementFiles) {
  const arr = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'))
  for (const x of arr) {
    const w = x.word.trim()
    if (words.has(w)) {
      console.error(`Duplicate word (skip file ${f} id ${x.id}):`, w.slice(0, 60))
      process.exit(1)
    }
    words.add(w)
    added.push(x)
  }
}

added.sort((a, b) => a.id - b.id)
const expectedStart = maxId + 1
if (added.length && added[0].id !== expectedStart) {
  console.warn(`Warning: first supplement id ${added[0].id}, expected ${expectedStart}`)
}

const merged = [...main, ...added]
fs.writeFileSync(mainFile, JSON.stringify(merged, null, 2) + '\n', 'utf8')
console.log(`Merged ${added.length} sentences from ${supplementFiles.length} file(s). Total: ${merged.length}. Max id: ${merged[merged.length - 1].id}`)
