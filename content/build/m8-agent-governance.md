# M8 代理與治理

::: info 本章屬性
- 等級: ◇ 進階
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-26
- 待查證: Rego 政策, 測試與 LangGraph 程式片段依官方文件撰寫, 未實機執行; 隔離模型的結構檢查, 斷路器, kill switch 與 A2 雙模型審查為整理者的設計建議 (推論); M8.4 節的模擬結果為內部研究紀錄, 模型判斷與分析師行為為腳本模擬; M8.1 節「LangGraph Platform 改名」的說法未查到官方原文; M8.5 節的每代理白名單政策, 共用配額與信任邊界為設計建議, 未實機驗證, `Send` 與 `max_concurrency` 僅有社群討論串為據, `max_parallel_requests` 在 `/key/generate` 的欄位名稱待實機確認; 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 代理讓模型自己決定下一步要呼叫哪個工具, 所以每個動作都要在模型之外再檢查一次. 本手冊的做法是: LangGraph 負責流程控制, OPA 負責政策判定, 讀取不可信內容的工作交給沒有工具的隔離模型. 需要多個代理同時執行或協作時, 見 M8.5 節.

**這一塊在圖上的位置**: VM 控制區 (LangGraph, OPA) 與 VM 隔離區 (自建程式 + 本地模型). **前置模組**: M7. **完成後的狀態**: 代理能處理多步驟任務, 寫入與刪除需要人工核准, 異常時自動切斷.

一般對話是一問一答; 代理則是給模型一個目標, 由它自己決定先查什麼, 再做什麼, 一路呼叫工具直到完成. 模型可能判斷錯誤, 也可能受到資料中夾帶的指令誘導, 所以每個動作在執行前都要經過模型以外的規則檢查. 可以想成新進同仁處理案件: 查資料可以自己來, 寄信給客戶要主管簽核, 動到核心系統則不在授權範圍內.

::: tip 本章常見名詞
| 詞 | 意思 |
|---|---|
| 代理 (agent) | 能自行規劃步驟並呼叫工具完成任務的模型應用 |
| LangGraph | 用程式定義代理流程的開源函式庫, 流程中的每一步稱為節點 |
| 政策引擎 | 依事先寫好的規則判斷「這個動作可不可以做」的程式; 本章以 OPA 為例 |
| OPA 與 Rego | OPA (Open Policy Agent) 是開源政策引擎, Rego 是它的規則語言 |
| 提示注入 (prompt injection) | 在模型會讀到的內容裡夾帶指令, 誘導模型偏離原本的任務 |
| 隔離模型 | 只負責讀取不可信內容, 沒有任何工具權限的模型 |
| 斷路器 (circuit breaker) | 某條路徑錯誤太多時自動切斷, 避免問題擴大 |
| kill switch | 由人手動觸發, 一次停下所有代理的總開關 |
| `thread_id` | 一次代理執行的編號, 用來保存狀態與串起紀錄 |
:::

## M8.1 LangGraph: 當函式庫用, 不用平台版

LangGraph 負責代理的流程控制: 每一步做什麼, 下一步走哪裡, 哪裡要停下來等人核准. 它有開源函式庫與商業平台兩種用法, 本節說明為何選函式庫.

- 程式庫採 MIT 授權, 可完全地端執行, 無商業限制 (來源: LangGraph GitHub 儲存庫).
- LangSmith Deployment 是 LangChain 公司代管與部署代理的商業平台 (舊稱 LangGraph Platform; 改名說法為訓練資料內資訊, 可能已過時). 官方文件寫明, 自架部署需要 Enterprise 方案與隨方案提供的 LangSmith 授權金鑰 (來源: LangChain 文件 Self-hosted deployment overview).
- 因此本手冊建議把 LangGraph 當函式庫, 嵌入自己的 FastAPI (以 Python 撰寫 API 服務的框架) 或腳本 (信心: 高).
- 需要理解狀態圖, 檢查點與節點等概念, 對初階讀者偏陡 (信心: 中, 屬推論).


## M8.2 政策引擎 (OPA)

模型的判斷不能當作最後一道關卡, 因為模型本身也可能受誘導. 政策引擎把「哪些動作允許, 哪些要審查, 哪些禁止」寫成固定規則, 由程式逐一比對, 結果不受模型說法影響. 可以想成公司的簽核規章: 不論申請人理由多充分, 超過權限的金額一律要往上簽.

