# 文件手冊 POC

用 [VitePress](https://vitepress.dev/) 建置的文件網站, 左側選單, 右側內容, 部署在 GitHub Pages.

## 網址

`https://githubuser03.github.io/docs-handbook-poc/`

## 發布原則: PR 核准後才上線

GitHub Pages 從 `main` 分支的 `/docs` 資料夾發布. 所有修改都在其他分支完成並開 PR, 核准者 Merge 之後網站才會更新. 不使用 GitHub Actions, 不需付費.

## 資料夾結構

```
content/                    # 手冊原始檔 (要修改的地方)
├── .vitepress/config.mts   # 網站設定 (左側選單、搜尋、標題)
├── index.md                # 首頁
├── guide/                  # 手冊章節
├── examples/               # 範例頁
└── public/                 # 圖片等靜態檔案
docs/                       # build 後的網站檔案 (自動產生, 勿手動修改)
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
