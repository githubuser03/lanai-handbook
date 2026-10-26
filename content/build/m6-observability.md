# M6 可觀測, 稽核與評估

::: info 本章屬性
- 等級: ● 必要 (測試集); ○ 依情境 (追蹤平台)
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: promptfoo 實際設定語法與收購案完成日期; OpenTelemetry GenAI 語意規範的最新狀態; M6.4 與 M6.5 節的 Langfuse, OTel Collector, Prometheus 設定與指令未實機驗證; Langfuse 開源版的組織層級角色範圍, 以及 OTLP 端點是否接收指標與日誌, 官方文件未寫明; llama-server `/metrics` 是否受 `--api-key` 保護未確認; Open WebUI OTel 軌跡的欄位內容未確認; OPA 政策判定紀錄的送出方式待 M8 定案
:::

**結論**: 初階讀者不需要追蹤平台, 需要的是一份 30 至 100 題的固定測試集. 每次換模型, 換提示或升級元件時跑一次, 就能回答「變好還是變壞」(信心: 高). 多人共用之後, 再加上可觀測與稽核平台, 記錄誰在什麼時候讓 AI 做了什麼.

**這一塊在圖上的位置**: VM 稽核區的 Langfuse, OTel Collector, Prometheus, 以及既有 SIEM. **前置模組**: M5. **完成後的狀態**: 每次換模型或升級都能用測試集比較結果; 每次模型與工具呼叫都留下紀錄.

## M6.1 30 至 100 題測試集的設計

最少需要三件事:

1. 一份固定測試集, 每題含「問題」與「期望答案或關鍵字」.
2. 保留介面的對話紀錄.
3. 記錄每次變更的版本 (見 O2).

測試集的組成建議:

| 類型 | 題數 | 用途 |
|---|---|---|
| 日常任務題 | 10 至 30 | 確認基本功能沒有退步 |
| 檢索問答題 | 50 (M4.3 節) | 確認檢索命中率 |
| 工具呼叫題 | 10 至 20 | 確認函式呼叫格式正確 (K5) |
| 邊界與安全題 | 5 至 10 | 確認拒答與權限邊界 |

T2 微調後的驗證, 沿用同一份測試集.

## M6.2 promptfoo 實作

promptfoo 是命令列工具, 不需要常駐服務, 採 MIT 授權. OpenAI 於 2026-03-09 宣布收購, 官方聲明 "remains open source under MIT" (來源: 研究 2 引用之官方聲明). 收購案的完成日期未能確認; 長期所有權變動屬鎖定風險, 須持續追蹤 (信心: 中).

設定檔語法會隨版本變動, 本章不放未經核對的範例, 實作步驟待依官方文件逐步驗證後補上.

## M6.3 追蹤平台何時值得裝

| 工具 | 授權 / 狀態 | 自架資源 |
|---|---|---|
| Langfuse | MIT; ClickHouse 公司於 2026-01-16 收購, 授權維持不變 (coverge.ai) | v3 起強制需要 ClickHouse, Redis, PostgreSQL, S3 / MinIO, 共 6 個服務; 官方最低需求為 ClickHouse 2 CPU / 8GiB, Redis 1 CPU / 1.5GiB (Langfuse 官方擴充文件) |
| Arize Phoenix | Elastic License 2.0 (非 OSI); Dynatrace 於 2026-10 初完成收購 Arize | 比 Langfuse 輕 (訓練資料內資訊, 可能已過時) |
| Ragas | Apache 2.0; 0.4.3 (2026-01-13) | 函式庫 |
| DeepEval | Apache 2.0; 4.3.1 (2026-10-16) | 函式庫 |

Langfuse 光 ClickHouse 最低就要 8GiB, 會與模型搶記憶體, 因此對硬體等級 A 至 D 不划算 (信心: 高, 依官方最低需求推論). 多人環境且有專人維運時, 才值得評估.

## M6.4 可觀測與稽核平台

三個元件分工不同: Langfuse 存放每次模型呼叫的軌跡 (提示, 回應, token 數, 延遲, 代理每一步), OpenTelemetry Collector 負責收集紀錄並分送到 Langfuse 與既有 SIEM, Prometheus 與 Grafana 處理服務指標與警示. 本節設定依官方文件整理, 未實機驗證.

