# 元件版本與安全公告

::: warning 使用前請先看
本頁的版本號與 CVE 變動很快. 每列都標示來源與資料基準日 (2026-10-26); 標示「待核對」者尚未以官方頁面確認, 請勿直接引用. 來源欄為「研究 1」「研究 2」者, 是手冊整理前的內部研究紀錄, 未附來源網址, 其版本號一律視為待核對. 正文章節不寫版本號, 一律連到本頁.
:::

## 版本表

<!-- data:versions:start -->

| 元件 | 版本 | 日期 | 來源 | 狀態 |
|---|---|---|---|---|
| Ollama | v0.40.10 | 2026-10-26 查證 | 研究 1 | 待核對官方 releases |
| llama.cpp | b11848 | 2026-10-26 查證 | 研究 1 | 待核對官方 releases |
| LM Studio | 0.4.26 | 2026-10-26 查證 | 研究 1 | 待核對官方頁面 |
| vLLM | 0.32.0 | 2026-10-26 查證 | 研究 1 | 待核對官方 releases |
| Open WebUI | v0.12.4 (研究 1) / v0.11.4, 2026-09-21 (研究 2, vdf.ai) | - | 兩份研究 | **兩者互相矛盾, 待核對** |
| LibreChat | v0.8.8 | 2026-09-30 | vdf.ai | 待核對 |
| AnythingLLM | v1.17.0 | 2026-10-01 | vdf.ai | 待核對 |
| LiteLLM | 最近安全版本 v1.106.2; v1.107.0 為惡意版本 | 2026-10-21 | LiteLLM 官方事故報告, Wiz | 事件仍在追蹤 |
| LangGraph | 1.2.16 | 2026-10-16 | FutureAGI (二手來源) | 待核對 |
| Qdrant | 1.19.2 | 2026-10-05 | vdf.ai | 待核對 |
| Chroma | 1.5.9 | 2026-05-05 | vdf.ai | 待核對 |
| LanceDB | 0.39.0 | 2026-09-17 | vdf.ai | 待核對 |
| Docling | v2.111 | 2026 年中 | Medium 比較文 | 待核對 |
| Dify | v1.17.0 | 2026-08-25 | guard0 TrustVector | 待核對 |
| NeMo Guardrails | v0.24.1 | 2026-09-16 | 研究 2 | 待核對 |
| Guardrails AI | 0.11.0 | 2026-08 | 研究 2 | 待核對 |
| DeepEval | 4.3.1 | 2026-10-16 | 研究 2 | 待核對 |
| Ragas | 0.4.3 | 2026-01-13 | 研究 2 | 二手來源稱此後未再發版 |
| MCP 規格 | 2026-07-28 版 | 2026-07-28 | MCP 官方部落格 | 前一版為 2025-11-25 |

<!-- data:versions:end -->

## LiteLLM 2026 年 CVE 紀錄

<!-- data:litellm_cves:start -->

| CVE | 類型 | 影響版本 / 修補 | 來源 | 來源性質 |
|---|---|---|---|---|
| CVE-2026-35029 | 授權繞過, 可改設定並執行程式碼 | 1.83.0 以前 | SentinelOne | 資安廠商 |
| CVE-2026-42208 | 未驗證 SQL 注入 | 1.81.16 至 1.83.6; 修補於 1.83.7, 官方建議 1.83.10-stable | LiteLLM 官方部落格, Bishop Fox | 官方 |
| CVE-2026-42271 | 低權限金鑰經 MCP preview 端點命令注入 | 1.74.2 至 1.83.6 | SentinelOne | 資安廠商 |
| CVE-2026-59819 | 管理者經 `/health/test_connection` 讀取本機檔案 | 1.83.10-stable 以前 | SentinelOne | 資安廠商 |
| CVE-2026-59822 | MCP Streamable HTTP 驗證繞過 (CWE-287, CWE-306), CVSS v3.1 8.2, v4.0 8.8 | 1.84.0 以前; 修補於 1.84.0 | Wiz 弱點資料庫 | 資安廠商 (非第一手); **該頁對 KEV 列入與否前後不一 (內文稱未列入, 標示欄稱已列入), 發布日也有 2026-06-30 與 2026-07-08 兩種寫法, 兩者皆未確認, 請以 CISA KEV 清單與 GHSA 為準** |
| CVE-2026-84377 | SSRF, 上游供應商金鑰外洩, CVSS 6.5 | 2026-09-30 公告 | safeguard.sh | 資安廠商部落格 (非第一手), 待以 GHSA 或 NVD 查證 |
| CVE-2026-114612 | 加密情境重用導致提權為 proxy_admin, CVSS 9.9 | 1.87.0 至 1.104.0-rc.1 | dev.to/cvereports | **二手來源; 本輪查證未找到第一手來源, 暫不採信, 請勿引用, 待以 GHSA 或 NVD 查證** |

<!-- data:litellm_cves:end -->

另據 SOCRadar, 有一個 LiteLLM 漏洞預定於 2026-10-27 公開, 已在保密中的企業版修補.

## 其他元件的重點 CVE

<!-- data:other_cves:start -->

| 元件 | CVE | 說明 | 來源 |
|---|---|---|---|
| LibreChat | CVE-2026-32625 | CVSS 9.6, MCP URL 注入外洩伺服器機密, 0.8.4-rc1 修補 | SentinelOne |
| AnythingLLM | CVE-2026-48116 | 代理檔案搜尋技能參數注入 RCE, CVSS 7.5; 公告未列修補版本 | vdf.ai (2026-10 查證) |
| Langflow | CVE-2026-0768 | CVSS 9.8, 未驗證即以 root 執行程式碼, 自 2026-08-29 起觀測到持續利用 | VulnCheck |
| n8n | CVE-2026-21858 | CVSS 10.0, 未驗證, 1.121.0 修補 | VulnCheck |
| MCP 相關 | CVE-2025-49596, CVE-2025-6514 等 | 見[第 13.3 節](/build/m7-tools-sandbox) | The Hacker News, JFrog |
| vLLM | GHSA-3c86-2m5g-59q7 (無 CVE 編號) | CVSS 7.8, 特定處理器載入器在 trust_remote_code=False 時仍執行模型內程式碼; 0.28.0 修補, 2026-08-28 公告 | [vLLM GitHub Security Advisory](https://github.com/vllm-project/vllm/security/advisories/GHSA-3c86-2m5g-59q7) |

<!-- data:other_cves:end -->

Langflow 與 n8n 的完整 KEV 清單取自彙整站 senserva.com, 應改連 CISA 原始來源後再引用.

## 已知的所有權變動

| 專案 | 變動 |
|---|---|
| promptfoo | OpenAI 於 2026-03-09 宣布收購, 聲明維持 MIT 開源 |
| Langfuse | ClickHouse 公司於 2026-01-16 收購, 授權維持不變 |
| LibreChat | ClickHouse 於 2025-11-04 收購 |
| Arize Phoenix | Dynatrace 於 2026-10 初完成收購 Arize |
| LLM Guard | Protect AI 儲存庫已於 2026-07-09 封存 |

收購方目前都承諾維持開源, 但屬長期鎖定風險, 需持續追蹤.