OPA (Open Policy Agent) 是通用的政策引擎: 應用程式送出一份 JSON 輸入, OPA 依 Rego 政策檔算出決策並回傳. 本手冊的用法是 LangGraph 在每一次工具呼叫之前查詢 OPA, 依結果執行, 拒絕或轉人工核准 (概念見 K5.6 節).

### 部署與查詢

這一步把 OPA 啟動成一個服務, 讓 LangGraph 每次要呼叫工具前先問它一次.

OPA 以 `opa run --server` 啟動為伺服器, 預設監聽 `localhost:8181`; 在容器中執行時, 須以 `--addr` 綁到容器的對外介面 (來源: OPA Docker 部署文件). 官方安全文件建議: 不需要遠端存取時只綁 localhost; 必須遠端存取時, 啟用驗證 (`--authentication=token` 搭配 `--authorization=basic` 與 `system.authz` 政策), 以 `--tls-cert-file` 與 `--tls-private-key-file` 啟用 HTTPS, 並以非 root 帳號執行. 未設定時, OPA 預設不做驗證與授權 (來源: OPA Security 文件). 本手冊把 OPA 與 LangGraph 放在同一個控制區 VM, 只綁 localhost 或控制區內部網路 (推論, 信心: 中).

查詢決策使用 Data API: 以 `POST /v1/data/<政策路徑>` 送出含 `input` 鍵的 JSON, 回應的 `result` 鍵即為決策. 路徑對應的文件未定義時, 伺服器仍回 200, 但回應中沒有 `result`; 啟用決策紀錄時, 回應另含 `decision_id`, 可與決策紀錄對應 (來源: OPA REST API 文件).

下列指令模擬代理送出一次查詢, 詢問「呼叫 `siem.query`, 對象 web01, 本次已呼叫 3 次」是否允許:

```bash
curl -s -X POST http://localhost:8181/v1/data/agent/tools/decision \
  -H 'Content-Type: application/json' \
  -d '{"input": {"tool": "siem.query", "args": {"target": "web01"}, "call_count": 3}}'
# 預期回應形式 (已依下方「決策紀錄」啟用 decision_logs 時才含 decision_id): {"decision_id": "...", "result": "allow"}
```

呼叫端程式須「失敗即拒絕」: 連不到 OPA, 回應不是 200, 或回應中沒有 `result` 時, 一律視為拒絕 (推論, 信心: 高).

### Rego 政策範例: 預設拒絕

「預設拒絕」的意思是: 沒有明確寫出允許的動作, 一律不准. 新增工具時若忘了寫規則, 結果是代理做不到, 而不是代理什麼都能做.

下列政策依 OPA 官方文件的 Rego 語法 (`default`, `if`, `contains`, `in`) 撰寫, 未實機驗證. 它把 K5.6 節的可回復性分級, 關鍵資產清單與單次工具配額寫在同一個檔案中:

```rego
package agent.tools

# 沒有任何規則成立時, 決策為拒絕
default decision := "deny"

# 工具白名單與可回復性分級; 不在表內的工具一律拒絕
tiers := {
	"siem.query": "A0",
	"ticket.create": "A1",
	"host.isolate": "A2",
	"mail.send": "A3",
}

# 關鍵資產: 以這些主機為對象的非唯讀動作, 一律轉人工核准
critical_assets := {"dc01", "fw-core-01"}

# 單次執行的工具呼叫上限
quota := {"siem.query": 30}

decision := "allow" if {
	base_ok
	tiers[input.tool] in {"A0", "A1"}
	not touches_critical_asset
}

decision := "review" if {
	base_ok
	tiers[input.tool] == "A2"
	not touches_critical_asset
}

decision := "approval" if {
	base_ok
	tiers[input.tool] == "A3"
}

decision := "approval" if {
	base_ok
	touches_critical_asset
}

base_ok if {
	tiers[input.tool]
	not over_quota
}

over_quota if input.call_count >= quota[input.tool]

touches_critical_asset if {
	tiers[input.tool] != "A0"
	input.args.target in critical_assets
}
```

這份政策的設計重點 (推論, 信心: 中):

