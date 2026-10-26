# 文件手冊 POC

用 [VitePress](https://vitepress.dev/) 建置的文件網站, 左側選單, 右側內容, 部署在 GitHub Pages.

## 網址

`https://githubuser03.github.io/docs-handbook-poc/`

## 本機預覽

```bash
npm install
npm run docs:dev
```

## 資料夾結構

```
docs/
├── .vitepress/config.mts   # 網站設定 (左側選單、搜尋、標題)
├── index.md                # 首頁
├── guide/                  # 手冊章節
└── examples/               # 範例頁
.github/workflows/deploy.yml  # 自動部署
```

## 啟用 GitHub Pages (只需設定一次)

repo 的 Settings → Pages → Build and deployment → Source 選 **GitHub Actions**. 之後每次 push 到 `main`, 網站會自動更新.
