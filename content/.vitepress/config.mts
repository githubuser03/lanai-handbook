import { defineConfig } from 'vitepress'

// GitHub Pages 的網址是 https://<帳號>.github.io/<repo 名稱>/,
// 所以 base 必須和 repo 名稱一致. 改 repo 名稱時, 這裡要跟著改.
const base = '/docs-handbook-poc/'

// 中文沒有空格分詞, 用瀏覽器內建的 Intl.Segmenter 斷詞, 讓站內搜尋找得到中文關鍵字.
// 這個函式會被序列化送到瀏覽器執行, 所以不能引用函式外的變數.
const tokenize = (text: string) =>
  Array.from(new Intl.Segmenter('zh-Hant', { granularity: 'word' }).segment(text))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)

export default defineConfig({
  lang: 'zh-Hant-TW',
  title: '地端 AI 手冊',
  description: '地端 AI 的概念, 硬體選擇, 架設, 訓練與維運',
  base,
  // build 結果輸出到 repo 根目錄的 docs/, GitHub Pages 從 main 分支的 /docs 發布
  outDir: '../docs',
  cleanUrls: true,

  // 網站首頁直接顯示第 1 章 (網址 / 對應 intro/01-usage.md), 不另做封面頁
  rewrites: {
    'intro/01-usage.md': 'index.md'
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
      { text: '分層圖', link: '/intro/03-layers' },
      { text: '參考資料', link: '/ref/versions' }
    ],

    // 左側選單: 每個 items 就是一個章節群組
    sidebar: [
      {
        text: '一、入門概念',
        items: [
          { text: '1. 使用說明與自我檢測', link: '/' },
          { text: '2. 人工智慧的基本概念', link: '/intro/02-basics' },
          { text: '3. 地端 AI 分層與預設組合', link: '/intro/03-layers' }
        ]
      },
      {
        text: '二、評估選擇',
        items: [
          { text: '4. 模型與軟體授權判讀', link: '/select/04-licenses' },
          { text: '5. 量化與記憶體需求估算', link: '/select/05-quantization' },
          { text: '6. 工具呼叫能力判讀', link: '/select/06-tool-calling' },
          { text: '7. 硬體選購', link: '/select/07-hardware' }
        ]
      },
      {
        text: '三、架設部署',
        items: [
          { text: '8. 第一次在本機執行模型', link: '/deploy/08-first-run' },
          { text: '9. 三種參考架構', link: '/deploy/09-architectures' },
          { text: '10. 閘道與模型切換', link: '/deploy/10-gateway' },
          { text: '11. 安全與風險控管', link: '/deploy/11-security' }
        ]
      },
      {
        text: '四、應用擴充',
        items: [
          { text: '12. 檢索增強生成 (RAG)', link: '/apply/12-rag' },
          { text: '13. 工作流程, 代理與 MCP', link: '/apply/13-workflow-agent-mcp' },
          { text: '14. 評估與回歸測試', link: '/apply/14-evaluation' }
        ]
      },
      {
        text: '五、訓練微調',
        items: [
          { text: '15. 是否需要訓練的判斷', link: '/train/15-decide' },
          { text: '16. 微調實作與部署', link: '/train/16-finetune' },
          { text: '17. 從零開始預訓練', link: '/train/17-pretrain' }
        ]
      },
      {
        text: '六、維運更新',
        items: [
          { text: '18. 備份與還原', link: '/ops/18-backup' },
          { text: '19. 版本鎖定與升級流程', link: '/ops/19-versioning' },
          { text: '20. 安全公告與事件處理', link: '/ops/20-advisories-incidents' }
        ]
      },
      {
        text: '參考資料',
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
