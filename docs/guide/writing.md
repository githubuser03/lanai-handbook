# 新增與修改頁面

新增一頁只需要兩個步驟: 建立 Markdown 檔案, 再把它加進左側選單.

## 新增一頁

### 1. 建立 Markdown 檔案

在 `docs/` 底下建立檔案. 資料夾結構就是網址結構, 例如:

| 檔案位置 | 網址 |
|---|---|
| `docs/guide/index.md` | `/guide/` |
| `docs/guide/writing.md` | `/guide/writing` |
| `docs/sop/backup.md` | `/sop/backup` |

檔案第一行用 `#` 寫頁面標題, 其後用 `##` 與 `###` 分段. 右側的本頁目錄會依這些標題自動產生.

### 2. 加進左側選單

打開 `docs/.vitepress/config.mts`, 在 `sidebar` 裡加一行:

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

## 直接在 GitHub 網頁上修改

不想在電腦上安裝工具的話, 可以直接在 GitHub 網頁上改:

1. 在 GitHub 打開要修改的 `.md` 檔案.
2. 點右上角的鉛筆圖示進入編輯.
3. 修改完成後按「Commit changes」.

存檔後, GitHub Actions 會自動重建網站.
