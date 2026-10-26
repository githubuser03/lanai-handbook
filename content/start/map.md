# 架構地圖: 最終要組出什麼

::: info 本頁屬性
- 等級: ● 必要, 所有讀者都讀
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 各層必要性分級與信心水準來自研究 2 (內部研究紀錄, 非公開來源), 多數沒有公開佐證, 屬整理者判斷; 可查證的外部事實見頁尾「參考來源」
:::

**結論**: 下圖是本手冊的終點, 也就是一套可以讓多人安全使用的地端 AI 系統. 手冊先在第一部說明每個方塊背後的原理, 再在第二部由下往上, 一次組裝一個模組. 多數讀者只需要組到其中一部分: 單人組到 M2, 小團隊組到 M6, 只有多人共用且有人每週維運時, 才組完整張圖.

![地端 AI 部署架構: 雲端, 地端, 使用者端三區, 標示實體主機, VM, 設備與各連線協定](/images/architecture.svg)

**讀圖方式**: 由下往上讀. 使用者只從內網連入反向代理, 經介面呼叫模型閘道, 再到推論伺服器. 珊瑚色元件接觸不可信內容, 紫色是可信控制區, 米色是基礎設施. 粗框是實體主機, 細框是 VM, 點線框是設備. 方塊上方是要安裝的軟體, 下方是角色.

## 圖上每一塊由哪個模組組裝

| 圖上的方塊 | 組裝模組 | 先讀的底層知識 | 等級 |
|---|---|---|---|
| Proxmox VE, VM 分區, 備份伺服器 | [M0 基礎環境](/build/m0-foundation) | K6 | ● |
| vLLM (或 Ollama, llama.cpp) | [M1 推論伺服器](/build/m1-inference) | K1, K2, K3 | ● |
| Open WebUI, Nginx 或 Caddy | [M2 使用者介面與反向代理](/build/m2-ui-proxy) | K6 | ● |
| ModelAudit, NFS 模型存放區, Hugging Face | [M3 模型入庫與存放](/build/m3-model-intake) | K1, K4 | ○ |
| Docling, Qdrant, 嵌入模型 | [M4 檢索 (RAG)](/build/m4-retrieval) | K1 | ○ |
| LiteLLM, Keycloak, 雲端 API | [M5 模型閘道與身分驗證](/build/m5-gateway-identity) | K6 | ○ |
| Langfuse, OTel, Prometheus, 既有 SIEM | [M6 可觀測, 稽核與評估](/build/m6-observability) | K5 | ○ |
| MCP gateway, MCP 伺服器, Docker + gVisor | [M7 工具與沙箱](/build/m7-tools-sandbox) | K5, K6 | ◇ |
| LangGraph, OPA, 隔離模型 | [M8 代理與治理](/build/m8-agent-governance) | K5, K6 | ◇ |
| n8n | [M9 流程自動化](/build/m9-automation) | K5 | ○ |

## 三個里程碑

| 里程碑 | 完成的模組 | 適合 | 對應組合 |
|---|---|---|---|
| 1. 能對話 | M0 至 M2 | 單人, 單機 | 最小安全組合 |
| 2. 能查文件, 能多人用 | 再加 M3 至 M6 | 家庭或 2 至 10 人小團隊 | 標準組合 |
| 3. 能動手做事 | 再加 M7 至 M9 | 多人共用, 有人每週維運 | 進階組合 (整張圖) |

每個里程碑都是可以獨立使用的系統, 不必等全部組完. 各里程碑的檢核表見[組裝總覽](/build/overview). 用這些模組能解決哪些問題, 見[應用範例](/examples/).

## 各層的必要性判斷