```
[LiteLLM / Open WebUI / 代理服務]
      | OTLP (gRPC 或 HTTP)
      v
[OTel Collector (稽核區)] --OTLP/HTTP 軌跡--> [Langfuse]
      |
      +--OTLP/HTTP 軌跡與日誌--> [既有 SIEM]

[Prometheus (稽核區)] --抓取 /metrics--> [vLLM, llama-server, LiteLLM]
      |
      v
[Alertmanager] --> 電子郵件或 webhook --> 維運人員
[Grafana] --查詢--> [Prometheus]
```

### Langfuse 自架要點

**需要的服務**: Langfuse 官方架構包含六個元件: Langfuse Web (介面與 API), Langfuse Worker (非同步處理事件), PostgreSQL (交易資料), ClickHouse (存放軌跡, observation 與評分), Redis 或 Valkey (佇列與快取), S3 相容的物件儲存 (保存所有進來的事件與大型匯出) (來源: Langfuse 文件 Self-hosting). 各元件的最低資源見 M6.3 節.

**部署方式**: 官方把 Docker Compose 定位為本機使用與測試, 標示為單一 VM, 沒有高可用, 擴充與備份; 正式環境的選項為 Kubernetes (Helm) 與各雲端平台 (來源: 同上). 依官方 Docker Compose 文件, 步驟為 `git clone https://github.com/langfuse/langfuse.git`, 進入目錄後修改所有標示 `# CHANGEME` 的機密值, 再執行 `docker compose up`. 介面在 3000 連接埠; worker (3030), MinIO 主控台 (9091) 與資料庫只綁 127.0.0.1 (來源: Langfuse 文件 Docker Compose). 本手冊的稽核區若採 Docker Compose, 須自行排程備份 PostgreSQL, ClickHouse 與 MinIO 的資料卷 (見 O1) (推論, 信心: 中).

**OTLP 端點**: Langfuse 在 `/api/public/otel` 接收軌跡, 只支援 OTLP over HTTP (JSON 與 protobuf), 不支援 gRPC. 驗證方式為 HTTP Basic, 值是「public key:secret key」的 base64 編碼. 這個端點從 Langfuse v3.22.0 開始提供, 自架版本至少要 v3.22.0 (來源: Langfuse 文件 OpenTelemetry). 官方文件只描述接收軌跡, 沒有說明是否接收指標與日誌, 因此本手冊只把軌跡送進 Langfuse.

**存取權限**: Langfuse 存放完整的提示與回應, 敏感程度等同對話資料庫 (推論, 信心: 高). 建議如下:

- 以 `AUTH_DISABLE_SIGNUP=true` 關閉自行註冊, 並以 Keycloak 單一登入 (見 M5.4 節).
- 角色分為 Owner, Admin, Member, Viewer, None. 官方文件標示, 自架環境的專案層級角色屬於企業版 (Enterprise Edition) (來源: Langfuse 文件 RBAC). 只用開源版時, 權限只能以組織層級控管, 應只把需要看軌跡的人加入組織 (推論, 信心: 中).
- 3000 連接埠只對管理者網段開放, 不對一般使用者網段開放.

**資料保存期限**: Langfuse 的資料保存設定以專案為單位, 最少 3 天; 但官方標示自架環境的這項功能屬於企業版, 沒有設定時資料會無限期保存 (來源: Langfuse 文件 Data Retention). 只用開源版時, 可改以介面或 API 刪除軌跡 (`DELETE /api/public/traces/{traceId}` 刪除單筆, `DELETE /api/public/traces` 批次刪除) (來源: Langfuse 文件 Data Deletion), 再以排程定期執行 (推論, 信心: 中). 保存天數由公司資料保存政策決定, 本手冊不提供建議值.

**是否記錄完整提示**: LiteLLM 的 OpenTelemetry 整合文件說明, 除非明確開啟, 否則不會擷取提示與回應內容 (來源: LiteLLM 文件 OpenTelemetry v2). 是否開啟, 應與保存期限與存取權限一起決定 (推論).

### OpenTelemetry Collector

**基本觀念** (來源: OpenTelemetry 文件 Collector configuration):

- receivers 從一個或多個來源收集遙測資料; processors 在送出前轉換資料; exporters 把資料送到一個或多個後端.
- 元件寫在設定檔中不會自動生效, 必須列在 `service.pipelines` 中才會啟用.
- 同一類型的元件可以定義多個, 以「類型/名稱」區分 (例如 `otlp_http/langfuse` 與 `otlp_http/siem`).
- 設定檔支援 `${env:VAR}` 讀取環境變數, 機密值可以不寫在檔案中.
- 官方建議所有客戶端都在本機時, 端點綁 `localhost`; Collector 的預設值也是 `localhost`.

