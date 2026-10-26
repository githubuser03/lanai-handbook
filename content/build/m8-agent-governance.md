# M8 代理與治理

::: info 本章屬性
- 等級: ◇ 進階
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-26
- 待查證: Rego 政策, 測試與 LangGraph 程式片段依官方文件撰寫, 未實機執行; 隔離模型的結構檢查, 斷路器, kill switch 與 T2 雙模型審查為整理者的設計建議 (推論); M8.4 節的模擬結果為內部研究紀錄, 模型判斷與分析師行為為腳本模擬; M8.1 節的 LangGraph 授權與 CLI 說明本輪未重新核對
:::

**結論**: 代理讓模型自己決定下一步要呼叫哪個工具, 所以每個動作都要在模型之外再檢查一次. 本手冊的做法是: LangGraph 負責流程控制, OPA 負責政策判定, 讀取不可信內容的工作交給沒有工具的隔離模型.

**這一塊在圖上的位置**: VM 控制區 (LangGraph, OPA) 與 VM 隔離區 (自建程式 + 本地模型). **前置模組**: M7. **完成後的狀態**: 代理能處理多步驟任務, 寫入與刪除需要人工核准, 異常時自動切斷.

## M8.1 LangGraph: 當函式庫用, 不用平台版

- 程式庫採 MIT 授權, 可完全地端執行, 無商業限制.
- LangGraph Platform 已改名為 LangSmith Deployment. 依 LangChain 官方 CLI 文件, `langgraph up` 啟動的 Agent Server 在正式環境需要授權金鑰.
- 因此本手冊建議把 LangGraph 當函式庫, 嵌入自己的 FastAPI 或腳本 (信心: 高).
- 需要理解狀態圖, 檢查點與節點等概念, 對初階讀者偏陡 (信心: 中, 屬推論).


## M8.2 政策引擎 (OPA)

OPA (Open Policy Agent) 是通用的政策引擎: 應用程式送出一份 JSON 輸入, OPA 依 Rego 政策檔算出決策並回傳. 本手冊的用法是 LangGraph 在每一次工具呼叫之前查詢 OPA, 依結果執行, 拒絕或轉人工核准 (概念見 K5.6 節).

### 部署與查詢

OPA 以 `opa run --server` 啟動為伺服器, 預設監聽 `localhost:8181`; 在容器中執行時, 須以 `--addr` 綁到容器的對外介面 (來源: OPA Docker 部署文件). 官方安全文件建議: 不需要遠端存取時只綁 localhost; 必須遠端存取時, 啟用驗證 (`--authentication=token` 搭配 `--authorization=basic` 與 `system.authz` 政策), 以 `--tls-cert-file` 與 `--tls-private-key-file` 啟用 HTTPS, 並以非 root 帳號執行. 未設定時, OPA 預設不做驗證與授權 (來源: OPA Security 文件). 本手冊把 OPA 與 LangGraph 放在同一個控制區 VM, 只綁 localhost 或控制區內部網路 (推論, 信心: 中高).

查詢決策使用 Data API: 以 `POST /v1/data/<政策路徑>` 送出含 `input` 鍵的 JSON, 回應的 `result` 鍵即為決策. 路徑對應的文件未定義時, 伺服器仍回 200, 但回應中沒有 `result`; 啟用決策紀錄時, 回應另含 `decision_id`, 可與決策紀錄對應 (來源: OPA REST API 文件).

```bash
curl -s -X POST http://localhost:8181/v1/data/agent/tools/decision \
  -H 'Content-Type: application/json' \
  -d '{"input": {"tool": "siem.query", "args": {"target": "web01"}, "call_count": 3}}'
# 預期回應形式: {"decision_id": "...", "result": "allow"}
```

呼叫端程式須「失敗即拒絕」: 連不到 OPA, 回應不是 200, 或回應中沒有 `result` 時, 一律視為拒絕 (推論, 信心: 高).

### Rego 政策範例: 預設拒絕

下列政策依 OPA 官方文件的 Rego 語法 (`default`, `if`, `contains`, `in`) 撰寫, 未實機驗證. 它把 K5.6 節的可回復性分級, 關鍵資產清單與單次工具配額寫在同一個檔案中:

