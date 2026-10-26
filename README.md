# 地端 AI 手冊

用 [VitePress](https://vitepress.dev/) 建置的文件網站, 左側選單, 右側內容, 部署在 GitHub Pages.

網址: `https://githubuser03.github.io/docs-handbook-poc/`

## 內容結構

七個選單群組, 共 20 章與 6 個參考資料頁. 每章頂端標示等級 (● 必要, ○ 依情境, ◇ 進階或選讀) 與狀態 (大綱, 草稿, 已審閱).

| 群組 | 章 |
|---|---|
| 一、入門概念 | 1 至 3 |
| 二、評估選擇 | 4 至 7 |
| 三、架設部署 | 8 至 11 |
| 四、應用擴充 | 12 至 14 |
| 五、訓練微調 | 15 至 17 |
| 六、維運更新 | 18 至 20 |
| 參考資料 | 版本與安全公告, 授權速查, 硬體價格, 效能實測, 模型建議, 術語對照 |

寫作規範見 [STYLE.md](STYLE.md).

## 發布原則: PR 核准後才上線

GitHub Pages 從 `main` 分支的 `/docs` 資料夾發布. 所有修改都在其他分支完成並開 PR, 核准者 Merge 之後網站才會更新. 不使用 GitHub Actions, 不需付費.

## 資料夾結構

```
content/                    # 手冊原始檔 (要修改的地方)
├── .vitepress/config.mts   # 網站設定 (左側選單, 搜尋, 標題)
├── index.md                # 首頁
├── intro/ select/ deploy/  # 各群組的章節
├── apply/ train/ ops/
├── ref/                    # 參考資料頁 (版本, 授權, 價格, 術語)
└── public/                 # 圖片等靜態檔案
docs/                       # build 後的網站檔案 (自動產生, 勿手動修改)
STYLE.md                    # 寫作規範
```

## 修改流程

```bash
git checkout -b 我的修改
npm install
npm run docs:dev      # 本機預覽, 存檔即更新
# 修改 content/ 裡的 Markdown
npm run docs:build    # 產生 docs/, 開 PR 前必須執行
git add content docs
git commit -m "說明這次改了什麼"
git push -u origin 我的修改
# 到 GitHub 開 PR, 等核准者 Merge
```

## GitHub Pages 設定 (只需設定一次)

repo 的 Settings → Pages → Build and deployment:

- Source: **Deploy from a branch**
- Branch: **main**, 資料夾 **/docs**