- **分級寫在政策裡**: 等級由政策依工具名稱查表, 不讓代理在輸入中自行申報.
- **配額由呼叫端計數**: OPA 每次判定只看當次輸入, 不保存狀態, 因此「本次執行已呼叫幾次」由 LangGraph 的狀態計數後放進 `input.call_count`.
- **決策值互斥**: `allow` 與 `review` 排除了關鍵資產, 兩條 `approval` 規則就算同時成立, 結果也相同, 因此同一個輸入只會得到一個決策值. 若不同值的規則同時成立, OPA 會回報衝突錯誤 (eval_conflict_error), 呼叫端依「失敗即拒絕」處理.
- **關鍵資產轉人工**: 以關鍵資產為對象的非唯讀動作不直接拒絕, 而是轉人工核准 (`approval`), 與範例 E2, E5 的做法一致.
- **對外連線白名單**: 需要時可比照 `critical_assets` 的寫法加一份允許的網域清單, 對帶有網址參數的工具檢查.

政策檔以 Git (追蹤檔案修改紀錄的版本控制工具) 管理, 變更須經審查; 每條規則都寫單元測試. OPA 以 `opa test` 執行測試, 測試規則的名稱以 `test_` 開頭, 並以 `with input as` 指定輸入 (來源: OPA Policy Testing 文件). 例如:

```rego
package agent.tools_test

import data.agent.tools

test_unknown_tool_denied if {
	tools.decision == "deny" with input as {"tool": "shell.exec", "args": {}, "call_count": 0}
}

test_isolate_dc_requires_approval if {
	tools.decision == "approval" with input as {"tool": "host.isolate", "args": {"target": "dc01"}, "call_count": 0}
}
```

```bash
opa test . -v
```

### 決策紀錄

每次判定都應留下紀錄. OPA 的決策紀錄 (decision logs) 包含 `decision_id`, 查詢的政策路徑, `input`, `result` 與時間戳記 (來源: OPA Decision Logs 文件). 最簡單的設定是輸出到主控台, 由容器日誌經 OTel Collector (稽核區收集並分送紀錄的程式) 轉送到稽核區與既有 SIEM (集中分析資安紀錄的系統) (見 M6):

```yaml
decision_logs:
  console: true
```

也可以設定上傳到遠端服務. 輸入中含有敏感欄位時, OPA 預設會先查詢 `data.system.log.mask` 政策, 依其中的規則清除或改寫欄位後才寫入紀錄 (來源: 同上). 例如工具參數中可能出現的帳號密碼, 應以遮罩規則移除.

## M8.3 隔離模型 (雙 LLM 模式)

log, 郵件與外部情資可能夾帶給模型的指令. 讓有工具權限的模型直接讀這些內容, 等於讓陌生人直接對擁有鑰匙的人下指令. 雙 LLM 模式把工作拆開: 一個沒有任何工具的模型負責閱讀與摘要, 只能交出固定格式的結果; 另一個模型依這些結果規劃下一步, 卻從不直接讀原文. 可以想成郵件室先拆信並填寫制式登記表, 主管只看登記表做決定.

讀取 log, 郵件, 外部情資等不可信內容的工作, 交給一個沒有任何工具的隔離模型; 原理見 K5.6 節. 隔離模型由自建程式加本地模型組成, 放在 VM 隔離區, 只能連模型閘道 LiteLLM, 不持有任何工具憑證 (見[組裝總覽](/build/overview)的部署分區).

### 實作要點

以下做法整理自雙 LLM 模式的原則, 屬推論 (信心: 中):

