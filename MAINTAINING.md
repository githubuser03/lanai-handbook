# 維護指南

## 發布原則: PR 核准後才上線

GitHub Pages 從 `main` 分支的 `/docs` 資料夾發布. 所有修改都在其他分支完成並開 PR, 核准者 Merge 之後網站才會更新. 不使用 GitHub Actions, 不需付費.

寫作規範見 [STYLE.md](STYLE.md).

## 資料夾結構

```
content/                    # 手冊原始檔 (要修改的地方)
├── .vitepress/config.mts   # 網站設定 (左側選單, 搜尋, 標題)
├── decide/                 # 決策參考頁
├── start/                  # 使用說明 (網站首頁) 與架構地圖
├── know/                   # 第一部 底層知識 (K1 至 K6)
├── build/                  # 第二部 模組化組裝 (組裝總覽, M0 至 M9)
├── examples/               # 第三部 應用範例
├── ops/                    # 第四部 維運 (O1 至 O3)
├── train/                  # 延伸主題: 訓練微調 (T1 至 T3)
├── ref/                    # 參考資料頁 (版本, 授權, 價格, 術語)
│   └── data/components.json  # 版本與 CVE 的資料來源
└── public/                 # 圖片等靜態檔案
docs/                       # build 後的網站檔案 (自動產生, 勿手動修改)
scripts/                    # 資料產生, 檢查與架構圖腳本 (npm run data, check, diagram)
STYLE.md                    # 寫作規範
```

網站首頁 (`/`) 對應「使用說明」 `content/start/usage.md`, 設定在 `config.mts` 的 `rewrites`.

## 修改流程

```bash
git checkout -b 我的修改
npm install
npm run docs:dev      # 本機預覽, 存檔即更新
# 修改 content/ 裡的 Markdown
                      # 新增或改寫的頁面都要有「## 參考來源」小節, 否則 npm run check 會失敗
npm run check         # 檢查資料與文字規範
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