| 層 | 分級 | 判斷依據 |
|---|---|---|
| 推論層 | 必要 | 沒有推論伺服器就沒有服務 |
| 使用者介面層 | 必要 | Open WebUI, LibreChat, AnythingLLM 擇一 (信心: 高) |
| 身分與存取 / 網路層 | 必要 | 最小做法是只綁 localhost 或只開放內網, 不必上 SSO (信心: 高) |
| 備份與更新層 | 必要 | 地端最常遺漏的必要層 (信心: 高) |
| 機密管理層 | 必要, 最低限度 | `.env` 檔加權限 600 即可; Vault 或 OpenBao 對多數讀者過度 (信心: 中高, 屬推論) |
| 檢索層 (RAG) | 依情境 | 有「問自己文件」的需求才加 (信心: 高) |
| 模型切換層 | 依情境 | 需要多個模型輪流佔用顯示記憶體時才加 llama-swap (信心: 中高) |
| 閘道與路由層 | 依情境, 多人 | 符合 M5.1 節三項條件中的任兩項 (多人個別金鑰與配額, 混用雲端與地端, 多應用統一入口) 才加 (信心: 高) |
| 可觀測性與評估層 | 評估必要, 追蹤依情境 | 一份回歸測試集是必要的; Langfuse 這類追蹤平台依情境 (信心: 中高) |
| 編排與代理層 | 依情境 | 多數讀者用固定工作流程即可 (信心: 中高) |
| 工具協定層 (MCP) | 依情境, 進階 | 需要跨客戶端重用工具時才加 (信心: 中高) |
| 沙箱層 | 依情境 | 只要讓模型執行程式碼就變成必要 (信心: 高) |
| 護欄層 | 不建議單獨加 | 地端單人情境成本效益低, 權限設計比護欄模型更有效 (信心: 中) |
| Kubernetes | 不建議 | 單機無法發揮排程與高可用的價值 (信心: 中高, 屬推論) |

資料來源: 研究 2《地端 AI 完整架構權衡研究》(2026-10-26), 分級與信心水準為該研究的整理判斷. 研究 2 為內部研究紀錄, 非公開來源; 可由公開資料佐證的部分見頁尾「參考來源」.

## 「少而精」的判斷原則

2026 年的主要風險不在模型, 而在推論伺服器之上的中介層. 閘道 (LiteLLM), 低程式碼平台 (Langflow, n8n, Flowise) 與 MCP 實作都出現過已有實際利用紀錄的漏洞 (信心: 高, 依據為 CISA KEV, VulnCheck 與各廠商通報; 逐項來源見頁尾「參考來源」, 細節見 M5, M7, M9). 這類服務的共同點是同時保存金鑰, 又能執行程式碼, 因此一旦入侵成功, 影響範圍大於單一應用程式.

本手冊據此採用三條取捨原則:

1. **能不加就不加**: 每多一層, 就多一個要更新, 備份與監看公告的服務. 若無法每週檢查安全公告, 寧可少裝元件.
2. **先固定流程, 再考慮自主代理**: 小模型單步工具呼叫約 78% 至 88%, 多輪任務只有約 30% 至 42% (BFCL V4 官方排行榜中 Qwen3-8B, 14B, 30B-A3B 的 FC 模式, 見 K5 與頁尾「參考來源」).
3. **權限設計優先於偵測**: 不給模型不需要的工具權限, 寫入與刪除需要人工確認, 比加護欄模型更有效.

圖上的分區方式就是這三條原則的實作: 金鑰只放在閘道區, 接觸不可信內容的元件與有工具權限的元件分開, 所有工具呼叫都經過同一個工具閘道.

## 參考來源

本頁的架構圖, 里程碑與各層必要性分級是整理者的設計與判斷 (信心標示見各列), 依據是研究 2 (內部研究紀錄, 非公開來源, 無公開連結). 各模組使用的元件版本, 參數與指令的來源, 列在[組裝總覽](/build/overview)與各模組章 (M0 至 M9) 的「參考來源」. 本頁可另外查證的外部事實如下.

**中介層的已知被利用漏洞 (「少而精」一節)**

