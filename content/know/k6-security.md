# K6 安全基礎與風險控管

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: K6.3 的沙箱與機密管理工具版本 (gVisor, Podman, SOPS 等) 為訓練資料內資訊, 可能已過時; gVisor 的效能負擔與 Podman, Vault 的相關說明來源待補; OWASP LLM Top 10 2026 的條目編號與名稱引自二手來源, 官方頁面本輪僅確認發布日; 「研究 1」「研究 2」為內部研究紀錄, 非公開來源; 2026-03 LiteLLM 事件的官方處置建議來源待補
:::

**結論**: 地端 AI 最有效的安全措施有四項: 不對網際網路開放, 鎖定版本, 縮小權限, 能還原. 這四項成本低, 且能涵蓋 2026 年已知的主要攻擊途徑.

## K6.1 網路暴露與存取控制

| 使用情境 | 做法 |
|---|---|
| 單人 | 服務只綁 127.0.0.1 |
| 家庭或小團隊 | 只開放內網, 加上介面本身的帳號系統 |
| 需要 HTTPS | 加反向代理: Nginx (內建速率限制, 來源: nginx 文件 `limit_req` 模組) 或 Caddy (預設自動取得並更新憑證, 來源: Caddy 文件 Automatic HTTPS; 設定較簡單屬整理者判斷) |
| 10 人以上, 或已有其他自架服務 | 才考慮 Keycloak 或 Authentik 這類 SSO |

**不要**用連接埠轉發把服務直接開到網際網路. SentinelLABS (SentinelOne) 與 Censys 在 293 天的掃描中觀察到 130 個國家共 175,108 台暴露的 Ollama 主機 (來源: SentinelLABS 研究報告); 2026 年 n8n 於 Shadowserver 2026-02-05 的統計中仍有 24,607 台易受攻擊 (來源: SC Media); Langflow 的 CVE-2026-33017 與 CVE-2026-0770 都已列入 CISA KEV (來源: BleepingComputer 報導; 另見 [K5](/know/k5-tools-agents)). 這幾件事屬於同一類問題.

上述存取控制工具的版本未於本輪驗證, 屬訓練資料內資訊, 可能已過時; 分級為研究 2 的推論 (信心: 中高).

## K6.2 供應鏈: 版本鎖定與映像摘要值

2026-10-21 的 LiteLLM 事件中, Docker Hub 上的 v1.107.0, latest, main-latest, main-stable 這些標籤都曾指向惡意映像 (來源: LiteLLM 官方事故報告). 浮動標籤因此不能當作安全依據.

實務做法:

1. 容器映像以版本號或摘要值 (digest) 鎖定, 不使用 `latest`.
2. 記錄每個元件的安裝版本與日期 (見 O2).
3. 升級前先讀發行說明, 並跑一次 promptfoo 測試集 (M6).
4. 模型權重優先採用 safetensors 格式, 避免載入來源不明的 pickle 檔; pickle 載入時可能執行任意程式碼 (來源: Hugging Face Pickle scanning 文件; 研究 1 亦列為風險).
5. 發現金鑰外洩時, 依「隔離, 重建, 輪替」處理 (整理者歸納的處理順序, 見 O3).

## K6.3 沙箱與機密管理

### 沙箱分級

以下分級為依產業慣例的推論 (信心: 中), gVisor, Firecracker, Podman, Docker rootless 的版本與效能未於本輪驗證. 各工具的功能描述來源見本章參考來源.

| 層級 | 做法 | 適用 |
|---|---|---|
| 最低 | 一般容器 + 非 root 使用者 (`--user`) + `--network none` + 唯讀根檔案系統 (`--read-only`) + 記憶體與 CPU 上限 (`--memory`, `--cpus`) (來源: Docker 文件 docker run 與 none network driver) | 所有讀者, 成本接近零 |
| 中階 | Podman 或 Docker rootless (Docker 文件稱 rootless 模式讓 daemon 與容器以非特權使用者執行; Podman README 稱可由一般使用者執行且無常駐管理 daemon) | 降低容器逃逸後的權限 |
| 進階 | gVisor (runsc) 提供系統呼叫層隔離: 以使用者空間的應用程式核心攔截系統呼叫, 代價是部分系統呼叫尚未實作, 且每次系統呼叫的負擔較高 (來源: gVisor 文件) | 多人環境 |

