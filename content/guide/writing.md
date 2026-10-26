# 新增與修改頁面

新增一頁只需要兩個步驟: 建立 Markdown 檔案, 再把它加進左側選單. 修改完成後, 依[發布流程](./#發布流程-核准後才上線)開 PR 送審.

## 新增一頁

### 1. 建立 Markdown 檔案

在 `content/` 底下建立檔案. 資料夾結構就是網址結構, 例如:

| 檔案位置 | 網址 |
|---|---|
| `content/guide/index.md` | `/guide/` |
| `content/guide/writing.md` | `/guide/writing` |
| `content/sop/backup.md` | `/sop/backup` |

檔案第一行用 `#` 寫頁面標題, 其後用 `##` 與 `###` 分段. 右側的本頁目錄會依這些標題自動產生.

### 2. 加進左側選單

打開 `content/.vitepress/config.mts`, 在 `sidebar` 裡加一行:

```ts
sidebar: [
  {
    text: '標準作業程序',          // 章節群組名稱
    items: [
      { text: '備份作業', link: '/sop/backup' }  // 新增的頁面
    ]
  }
]
```

::: warning 選單不會自動列出新頁面
沒有加進 `sidebar` 的頁面仍然可以用網址開啟, 但左側選單看不到. 新增頁面後, 記得同步修改設定檔.
:::

## 送審前必做: 重新 build

網站讀的是 `docs/` 裡 build 好的檔案, 不是 `content/` 的 Markdown. 只改 Markdown 卻沒有 build, 合併後網站不會變.

```bash
npm run docs:build
git add content docs
git commit -m "說明這次改了什麼"
```

::: danger 不要手動修改 docs/
`docs/` 每次 build 都會整個重新產生, 手動修改的內容會被覆蓋.
:::
