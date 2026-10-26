# 元件版本與安全公告

::: warning 使用前請先看
本頁的版本號與 CVE 變動很快. 每列都標示來源與資料基準日 (2026-10-26), 來源連結為 2026-10-26 實際擷取確認的第一手頁面 (官方 releases, PyPI, 官方更新日誌, GHSA, NVD, CISA). 版本號以查證當日為準, 超過 30 天須重新核對. 同一 CVE 的評分在 GHSA 與 NVD 可能不同, 表中並列. 正文章節不寫版本號, 一律連到本頁.
:::

## 版本表

<!-- data:versions:start -->

| 元件 | 版本 | 日期 | 來源 | 狀態 |
|---|---|---|---|---|
| Ollama | v0.40.11 | 2026-10-24 | [Ollama GitHub Releases](https://github.com/ollama/ollama/releases/tag/v0.40.11) | 已核對官方 release 頁 (原記 v0.40.10 為前一版) |
| llama.cpp | b11889 | 2026-10-25 | [llama.cpp GitHub Releases](https://github.com/ggml-org/llama.cpp/releases/tag/b11889) | 已核對官方 release 頁; 此專案每次提交即出新 build 編號, 版本變動極快 |
| LM Studio | 0.4.26 | 2026-10-13 | [LM Studio 官方更新日誌](https://lmstudio.ai/changelog/lmstudio-v0.4.26) | 已核對官方更新日誌 |
| vLLM | 0.32.0 | 2026-10-18 | [vLLM GitHub Releases, PyPI](https://github.com/vllm-project/vllm/releases/tag/v0.32.0) | 已核對官方 release 頁與 PyPI |
| Open WebUI | v0.12.4 | 2026-10-25 | [Open WebUI GitHub Releases, PyPI](https://github.com/open-webui/open-webui/releases/tag/v0.12.4) | 已核對官方 release 頁與 PyPI; 先前記載的 v0.11.4 (2026-09-21) 為較舊版本, 矛盾已排除 |
| LibreChat | v0.8.8 | 2026-09-30 | [LibreChat 官方更新日誌](https://www.librechat.ai/changelog) | 已核對官方更新日誌; GitHub 主分支已進入 v0.8.9-rc1 |
| AnythingLLM | v1.18.0 (GitHub release); Docker Hub 映像另有 1.19.0 | 2026-10-13 (v1.18.0); 2026-10-23 (Docker 1.19.0) | [AnythingLLM GitHub Releases](https://github.com/Mintplex-Labs/anything-llm/releases/tag/v1.18.0) | GitHub release 頁已核對 v1.18.0; 1.19.0 見官方 Docker Hub 標籤與主分支 package.json, 尚未見對應的 GitHub release 頁 |
| LiteLLM | 最近安全版本 v1.106.2; v1.107.0 為惡意版本 | 2026-10-21 | [LiteLLM 官方事故報告 (2026-10-21), 根因分析 (2026-10-23)](https://docs.litellm.ai/blog/security-incident-oct-21-2026) | 已核對官方事故報告: v1.107.0 於 PyPI 上架約 2 小時 (11:39 至 13:23 UTC); 根因分析稱調查已完成, 清理作業仍在進行 |
| LangGraph | 1.2.17 | 2026-10-24 | [PyPI langgraph](https://pypi.org/project/langgraph/) | 已核對 PyPI (原記 1.2.16 為前一版) |
| Qdrant | v1.20.0 | 2026-10-22 | [Qdrant GitHub Releases](https://github.com/qdrant/qdrant/releases/tag/v1.20.0) | 已核對官方 release 頁 (原記 1.19.2 為前一版) |
| Chroma | 1.5.9 | 2026-05-05 | [PyPI chromadb](https://pypi.org/project/chromadb/) | 已核對 PyPI |
| LanceDB | 0.40.0 (Python 套件) | 2026-10-07 | [PyPI lancedb](https://pypi.org/project/lancedb/) | 已核對 PyPI (原記 0.39.0 為前一版) |
| Docling | v2.142.1 | 2026-10-23 | [Docling GitHub Releases, PyPI](https://github.com/docling-project/docling/releases/tag/v2.142.1) | 已核對官方 release 頁與 PyPI (原記 v2.111 已過時) |
| Dify | v1.18.0 | 2026-10-23 | [Dify GitHub Releases](https://github.com/langgenius/dify/releases/tag/1.18.0) | 已核對官方 release 頁 (原記 v1.17.0 為前一個次版本) |
| NeMo Guardrails | v0.24.1 | 2026-09-16 | [PyPI nemoguardrails](https://pypi.org/project/nemoguardrails/) | 已核對 PyPI |
| Guardrails AI | 0.11.0 | 2026-08-14 | [PyPI guardrails-ai](https://pypi.org/project/guardrails-ai/) | 已核對 PyPI |
| DeepEval | 4.3.1 | 2026-10-16 | [PyPI deepeval](https://pypi.org/project/deepeval/) | 已核對 PyPI |
| Ragas | 0.4.3 | 2026-01-13 | [PyPI ragas](https://pypi.org/project/ragas/) | 已核對 PyPI: 截至 2026-10-26 最新版仍為 0.4.3 |
| MCP 規格 | 2026-07-28 版 | 2026-07-28 | [MCP 官方部落格, 規格變更紀錄](https://blog.modelcontextprotocol.io/posts/2026-07-28/) | 已核對官方部落格與規格頁; 規格變更紀錄載明前一版為 2025-11-25 |

<!-- data:versions:end -->

## LiteLLM 2026 年 CVE 紀錄

<!-- data:litellm_cves:start -->

| CVE | 類型 | 影響版本 / 修補 | 來源 | 來源性質 |
|---|---|---|---|---|
| CVE-2026-35029 | 授權繞過: /config/update 未檢查管理者角色, 已登入使用者可改設定並執行程式碼; CVSS v4.0 8.7 (GHSA), v3.1 8.8 (NVD) | 1.83.0 以前; 修補於 1.83.0 | [GitHub Security Advisory GHSA-53mr-6c8q-9789, NVD](https://github.com/BerriAI/litellm/security/advisories/GHSA-53mr-6c8q-9789) | 官方 (GHSA, NVD 核對) |
| CVE-2026-42208 | 未驗證 SQL 注入; CVSS v4.0 9.3 (GHSA), v3.1 9.8 (NVD) | 1.81.16 至 1.83.6; 修補於 1.83.7, 官方建議 1.83.10-stable | [GitHub Security Advisory GHSA-r75f-5x8p-qvmc, NVD, CISA KEV](https://github.com/BerriAI/litellm/security/advisories/GHSA-r75f-5x8p-qvmc) | 官方 (GHSA, NVD 核對); 已列入 CISA KEV (2026-05-08). 「官方建議 1.83.10-stable」出自先前引用的 LiteLLM 部落格, 本輪未核對 |
| CVE-2026-42271 | 低權限金鑰經 MCP preview 端點 (stdio 設定) 命令注入; CVSS v4.0 8.7 (GHSA), v3.1 8.8 (NVD) | 1.74.2 至 1.83.6; 修補於 1.83.7 | [GitHub Security Advisory GHSA-v4p8-mg3p-g94g, NVD, CISA KEV](https://github.com/BerriAI/litellm/security/advisories/GHSA-v4p8-mg3p-g94g) | 官方 (GHSA, NVD 核對); 已列入 CISA KEV (2026-06-08) |
| CVE-2026-59819 | 管理者經 `/health/test_connection` 讀取本機檔案; CVSS v4.0 2.1 (GHSA), v3.1 4.9 (NVD) | 1.83.10-stable 以前; 修補於 1.83.10-stable | [GitHub Security Advisory GHSA-4g5m-c9r5-49xf, NVD](https://github.com/BerriAI/litellm/security/advisories/GHSA-4g5m-c9r5-49xf) | 官方 (GHSA, NVD 核對) |
| CVE-2026-59822 | MCP Streamable HTTP 驗證繞過 (CWE-287); CVSS v4.0 8.8 (GHSA), v3.1 8.2 (NVD) | 1.84.0 以前; 修補於 1.84.0 | [GitHub Security Advisory GHSA-7488-6r32-c95q, NVD, CISA KEV](https://github.com/BerriAI/litellm/security/advisories/GHSA-7488-6r32-c95q) | 官方 (GHSA, NVD 核對); 已列入 CISA KEV (2026-09-02). GHSA 發布日 2026-06-30, NVD 收錄日 2026-07-08 |
| CVE-2026-84377 | SSRF, 已登入使用者可使 proxy 將上游供應商金鑰送往自訂位置; CVSS 6.5 | NVD: 1.88.6 與 1.96.2 之前, 修補於這兩版; GHSA: 1.94.0 以前受影響, 修補於 1.96.2 並回補 1.88.x; NVD 2026-09-02 收錄 | [GitHub Security Advisory GHSA-3cv6-jpf6-8222, NVD](https://github.com/BerriAI/litellm/security/advisories/GHSA-3cv6-jpf6-8222) | 官方 (GHSA, NVD 核對); GHSA 頁面未顯示 CVE 編號, 對應關係見 NVD 參考連結 |
| CVE-2026-114612 | 加密情境重用 (同一金鑰保護機密與 session token) 導致提權為 proxy_admin; CVSS v3.1 9.9 (NVD 收錄), v4.0 7.7 (GHSA) | 1.87.0 起; 修補於 1.100.4, 1.101.3, 1.102.2, 1.103.1, 1.104.0-rc.2 | [GitHub Security Advisory GHSA-7hp6-4w63-5g45, NVD](https://github.com/BerriAI/litellm/security/advisories/GHSA-7hp6-4w63-5g45) | 官方 (GHSA 發布於 2026-09-30, NVD 於 2026-10-22 收錄); 先前二手來源的說法已由官方資料證實, GHSA 頁面未顯示 CVE 編號, 對應關係見 NVD 參考連結 |

<!-- data:litellm_cves:end -->

另據 SOCRadar, 有一個 LiteLLM 漏洞預定於 2026-10-27 公開, 已在保密中的企業版修補 (來源待補: 本輪未能在 SOCRadar 原文確認此說法).

## 其他元件的重點 CVE

<!-- data:other_cves:start -->

| 元件 | CVE | 說明 | 來源 |
|---|---|---|---|
| LibreChat | CVE-2026-32625 | CVSS 9.6, MCP URL 注入外洩伺服器機密; 0.8.3 以前受影響, 0.8.4-rc1 修補 | [GitHub Security Advisory GHSA-4pcc-j6m6-wcwx, NVD](https://github.com/danny-avila/LibreChat/security/advisories/GHSA-4pcc-j6m6-wcwx) |
| AnythingLLM | CVE-2026-48116 | 代理檔案搜尋技能 (filesystem-search-files) 參數注入, 可執行指令; CVSS 7.5 (GHSA), 8.8 (NVD); GHSA 列 1.12.1 以前受影響且未列修補版本, NVD 記載 1.13.0 以前受影響 | [GitHub Security Advisory GHSA-6hrp-7mw6-8v59, NVD](https://github.com/Mintplex-Labs/anything-llm/security/advisories/GHSA-6hrp-7mw6-8v59) |
| Langflow | CVE-2026-0768 | CVSS 9.8 (v3.0, ZDI), validate 端點程式碼注入, 未驗證即以 root 執行程式碼; NVD 列 1.4.2 受影響. 不在 CISA KEV 目錄 (版本 2026.10.23). 「自 2026-08-29 起觀測到持續利用」引自 VulnCheck, 來源待補 | [NVD (ZDI 通報編號 ZDI-26-034); 利用情形引自 VulnCheck (未核對)](https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2026-0768) |
| n8n | CVE-2026-21858 | CVSS 10.0, 未驗證遠端讀取伺服器檔案; 1.65.0 至 1.121.0 之前受影響, 1.121.0 修補. 不在 CISA KEV 目錄 (版本 2026.10.23) | [GitHub Security Advisory GHSA-v4pr-fm98-w9pg, NVD](https://github.com/n8n-io/n8n/security/advisories/GHSA-v4pr-fm98-w9pg) |
| MCP Inspector | CVE-2025-49596 | CVSS v4.0 9.4, 0.14.1 以前缺乏驗證, 可啟動 MCP 指令; 0.14.1 修補. 見[第 13.3 節](/build/m7-tools-sandbox) | [GitHub Security Advisory GHSA-7f8r-222p-6f5g, NVD](https://github.com/modelcontextprotocol/inspector/security/advisories/GHSA-7f8r-222p-6f5g) |
| mcp-remote | CVE-2025-6514 | CVSS v3.1 9.6 (JFrog 為 CNA), 連線至不受信任的 MCP 伺服器時, 授權端點回應中的網址可造成作業系統命令注入. 見[第 13.3 節](/build/m7-tools-sandbox) | [NVD (CNA: JFrog)](https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2025-6514) |
| vLLM | GHSA-3c86-2m5g-59q7 (無 CVE 編號) | CVSS 7.8, 特定處理器載入器在 trust_remote_code=False 時仍執行模型內程式碼; 0.28.0 修補, 2026-08-28 公告 | [vLLM GitHub Security Advisory (2026-10-26 核對)](https://github.com/vllm-project/vllm/security/advisories/GHSA-3c86-2m5g-59q7) |

<!-- data:other_cves:end -->

以 [CISA KEV 目錄](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json) (版本 2026.10.23) 核對: Langflow 列入 CVE-2025-3248, CVE-2026-33017, CVE-2025-34291, CVE-2026-55255, CVE-2026-0770 與 CVE-2026-9198 (IBM Langflow); n8n 列入 CVE-2025-68613; LiteLLM 列入 CVE-2026-42208, CVE-2026-42271 與 CVE-2026-59822. 上表的 Langflow CVE-2026-0768 與 n8n CVE-2026-21858 不在該目錄內.

## 已知的所有權變動

| 專案 | 變動 | 來源 |
|---|---|---|
| promptfoo | OpenAI 於 2026-03-09 宣布收購, 聲明維持開源 (授權條款見[授權速查](/ref/licenses)) | [OpenAI 公告](https://openai.com/index/openai-to-acquire-promptfoo/), [Promptfoo 公告](https://www.promptfoo.dev/blog/promptfoo-joining-openai/) |
| Langfuse | ClickHouse 公司於 2026-01-16 收購, 核心功能維持 MIT 授權 | [ClickHouse 公告](https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability) |
| LibreChat | ClickHouse 於 2025-11-04 收購, 公告稱既有部署的運作不變 | [ClickHouse 公告](https://clickhouse.com/blog/clickhouse-acquires-librechat) |
| Arize Phoenix | Dynatrace 於 2026-10-01 公告完成收購 Arize, Arize 表示持續支援 Phoenix | [Dynatrace 新聞稿](https://dynatrace.com/news/press-release/dynatrace-completes-acquisition-of-arize) |
| LLM Guard | Protect AI 儲存庫已於 2026-07-09 封存 | [GitHub 儲存庫](https://github.com/protectai/llm-guard) |

收購方目前都承諾維持開源, 但屬長期鎖定風險, 需持續追蹤.