1. **固定欄位**: 每一種任務事先定義輸出的 JSON 結構, 隔離模型只能填這些欄位. 範例 (告警分流):

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["category", "severity", "indicators", "summary"],
  "properties": {
    "category": { "enum": ["phishing", "malware", "brute_force", "other"] },
    "severity": { "enum": ["low", "medium", "high"] },
    "indicators": {
      "type": "array",
      "maxItems": 20,
      "items": { "type": "string", "maxLength": 64 }
    },
    "summary": { "type": "string", "maxLength": 300 }
  }
}
```

2. **程式端檢查**: 收到輸出後, 程式依序檢查: 能否解析為 JSON; 是否符合結構 (欄位, 型別, 列舉值, 長度); 指標欄位是否符合預期格式 (例如 IP 位址, 雜湊值, 網域名稱的格式). 任何一項不通過就整筆丟棄並記錄, 不嘗試修補.
3. **分流欄位用途**: 列舉欄位 (`category`, `severity`) 與通過格式檢查的指標, 才交給 LangGraph 決定下一步; 自由文字欄位 (`summary`) 只顯示給分析師, 不作為規劃下一步的輸入. 這對應 Willison 原文「未經過濾的隔離模型輸出不得轉給特權模型」的原則.
4. **獨立呼叫**: 每筆不可信內容各自一次呼叫, 不累積對話歷史, 避免前一筆內容影響後一筆.

### 擋不住的情況

格式檢查只能確認「值的形狀正確」, 無法確認「值是否遭到操控」. 例如郵件中藏有指令, 讓隔離模型在 `indicators` 填入網域控制站的 IP 位址; 這個值格式完全合法, 後續若據此執行「隔離主機」, 就會影響關鍵系統. 因應方式是由 OPA 的關鍵資產清單把關 (見 M8.2 節的 `touches_critical_asset`), 並讓 A2 以上的動作經過審查或人工核准 (見 M8.4 節) (信心: 中).

## M8.4 人工核准, 斷路器與配額

本節處理三件事: 高風險動作停下來等人核准, 每次執行限制工具呼叫次數, 以及出問題時能自動或手動切斷.

### 依可回復性分級處理

動作依「做錯了能不能復原」分級: 查詢做錯沒有損失, 寄出的信無法收回. 等級越高, 把關越嚴.

| OPA 決策 | 對應等級 | LangGraph 的處理 |
|---|---|---|
| `allow` | A0, A1 | 直接執行工具, 記錄結果 |
| `review` | A2 | 由兩個不同模型分別審查動作與理由; 兩者都同意才以 canary 方式先對少量對象執行, 確認無誤後再擴大; 不一致即轉人工核准 |
| `approval` | A3 | 暫停流程, 等待人工核准 |
| `deny` | 任何等級 | 不執行, 記錄拒絕原因 |

分級定義見 K5.6 節. A2 的雙模型審查與 canary 分批屬於本手冊的設計建議 (推論, 信心: 中).

### 以 LangGraph 的 interrupt 實作人工核准

LangGraph 的 `interrupt()` 會在呼叫處暫停圖的執行, 並透過 checkpointer (LangGraph 保存流程狀態的元件) 保存狀態; 傳給 `interrupt()` 的值會回傳給呼叫端, 圖會一直等到恢復執行. 恢復時以相同的 `thread_id` 再次呼叫, 並傳入 `Command(resume=...)`, 傳入的值即成為 `interrupt()` 的回傳值 (來源: LangGraph Interrupts 文件). 下列程式片段依官方範例改寫, 未實機驗證:

```python
from langgraph.types import interrupt, Command

def approval_node(state):
    # 把待核准的動作交給核准者; 恢復時取得核准者的回覆
    is_approved = interrupt({
        "question": "是否執行這個動作?",
        "details": state["action_details"],
    })
    if is_approved:
        return Command(goto="execute_tool")
    return Command(goto="cancel")
```

```python
# 編譯時指定 checkpointer; 正式環境須改用資料庫型的 checkpointer
graph = builder.compile(checkpointer=checkpointer)
config = {"configurable": {"thread_id": "<執行編號>"}}

result = graph.invoke(initial_state, config)
# 暫停中的請求出現在 result["__interrupt__"], 送交核准者