- CISA Known Exploited Vulnerabilities (KEV) 目錄 (catalogVersion 2026.10.23, 2026-10-26 擷取) 列有: LiteLLM 3 筆 (CVE-2026-42208, CVE-2026-42271, CVE-2026-59822, 加入日 2026-05-08, 2026-06-08, 2026-09-02, 其中 CVE-2026-59822 位於 MCP Streamable HTTP 端點); Langflow 6 筆 (CVE-2025-3248, CVE-2026-33017, CVE-2025-34291, CVE-2026-55255, CVE-2026-0770, CVE-2026-9198); n8n 1 筆 (CVE-2025-68613, 2026-03-11). [CISA: Known Exploited Vulnerabilities 目錄 (JSON)](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json)
- Flowise 不在上述 CISA KEV 中. 利用紀錄來自 VulnCheck: BleepingComputer 2026-04-07 報導 VulnCheck 的 Canary 網路偵測到 CVE-2025-59528 的首次利用 (二手來源, 尚未改連 VulnCheck 原文). [BleepingComputer: Max severity Flowise RCE vulnerability now exploited in attacks](https://www.bleepingcomputer.com/news/security/max-severity-flowise-rce-vulnerability-now-exploited-in-attacks/)
- n8n 另有 CVE-2026-21858: VulnCheck 部落格記載它於 2026-01-09 列入 VulnCheck KEV, 但未列入 CISA KEV. [VulnCheck: n8n needs more KEV](https://www.vulncheck.com/blog/n8n-needs-more-kev)
- 「MCP 實作」目前的佐證只有上述 LiteLLM 的 MCP 相關條目 (廠商為閘道, 不是獨立的 MCP 伺服器); 其他 MCP 伺服器的利用紀錄來源待補, 依據的範圍以 M7 為準.
- 「這類服務同時保存金鑰又能執行程式碼, 影響範圍較大」是整理者的歸納 (推論, 信心: 中). 閘道集中保存上游金鑰一點, 見 LiteLLM 事故報告, 其處置建議包含輪替代理資料庫中的供應商金鑰, master 與虛擬金鑰. [LiteLLM: Security incident Oct 21 2026](https://docs.litellm.ai/blog/security-incident-oct-21-2026)

**工具呼叫準確率 (「少而精」第 2 條)**

- BFCL V4 官方排行榜 (頁面標示最後更新 2026-04-12) 的資料檔顯示: Qwen3-8B (FC) 非即時 AST 87.58%, 即時 80.53%, 多輪 41.75%; Qwen3-14B (FC) 為 84.94%, 80.01%, 34.75%; Qwen3-30B-A3B-Instruct-2507 (FC) 為 85.77%, 77.94%, 30.00%. 內文「單步約 78% 至 88%, 多輪約 30% 至 42%」即這三個模型的範圍, K5 表格先前取自彙整站, 數字與官方資料檔相符.
- 適用範圍有限: 同一份資料中更小的模型多輪更低 (例如 Qwen3-4B-Instruct-2507 FC 為 22.12%, Qwen3-1.7B FC 為 11.00%), 因此「小模型」的範圍僅適用於 8B 至 30B-A3B 等級.
- [BFCL V4 排行榜](https://gorilla.cs.berkeley.edu/leaderboard.html), [BFCL V4 資料檔 (CSV)](https://gorilla.cs.berkeley.edu/data_overall.csv)

**權限設計優先於偵測 (「少而精」第 3 條)**

- OWASP GenAI LLM01:2025 的緩解方向包含把模型權限限制在最小必要範圍, 以及對特權操作加入人工核准; 同頁指出目前不清楚是否存在萬無一失的提示注入防範方法. 「比加護欄模型更有效」的比較則是整理者判斷 (信心: 中), 沒有公開的對照資料. [OWASP GenAI: LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)

**元件行為**

- 「只綁 localhost 或只開放內網」: Docker 文件說明, 發布容器連接埠後服務對外部開放, 加上 127.0.0.1 才限制為主機本機存取. [Docker 文件: Port publishing and mapping](https://docs.docker.com/engine/network/port-publishing/)
- llama-swap: 專案自述為可在本地 OpenAI 或 Anthropic 相容伺服器 (如 llama.cpp, vLLM) 之間切換模型的工具, 授權為 MIT. [llama-swap (GitHub)](https://github.com/mostlygeek/llama-swap)

**沒有公開佐證的判斷 (來源待補, 屬整理者判斷)**

- 使用者介面「Open WebUI, LibreChat, AnythingLLM 擇一」, 機密管理「`.env` 加權限 600 即可, Vault 或 OpenBao 過度」, 護欄層「不建議單獨加」, Kubernetes「不建議」, 編排與代理層, 工具協定層的分級, 以及三個里程碑適用的人數與硬體: 依據為研究 2, 屬推論, 信心標示如各列.