Firecracker 微型虛擬機使用 Linux KVM 建立 microVM (來源: Firecracker GitHub README); 維運成本高, 不建議手冊讀者使用 (整理者判斷).

**原則**: 只要讓模型執行程式碼, 就必須放進沙箱.

### 機密管理

- `.env` 檔 (權限 600, 不進版本控制) 足以應付多數讀者 (整理者建議).
- Docker Compose secrets 是下一階: 機密以檔案形式掛載到容器的 `/run/secrets/`, 避免放在環境變數中 (來源: Docker 文件 Compose secrets).
- SOPS 適合用 Git 管理設定的人: 它是加密檔案的編輯工具, 支援 YAML, JSON, ENV 等格式 (來源: SOPS GitHub README; 與 Git 搭配的用法屬整理者建議).
- HashiCorp Vault 或 OpenBao 對手冊讀者過度 (整理者判斷); OpenBao 為開源的機密管理系統 (來源: OpenBao GitHub README), Vault 的說明來源待補.

真正重要的是金鑰外洩後能快速輪替. LiteLLM 2026-10 事故報告建議從頭重建映像與環境, 並輪替代理資料庫中的供應商金鑰, master key, 虛擬金鑰與資料庫密碼 (來源: LiteLLM 官方事故報告); 「隔離, 重建, 輪替」是整理者歸納的處理順序, 2026-03 事件的官方建議來源待補.

## K6.4 基線檢核表與 OWASP 2026 對照

基線檢核表分三組, 隨架構逐層累加, 見[「組裝總覽」](/build/overview).

### OWASP 對照

OWASP Top 10 for LLM Applications 2026 於 2026-08-03 發布 (來源: OWASP GenAI Security Project 官方頁面); 下表的條目編號與名稱引自 Imperva 與 Cloud Security Alliance 轉載的文章 (二手來源), 官方頁面本輪擷取的文字未列出各條目. OWASP Top 10 for Agentic Applications 2026 於 2025-12-09 發布 (來源: OWASP 官方頁面), ASI 條目名稱引自 Giskard 的整理 (二手來源). 另有一份 OWASP GenAI 的《State of Agentic AI Security and Governance》v2.01 於 2026-06-01 發布 (來源: letsdatascience.com 報導, 二手來源); 該文件與 Agentic Top 10 的更新關係待核對.

| 風險 | 本手冊的對應做法 |
|---|---|
| LLM03 過度代理 (Excessive Agency), ASI02, ASI03 | 工具權限最小化; 寫入與刪除需人工確認 |
| LLM04 供應鏈, ASI04 | 鎖定版本與摘要值; 審核 MCP 伺服器 |
| ASI05 | 程式碼執行放進沙箱 |
| LLM08 隱藏情境暴露, ASI06 | RAG 資料來源只限可信資料夾 |
| LLM06 無限制資源消耗 | 速率與 token 上限 |

### 護欄模型的定位

分類器護欄不建議當作唯一防線, 理由有兩點:

1. 字元層級手法可繞過偵測. Hackett 等人 (Mindgard 與 Lancaster University, arXiv 2504.11168) 測試 6 套偵測系統, 「Emoji Smuggling」對受測的提示注入與越獄偵測器都達到 100% 攻擊成功率; 該研究測的是第一代 Meta Prompt Guard, 未測 Prompt Guard 2.
2. Llama Guard 4 有 120 億參數, 權重為 BF16 (來源: Meta 模型卡與 Hugging Face 模型卡); 依參數量 x 2 位元組推估約需 24GB (算術推論), 超出硬體等級 A 至 D 的能力.

地端單人環境的主要威脅是間接提示注入, 即模型讀取的文件或網頁內夾帶指令. 比護欄更有效的做法是縮小工具權限, 要求人工確認, 並把程式碼執行放進沙箱 (信心: 中). 多人對外服務時, 才值得加 Prompt Guard 2 22M 這類輕量分類器 (22M 參數, 基於 DeBERTa-xsmall, 上下文 512 token; 來源: Hugging Face 模型卡), 且僅當作「多一層」. LLM Guard (Protect AI) 儲存庫已於 2026-07-09 封存 (來源: GitHub 儲存庫), 不建議新導入.

## 參考來源

網路暴露與事故統計:

- [SentinelLABS: Silent Brothers, Ollama Hosts Form Anonymous AI Network Beyond Platform Guardrails (175,108 台)](https://www.sentinelone.com/labs/silent-brothers-ollama-hosts-form-anonymous-ai-network-beyond-platform-guardrails)
- [SC Media: CISA adds n8n RCE flaw to list of known exploited vulnerabilities (24,607 台)](https://www.scworld.com/news/cisa-adds-n8n-rce-flaw-to-list-of-known-exploited-vulnerabilities)
- [BleepingComputer: CISA new Langflow flaw actively exploited (CVE-2026-33017)](https://www.bleepingcomputer.com/news/security/cisa-new-langflow-flaw-actively-exploited-to-hijack-ai-workflows/)
- [BleepingComputer: CISA orders feds to patch actively exploited Langflow RCE flaw (CVE-2026-0770)](https://www.bleepingcomputer.com/news/security/cisa-orders-feds-to-patch-actively-exploited-langflow-rce-flaw/)
- [nginx 文件: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- [Caddy 文件: Automatic HTTPS](https://caddyserver.com/docs/automatic-https)

供應鏈與機密管理:

- [LiteLLM 官方部落格: Security incident Oct 21, 2026](https://docs.litellm.ai/blog/security-incident-oct-21-2026)
- [Hugging Face 文件: Pickle scanning](https://huggingface.co/docs/hub/security-pickle)
- [Docker 文件: docker container run](https://docs.docker.com/reference/cli/docker/container/run/)
- [Docker 文件: None network driver](https://docs.docker.com/engine/network/drivers/none/)
- [Docker 文件: Rootless mode](https://docs.docker.com/engine/security/rootless/)
- [Docker 文件: Use secrets in Compose](https://docs.docker.com/compose/how-tos/use-secrets/)
- [Podman GitHub 儲存庫](https://github.com/containers/podman)
- [gVisor 文件](https://gvisor.dev/docs/)
- [Firecracker GitHub 儲存庫](https://github.com/firecracker-microvm/firecracker)
- [SOPS GitHub 儲存庫](https://github.com/getsops/sops)
- [OpenBao GitHub 儲存庫](https://github.com/openbao/openbao)

OWASP 對照與護欄模型:

- [OWASP GenAI Security Project: OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
- [Imperva: OWASP LLM Top 10 2026, What Changed and Why (二手來源, 條目名稱)](https://www.imperva.com/blog/owasp-llm-top-10-2026-what-changed/)
- [Cloud Security Alliance: The OWASP Top 10 for LLM Applications 2026 (二手來源, 條目名稱)](https://cloudsecurityalliance.org/blog/2026/10/21/the-owasp-top-10-for-llm-applications-2026-what-changed-and-why-it-matters)
- [OWASP GenAI Security Project: Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- [Giskard: OWASP Top 10 for Agentic Applications 2026 (二手來源, ASI 條目名稱)](https://www.giskard.ai/knowledge/owasp-top-10-for-agentic-application-2026)
- [letsdatascience.com: OWASP releases agentic AI security report v2.01 (二手來源)](https://letsdatascience.com/news/owasp-releases-agentic-ai-security-report-v201-b6926a1d)
- [Hackett 等人, Bypassing LLM Guardrails (arXiv 2504.11168)](https://arxiv.org/abs/2504.11168)
- [arXiv 2504.11168 全文 (Emoji Smuggling 結果)](https://arxiv.org/pdf/2504.11168)
- [Meta 文件: Llama Guard 4 模型卡](https://dev.meta.ai/llama/docs/model-cards-and-prompt-formats/llama-guard-4)
- [Hugging Face 模型卡: meta-llama/Llama-Guard-4-12B](https://huggingface.co/meta-llama/Llama-Guard-4-12B)
- [Hugging Face 模型卡: meta-llama/Llama-Prompt-Guard-2-22M](https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-22M)
- [GitHub: protectai/llm-guard (2026-07-09 封存)](https://github.com/protectai/llm-guard)

內部研究紀錄與整理者判斷:

- 「研究 1」「研究 2」為手冊整理前的內部研究紀錄, 非公開來源. 本章中「研究 2」對存取控制工具的分級, 以及「四項措施涵蓋 2026 年已知的主要攻擊途徑」的結論, 屬整理者推論 (信心: 中高), 無公開來源可佐證.
- 沙箱分級 (最低, 中階, 進階), 機密管理的取捨, 「縮小工具權限優於護欄」的判斷, 以及 SSO 的人數門檻 (10 人), 皆為整理者建議 (推論).
