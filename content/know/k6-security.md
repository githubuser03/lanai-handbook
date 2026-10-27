---
description: "地端 AI 最有效的安全措施有四項: 不對網際網路開放, 鎖定版本, 縮小權限, 能還原."
---

# K6 安全基礎與風險控管

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-27
- 待查證: OWASP LLM Top 10 2026 官方 PDF 的版次頁仍寫「發布日期待定」, 發布日以官方網頁標示的 2026-08-03 為準; 「研究 1」「研究 2」為內部研究紀錄, 非公開來源; 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 地端 AI 最有效的安全措施有四項: 不對網際網路開放, 鎖定版本, 縮小權限, 能還原. 這四項成本低, 且能涵蓋 2026 年已知的主要攻擊途徑 (推論, 信心: 中).

::: tip 本章常見名詞
| 詞 | 意思 |
|---|---|
| 127.0.0.1 | 代表「這台電腦自己」的網路位址, 只有本機的程式連得到 |
| 連接埠轉發 (port forwarding) | 在路由器上設定, 讓網際網路上的連線轉進家中或公司內的某台機器 |
| 反向代理 (reverse proxy) | 站在服務前面代收請求的程式, 可加上 HTTPS 與速率限制 |
| SSO | 單一登入, 一組帳號登入多個服務 |
| 容器 (container) 與映像 (image) | 映像是把程式與執行環境打包好的檔案; 容器是由映像啟動, 正在執行的個體 |
| 摘要值 (digest) | 依映像內容計算出的指紋, 內容一改就不同 |
| 沙箱 (sandbox) | 讓程式在隔離環境中執行, 碰不到外面的系統 |
| root | 系統中權限最高的帳號 |
| CVE 與 CISA KEV | CVE 是公開漏洞的編號; KEV 是美國 CISA 維護的「已知遭實際利用的漏洞」清單 |
| 護欄 (guardrail) | 另外檢查輸入或輸出是否有問題的機制, 常是一個小型分類模型 |

完整詞彙見[術語對照](/ref/glossary).
:::

## K6.1 網路暴露與存取控制

服務開在哪裡, 決定了誰連得到. 可以想成住家的門: 服務只綁 127.0.0.1, 等於只有自己房間能用; 只開放內網, 等於家人都能進出; 用連接埠轉發開到網際網路, 則是把大門直接開向街上, 路過的人都能來敲門.

| 使用情境 | 做法 |
|---|---|
| 單人 | 服務只綁 127.0.0.1 |
| 家庭或小團隊 | 只開放內網, 加上介面本身的帳號系統 |
| 需要 HTTPS | 加反向代理: Nginx (內建速率限制, 來源: nginx 文件 `limit_req` 模組) 或 Caddy (預設自動取得並更新憑證, 來源: Caddy 文件 Automatic HTTPS; 設定較簡單屬整理者判斷) |
| 10 人以上, 或已有其他自架服務 | 才考慮 Keycloak 或 Authentik 這類統一登入 (SSO) 的身分服務, 讓多個服務共用同一組公司帳號 |

**不要**用連接埠轉發把服務直接開到網際網路. SentinelLABS (SentinelOne) 與 Censys 在 293 天的掃描中觀察到 130 個國家共 175,108 台暴露的 Ollama 主機 (來源: SentinelLABS 研究報告); 2026 年 n8n 於 Shadowserver 2026-02-05 的統計中仍有 24,607 台易受攻擊 (來源: SC Media); Langflow 也有多個漏洞已列入 CISA KEV (來源: BleepingComputer 報導; 編號與加入日見[架構地圖](/start/map)的參考來源, 處理方式見 [M9](/build/m9-automation)). 這幾件事屬於同一類問題.

本節不寫各工具的版本號; 上表的分級為研究 2 的推論 (信心: 中).

## K6.2 供應鏈: 版本鎖定與映像摘要值

容器映像的標籤 (tag, 例如 `latest` 或 `v1.107.0`) 像門牌, 可以從一棟房子拆下來換到另一棟; 摘要值則像房子本身的指紋, 內容只要改一點就對不上. 用標籤下載, 拿到的是「現在掛這塊門牌的房子」; 用摘要值下載, 拿到的一定是當初檢查過的那一棟.

2026-10-21 的 LiteLLM 事件中, Docker Hub 上的 v1.107.0, latest, main-latest, main-stable 這些標籤都曾指向惡意映像 (來源: LiteLLM 官方事故報告). 浮動標籤因此不能當作安全依據.