**otlp_http exporter**: 官方 README 指出, 這個 exporter 已由 `otlphttp` 改名為 `otlp_http`, 舊名稱暫時保留為別名, 未來會移除 (來源: GitHub opentelemetry-collector, OTLP HTTP Exporter README). 依 Collector 變更紀錄, 改名發生在 v0.144.0; 使用更早版本時, 設定中要寫 `otlphttp` (來源: opentelemetry-collector CHANGELOG). `endpoint` 是基底網址, 送軌跡時會自動加上 `/v1/traces`; 也可用 `traces_endpoint` 直接指定完整網址. 預設編碼為 protobuf, 預設啟用 gzip 壓縮 (來源: 同上 README). 自訂標頭使用 HTTP 客戶端共用設定的 `headers` 欄位 (來源: confighttp README).

**最小設定範例** (依 OpenTelemetry Collector 文件與 Langfuse 的 Collector 範例整理, 未實機驗證):

```yaml
# otelcol.yaml (未實機驗證)
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 10.0.60.10:4317   # 稽核區 Collector 的位址, 以防火牆限制來源
      http:
        endpoint: 10.0.60.10:4318

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 1500
    spike_limit_mib: 300
  batch: {}

exporters:
  otlp_http/langfuse:
    # 自動加上 /v1/traces, 即 /api/public/otel/v1/traces
    endpoint: http://langfuse-web:3000/api/public/otel
    headers:
      Authorization: "Basic ${env:LANGFUSE_AUTH}"   # base64(public key:secret key)
      x-langfuse-ingestion-version: "4"            # Langfuse 官方範例所列
  otlp_http/siem:
    endpoint: https://siem.example.internal:4318   # 既有 SIEM 的 OTLP/HTTP 接收端
    headers:
      Authorization: "Bearer ${env:SIEM_TOKEN}"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp_http/langfuse, otlp_http/siem]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp_http/siem]
```

說明:

- `memory_limiter` 的 `limit_mib` 為硬上限, `spike_limit_mib` 官方建議約為 `limit_mib` 的 20%, `check_interval` 建議 1 秒 (來源: Memory Limiter Processor README). 數值請依 VM 記憶體調整.
- receiver 同時開 gRPC 與 HTTP. 來源送 gRPC 時, 由 Collector 轉為 OTLP/HTTP 再送 Langfuse, 這樣可以避開 Langfuse 不收 gRPC 的限制 (推論, 信心: 中高).
- 既有 SIEM 不接收 OTLP 時, contrib 發行版另有 syslog, Splunk HEC, Elasticsearch 等 exporter, 其中 syslog exporter 只支援日誌且仍為 alpha (來源: GitHub opentelemetry-collector-contrib). 選用前請確認 SIEM 端的接收格式.

**送進 Collector 的來源**:

- **LiteLLM**: 以環境變數 `LITELLM_OTEL_V2=true`, `OTEL_EXPORTER="otlp_http"`, `OTEL_ENDPOINT="http://<Collector>:4318"` 開啟 (來源: LiteLLM 文件 OpenTelemetry v2). LiteLLM 也有直接送 Langfuse 的 `langfuse_otel` callback, 但經 Collector 才能同一份資料同時送 SIEM (推論).
- **Open WebUI**: `ENABLE_OTEL` 與 `ENABLE_OTEL_TRACES` 預設為 `False`; `OTEL_EXPORTER_OTLP_ENDPOINT` 預設為 `http://localhost:4317` (來源: Open WebUI 文件 Environment Variable Configuration). 改指向 Collector 即可. Open WebUI 送出的軌跡包含哪些欄位, 本輪未確認.
- **政策判定 (OPA)**: 由 M8 的代理服務送出; 格式與送出方式待 M8 定案.

### Prometheus 與 Grafana

**各推論引擎的指標來源**:

| 元件 | 指標端點 | 重點指標 | 注意事項 |
|---|---|---|---|
| vLLM | OpenAI 相容 API 伺服器的 `/metrics` (來源: vLLM 文件 Production Metrics) | `vllm:num_requests_running`, `vllm:num_requests_waiting`, `vllm:kv_cache_usage_perc` (gauge); `vllm:time_to_first_token_seconds`, `vllm:e2e_request_latency_seconds` (histogram) | vLLM 安全文件把 `/metrics` 列為即使設定 `--api-key` 也不需金鑰的端點 (來源: vLLM 文件 Security) |
| llama-server | 啟動時加 `--metrics` (環境變數 `LLAMA_ARG_ENDPOINT_METRICS`) 才有 `/metrics`, 預設關閉 (來源: llama.cpp server README) | `llamacpp:requests_processing`, `llamacpp:requests_deferred`, `llamacpp:predicted_tokens_seconds`, `llamacpp:tokens_predicted_total` | `/metrics` 是否檢查 `--api-key`, 本輪未確認 |
| Ollama | 官方 API 文件沒有列出指標端點 (來源: Ollama API 文件) | 回應中帶 `eval_count`, `eval_duration`, `total_duration` 等欄位 | 改在閘道層蒐集 |
| LiteLLM (閘道層) | 在 `litellm_settings` 加 `callbacks: ["prometheus"]` 後, 提供 `/metrics` (來源: LiteLLM 文件 Prometheus metrics) | `litellm_request_total_latency_metric` (histogram), `litellm_proxy_total_requests_metric` | 自 v1.85.0 起 `/metrics` 預設需要 LiteLLM API 金鑰 (同上) |

**網路例外**: 推論區原則上只接受閘道區連線. Prometheus 要抓取 vLLM 指標時, `/metrics` 與推論端點共用同一個連接埠, 而且有多個不需金鑰的端點 (見 M5.5 節), 因此只對 Prometheus 主機的單一 IP 開放這個連接埠, 並記錄這條例外 (推論, 信心: 中).

**prometheus.yml 範例** (依 Prometheus 設定文件的欄位整理, 未實機驗證):

```yaml
global:
  scrape_interval: 15s

rule_files:
  - /etc/prometheus/rules/*.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

scrape_configs:
  - job_name: vllm
    static_configs:
      - targets: ["<推論區主機>:<vLLM 連接埠>"]
  - job_name: litellm
    authorization:
      credentials_file: /etc/prometheus/litellm.key   # LiteLLM API 金鑰, 權限 600
    static_configs:
      - targets: ["<閘道區主機>:4000"]
```

`metrics_path` 預設為 `/metrics`, `authorization` 的 `type` 預設為 Bearer (來源: Prometheus 文件 Configuration). Alertmanager 的 9093 連接埠取自其官方 README 的範例.

**警示規則一例**: vLLM 第 95 百分位端到端延遲連續 10 分鐘超過 30 秒時發出警示. 門檻 30 秒為示意值, 請以自己環境的平常值為基準設定 (推論).

```yaml
# /etc/prometheus/rules/llm.yml (未實機驗證)
groups:
  - name: llm-serving
    rules:
      - alert: VllmHighE2ELatency
        expr: histogram_quantile(0.95, sum by (le) (rate(vllm:e2e_request_latency_seconds_bucket[5m]))) > 30
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "vLLM 第 95 百分位端到端延遲超過 30 秒"
      - alert: VllmQueueBacklog
        expr: vllm:num_requests_waiting > 10
        for: 5m
        labels:
          severity: warn
        annotations:
          summary: "vLLM 排隊請求持續超過 10 個"
```

規則格式依 Prometheus 官方的 alerting rules 範例 (groups, alert, expr, for, labels, annotations). 修改後先以 `promtool check rules <檔案>` 檢查語法, 再對 Prometheus 行程送出 `SIGHUP` 重新載入; 只有全部規則檔格式正確時才會套用 (來源: Prometheus 文件 Recording rules). Prometheus 本身不發通知, 由 Alertmanager 依 `receivers` 設定送出, 可用的整合包括 `email_configs` 與 `webhook_configs` 等; Alertmanager 設定檔可用 `amtool check-config` 檢查 (來源: Prometheus 文件 Alerting rules, Alertmanager configuration).

**Grafana**: 以 Prometheus 為資料來源建立儀表板 (來源: Grafana 文件 Prometheus data source). 建議至少放四張圖: 執行中與排隊中的請求數, 第一個 token 的延遲, 端到端延遲, 每秒生成 token 數 (推論, 信心: 中).

## M6.5 驗收測試

以下步驟依各官方文件整理, 未實機驗證.

**1. 一次對話能在 Langfuse 看到完整軌跡**

