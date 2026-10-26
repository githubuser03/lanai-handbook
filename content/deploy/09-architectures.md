# 第 9 章 三種參考架構

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 記憶體與磁碟占用為研究 2 的推論值, 實機驗證前請視為推估值; 9.3 圖中 Keycloak, OPA, ToolHive, gVisor, ModelScan 的設定未實機驗證
:::

**結論**: 依人數與需求分三種組合, 由小到大逐步加層. 單人單機用最小組合; 2 至 10 人且需要檢索, 用標準組合; 多人, 多模型且有人每週維運 (並符合第 10.1 節條件), 才採進階組合.

| 組合 | 適用 | 建議硬體等級 | 額外占用 (推論) |
|---|---|---|---|
| 最小安全組合 | 單人, 單機 | A 至 F | 介面約 0.5 至 1.5GB 記憶體; 磁碟約 2 至 5GB (不含模型) |
| 標準組合 | 家庭或小團隊 2 至 10 人, 含檢索與基本評估 | B, D, E; C 級須為中高記憶體款 | 嵌入模型約 0.6 至 1.2GB; 向量庫約 1 至 2GB; 磁碟約 10 至 30GB |
| 進階組合 | 多人, 多模型, 含閘道, 代理與沙箱 | F | 閘道加 PostgreSQL 約 1 至 2GB; 磁碟約 50 至 100GB |

資料來源: 研究 2 (2026-10-26), 占用值由各元件公開資料加總推算, 信心: 中.

## 9.1 最小安全組合 (單人, 單機)

**元件**: 推論引擎 (llama.cpp 或 Ollama), 加上一個介面. 等級 A 與 C 建議用 AnythingLLM 桌面版, 其他等級用 Open WebUI 單一容器. 不加閘道, 代理框架與 MCP.

**啟動順序**: 推論引擎 → 介面.

```
[瀏覽器 / 桌面 App]
      | http://127.0.0.1:3000
      v
[Open WebUI 或 AnythingLLM] ----> [Ollama / llama-server]
      |
   (本機資料卷: 對話, 設定) --> 每週備份
   對外: 無開放連接埠
```

### 9.1.1 用 Docker 執行介面時的連接埠與位址

用容器跑介面時, 有兩件事容易做錯 (指令未實機驗證, 依下列官方文件整理):

1. **發布連接埠時要指定 127.0.0.1.** Docker 官方文件指出, `-p 8080:80` 會綁定在主機的任一位址, 要限制只有主機本身能存取, 須寫成 `-p 127.0.0.1:8080:80` (來源: Docker 文件 Port publishing and mapping). 此外, Docker 官方文件說明 Docker 與 ufw 的防火牆規則運作方式不相容, 已發布的連接埠可能不受 ufw 規則限制 (來源: Docker 文件 Packet filtering and firewalls). 因此「用 ufw 擋住」不能當作唯一防線, 發布時就要綁定 127.0.0.1.
2. **容器內的 127.0.0.1 指的是容器自己.** 要從容器連到主機上的 Ollama, Open WebUI 官方文件建議使用 `host.docker.internal`, 並在 Linux 加上 `--add-host=host.docker.internal:host-gateway` (來源: Open WebUI 文件 Quick Start).

範例 (以 Open WebUI 官方 Quick Start 的指令為基礎, 僅把發布位址改為 127.0.0.1, 並固定版本標籤):

```bash
docker run -d -p 127.0.0.1:3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  -e WEBUI_SECRET_KEY="$(openssl rand -hex 32)" \
  --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:<固定版本標籤>
```

`WEBUI_SECRET_KEY` 請存入 `.env` 並沿用, 否則重建容器後所有人須重新登入 (來源: Open WebUI Quick Start). 官方範例使用浮動的 `:main` 標籤, 本手冊建議改用固定版本 (見第 19 章).