實務做法:

1. 容器映像以版本號或摘要值 (digest) 鎖定, 不使用 `latest`.
2. 記錄每個元件的安裝版本與日期 (見 O2).
3. 升級前先讀發行說明, 並跑一次 promptfoo 測試集 (M6). promptfoo 是以固定題目比較模型回答品質的命令列測試工具.
4. 模型權重優先採用 safetensors 格式, 避免載入來源不明的 pickle 檔; pickle 載入時可能執行任意程式碼 (來源: Hugging Face Pickle scanning 文件; 研究 1 亦列為風險).
5. 發現金鑰外洩時, 依「隔離, 重建, 輪替」處理 (整理者歸納的處理順序, 見 O3).

## K6.3 沙箱與機密管理

### 沙箱分級

沙箱可以想成讓外包人員在玻璃隔間裡工作: 外面看得到他在做什麼, 但他碰不到隔間外的東西. 讓模型執行程式碼時, 程式碼可能來自模型讀到的不可信內容, 因此要放進隔間. 隔間的牆越厚, 越難突破, 但進出也越麻煩. 「容器逃逸」指程式突破容器的隔離, 碰到主機本身; 以非 root 使用者執行, 可以降低逃逸後能做的事.

以下分級為依產業慣例的推論 (信心: 中). 表中的工具都位在「容器」與「主機」之間: Docker 與 Podman 是建立和管理容器的工具, rootless 是讓它們不需要 root 權限的執行方式; gVisor 是夾在容器與主機核心之間的隔離層, 取代一般的容器執行環境 (runc), 以 runsc 執行容器. 各工具的版本號見[元件版本與安全公告頁](/ref/versions), 功能描述來源見本章參考來源.

| 層級 | 做法 | 適用 |
|---|---|---|
| 最低 | 一般容器 + 非 root 使用者 (`--user`) + `--network none` + 唯讀根檔案系統 (`--read-only`) + 記憶體與 CPU 上限 (`--memory`, `--cpus`) (來源: Docker 文件 docker run 與 none network driver) | 所有讀者, 成本接近零 |
| 中階 | Podman 或 Docker rootless. Podman 是與 Docker 同類的容器管理工具, 用法接近, README 稱它可由一般使用者執行, 且沒有常駐的管理 daemon (背景服務); Docker 文件稱 rootless 模式讓 daemon 與容器都以非特權使用者執行 | 降低容器逃逸後的權限 |
| 進階 | gVisor (runsc) 提供系統呼叫層隔離: 容器發出的系統呼叫先由 gVisor 在使用者空間實作的核心 (Sentry) 處理, 不直接交給主機核心; 代價是部分系統呼叫尚未實作, 且每次系統呼叫的負擔較高 (來源: gVisor 文件) | 多人環境 |

gVisor 的效能負擔集中在特定工作. 官方效能指南指出: 負擔主要影響大量呼叫系統的應用, 每次呼叫做的事越少, 負擔占比越高; 網路與大量小型檔案操作也有負擔; 純 CPU 運算不受影響, 因為 gVisor 不模擬 CPU 指令, 因此資料處理與機器學習類工作的負擔很小. 指南也建議多數情況使用 Systrap 平台以取得較佳效能 (來源: gVisor Performance Guide). 對本手冊的用途, 沙箱裡跑的是模型產生的短程式, 不是推論本身, 效能負擔通常可以接受 (推論, 信心: 中).

Firecracker 是另一種做法: 不共用主機核心, 而是替每個工作負載開一台微型虛擬機 (microVM); 它使用 Linux KVM 建立 microVM (來源: Firecracker GitHub README). 維運成本高, 不建議手冊讀者使用 (整理者判斷).

**原則**: 只要讓模型執行程式碼, 就必須放進沙箱.

### 機密管理

機密指密碼, API 金鑰, 資料庫帳密這類一旦外流, 別人就能冒用身分的資料. 管理機密的重點有兩個: 平時不讓機密散落在看得到的地方, 外洩時能很快換掉.

