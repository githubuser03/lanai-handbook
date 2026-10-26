# 手冊簡介

這份手冊是文件網站的 POC, 用來確認版型、撰寫方式與發布流程是否符合需求. 確認後, 把範例內容換成正式內容即可.

## 網站的組成

畫面分成三個區塊:

| 區塊 | 位置 | 內容來源 |
|---|---|---|
| 左側選單 | 畫面左邊 | `content/.vitepress/config.mts` 的 `sidebar` 設定 |
| 內文 | 畫面中間 | 每一頁的 Markdown 檔案 |
| 本頁目錄 | 畫面右邊 | 自動擷取頁面裡的 `##` 與 `###` 標題 |

手機上, 左側選單會收進左上角的「選單」按鈕, 本頁目錄則收進頁首的下拉選單.

## 發布流程: 核准後才上線

所有修改都必須經過 Pull Request (PR) 審核, 核准者按下 Merge 之後, 網站才會更新.

1. 在新分支修改 `content/` 裡的 Markdown 檔案.
2. 執行 `npm run docs:build`, 產生網站檔案到 `docs/` 資料夾.
3. 把修改與 `docs/` 一起 commit, push 後開 PR.
4. 核准者在 GitHub 上檢視 PR, 確認無誤後按 Merge.
5. GitHub Pages 從 `main` 分支的 `docs/` 資料夾發布, 約一至兩分鐘後網站更新.

::: tip 為什麼合併就等於發布
GitHub Pages 只讀 `main` 分支. 修改留在其他分支或尚未合併的 PR 時, 網站內容不會改變, 所以 Merge 就是唯一的發布開關.
:::

::: tip 不需付費
這個流程不使用 GitHub Actions, 只用 GitHub Pages 內建的分支發布, 公開 repo 不需付費.
:::

## 審核 PR 時看哪裡

PR 的「Files changed」會同時列出 `content/` 和 `docs/` 的變更. 審核時看 `content/` 底下的 Markdown 即可; `docs/` 是自動產生的網站檔案, 不需要逐行檢查.

## 適合放什麼內容

GitHub Pages 的網站是公開的, 任何拿到網址的人都看得到. 因此適合放工具使用說明、公開的技術筆記與教學內容; 含客戶資訊或內部資料的內容, 請改放需要登入的平台.