**尚待實機驗證的取捨 (推論, 信心: 中高)**: Ollama 預設只綁 127.0.0.1:11434 (來源: Ollama FAQ). 在 Linux 上, 容器經 `host-gateway` 連主機時, 流量不是從主機的 127.0.0.1 進入, 因此預設設定下可能連不到. 常見解法有三種, 各有取捨:

| 做法 | 作法 | 風險 |
|---|---|---|
| 讓 Ollama 也跑在容器, 與介面共用 Docker 網路 | 不發布 Ollama 的連接埠 | 最單純; 需設定 GPU 直通 (依 Ollama 與 Docker 官方文件) |
| 把 `OLLAMA_HOST` 改為 `0.0.0.0:11434` | 以 systemd 設定 (見第 8 章) | 區域網路內其他裝置也連得到 11434, 須搭配主機防火牆 |
| 介面容器改用主機網路 (`--network=host`) | 不經 Docker NAT | 容器與主機共用網路, 隔離變弱 |

建議優先採用第一種. 若採第二種, 請確認防火牆規則在 Docker 之外也有效, 並以另一台裝置實際掃描 11434 連接埠.

**安全基線檢核表**

- [ ] 所有服務只綁 127.0.0.1
- [ ] 映像或安裝版本已記錄並鎖定
- [ ] 介面已設管理者密碼, 並關閉公開註冊
- [ ] 每週備份資料卷
- [ ] 每週檢查一次安全公告, 每月評估一次是否升級 (見第 19, 20 章)
- [ ] 不在介面中存放雲端 API 金鑰, 或只放低額度金鑰

## 9.2 標準組合 (家庭或小團隊)

**元件**:

- 推論引擎, 搭配 llama-swap (需要多模型輪替時)
- 介面: Open WebUI 或 LibreChat
- 嵌入模型: Qwen3-Embedding-0.6B 或 bge-m3
- 向量庫: 介面內建的, 或 Qdrant
- 文件解析: Docling
- 評估: promptfoo 測試集 (第 14 章)
- 網路: 只限內網 (辦公室或機房的區域網路)

**啟動順序**: 推論引擎 / llama-swap → 向量庫 → 介面 → (排程) 文件解析與匯入 → promptfoo 驗證.

```
[家人 / 同事裝置] --內網 HTTPS--> [主機 192.168.x.y]
                                              |
                     +------------------------+-----------------+
                     v                        v                 v
               [Open WebUI / LibreChat]  [Qdrant :6333]    [Docling 批次]
                     |  (內部 Docker 網路, 不對外)
                     v
               [llama-swap :8080] --> [llama-server: 對話模型 / 嵌入模型]
   公網: 無連接埠轉發
```

**在最小組合的檢核表之上, 另加**:

- [ ] 以主機防火牆限定可連入的內網網段
- [ ] 每位使用者使用個別帳號
- [ ] RAG 文件來源只限可信資料夾 (對應 OWASP LLM08 與 ASI06, 見第 11.4 節)
- [ ] 升級前先跑 promptfoo 測試集
- [ ] `.env` 權限設為 600

## 9.3 進階組合 (多人, 多模型) ◇

**使用條件**: 有人能每週維運, 且符合第 10.1 節列出的閘道條件. 若不符, 請回到 9.2.

**元件**: 標準組合全部, 加上:

- 推論伺服器: vLLM (多人同時使用時, 吞吐量明顯高於 llama.cpp 與 Ollama)
- 閘道: LiteLLM 或 Bifrost 擇一, 以映像摘要值 (digest) 鎖定版本
- 反向代理: Nginx 或 Caddy, 只接受內網連線
- 身分驗證 (可選): Keycloak, 以 OIDC 提供單一登入
- 代理: LangGraph 程式庫, 嵌入自己撰寫的服務; 搭配 OPA 政策引擎
- 隔離模型: 自建程式加本地模型, 專門讀取不可信內容, 不給任何工具
- 工具閘道: MCP gateway (ToolHive 等), 加上少量已審核, 已容器化的 MCP 伺服器
- 程式碼沙箱: Docker 加 gVisor
- 模型入庫檢查 (ModelScan 等) 與 NFS 唯讀的模型存放區
- 可選: n8n (規則固定的流程自動化), Langfuse (另備至少 12GB 記憶體給 ClickHouse 與 Redis 等), OTel Collector, Prometheus 與 Grafana, Prompt Guard 2 22M