- `.env` 檔 (權限 600, 不進版本控制) 足以應付多數讀者 (整理者建議).
- Docker Compose secrets 是下一階: 機密以檔案形式掛載到容器的 `/run/secrets/`, 避免放在環境變數中 (來源: Docker 文件 Compose secrets).
- SOPS 適合用 Git 管理設定的人. 它是放在設定檔與版本控制之間的命令列工具: 把設定檔中的機密欄位加密後再存進 Git, 使用時再解密. README 稱它為加密檔案的編輯器, 支援 YAML, JSON, ENV, INI 與二進位格式, 金鑰可用 age, PGP 或雲端 KMS (來源: SOPS GitHub README; 與 Git 搭配的用法屬整理者建議).
- HashiCorp Vault 與 OpenBao 是獨立運作的機密管理伺服器: 機密集中存在伺服器上, 應用程式需要時再向它索取. 官方文件稱 Vault 是以身分為基礎的機密與加密管理系統, 可動態產生憑證, 並為每個機密設定租期, 到期後撤銷 (來源: HashiCorp Vault 文件 What is Vault, v1.15.x). OpenBao 自述為管理, 儲存與分發機密, 憑證與金鑰的軟體, 授權為 MPL-2.0 (來源: OpenBao GitHub README); 它是 HashiCorp 將 Vault 改為 Business Source License 後, 社群從最後一個開源版本 (1.14 分支) 分出來的專案 (來源: The New Stack 2023-12-15 報導, 二手來源). 兩者都要另外架設, 備份與維運一台伺服器, 對手冊讀者過度 (整理者判斷).

真正重要的是金鑰外洩後能快速輪替. LiteLLM 2026-10 事故報告建議從頭重建映像與環境, 並輪替代理資料庫中的供應商金鑰, master key, 虛擬金鑰與資料庫密碼 (來源: LiteLLM 官方事故報告). 2026-03 事件的官方建議則是把受影響系統上的憑證全部視為已外洩並輪替, 並鎖定已知安全的版本 (來源: LiteLLM 官方部落格 2026-03-24). 「隔離, 重建, 輪替」是整理者綜合兩次建議歸納的處理順序.

## K6.4 基線檢核表與 OWASP 2026 對照

基線檢核表分三組, 隨架構逐層累加, 見[「組裝總覽」](/build/overview).

### OWASP 對照

OWASP (Open Worldwide Application Security Project) 定期整理各類應用的十大風險清單, 業界常用來檢查設計是否漏掉常見風險. 下表把清單中的條目對應到本手冊的做法.

OWASP Top 10 for LLM Applications 2026 於 2026-08-03 發布 (來源: OWASP GenAI Security Project 官方頁面). 下表的條目編號與名稱已用官方頁面提供下載的 PDF 核對: LLM01 提示注入, LLM02 敏感資訊揭露, LLM03 過度代理, LLM04 供應鏈, LLM05 資料與模型投毒, LLM06 無限制資源消耗, LLM07 錯誤資訊, LLM08 隱藏情境暴露, LLM09 向量與嵌入弱點, LLM10 不當輸出處理 (2026-10-27 核對). OWASP Top 10 for Agentic Applications 2026 於 2025-12-09 發布 (來源: OWASP 官方頁面), ASI 條目名稱引自 Giskard 的整理 (二手來源). 另有一份 OWASP GenAI 的《State of Agentic AI Security and Governance》v2.01 於 2026-06-01 發布 (來源: letsdatascience.com 報導, 二手來源); 該文件與 Agentic Top 10 的更新關係待核對.

| 風險 | 本手冊的對應做法 |
|---|---|
| LLM03 過度代理 (Excessive Agency), ASI02 工具誤用 (Tool Misuse and Exploitation), ASI03 身分與權限濫用 (Identity and Privilege Abuse) | 工具權限最小化; 寫入與刪除需人工確認 |
| LLM04 供應鏈, ASI04 代理供應鏈弱點 (Agentic Supply Chain Vulnerabilities) | 鎖定版本與摘要值; 審核 MCP 伺服器 |
| ASI05 非預期的程式碼執行 (Unexpected Code Execution) | 程式碼執行放進沙箱 |
| LLM05 資料與模型投毒, LLM09 向量與嵌入弱點, ASI06 記憶與情境投毒 (Memory & Context Poisoning) | RAG 資料來源只限可信資料夾 |
| LLM08 隱藏情境暴露 (系統提示, 工具定義等不對使用者顯示的內容遭取出) | 系統提示與工具定義中不放金鑰或機密 |
| LLM06 無限制資源消耗 | 速率與 token 上限 |

### 護欄模型的定位