# 核准者回覆後, 以同一個 thread_id 恢復
graph.invoke(Command(resume=True), config)
```

官方文件提醒的三項規則 (來源: 同上):

- **恢復時整個節點從頭執行**: `interrupt()` 之前的程式碼會再跑一次, 因此有副作用的動作 (例如呼叫工具) 應放在 `interrupt()` 之後, 或確保可重複執行而不產生不同結果.
- **不要用籠統的 try/except 包住 `interrupt()`**: 否則會攔截到暫停機制使用的例外, 應只攔截特定例外類型.
- **正式環境使用資料庫型的 checkpointer**: 官方建議正式環境使用以資料庫保存狀態的 checkpointer, 範例中的 `InMemorySaver` 把狀態存在記憶體, 服務重啟即消失, 只適合測試.

核准介面可以是 ticket 系統, 聊天機器人或簡單的網頁; 重點是核准紀錄 (誰, 何時, 核准了哪個 `thread_id` 的哪個動作) 與 OPA 的 `decision_id` 一起保存, 稽核時才能串起來 (推論, 信心: 中).

### 單次配額

每次代理執行 (一個 `thread_id`) 為每個工具設定呼叫上限, 例如 `siem.query` 每次執行最多 30 次. 計數保存在 LangGraph 的狀態中, 每次查詢 OPA 時帶入 (見 M8.2 節). 配額的作用是限制「遭注入後陷入迴圈」或「大量撈取資料」的影響範圍 (推論, 信心: 中).

### 斷路器與 kill switch

斷路器像配電箱裡的分路開關, 某一路短路時只跳那一路; kill switch 像總開關, 一次切斷全部. 兩者的範圍不同, 應分開設計 (推論, 信心: 中):

| 機制 | 範圍 | 觸發條件 (示意) | 恢復方式 |
|---|---|---|---|
| 斷路器 | 單一工具路徑 (例如某代理對某工具) | 短時間內 OPA 拒絕或工具錯誤超過門檻 | 冷卻一段時間後自動半開, 試行一次成功才完全恢復; 或由維運人員手動恢復 |
| kill switch | 所有代理 | 維運人員判斷有異常, 或監控警示 | 人工確認原因後恢復 |

斷路器只切斷出問題的路徑, 其他工作照常執行; kill switch 是最後防線, 應準備多個彼此獨立的切斷點, 例如: 停止 LangGraph 服務; 在 OPA 政策中加一條讓所有決策為 `deny` 的規則; 在工具閘道撤銷代理使用的身分或金鑰. 至少每季演練一次, 確認切斷後代理確實無法呼叫任何工具 (推論, 信心: 中).

### 內部模擬結果

2026-10 的一次藍隊代理模擬 (使用真實的 LangGraph 1.2.17 與 OPA 1.4.2, 模型判斷與分析師行為以腳本模擬) 顯示: 沒有政策層時, 16 項注入攻擊全部得逞; 加上預設拒絕, 關鍵資產清單, 單次工具配額 (`siem.query` 每次執行上限 30 次) 與斷路器之後, 16 項中有 15 項由確定性規則擋下, 1 項由分析師拒絕; 政策判定延遲的中位數為 0.82 毫秒 (內部模擬, 推論). 這個結果的限制是模型判斷與分析師行為皆為模擬, 不代表真實模型與真實人員的表現; 讀者應以 M8.5 節的方法, 用自己的工具與測試資料重做.

## M8.5 多代理: 同時執行與協作

**結論**: 本手冊的架構可以同時執行多個代理, 但建議分兩步走: 先做「多個獨立代理各跑各的」, 再做「固定流程的協作」, 不建議讓代理之間自由對話. 原因是每多一個代理, 就多一條可能傳遞注入內容的路徑, 且同時進行的請求會共用同一組 GPU. 基礎元件 (LiteLLM 虛擬金鑰, OPA, MCP gateway, 記錄模型呼叫軌跡的 Langfuse) 都已就位, 要補的是每個代理的身分, 代理之間的信任邊界, 以及跨執行的共用配額.

### 三種「多代理」要分開看

| 型態 | 做法 | 風險 | 本手冊的建議 |
|---|---|---|---|
| 並行獨立 | 多個代理各自處理不同任務, 彼此不傳訊息 (例如分流代理與週報代理) | 搶用 GPU 與工具配額 | 先做這一種 |
| 固定流程協作 | 主流程依預先定義的順序呼叫專責代理, 傳遞的內容是固定欄位 JSON (例如分流後交給調查) | 上游輸出若遭操控, 會影響下游 | 第二步, 需套用本節的信任邊界 |
| 自由對話 | 代理之間以自然語言彼此委派, 自行決定下一個該找誰 | 注入內容可沿對話擴散, 行為難以預測與稽核 | 不建議 (推論, 信心: 中) |

### 每個代理一個身分

並行之後, 稽核與切斷都以「代理」為單位, 因此每個代理要有自己的身分與權限, 不共用:

1. **各用一把虛擬金鑰**: 在 LiteLLM 為每個代理各發一把 (`/key/generate` 的做法見 M5.6 節的驗收測試), 設定自己的 `rpm_limit`, `tpm_limit` 與 `max_parallel_requests`. 官方文件說明這些限制對任何設定了它們的金鑰, 使用者或團隊都生效; 金鑰超過預算 (`max_budget`) 後請求會失敗, 但預設不檢查預算 (來源: LiteLLM 文件 Virtual Keys 與 Users). `max_parallel_requests` 在 `/key/generate` 的欄位名稱, 官方頁面的範例未直接展示, 實機驗證時請確認 (待查證).
2. **各設工具範圍**: MCP 權限依金鑰, 團隊與組織設定 (來源: LiteLLM MCP 文件); 沒有設定伺服器清單時預設全部可連, 設定方式見 M7.2 節的表格. 每個代理的金鑰只列它需要的伺服器與工具.
3. **OPA 以代理編號判定**: 呼叫 OPA 時帶入 `agent_id`, 政策依代理查白名單. `agent_id` 由 LangGraph 服務依自己的設定填入, 不取自模型輸出, 也不取自代理之間傳遞的訊息 (設計建議, 信心: 高).

在 M8.2 節的政策中加入每個代理的工具白名單 (依 OPA 官方文件的語法撰寫, 未實機驗證):

```rego
package agent.tools

