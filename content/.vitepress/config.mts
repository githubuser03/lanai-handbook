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
  title: '作業手冊',
  description: '文件手冊 POC',
  base,
  // build 結果輸出到 repo 根目錄的 docs/, GitHub Pages 從 main 分支的 /docs 發布
  outDir: '../docs',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    // 上方導覽列
    nav: [
      { text: '手冊首頁', link: '/guide/' },
      { text: '範例頁', link: '/examples/formatting' }
    ],

    // 左側選單: 每個 items 就是一個章節群組
    sidebar: [
      {
        text: '開始使用',
        items: [
          { text: '手冊簡介', link: '/guide/' },
          { text: '快速開始', link: '/guide/getting-started' },
          { text: '新增與修改頁面', link: '/guide/writing' }
        ]
      },
      {
        text: '範例',
        items: [
          { text: '排版元素', link: '/examples/formatting' },
          { text: '作業程序範例', link: '/examples/procedure' }
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
