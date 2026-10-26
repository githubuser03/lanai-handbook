import { defineConfig } from 'vitepress'

// GitHub Pages 的網址是 https://<帳號>.github.io/<repo 名稱>/,
// 所以 base 必須和 repo 名稱一致. 改 repo 名稱時, 這裡要跟著改.
const base = '/lanai-handbook/'

// 中文沒有空格分詞, 用瀏覽器內建的 Intl.Segmenter 斷詞, 讓站內搜尋找得到中文關鍵字.
// 這個函式會被序列化送到瀏覽器執行, 所以不能引用函式外的變數.
const tokenize = (text: string) =>
  Array.from(new Intl.Segmenter('zh-Hant', { granularity: 'word' }).segment(text))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)

export default defineConfig({
  lang: 'zh-Hant-TW',
  title: '地端 LAN-AI 自建手冊',
  description: '地端 AI 的概念, 硬體選擇, 架設, 訓練與維運',
  base,
  // build 結果輸出到 repo 根目錄的 docs/, GitHub Pages 從 main 分支的 /docs 發布
  outDir: '../docs',
  cleanUrls: true,

  // 網站首頁直接顯示「使用說明」(網址 / 對應 start/usage.md), 不另做封面頁
  rewrites: {
    'start/usage.md': 'index.md'
  },
  lastUpdated: true,

  // 程式碼上色: 低飽和的 GitHub 配色
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark-dimmed' }
  },

  themeConfig: {
    // 上方導覽列
    nav: [
      { text: '從這裡開始', link: '/' },
      { text: '架構地圖', link: '/start/map' },
      { text: '應用範例', link: '/examples/' },
      { text: '決策參考', link: '/decide/summary' },
      { text: '參考資料', link: '/ref/versions' }
    ],

    // 左側選單: 以架構圖為終點, 先懂底層知識, 再逐一組裝模組, 最後看應用範例
    sidebar: [
      {
        text: '從這裡開始',
        items: [
          { text: '使用說明與學習路線', link: '/' },
          { text: '架構地圖: 最終要組出什麼', link: '/start/map' }
        ]
      },
      {
        text: '第一部 底層知識',
        items: [
          { text: 'K1 模型如何運作', link: '/know/k1-basics' },
          { text: 'K2 量化與記憶體需求', link: '/know/k2-quantization' },
          { text: 'K3 硬體選購', link: '/know/k3-hardware' },
          { text: 'K4 模型與軟體授權', link: '/know/k4-licenses' },
          { text: 'K5 工具呼叫, MCP 與代理', link: '/know/k5-tools-agents' },
          { text: 'K6 安全基礎與風險控管', link: '/know/k6-security' }
        ]
      },
      {
        text: '第二部 模組化組裝',
        items: [
          { text: '組裝總覽與里程碑', link: '/build/overview' },
          { text: 'M0 基礎環境', link: '/build/m0-foundation' },
          { text: 'M1 推論伺服器', link: '/build/m1-inference' },
          { text: 'M2 使用者介面與反向代理', link: '/build/m2-ui-proxy' },
          { text: 'M3 模型入庫與存放', link: '/build/m3-model-intake' },
          { text: 'M4 檢索 (RAG)', link: '/build/m4-retrieval' },
          { text: 'M5 模型閘道與身分驗證', link: '/build/m5-gateway-identity' },
          { text: 'M6 可觀測, 稽核與評估', link: '/build/m6-observability' },
          { text: 'M7 工具與沙箱', link: '/build/m7-tools-sandbox' },
          { text: 'M8 代理與治理', link: '/build/m8-agent-governance' },
          { text: 'M9 流程自動化', link: '/build/m9-automation' }
        ]
      },
      {
        text: '第三部 應用範例',
        items: [
          { text: '範例總覽', link: '/examples/' },
          { text: 'P1 問自己的文件', link: '/examples/p1-docs-qa' },
          { text: 'P2 程式撰寫助理', link: '/examples/p2-coding' },
          { text: 'P3 會議記錄摘要', link: '/examples/p3-meeting-notes' },
          { text: 'E1 內部知識庫問答', link: '/examples/e1-knowledge-base' },
          { text: 'E2 資安告警分流', link: '/examples/e2-alert-triage' },
          { text: 'E3 合約與法規文件比對', link: '/examples/e3-document-compare' },
          { text: 'E4 每週報告自動化', link: '/examples/e4-weekly-report' }
        ]
      },
      {
        text: '第四部 維運',
        items: [
          { text: 'O1 備份與還原', link: '/ops/backup' },
          { text: 'O2 版本鎖定與升級', link: '/ops/versioning' },
          { text: 'O3 安全公告與事件處理', link: '/ops/advisories' }
        ]
      },
      {
        text: '決策參考',
        collapsed: true,
        items: [
          { text: '一頁決策摘要', link: '/decide/summary' },
          { text: '該不該自架決策樹', link: '/decide/should-self-host' },
          { text: '成本試算表', link: '/decide/tco' },
          { text: '風險自評', link: '/decide/risk-checklist' },
          { text: '授權紅旗', link: '/decide/license-flags' },
          { text: '30 天 PoC 計畫', link: '/decide/poc-30days' }
        ]
      },
      {
        text: '延伸主題: 訓練微調',
        collapsed: true,
        items: [
          { text: 'T1 是否需要訓練的判斷', link: '/train/t1-decide' },
          { text: 'T2 微調實作與部署', link: '/train/t2-finetune' },
          { text: 'T3 從零開始預訓練', link: '/train/t3-pretrain' }
        ]
      },
      {
        text: '參考資料',
        collapsed: true,
        items: [
          { text: '元件版本與安全公告', link: '/ref/versions' },
          { text: '授權速查', link: '/ref/licenses' },
          { text: '硬體價格 (台灣)', link: '/ref/hardware-prices' },
          { text: '效能實測與基準分數', link: '/ref/benchmarks' },
          { text: '模型建議', link: '/ref/models' },
          { text: '術語對照', link: '/ref/glossary' }
        ]
      }
    ],

    // 右側「本頁目錄」
    outline: { level: [2, 3], label: '本頁目錄' },

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: { tokenize },
          searchOptions: { tokenize, prefix: true, fuzzy: 0.2 }
        },
        translations: {
          button: { buttonText: '搜尋', buttonAriaLabel: '搜尋' },
          modal: {
            displayDetails: '顯示詳細清單',
            resetButtonTitle: '清除搜尋',
            backButtonTitle: '關閉搜尋',
            noResultsText: '找不到相關結果',
            footer: {
              selectText: '選擇',
              navigateText: '切換',
              closeText: '關閉'
            }
          }
        }
      }
    },

    docFooter: { prev: '上一頁', next: '下一頁' },
    lastUpdated: { text: '最後更新' },
    darkModeSwitchLabel: '外觀',
    lightModeSwitchTitle: '切換為淺色',
    darkModeSwitchTitle: '切換為深色',
    sidebarMenuLabel: '選單',
    returnToTopLabel: '回到頂端'
  }
})