護欄模型是另外執行一個模型, 專門判斷輸入或輸出有沒有問題. 可以想成大樓入口的金屬探測門: 能攔下一部分問題, 但不能取代門禁, 監視器與保全.

分類器護欄不建議當作唯一防線, 理由有兩點:

1. 字元層級手法可繞過偵測. Hackett 等人 (Mindgard 與 Lancaster University, arXiv 2504.11168) 測試 6 套偵測系統, 「Emoji Smuggling」對受測的提示注入與越獄偵測器都達到 100% 攻擊成功率; 該研究測的是第一代 Meta Prompt Guard, 未測 Prompt Guard 2.
2. Llama Guard 4 是 Meta 發布的安全分類模型, 用來判斷對話的輸入或輸出是否屬於不安全類別. 它有 120 億參數, 權重為 BF16 (來源: Meta 模型卡與 Hugging Face 模型卡); 依參數量 x 2 位元組推估 BF16 版約需 24GB (算術推論), 超出硬體等級 A, B, D 與 16GB 的 C; 量化後可降低記憶體需求, 但分類準確度須以自己的題目實測 (推論, 信心: 中).

地端單人環境的主要威脅是間接提示注入, 即模型讀取的文件或網頁內夾帶指令. 比護欄更有效的做法是縮小工具權限, 要求人工確認, 並把程式碼執行放進沙箱 (信心: 中). 多人對外服務時, 才值得加 Prompt Guard 2 22M 這類輕量分類器. Prompt Guard 2 是 Meta 發布, 專門偵測提示注入與越獄企圖的小模型, 放在使用者輸入進入主模型之前 (22M 參數, 基於 DeBERTa-xsmall, 上下文 512 token; 來源: Hugging Face 模型卡), 且僅當作「多一層」. LLM Guard 是 Protect AI 的開源輸入輸出檢查工具組, 儲存庫已於 2026-07-09 封存 (來源: GitHub 儲存庫), 不建議新導入.

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
- [gVisor 文件: Performance Guide (效能負擔來源, Systrap 建議)](https://gvisor.dev/docs/architecture_guide/performance/)
- [Firecracker GitHub 儲存庫](https://github.com/firecracker-microvm/firecracker)
- [SOPS GitHub 儲存庫](https://github.com/getsops/sops)
- [OpenBao GitHub 儲存庫](https://github.com/openbao/openbao)
- [HashiCorp Vault 文件: What is Vault (v1.15.x)](https://developer.hashicorp.com/vault/docs/v1.15.x/what-is-vault)
- [The New Stack: Meet OpenBao, an open source fork of HashiCorp Vault (2023-12-15, 二手來源)](https://thenewstack.io/meet-openbao-an-open-source-fork-of-hashicorp-vault/)
- [LiteLLM 官方部落格: Security Update, Suspected Supply Chain Incident (2026-03-24)](https://docs.litellm.ai/blog/security-update-march-2026)

OWASP 對照與護欄模型:

- [OWASP GenAI Security Project: OWASP GenAI LLM Top 10 2026 (發布日)](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
- [OWASP GenAI LLM Top 10 2026 官方 PDF (條目編號與名稱)](https://genai.owasp.org/download/56857/?tmstv=1785822482)
- [Imperva: OWASP LLM Top 10 2026, What Changed and Why (二手來源, 改版說明)](https://www.imperva.com/blog/owasp-llm-top-10-2026-what-changed/)
- [Cloud Security Alliance: The OWASP Top 10 for LLM Applications 2026 (二手來源, 改版說明)](https://cloudsecurityalliance.org/blog/2026/10/21/the-owasp-top-10-for-llm-applications-2026-what-changed-and-why-it-matters)
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

- 「研究 1」「研究 2」為手冊整理前的內部研究紀錄, 非公開來源. 本章中「研究 2」對存取控制工具的分級, 以及「四項措施涵蓋 2026 年已知的主要攻擊途徑」的結論, 屬整理者推論 (信心: 中), 無公開來源可佐證.
- 文中的類比 (住家的門, 門牌與指紋, 玻璃隔間, 金屬探測門): 整理者所寫, 無外部來源, 不應當作技術定義引用.
- 沙箱分級 (最低, 中階, 進階), 機密管理的取捨, 「縮小工具權限優於護欄」的判斷, 以及 SSO 的人數門檻 (10 人), 皆為整理者建議 (推論).
