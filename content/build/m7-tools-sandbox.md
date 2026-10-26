# M7 工具與沙箱

::: info 本章屬性
- 等級: ◇ 進階
- 狀態: 可閱讀 (M7.2 至 M7.5 僅有大綱)
- 資料基準日: 2026-10-26
- 待查證: MCP 授權規範細節未逐條驗證; ToolHive, gVisor 的設定未實機驗證
:::

**結論**: 工具讓模型能讀寫系統, 也是風險最集中的地方. 所有工具都放在獨立的 VM 工具區, 經同一個工具閘道 (MCP gateway) 呼叫; 會執行程式碼的工具一律放進沙箱. 工具只有幾個時, 可以由 LiteLLM 兼任工具閘道.

**這一塊在圖上的位置**: VM 工具區 (MCP 伺服器, Docker + gVisor) 與閘道區的 MCP gateway. **前置模組**: M5, M6. **完成後的狀態**: 介面與代理都能透過同一個工具閘道呼叫已審核的工具, 每次呼叫都留下紀錄.

## M7.1 MCP 伺服器的審核與沙箱化

已公開的事件顯示風險真實存在:

| 日期 | 事件 | 來源 |
|---|---|---|
| 2025-04 | Invariant Labs 公開工具投毒 (tool poisoning): 在工具描述中藏指令, 讓模型讀取 SSH 私鑰 | pipelab.org, agentmelt.com 整理 |
| 2025-06 | CVE-2025-49596, 官方 MCP Inspector 缺乏驗證, 可經惡意網頁執行程式碼 (CVSS 9.4) | The Hacker News, Vulnerable MCP Project |
| 2025-07 | CVE-2025-6514, mcp-remote 經惡意伺服器注入作業系統命令 (CVSS 9.6), 0.1.16 修補 | JFrog, The Hacker News |
| 2025-09 | postmark-mcp npm 套件後門, 首例實際環境中的惡意 MCP 伺服器 | pipelab.org |
| 2026-06 | Miasma 蠕蟲在 73 個 GitHub 儲存庫植入惡意 MCP 設定檔, IDE 開啟專案即自動執行 | Cloud Security Alliance |

另有研究 "MCP at First Glance" (arXiv:2506.13538) 分析 1,899 個開源 MCP 伺服器, 摘要指出 7.2% 含一般漏洞, 5.5% 有 MCP 特有的工具投毒.

審核做法 (信心: 中高):

1. **來源**: 只用官方或知名組織維護的伺服器, 確認套件發行者與儲存庫一致.
2. **鎖定版本**: 固定版本號與雜湊, 不用 `npx -y` 拉最新版; 工具描述變更時重新審核, 以防 rug pull.
3. **權限最小化**: 檔案系統伺服器只開放單一資料夾; 資料庫伺服器使用唯讀帳號.
4. **沙箱化**: stdio 伺服器放進容器 (無網路或限制對外連線, 非 root, 唯讀根檔案系統).
5. **不讓專案自動載入 MCP 設定**: 關閉 IDE 的自動信任.
6. **MCP 閘道**: 對初階讀者過度, 且 LiteLLM 的 MCP 路由本身就出過多個 CVE; 里程碑 3 才加入, 見 M7.2 節.


## M7.2 架設工具閘道 (MCP gateway)

待撰寫要點:

- ToolHive 的部署方式 (容器), 工具白名單, 依角色授權, 稽核紀錄
- 規模小時改用 LiteLLM 的 MCP 功能兼任
- 第二次政策判定: 代理端判定後, 工具閘道再判定一次

## M7.3 架設程式碼沙箱 (Docker + gVisor)

待撰寫要點:

- 在 VM 工具區安裝 gVisor 的 runsc, 以 `--runtime runsc` 執行沙箱容器
- 啟動參數: `--network none`, `--read-only`, 非 root, `--cap-drop ALL`, 記憶體, CPU 與行程數上限, 執行逾時
- 每次執行用新容器, 結束即刪除
- 以一支小型 MCP 伺服器接收程式碼, 啟動沙箱, 回傳結果

## M7.4 讓 Open WebUI 使用同一組工具

待撰寫要點:

- Open WebUI 原生支援 MCP (Streamable HTTP), 在管理設定的外部工具加入工具閘道網址
- 關閉伺服器端的 Jupyter 程式碼執行引擎; 外掛 (Tools, Functions) 只限管理者匯入
- 若啟用 Open Terminal, 部署在 VM 工具區

## M7.5 驗收測試

待撰寫要點:

- 工具閘道拒絕白名單以外的工具呼叫, 並留下紀錄
- 沙箱內的程式無法連線外部網路, 無法寫入唯讀目錄
- 工具描述變更時, 審核流程能偵測到
