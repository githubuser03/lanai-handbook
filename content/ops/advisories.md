# O3 安全公告與事件處理

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: CISA KEV 目錄頁本輪未能擷取, 未列連結 (請至 CISA 網站搜尋 "Known Exploited Vulnerabilities Catalog"); 2026-03 LiteLLM 事件的官方處置建議來源待補; 2026-10 事件的入口點官方尚未確認, 官方另有一份攻擊鏈分析本輪無法取得; 每週, 每月, 每季的檢查頻率為整理者建議, 無來源
:::

**結論**: 地端 AI 的事件多半從「更新時取得含惡意程式的版本」或「服務對外暴露」開始. 因此維運的重點是三件事: 知道公告, 能鎖定版本, 能快速輪替金鑰. 若不能每週檢查安全公告, 寧可少裝元件.

## O3.1 公告訂閱

| 管道 | 做法 |
|---|---|
| GitHub Security Advisories | 在每個使用中元件的 GitHub 儲存庫訂閱安全通知: 對儲存庫選 Watch, 並在自訂選項中勾選 Security alerts (來源: GitHub Docs, Managing security notifications; 操作介面可能調整, 請以 GitHub 官方文件為準) |
| 元件發行頁 | 每週檢查一次安全公告; 升級前先讀發行說明 |
| CISA Known Exploited Vulnerabilities (KEV) | 每月比對一次使用中元件是否列入 (頻率為建議值, 屬推論); 目錄由 CISA 網站提供, 建議搜尋關鍵字 "CISA Known Exploited Vulnerabilities Catalog" |
| 本手冊[元件版本與安全公告頁](/ref/versions) | 查看最後驗證日與已知問題 |
| 自家服務日誌 | 每週掃一次錯誤訊息; 位置與查看方式見 [M1.7 節](/build/m1-inference) |

## O3.2 案例: LiteLLM 2026 年兩次供應鏈事件

兩次事件的詳細時間線見 [M5.3 節](/build/m5-gateway-identity). 從維運角度可歸納三個教訓:

1. **浮動標籤不可信**: 2026-10-21 事件中, Docker Hub 上的 v1.107.0, latest, main-latest 與 main-stable 標籤都曾指向惡意映像 (來源: LiteLLM 官方事故報告).
2. **事件起點常在上游的小疏失**: 2026-03 事件起於 CI/CD 中未鎖定版本的 Trivy 掃描工具, 發布權杖因此外洩 (來源: Snyk); 2026-10 事件中, 官方事故報告指出發布權限曾暫時放寬, 攻擊者取得開發者的 GitHub CLI 憑證後修改發布流程, 入口點官方表示尚未確認 (來源: LiteLLM 官方事故報告).
3. **風險集中於保存金鑰的服務**: 閘道集中保存上游金鑰, 一旦入侵, 所有金鑰都須視為外洩; 官方事故報告要求輪替代理資料庫中的每一把供應商金鑰 (來源: LiteLLM 官方事故報告).

## O3.3 金鑰輪替與小團隊帳號管理

### 事件處理順序

LiteLLM 2026-10 事故報告建議從頭重建映像與環境, 並輪替所有憑證 (來源: LiteLLM 官方事故報告). 下列「隔離, 重建, 輪替」三步為整理者歸納的處理順序 (推論, 信心: 中高), 2026-03 事件的官方建議來源待補:

1. **隔離**: 中斷受影響主機的對外網路, 停止相關容器.
2. **重建**: 以已知安全的版本 (依官方公告指定) 重新建立容器與環境, 不在原主機上修補. 2026-10 事故報告指定回到 1.106.2, 並稱從頭重建映像與虛擬環境較佳.
3. **輪替**: 更換該主機上存放過的所有金鑰, 包含上游 API 金鑰與資料庫密碼.

### 事先準備

- 列出所有存放金鑰的位置 (`.env`, 閘道設定, 介面設定).
- 上游金鑰只給最低權限並設用量上限, 使外洩損失有上限.
- 演練一次輪替, 確認能在一小時內完成 (信心: 低, 此時間為建議目標, 非來源資料).

### 小團隊帳號

- 每位使用者使用個別帳號, 並關閉公開註冊.
- 人員異動時, 當天停用帳號並檢視其持有的虛擬金鑰.
- 帳號清單每季檢視一次.

## 參考來源

- [LiteLLM 官方部落格: Security incident Oct 21, 2026](https://docs.litellm.ai/blog/security-incident-oct-21-2026)
- [Snyk: Poisoned security scanner backdooring LiteLLM](https://snyk.io/blog/poisoned-security-scanner-backdooring-litellm/)
- [GitHub Docs: Managing security notifications](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-security-notifications)
- 手冊內部連結: [M5.3 節 LiteLLM 事件時間線](/build/m5-gateway-identity), [元件版本與安全公告頁](/ref/versions)
- CISA KEV 目錄: 本輪未能擷取, 不列連結; 搜尋關鍵字 "CISA Known Exploited Vulnerabilities Catalog"

整理者建議 (推論, 無外部來源): O3.1 的檢查頻率 (每週, 每月), O3.3 的事先準備清單與「一小時內完成輪替」的目標, 以及小團隊帳號管理做法 (個別帳號, 當天停用, 每季檢視). 結論段的「事件多半從更新含惡意程式的版本或服務對外暴露開始」屬整理者歸納 (信心: 中高), 依據為 K6.1 與 K6.2 所列公開事件.