```rego
package agent.tools

# 沒有任何規則成立時, 決策為拒絕
default decision := "deny"

# 工具白名單與可回復性分級; 不在表內的工具一律拒絕
tiers := {
	"siem.query": "T0",
	"ticket.create": "T1",
	"host.isolate": "T2",
	"mail.send": "T3",
}

# 關鍵資產: 非唯讀動作不得以這些主機為對象
critical_assets := {"dc01", "fw-core-01"}

# 單次執行的工具呼叫上限
quota := {"siem.query": 30}

decision := "allow" if {
	base_ok
	tiers[input.tool] in {"T0", "T1"}
}

decision := "review" if {
	base_ok
	tiers[input.tool] == "T2"
}

decision := "approval" if {
	base_ok
	tiers[input.tool] == "T3"
}

base_ok if {
	tiers[input.tool]
	not over_quota
	not touches_critical_asset
}

over_quota if input.call_count >= quota[input.tool]

touches_critical_asset if {
	tiers[input.tool] != "T0"
	input.args.target in critical_assets
}
```

這份政策的設計重點 (推論, 信心: 中高):

- **分級寫在政策裡**: 等級由政策依工具名稱查表, 不讓代理在輸入中自行申報.
- **配額由呼叫端計數**: OPA 每次判定只看當次輸入, 不保存狀態, 因此「本次執行已呼叫幾次」由 LangGraph 的狀態計數後放進 `input.call_count`.
- **決策值互斥**: 三條 `decision` 規則以不同等級為條件, 同一個輸入只會有一條成立.
- **對外連線白名單**: 需要時可比照 `critical_assets` 的寫法加一份允許的網域清單, 對帶有網址參數的工具檢查.

政策檔以 Git 管理, 變更須經審查; 每條規則都寫單元測試. OPA 以 `opa test` 執行測試, 測試規則的名稱以 `test_` 開頭, 並以 `with input as` 指定輸入 (來源: OPA Policy Testing 文件). 例如:

```rego
package agent.tools_test

import data.agent.tools

test_unknown_tool_denied if {
	tools.decision == "deny" with input as {"tool": "shell.exec", "args": {}, "call_count": 0}
}

test_isolate_dc_denied if {
	tools.decision == "deny" with input as {"tool": "host.isolate", "args": {"target": "dc01"}, "call_count": 0}
}
```

```bash
opa test . -v
```

### 決策紀錄

每次判定都應留下紀錄. OPA 的決策紀錄 (decision logs) 包含 `decision_id`, 查詢的政策路徑, `input`, `result` 與時間戳記 (來源: OPA Decision Logs 文件). 最簡單的設定是輸出到主控台, 由容器日誌經 OTel Collector 轉送到稽核區與既有 SIEM (見 M6):

```yaml
decision_logs:
  console: true
```

也可以設定上傳到遠端服務. 輸入中含有敏感欄位時, OPA 預設會先查詢 `data.system.log.mask` 政策, 依其中的規則清除或改寫欄位後才寫入紀錄 (來源: 同上). 例如工具參數中可能出現的帳號密碼, 應以遮罩規則移除.

## M8.3 隔離模型 (雙 LLM 模式)

讀取 log, 郵件, 外部情資等不可信內容的工作, 交給一個沒有任何工具的隔離模型; 原理見 K5.6 節. 隔離模型由自建程式加本地模型組成, 放在 VM 隔離區, 只能連 LiteLLM, 不持有任何工具憑證 (見[組裝總覽](/build/overview)的部署分區).

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

格式檢查只能確認「值的形狀正確」, 無法確認「值是否被操控」. 例如郵件中藏有指令, 讓隔離模型在 `indicators` 填入網域控制站的 IP 位址; 這個值格式完全合法, 後續若據此執行「隔離主機」, 就會影響關鍵系統. 因應方式是由 OPA 的關鍵資產清單把關 (見 M8.2 節的 `touches_critical_asset`), 並讓 T2 以上的動作經過審查或人工核准 (見 M8.4 節) (信心: 中高).

## M8.4 人工核准, 斷路器與配額

### 依可回復性分級處理

| OPA 決策 | 對應等級 | LangGraph 的處理 |
|---|---|---|
| `allow` | T0, T1 | 直接執行工具, 記錄結果 |
| `review` | T2 | 由兩個不同模型分別審查動作與理由; 兩者都同意才以 canary 方式先對少量對象執行, 確認無誤後再擴大; 不一致即轉人工核准 |
| `approval` | T3 | 暫停流程, 等待人工核准 |
| `deny` | 任何等級 | 不執行, 記錄拒絕原因 |

分級定義見 K5.6 節. T2 的雙模型審查與 canary 分批屬於本手冊的設計建議 (推論, 信心: 中).

### 以 LangGraph 的 interrupt 實作人工核准