1. 在 Open WebUI (經 LiteLLM) 送出一則訊息, 記下送出時間.
2. 登入 Langfuse, 開啟 Traces 清單, 找到該時間的軌跡.
3. 確認軌跡包含模型名稱, 輸入與輸出 token 數與延遲; 若有開啟內容擷取, 確認提示與回應內容正確.
4. 看不到軌跡時, 先查 Collector 日誌是否有送出錯誤. Langfuse 官方文件建議, 遇到 4xx 錯誤時先升級到最新版本 (來源: Langfuse 文件 OpenTelemetry).

**2. 閘道與政策判定的紀錄能在 SIEM 查到**

1. 以第 1 步同一則對話的時間或軌跡 ID, 在 SIEM 搜尋閘道的紀錄.
2. 確認紀錄至少能回答: 哪把金鑰 (或哪位使用者), 在什麼時間, 呼叫哪個模型, 結果是成功或失敗 (推論, 信心: 中).
3. 有 M8 代理服務時, 觸發一次政策會拒絕的動作, 確認 SIEM 查得到該筆政策判定.

**3. 延遲超過門檻時, 警示能送達維運人員**

1. 複製一份警示規則到測試檔, 把門檻暫時調低 (例如端到端延遲大於 0.1 秒), 並把 `for` 改短.
2. 以 `promtool check rules` 檢查語法, 送出 `SIGHUP` 重新載入.
3. 送出幾則對話, 讓延遲超過測試門檻.
4. 在 Prometheus 介面的 Alerts 頁面確認警示進入 firing 狀態.
5. 確認維運人員實際收到電子郵件或 webhook 通知, 並記錄從觸發到收到的時間.
6. 刪除測試規則並重新載入, 確認警示解除.

**4. 存取權限與保存期限符合規劃**

1. 以一般使用者網段的裝置連 Langfuse 的 3000 連接埠, 預期連不上.
2. 以非管理者帳號登入 Langfuse, 確認看不到不屬於自己的組織或專案.
3. 確認刪除舊軌跡的排程 (或企業版的保存設定) 已執行, 並保留執行紀錄.

## 參考來源

- [Langfuse 文件: Self-hosting](https://langfuse.com/self-hosting)
- [Langfuse 文件: Docker Compose](https://langfuse.com/self-hosting/deployment/docker-compose)
- [Langfuse 文件: OpenTelemetry](https://langfuse.com/docs/opentelemetry/introduction)
- [Langfuse 文件: RBAC](https://langfuse.com/docs/administration/rbac)
- [Langfuse 文件: Data Retention](https://langfuse.com/docs/administration/data-retention)
- [Langfuse 文件: Data Deletion](https://langfuse.com/docs/administration/data-deletion)
- [OpenTelemetry 文件: Collector configuration](https://opentelemetry.io/docs/collector/configuration/)
- [GitHub opentelemetry-collector: OTLP HTTP Exporter README](https://github.com/open-telemetry/opentelemetry-collector/blob/main/exporter/otlphttpexporter/README.md)
- [GitHub opentelemetry-collector: OTLP Receiver README](https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/otlpreceiver/README.md)
- [GitHub opentelemetry-collector: Memory Limiter Processor README](https://github.com/open-telemetry/opentelemetry-collector/blob/main/processor/memorylimiterprocessor/README.md)
- [GitHub opentelemetry-collector: confighttp README](https://github.com/open-telemetry/opentelemetry-collector/blob/main/config/confighttp/README.md)
- [GitHub opentelemetry-collector: CHANGELOG](https://github.com/open-telemetry/opentelemetry-collector/blob/main/CHANGELOG.md)
- [GitHub opentelemetry-collector-contrib: Syslog Exporter README](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/syslogexporter/README.md)
- [LiteLLM 文件: OpenTelemetry v2](https://docs.litellm.ai/docs/observability/opentelemetry_v2)
- [LiteLLM 文件: Prometheus metrics](https://docs.litellm.ai/docs/proxy/prometheus)
- [Open WebUI 文件: Environment Variable Configuration](https://docs.openwebui.com/reference/env-configuration)
- [vLLM 文件: Production Metrics](https://docs.vllm.ai/en/latest/usage/metrics/)
- [vLLM 文件: Security](https://docs.vllm.ai/en/latest/usage/security/)
- [llama.cpp server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [Ollama API 文件](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Prometheus 文件: Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Prometheus 文件: Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [Prometheus 文件: Recording rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)
- [Prometheus 文件: Alertmanager configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [Alertmanager README](https://github.com/prometheus/alertmanager/blob/main/README.md)
- [Grafana 文件: Prometheus data source](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