**啟動順序**: PostgreSQL / Redis → 推論伺服器 / llama-swap → 閘道 → 向量庫 → OPA → MCP gateway 與 MCP 伺服器 (容器) → 代理服務 → n8n → Keycloak → 介面 → 反向代理 → 可觀測性.

![圖 9-1 進階組合的完整部署架構](/images/architecture.svg)

圖 9-1 與 README 的架構圖相同. 珊瑚色元件接觸不可信內容, 紫色是可信控制區, 米色是基礎設施; 粗框是實體主機, 細框是 VM, 點線框是設備. 方塊上方是要安裝的軟體, 下方是角色.

**部署分區**: 以 Proxmox VE 的 VM 劃分信任區, 接觸不可信內容的元件一律放 VM, 不放 LXC 容器 (LXC 與主機共用核心, 隔離較弱; 推論, 信心: 中).

| VM 區 | 放什麼 | 網路限制 |
|---|---|---|
| 入口區 | 反向代理, 介面, Keycloak, Docling, Qdrant | 只接受內網使用者連線 |
| 控制區 | LangGraph, OPA | 只能連閘道區與隔離區 |
| 隔離區 | 隔離模型 | 只能連 LiteLLM, 不持有任何工具憑證 |
| 閘道區 | LiteLLM, MCP gateway | 唯一保存 API 金鑰, 唯一能對外連線的區 |
| 工具區 | MCP 伺服器, 程式碼沙箱 | 沙箱無網路; MCP 伺服器只能連指定系統 |
| 推論區 | vLLM (GPU 直通) | 只接受閘道區連線 |
| 稽核區 | Langfuse, OTel Collector, Prometheus | 只接收紀錄, 轉送既有 SIEM |
| 自動化區 | n8n | 只能連閘道區 (LiteLLM, MCP gateway) |

資料來源: 分區方式整理自 2026-10 的藍隊代理架構模擬與研究 2, 屬推論, 信心: 中. 實際部署前請以自己的網段與防火牆規則驗證.

**在前兩組的檢核表之上, 另加**:

- [ ] 閘道與 MCP 映像以摘要值鎖定, 並訂閱 GitHub Security Advisories
- [ ] 閘道管理端點只限管理者 IP
- [ ] 每位使用者或每個應用各一把虛擬金鑰, 並設用量上限
- [ ] 代理的寫入與刪除動作需要人工確認
- [ ] 沙箱無網路, 並有資源上限
- [ ] MCP 工具描述變更時重新審核
- [ ] 金鑰輪替流程已準備, 並演練過一次
- [ ] 推論伺服器只接受閘道連線
- [ ] 模型檔入庫前掃描並記錄雜湊值, 推論伺服器以唯讀方式掛載
- [ ] n8n 不保存外部系統金鑰, 工具一律經 MCP gateway 呼叫

## 9.4 硬體等級對應

| 等級 | 建議架構 | 備註 |
|---|---|---|
| A 無獨顯筆電 | 最小組合 (AnythingLLM 桌面版) | RAG 只用小型嵌入模型; 不跑代理 |
| B 8 至 12GB 顯示卡 | 最小組合, 或精簡標準組合 | 嵌入模型放 CPU, 保留顯示記憶體 |
| C Apple Silicon | 16GB 用最小組合; 32GB 以上可用標準組合 | 依統一記憶體決定 |
| D 16GB 顯示卡 | 標準組合 | llama-swap 輪替對話與嵌入模型 |
| E | 標準組合; 小團隊可加 LangGraph | 使用 Langfuse 須確認系統記憶體 32GB 以上 |
| F | 進階組合 | 有人能每週維運時才採用 |

資料來源: 研究 2 第 12.4 節, 屬推論, 信心: 中.
