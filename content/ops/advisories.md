# O3 安全公告與事件處理

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-27
- 待查證: LiteLLM 官方事故報告提到一個預定於 2026-10-27 公開的漏洞, 截至 2026-10-27 查詢尚未見對應公告; 每週, 每月, 每季的檢查頻率為整理者建議, 無來源; 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 地端 AI 的事件多半從「更新時取得含惡意程式的版本」或「服務對外暴露」開始. 因此維運的重點是三件事: 知道公告, 能鎖定版本, 能快速輪替金鑰. 若不能每週檢查安全公告, 寧可少裝元件.

## O3.1 公告訂閱

安全公告是軟體專案發布的漏洞通知, 說明哪些版本受影響, 以及該升級到哪一版. 訂閱公告可以想成登記汽車召回通知: 原廠發現瑕疵時, 車主才能第一時間知道.

| 管道 | 做法 |
|---|---|
| GitHub Security Advisories | 在每個使用中元件的 GitHub 儲存庫訂閱安全通知: 對儲存庫選 Watch, 並在自訂選項中勾選 Security alerts (來源: GitHub Docs, Managing security notifications; 操作介面可能調整, 請以 GitHub 官方文件為準) |
| 元件發行頁 | 每週檢查一次安全公告; 升級前先讀發行說明 |
| CISA Known Exploited Vulnerabilities (KEV) | KEV 是美國網路安全暨基礎設施安全局 (CISA) 維護的「已確認遭實際利用」漏洞清單, 比一般漏洞資料庫更能看出哪些漏洞要先處理. 每月比對一次使用中元件是否列入 (頻率為建議值, 屬推論); 目錄網址見本章參考來源 |
| 本手冊[元件版本與安全公告頁](/ref/versions) | 查看最後驗證日與已知問題 |
| 自家服務日誌 | 每週掃一次錯誤訊息; 位置與查看方式見 [M1.7 節](/build/m1-inference) |

## O3.2 案例: LiteLLM 2026 年兩次供應鏈事件

供應鏈事件是指攻擊者不直接攻擊使用者的系統, 而是污染使用者下載的軟體或軟體的發布流程, 使用者在正常更新時就裝進了惡意版本.

兩次事件的詳細時間線見 [M5.3 節](/build/m5-gateway-identity). 從維運角度可歸納三個教訓:

1. **浮動標籤不可信**: 2026-10-21 事件中, Docker Hub 上的 v1.107.0, latest, main-latest 與 main-stable 標籤都曾指向惡意映像 (來源: LiteLLM 官方事故報告).
2. **事件起點常在上游的小疏失**: 2026-03 事件起於 CI/CD (自動建置與發布軟體的流程). 官方研判入口很可能是掃描流程中的 Trivy 相依套件 (來源: LiteLLM 官方部落格 2026-03-24); Snyk 的分析指出, 未鎖定版本的 Trivy 遭入侵後, 發布權杖 (用來發布新版本的憑證) 因此外洩 (來源: Snyk). 2026-10 事件的起點, 依官方 2026-10-23 的攻擊鏈報告, 是一把 2026-05-27 被提交到公開儲存庫, 之後沒有撤銷的 Agent Platform master key; 攻擊者於 2026-10-10 用它進入內部環境, 再取得開發者的 GitHub 憑證並修改發布流程 (來源: LiteLLM 官方攻擊鏈報告).
3. **風險集中於保存金鑰的服務**: 閘道集中保存上游金鑰, 一旦入侵, 所有金鑰都須視為外洩; 官方事故報告要求輪替代理資料庫中的每一把供應商金鑰 (來源: LiteLLM 官方事故報告).

## O3.3 金鑰輪替與小團隊帳號管理

金鑰是服務之間存取用的密碼, 輪替是換上新金鑰並讓舊金鑰失效. 金鑰可能外洩時, 輪替就像換鎖: 不確定誰拿到舊鑰匙, 就整組換掉.

### 事件處理順序

LiteLLM 2026-10 事故報告建議從頭重建映像與環境, 並輪替所有憑證 (來源: LiteLLM 官方事故報告). 2026-03 事件的官方建議是把受影響系統上的所有憑證視為已外洩並輪替, 移除惡意檔案, 並鎖定已知安全的版本; 該次公告沒有明確要求重建主機, 只要求進一步調查主機是否遭入侵 (來源: LiteLLM 官方部落格 2026-03-24). 下列「隔離, 重建, 輪替」三步為整理者綜合兩次官方建議歸納的處理順序 (推論, 信心: 中高):

1. **隔離**: 中斷受影響主機的對外網路, 停止相關容器.
2. **重建**: 以已知安全的版本 (依官方公告指定) 重新建立容器與環境, 不在原主機上修補. 2026-10 事故報告指定回到 1.106.2, 並稱從頭重建映像與虛擬環境較佳.
3. **輪替**: 更換該主機上存放過的所有金鑰, 包含上游 API 金鑰與資料庫密碼.

### 事先準備

- 列出所有存放金鑰的位置 (`.env`, 閘道設定, 介面設定).
- 上游金鑰只給最低權限並設用量上限, 使外洩損失有上限.
- 演練一次輪替, 確認能在一小時內完成 (信心: 低, 此時間為建議目標, 非來源資料).

### 小團隊帳號

- 每位使用者使用個別帳號, 並關閉公開註冊.
- 人員異動時, 當天停用帳號並檢視其持有的虛擬金鑰 (閘道發給每位使用者的個別金鑰, 見 [M5](/build/m5-gateway-identity)).
- 帳號清單每季檢視一次.

## 參考來源

- [LiteLLM 官方部落格: Security incident Oct 21, 2026](https://docs.litellm.ai/blog/security-incident-oct-21-2026)
- [LiteLLM 官方部落格: The attack chain behind the v1.107.0 LiteLLM release (2026-10-23)](https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain)
- [LiteLLM 官方部落格: Security Update, Suspected Supply Chain Incident (2026-03-24)](https://docs.litellm.ai/blog/security-update-march-2026)
- [Snyk: Poisoned security scanner backdooring LiteLLM](https://snyk.io/blog/poisoned-security-scanner-backdooring-litellm/)
- [GitHub Docs: Managing security notifications](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-security-notifications)
- 手冊內部連結: [M5.3 節 LiteLLM 事件時間線](/build/m5-gateway-identity), [元件版本與安全公告頁](/ref/versions)
- [CISA: Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) (網頁版, 2026-10-27 由搜尋結果取得網址); 機器可讀的 JSON 版見[元件版本與安全公告頁](/ref/versions)

整理者建議 (推論, 無外部來源): O3.1 的檢查頻率 (每週, 每月), O3.3 的事先準備清單與「一小時內完成輪替」的目標, 以及小團隊帳號管理做法 (個別帳號, 當天停用, 每季檢視). 結論段的「事件多半從更新含惡意程式的版本或服務對外暴露開始」屬整理者歸納 (信心: 中高), 依據為 K6.1 與 K6.2 所列公開事件.

文中的類比 (汽車召回通知, 換鎖): 整理者所寫, 無外部來源, 不應當作技術定義引用.
