import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

// 沿用 VitePress 預設版面 (左選單 / 內文 / 右目錄), 只用 custom.css 覆寫配色與字型.
// 每個內文頁底部加一行版權聲明 (預設的 footer 在有側邊選單的頁面不會顯示).
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-after': () =>
        h('p', { class: 'site-copyright' }, '© 2026 地端 LAN-AI 自建手冊作者. 版權所有, 保留一切權利. 引用請標示出處, 轉載或改作請先取得書面同意.')
    })
}