# 每個代理各自的工具白名單; 代理編號不在表內, 或工具不在該代理的清單內, 都不成立
agent_tools := {
	"triage": {"siem.query"},
	"investigate": {"siem.query", "ticket.create", "host.isolate"},
}

agent_ok if input.tool in agent_tools[input.agent_id]

# 取代 M8.2 節原本的 base_ok; 同名規則寫兩次會變成「任一成立即可」, 白名單就失效
base_ok if {
	tiers[input.tool]
	agent_ok
	not over_quota
}
```

這樣即使分流代理遭注入, 也無法叫用 `host.isolate`: 該工具不在它的白名單, 與模型輸出了什麼無關.

### LangGraph 的做法: 專責代理當工具呼叫

LangChain 官方的 supervisor 遷移說明指出, `langgraph-supervisor` 套件已不再積極維護, 建議改用 subagents 模式: 主代理把每個專責代理包成一個工具來呼叫. 該文件並說明: 專責代理中的 `interrupt` 會往上傳到最外層的圖, 只有最外層需要 checkpointer, 外層呼叫時帶 `thread_id`, 恢復時以 `Command(resume=...)` 繼續 (來源: LangChain 文件 Migrate: langgraph-supervisor). 子圖 (subgraph) 的文件另有幾項與並行有關的說明 (來源: LangGraph 文件 Subgraphs):

- 子圖是「作為另一張圖的節點的圖」; 可以用包裝函式轉換父子狀態 (各自保有私有狀態), 或直接加入為節點並共用狀態欄位.
- 子圖設為「每個執行緒保留狀態」(`checkpointer=True`) 時, 不支援對同一個子圖的平行呼叫, 否則會發生 checkpoint 衝突.
- 多個這類子圖在節點內呼叫時, 各自要用獨立的節點名稱, 避免 checkpoint 相互覆蓋.

動態展開多個平行分支, 社群討論串提到可用 `Send`, 並以 `max_concurrency` 控制同時數量 (二手來源, 為社群論壇討論, 實際行為待對照官方文件).

固定流程協作的示意如下 (依上述文件整理的設計, 未實機驗證):

```
告警進入
   |
   v
[主流程 LangGraph, thread_id = 本次執行編號]
   |
   +--> [分流代理]   金鑰 k-triage, 工具: siem.query
   |        | 輸出固定欄位 JSON
   |        v
   |    [程式檢查結構, 長度, 列舉值]  不通過就整筆丟棄
   |        |
   +--> [調查代理]   金鑰 k-investigate, 工具: siem.query, ticket.create, host.isolate
            | 每次工具呼叫先查 OPA (帶 agent_id)
            v
        [MCP gateway] --> 工具
   A2 以上的動作: 雙模型審查或人工核准 (見 M8.4 節)
