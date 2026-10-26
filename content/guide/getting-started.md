# 快速開始

本頁說明如何在自己的電腦上預覽手冊. 只想在 GitHub 網頁上直接改內容的話, 可以跳過本頁, 直接看[新增與修改頁面](./writing).

## 事前準備

電腦上需要先安裝 [Node.js](https://nodejs.org/) 20 版以上. 安裝完成後, 在終端機輸入下列指令確認版本:

```bash
node -v
```

## 下載專案並預覽

### 1. 下載專案

```bash
git clone https://github.com/githubuser03/docs-handbook-poc.git
cd docs-handbook-poc
```

### 2. 安裝套件

```bash
npm install
```

### 3. 啟動預覽

```bash
npm run docs:dev
```

指令執行後, 用瀏覽器開啟終端機顯示的網址 (通常是 `http://localhost:5173/docs-handbook-poc/`). 修改 Markdown 存檔後, 瀏覽器畫面會立即更新.

## 常用指令

| 指令 | 用途 |
|---|---|
| `npm run docs:dev` | 本機預覽, 存檔即更新 |
| `npm run docs:build` | 產生正式網站檔案, 輸出到 `docs/`; 開 PR 前必須執行 |
| `npm run docs:preview` | 預覽 build 後的正式網站 |
