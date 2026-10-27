// 資料與文字檢查. 用法:
//   npm run check            完整檢查; 資料過期視為錯誤 (結束碼 1)
//   npm run check -- --hook  提交前檢查; 資料過期只警告, 其餘錯誤仍會擋下
//   npm run check -- --strict 警告也視為錯誤
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from './gen-data.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const hook = args.has('--hook')
const strict = args.has('--strict')
const errors = []
const warns = []

// 1. 資料檔結構 -------------------------------------------------------------
const dataFile = path.join(root, 'content/ref/data/components.json')
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
const TYPES = new Set(['primary', 'secondary', 'internal'])
const required = {
  versions: ['component', 'version', 'date', 'source_name', 'source_type', 'verified_on', 'expires_after_days', 'status'],
  litellm_cves: ['component', 'cve', 'summary', 'affected', 'source_name', 'source_type', 'verified_on', 'expires_after_days'],
  other_cves: ['component', 'cve', 'summary', 'source_name', 'source_type', 'verified_on', 'expires_after_days']
}
const today = new Date()
let total = 0
let notPrimary = 0
const missingUrl = []
for (const [group, fields] of Object.entries(required)) {
  for (const [i, r] of (data[group] ?? []).entries()) {
    const id = `${group}[${i}] ${r.component ?? ''} ${r.cve ?? ''}`.trim()
    total++
    for (const f of fields) {
      if (r[f] === undefined || r[f] === null || r[f] === '') {
        // version 與 status 欄允許空字串以外的缺漏才算錯
        if (!(f === 'status' || f === 'affected') || r[f] === undefined) errors.push(`${id}: 缺少欄位 ${f}`)
      }
    }
    if (!TYPES.has(r.source_type)) errors.push(`${id}: source_type 必須是 primary, secondary 或 internal`)
    if (r.source_type !== 'primary') notPrimary++
    if (!r.source_url) missingUrl.push(id)
    else if (!/^https:\/\//.test(r.source_url)) errors.push(`${id}: source_url 必須以 https:// 開頭`)
    const v = new Date(r.verified_on)
    if (Number.isNaN(v.getTime())) {
      errors.push(`${id}: verified_on 不是有效日期`)
    } else {
      const ageDays = Math.floor((today - v) / 86400000)
      if (ageDays < 0) errors.push(`${id}: verified_on 是未來日期`)
      else if (ageDays > r.expires_after_days) {
        const msg = `${id}: 已過期 (查證日 ${r.verified_on}, 有效 ${r.expires_after_days} 天, 已過 ${ageDays} 天)`
        ;(hook ? warns : errors).push(msg)
      }
    }
  }
}
if (missingUrl.length) warns.push(`${missingUrl.length} 筆沒有 source_url (例: ${missingUrl.slice(0, 3).join('; ')} ...)`)
const share = total ? Math.round((notPrimary / total) * 100) : 0
console.log(`資料筆數 ${total}; 非第一手來源 ${notPrimary} 筆 (${share}%)`)
if (share > 50) warns.push(`非第一手來源占 ${share}%, 建議優先補上官方來源網址`)

// 2. 版本頁與資料檔一致 -----------------------------------------------------
try {
  const current = fs.readFileSync(path.join(root, 'content/ref/versions.md'), 'utf8')
  if (render() !== current) errors.push('content/ref/versions.md 與 components.json 不一致, 請執行 npm run data')
} catch (e) {
  errors.push(`版本頁檢查失敗: ${e.message}`)
}

// 3. 文字檢查: 標點, 屬性框與未完成事項 ----------------------------------------------
const FULLWIDTH = /[，。；：（）]/
// 頁面不留未完成事項: 查不到的事實寫「官方文件未說明 / 公開資料查無 (日期)」, 需要實機確認的寫在「實機驗證」欄
const PENDING = /待查證|待核對|來源待補|本輪未|本輪無法|待確認|須再查證|研究 [12]|內部研究|內部模擬/
// 屬性框只寫等級與實機驗證 (有指令的頁面); 不標示狀態, 資料基準日與「實機驗證: 不適用」
const BANNED_ATTR = /^- (狀態|資料基準日):|^- 實機驗證: 不適用/m
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === '.vitepress' || e.name === 'node_modules' ? [] : walk(p)
    return p.endsWith('.md') ? [p] : []
  })
}
for (const f of walk(path.join(root, 'content'))) {
  const rel = path.relative(root, f)
  const text = fs.readFileSync(f, 'utf8')
  let inCode = false
  text.split('\n').forEach((line, i) => {
    if (FULLWIDTH.test(line)) errors.push(`${rel}:${i + 1}: 含全形標點 (本手冊標點一律半形)`)
    if (line.startsWith('```')) inCode = !inCode
    if (!inCode && PENDING.test(line)) errors.push(`${rel}:${i + 1}: 含未完成事項字樣「${line.match(PENDING)[0]}」, 請查證後寫入正文或移到實機驗證欄`)
  })
  if (text.includes('::: info 本章屬性') || text.includes('::: info 本頁屬性')) {
    if (BANNED_ATTR.test(text)) errors.push(`${rel}: 屬性框不標示狀態, 資料基準日或「實機驗證: 不適用」`)
    // 每個有屬性框的內容頁都要有來源小節 (標題含「來源」或「參考資料」)
    if (!/^#{2,3} .*(來源|參考資料)/m.test(text)) errors.push(`${rel}: 缺少「參考來源」或「資料來源」小節`)
  }
}

// 輸出 ----------------------------------------------------------------------
for (const w of warns) console.warn(`警告: ${w}`)
for (const e of errors) console.error(`錯誤: ${e}`)
console.log(`錯誤 ${errors.length} 項, 警告 ${warns.length} 項`)
process.exit(errors.length > 0 || (strict && warns.length > 0) ? 1 : 0)