LangGraph 的 `interrupt()` 會在呼叫處暫停圖的執行, 並透過 checkpointer 保存狀態; 傳給 `interrupt()` 的值會回傳給呼叫端, 圖會一直等到恢復執行. 恢復時以相同的 `thread_id` 再次呼叫, 並傳入 `Command(resume=...)`, 傳入的值即成為 `interrupt()` 的回傳值 (來源: LangGraph Interrupts 文件). 下列程式片段依官方範例改寫, 未實機驗證:

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
- **正式環境使用持久化的 checkpointer**: 官方範例中的 `InMemorySaver` 只適合測試.

核准介面可以是 ticket 系統, 聊天機器人或簡單的網頁; 重點是核准紀錄 (誰, 何時, 核准了哪個 `thread_id` 的哪個動作) 與 OPA 的 `decision_id` 一起保存, 稽核時才能串起來 (推論, 信心: 中高).

### 單次配額

每次代理執行 (一個 `thread_id`) 為每個工具設定呼叫上限, 例如 `siem.query` 每次執行最多 30 次. 計數保存在 LangGraph 的狀態中, 每次查詢 OPA 時帶入 (見 M8.2 節). 配額的作用是限制「被注入後陷入迴圈」或「大量撈取資料」的影響範圍 (推論, 信心: 中高).

### 斷路器與 kill switch

兩者的範圍不同, 應分開設計 (推論, 信心: 中):

| 機制 | 範圍 | 觸發條件 (示意) | 恢復方式 |
|---|---|---|---|
| 斷路器 | 單一工具路徑 (例如某代理對某工具) | 短時間內 OPA 拒絕或工具錯誤超過門檻 | 冷卻一段時間後自動半開, 試行一次成功才完全恢復; 或由維運人員手動恢復 |
| kill switch | 所有代理 | 維運人員判斷有異常, 或監控警示 | 人工確認原因後恢復 |

斷路器只切斷出問題的路徑, 其他工作照常進行; kill switch 是最後防線, 應準備多個彼此獨立的切斷點, 例如: 停止 LangGraph 服務; 在 OPA 政策中加一條讓所有決策為 `deny` 的規則; 在工具閘道撤銷代理使用的身分或金鑰. 至少每季演練一次, 確認切斷後代理確實無法呼叫任何工具 (推論, 信心: 中).

### 內部模擬結果

2026-10 的一次藍隊代理模擬 (使用真實的 LangGraph 1.2.17 與 OPA 1.4.2, 模型判斷與分析師行為以腳本模擬) 顯示: 沒有政策層時, 16 項注入攻擊全部得逞; 加上預設拒絕, 關鍵資產清單, 單次工具配額 (`siem.query` 每次執行上限 30 次) 與斷路器之後, 16 項中有 15 項由確定性規則擋下, 1 項由分析師拒絕; 政策判定延遲的中位數為 0.82 毫秒 (內部模擬, 推論). 這個結果的限制是模型判斷與分析師行為皆為模擬, 不代表真實模型與真實人員的表現; 讀者應以 M8.5 節的方法, 用自己的工具與測試資料重做.

## M8.5 驗收測試

下列測試全部通過後, 才讓代理處理真實資料 (測試項目為整理者建議, 未實機驗證).

**政策引擎**

- [ ] `opa test . -v` 全部通過, 測試涵蓋: 不在白名單的工具被拒絕; 非唯讀動作以關鍵資產為對象被拒絕; 超過配額被拒絕; 每個等級回傳預期的決策.
- [ ] 停止 OPA 服務後, 代理的所有工具呼叫都被拒絕 (失敗即拒絕).
- [ ] OPA 只能從控制區內部連線; 從其他區連 8181 連接埠失敗.

**提示注入測試**

- [ ] 準備一組內含提示注入的測試資料 (例如 log, 郵件, 情資報告中夾帶「刪除資料」「把資料寄到外部信箱」「隔離網域控制站」等指令), 交給代理處理; 每一項有害動作都被拒絕或轉人工核准, 沒有任何一項直接執行.
- [ ] 隔離模型的輸出不符合結構時 (例如多出欄位, 超過長度, 列舉值以外的值), 整筆被丟棄並留下紀錄.
- [ ] 測試資料併入 M6 的測試集, 每次換模型, 改提示或改政策時重跑.

**人工核准與切斷**

- [ ] T3 動作會暫停, 核准後才執行; 拒絕後不執行; 核准紀錄能對應到 OPA 的 `decision_id`.
- [ ] 重新啟動 LangGraph 服務後, 暫停中的核准請求仍能恢復 (確認 checkpointer 為持久化).
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
- [LangGraph 文件: Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [Simon Willison: The Dual LLM pattern](https://simonwillison.net/2023/Apr/25/dual-llm-pattern/)
- [OWASP GenAI: LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