```

完整的應用範例 (三個調查代理平行執行, 一個彙整代理提出處置建議), 見 [E5 多代理事件調查](/examples/e5-multi-agent-investigation).

### 代理之間的訊息一律視為不可信

OWASP (推動應用程式安全的非營利社群) 的代理應用十大風險中, ASI07「Insecure Inter-Agent Communication」指代理之間遭偽造的訊息可能把整群代理導向錯誤動作, ASI08「Cascading Failures」指錯誤訊號在自動化流程中擴大 (來源: OWASP GenAI Security Project, Top 10 for Agentic Applications). 因應做法沿用 M8.3 節的隔離原則 (設計建議, 信心: 中):

1. **只傳固定欄位**: 上游代理的輸出須通過結構檢查 (欄位, 型別, 列舉值, 長度) 才交給下游; 自由文字只顯示給分析師, 不當作下游的指令或規劃依據.
2. **權限不隨訊息變動**: 下游代理的工具範圍由自己的金鑰與 OPA 白名單決定. 上游訊息要求「幫我隔離這台主機」時, 下游仍須通過自己的政策判定.
3. **訊息不帶憑證**: 代理之間不傳遞金鑰, token 或網址憑證.
4. **關鍵資產清單照常生效**: 上游填入的目標值若落在關鍵資產清單, 下游的非唯讀動作仍會轉人工核准 (見 M8.3 節「擋不住的情況」).
5. **錯誤不往下游擴散**: 上游連續輸出格式錯誤時, 由斷路器切斷該代理, 下游不再接收 (見 M8.4 節).

### 同時執行的容量與配額

**GPU 是共用瓶頸.** 同時進行的請求數大致等於「同時執行的代理數」乘以「每個代理內同時送出的呼叫數」(推算, 非實測). 推論伺服器 vLLM 的 KV cache 不足時會發生搶佔 (preemption), 被搶佔的請求待空間足夠後重新計算; V1 預設的搶佔模式為 `RECOMPUTE`. 官方建議: 搶佔頻繁時降低 `max_num_seqs` 或 `max_num_batched_tokens`, 可縮小一批的請求數, 降低 KV cache 需求; 搶佔次數可由 Prometheus (M6 的指標監控系統) 的指標或 `disable_log_stats=False` 觀察 (來源: vLLM 文件 Optimization and Tuning). 實務做法是先用一個代理量出單次執行的呼叫數與延遲, 再逐一加入其他代理, 觀察搶佔次數與延遲, 超過可接受範圍就停止增加, 或另加一台推論主機 (設計建議, 信心: 中).

**金鑰層的限流.** LiteLLM 跨多個實例時, `tpm`, `rpm` 與 `max_parallel_requests` 的計數放在 Redis (常用來存放計數與快取的記憶體資料庫); Redis 無法連線時, 各實例會退回各自的記憶體計數, 例如 `rpm_limit: 2` 會變成每個實例各 2 次. 設定 `fail_closed_rate_limit_enforcement: true` 後, 無法驗證計數的請求會回 503 (來源: LiteLLM 文件 Users). 單一 LiteLLM 實例的部署不受影響; 多實例時, 建議啟用 fail closed (推論, 信心: 中).

**跨執行的共用配額.** M8.4 節的單次配額只管「一次執行」(一個 `thread_id`) 的呼叫數. 要限制「所有代理加總」的呼叫量 (例如整個系統每分鐘最多對 SIEM 查詢 100 次), 需要外部計數器, 例如 Redis. LangGraph 在查詢 OPA 前讀取計數, 放進 `input.global_count`, 政策再加一條 `over_global_quota` 規則. OPA 本身不保存狀態, 計數由呼叫端負責 (設計建議, 信心: 中).

### 觀測與切斷以代理為單位

- **追蹤**: 同一次協作內的所有代理共用同一個 `thread_id`, 並記在 Langfuse 的追蹤與 OPA 的決策紀錄中, 才查得出完整路徑 (設計建議).
- **單獨切斷一個代理**: 以 `/key/block` 封鎖該代理的虛擬金鑰 (做法見 M5.4 節「離職停用流程」), 或在 OPA 政策對該 `agent_id` 一律回 `deny`, 其他代理不受影響. 這與 M8.4 節的全域 kill switch 並存.
- **斷路器的範圍**: 斷路器的對象改為「代理 + 工具」的組合, 避免一個代理出錯時, 連帶封鎖其他代理使用同一個工具.

### 為什麼先固定流程

K5 引用的 BFCL V4 顯示, 通用小模型單步工具呼叫約 78% 至 87%, 多輪任務只有約 6% 至 11%. 多個代理串接時, 整體成功率是各段相乘: 示意計算, 每段 90% 成功, 串接 5 段約為 59% (0.9 的 5 次方; 非實測). 因此固定流程的順序與欄位, 比讓代理自行決定交給誰更容易測試與稽核 (信心: 高). 需要新增代理時, 先確認它能獨立通過 M8.6 節的測試, 再接進流程.

## M8.6 驗收測試

代理的驗收重點是故意餵它有問題的資料, 確認規則與核准機制真的擋得住.

下列測試全部通過後, 才讓代理處理真實資料 (測試清單為整理者建議, 未實機驗證).

**政策引擎**

- [ ] `opa test . -v` 全部通過, 測試涵蓋: 拒絕不在白名單的工具; 以關鍵資產為對象的非唯讀動作轉人工核准; 拒絕超過配額的呼叫; 每個等級回傳預期的決策.
- [ ] 停止 OPA 服務後, 代理的所有工具呼叫一律拒絕 (失敗即拒絕).
- [ ] OPA 只能從控制區內部連線; 從其他區連 8181 連接埠失敗.

**提示注入測試**

- [ ] 準備一組內含提示注入的測試資料 (例如 log, 郵件, 情資報告中夾帶「刪除資料」「把資料寄到外部信箱」「隔離網域控制站」等指令), 交給代理處理; 每一項有害動作都遭拒絕或轉人工核准, 沒有任何一項直接執行.
- [ ] 隔離模型的輸出不符合結構時 (例如多出欄位, 超過長度, 列舉值以外的值), 程式整筆丟棄並留下紀錄.
- [ ] 測試資料併入 M6 的測試集, 每次換模型, 改提示或改政策時重跑.

**人工核准與切斷**

- [ ] A3 動作會暫停, 核准後才執行; 拒絕後不執行; 核准紀錄能對應到 OPA 的 `decision_id`.
- [ ] 重新啟動 LangGraph 服務後, 暫停中的核准請求仍能恢復 (確認 checkpointer 把狀態存在資料庫).
- [ ] 單一工具連續出錯時斷路器開啟, 其他工具仍可使用.
- [ ] 啟動 kill switch 後, 所有代理都無法呼叫工具.

**紀錄**

- [ ] 每次政策判定都能在稽核區或 SIEM 查到決策紀錄 (`decision_id`, 工具, 決策, 時間).
- [ ] 決策紀錄中看不到遮罩規則指定的敏感欄位.

## 參考來源

- [OPA 文件: REST API](https://www.openpolicyagent.org/docs/rest-api)
- [OPA 文件: Policy Language](https://www.openpolicyagent.org/docs/policy-language)
- [OPA 文件: Policy Testing](https://www.openpolicyagent.org/docs/policy-testing)
- [OPA 文件: Decision Logs](https://www.openpolicyagent.org/docs/management-decision-logs)
- [OPA 文件: Deploy with Docker](https://openpolicyagent.org/docs/deploy/docker)
- [OPA 文件: Security](https://www.openpolicyagent.org/docs/security.md)
- [LangGraph GitHub 儲存庫 (MIT 授權)](https://github.com/langchain-ai/langgraph)
- [LangChain 文件: Self-hosted deployment overview (自架需 Enterprise 方案與授權金鑰)](https://docs.langchain.com/langsmith/deploy-to-self-hosted-overview)
- [LangGraph 文件: Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [Simon Willison: The Dual LLM pattern](https://simonwillison.net/2023/Apr/25/dual-llm-pattern/)
- [OWASP GenAI: LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [LangGraph 文件: Subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs)
- [LangChain 文件: Migrate from langgraph-supervisor](https://docs.langchain.com/oss/python/migrate/langgraph-supervisor.md)
- [LangChain 社群論壇: Best practices for parallel nodes (fanouts)](https://forum.langchain.com/t/best-practices-for-parallel-nodes-fanouts/1900.md) (二手來源, 社群討論)
- [LiteLLM 文件: Virtual Keys, Budgets, Rate Limits](https://docs.litellm.ai/docs/proxy/users)
- [LiteLLM 文件: MCP](https://docs.litellm.ai/docs/mcp)
- [vLLM 文件: Optimization and Tuning](https://docs.vllm.ai/en/latest/configuration/optimization/)
- [OWASP GenAI Security Project: Top 10 for Agentic Applications](https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agent)
- 文中的類比 (新進同仁的授權範圍, 簽核規章, 郵件室的制式登記表, 電路開關): 整理者所寫, 無外部來源, 不應當作技術定義引用.
