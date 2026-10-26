// 由 content/ref/data/components.json 產生 content/ref/versions.md 中的三張表.
// 用法: npm run data        (寫入)
//       npm run data -- --check   (只檢查 versions.md 是否與 JSON 一致, 不一致時結束碼為 1)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataFile = path.join(root, 'content/ref/data/components.json')
const pageFile = path.join(root, 'content/ref/versions.md')

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|')
const src = (r) => (r.source_url ? `[${esc(r.source_name)}](${r.source_url})` : esc(r.source_name))

const renderers = {
  versions: (rows) => [
    '| 元件 | 版本 | 日期 | 來源 | 狀態 |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${esc(r.component)} | ${esc(r.version)} | ${esc(r.date)} | ${src(r)} | ${esc(r.status)} |`)
  ],
  litellm_cves: (rows) => [
    '| CVE | 類型 | 影響版本 / 修補 | 來源 | 來源性質 |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${esc(r.cve)} | ${esc(r.summary)} | ${esc(r.affected)} | ${src(r)} | ${esc(r.status)} |`)
  ],
  other_cves: (rows) => [
    '| 元件 | CVE | 說明 | 來源 |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${esc(r.component)} | ${esc(r.cve)} | ${esc(r.summary)} | ${src(r)} |`)
  ]
}

export function render() {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  let page = fs.readFileSync(pageFile, 'utf8')
  for (const [key, fn] of Object.entries(renderers)) {
    const re = new RegExp(`(<!-- data:${key}:start -->\\n)[\\s\\S]*?(\\n<!-- data:${key}:end -->)`)
    if (!re.test(page)) throw new Error(`versions.md 缺少標記 data:${key}`)
    page = page.replace(re, `$1\n${fn(data[key]).join("\n")}\n$2`)
  }
  return page
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = render()
  const current = fs.readFileSync(pageFile, 'utf8')
  if (process.argv.includes('--check')) {
    if (next !== current) {
      console.error('versions.md 與 components.json 不一致, 請執行 npm run data')
      process.exit(1)
    }
    console.log('versions.md 與 components.json 一致')
  } else {
    fs.writeFileSync(pageFile, next)
    console.log('已更新 content/ref/versions.md')
  }
}
