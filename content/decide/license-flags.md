# 授權紅旗

::: info 本頁屬性
- 等級: 決策參考
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 授權條款會改版, 對外提供服務前請以各專案儲存庫的授權檔為準; 本頁不構成法律意見; Dify 授權改版紀錄與 LangGraph 正式環境授權金鑰的官方文字說明來源待補, 見頁尾「參考來源」
:::

**結論**: 個人與內部使用通常不受授權限制影響 (信心: 中). 一旦要對外提供服務, 或把多個元件組成產品, 就要先檢查下列紅旗. 各元件的授權明細見[授權速查](/ref/licenses).

| 紅旗 | 說明 | 涉及的元件 (依授權速查) |
|---|---|---|
| 原始碼公開但非 OSI 開源 | 授權對使用方式設有限制, 不能當作一般開源元件處理 | n8n, Dify, LobeHub, MinerU, Arize Phoenix, Open WebUI (品牌條款) |
| 品牌或標示條款 | 限制修改或移除標示 | Open WebUI, Dify |
| 多租戶服務限制 | 未經書面授權不得營運多租戶服務 | Dify |
| 規模或營收門檻 | 超過門檻須另取商業授權 | MinerU |
| 衍生作品散布限制 | 散布修改後的衍生作品須商業授權 | LobeHub |
| 部分目錄或功能另有授權 | 同一專案內不同目錄授權不同 | LiteLLM (`enterprise/` 目錄), LibreChat (管理面板為另一儲存庫, 授權為 AGPL), LangGraph (官方 Agent Server 在正式環境須授權金鑰, 官方文件出處待補) |
| 模型授權 | 須申請下載, 或附使用條款 | Llama 4 Community License, Gemma 條款 (Gemma 4 以前; Gemma 4 為 Apache 2.0) |
| 授權會改版 | 同一專案可能在新版改授權 | MinerU, LobeHub 都曾改過; Dify 的授權條文載明提供者可調整條款, 改版紀錄來源待補 |

## 建議做法

1. 對外提供服務前, 列出所有元件與模型的授權, 找出上表中有紅旗的元件.
2. 有紅旗的元件時, 優先尋找授權較寬鬆的替代品, 其次才評估取得商業授權.
3. 組合多個元件時, 最嚴格的條款決定能做什麼 (信心: 中).
4. 記錄所用版本的授權原文與取得日期, 授權改版時才能比對.
5. 有疑義時請洽法律顧問.

## 參考來源

本頁的紅旗分類與建議做法是整理者的歸納 (信心: 中, 推論); 各元件的授權內容以下列授權原文為準. 授權原文由 raw.githubusercontent.com 擷取, 擷取日 2026-10-26, 授權會改版, 引用前請重新核對.

**「原始碼公開」與 OSI 開源的界線**

- OSI 的開源定義第 6 條: 授權不得限制任何人在特定領域使用程式. 授權對使用方式設限者, 依此條不屬 OSI 開源 (整理者依條文判斷, 信心: 中高). [The Open Source Definition (OSI)](https://opensource.org/osd)
- n8n 官方文件自述: 依 OSI, 開源授權不能限制使用方式, 因此不稱自己為開源; Sustainable Use License 限定只能用於自己的內部業務或非商業, 個人用途, 散布須免費且非商業. [n8n 文件: Community license](https://docs.n8n.io/n8n-community-license/), [n8n 文件: Sustainable Use License](https://docs.n8n.io/n8n-community-license/sustainable-use-license)
- Open WebUI: LICENSE 第 4 條禁止更動, 移除或遮蔽「Open WebUI」品牌, 例外為任一 30 天內終端使用者不超過 50 人, 取得書面許可, 或取得企業授權. 官方文件說明 v0.6.6 起的授權不是 OSI 核准的開源授權. [LICENSE 原文](https://raw.githubusercontent.com/open-webui/open-webui/main/LICENSE), [Open WebUI 文件: License](https://docs.openwebui.com/license)
- Dify: 以 Apache 2.0 修改, 附加條件為未經書面授權不得用原始碼營運多租戶環境 (一個 workspace 為一個租戶), 使用前端時不得移除或修改 LOGO 與著作權資訊; 貢獻者同意提供者可調整授權. [LICENSE 原文](https://raw.githubusercontent.com/langgenius/dify/main/LICENSE), [Dify 文件: Open Source License](https://docs.dify.ai/policies/open-source)
- Arize Phoenix: Elastic License 2.0, 條文禁止將軟體以託管或受管服務提供給第三方, 並禁止規避授權金鑰功能. [LICENSE 原文](https://raw.githubusercontent.com/Arize-ai/phoenix/main/LICENSE)

**規模門檻, 衍生作品與部分目錄另有授權**

- MinerU: 以 Apache 2.0 加附加條款; 合併計算月活躍使用者超過 1 億, 或月總收入超過 2,000 萬美元, 須另取商業授權; 對第三方提供線上服務須標示使用 MinerU; 未取得授權或未標示, 授權自動終止. [LICENSE 原文](https://raw.githubusercontent.com/opendatalab/MinerU/master/LICENSE.md)
- LobeHub (原 LobeChat): 1.0 起採 LobeHub Community License, 可作為前後端服務商用 (不修改原始碼), 開發並散布衍生作品須取得商業授權. [LICENSE 原文](https://raw.githubusercontent.com/lobehub/lobe-chat/main/LICENSE)
- LiteLLM: `enterprise/` 目錄內容依該目錄的 LICENSE, 其餘為 MIT. [LICENSE 原文](https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE)
- LibreChat: 主儲存庫為 MIT; 管理面板是另一個儲存庫 (ClickHouse/librechat-admin-panel), LICENSE 為 GNU AGPL v3, 官方文件頁連到該儲存庫. [主儲存庫 LICENSE](https://raw.githubusercontent.com/danny-avila/LibreChat/main/LICENSE), [管理面板 LICENSE](https://raw.githubusercontent.com/ClickHouse/librechat-admin-panel/main/LICENSE), [LibreChat 文件: Admin Panel](https://www.librechat.ai/docs/features/admin_panel)
- LangGraph Agent Server: 自架的獨立伺服器部署文件列出環境變數 `LANGGRAPH_CLOUD_LICENSE_KEY` (啟動時驗證一次), 並要求連線到 LangChain 端點做授權驗證與用量回報 (非隔離網路時). 「正式環境須授權金鑰」的說法, 目前只有 LangChain 論壇的回覆 (回覆者角色未標明, 屬二手來源) 寫明「正式環境的完整自架目前需要企業授權」; 官方文件的對應文字來源待補. [LangChain 文件: Self-host standalone servers](https://docs.langchain.com/langsmith/deploy-standalone-server), [LangChain 論壇: Question about the license (二手來源)](https://forum.langchain.com/t/question-about-the-license/2242)

**模型授權**

- Llama 4 Community License (2025-04-05 生效): 前一個月月活躍使用者超過 7 億須向 Meta 申請授權; 散布時須顯著標示「Built with Llama」; 須遵守 Acceptable Use Policy. Hugging Face 上的模型頁需登入並填寫表單後才能存取. [Llama 4 Community License](https://www.llama.com/llama4/license/), [Hugging Face: Llama-4-Scout-17B-16E-Instruct](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct)
- Gemma: Gemma Terms of Use (2026-04-01 修訂) 適用於 Gemma 4 以前的模型, 使用限制納入 Prohibited Use Policy; Gemma 4 另依 Apache 2.0 發布. [Gemma Terms of Use](https://ai.google.dev/gemma/terms), [Google Open Source Blog: Gemma 4 與 Apache 2.0](https://opensource.googleblog.com/2026/03/gemma-4-expanding-the-gemmaverse-with-apache-20.html)

**授權會改版**

- MinerU: 3.1.0 發行說明 (2026-04-18) 記載由 AGPLv3 改為 MinerU Open Source License; 此為 GitHub 發行說明的彙整鏡像 (二手來源), 尚未改連 GitHub 原頁. [newreleases.io: MinerU 3.1.0](https://newreleases.io/project/github/opendatalab/MinerU/release/mineru-3.1.0-released)
- LobeHub: LICENSE 檔頭寫明「From 1.0, LobeChat is licensed under the LobeHub Community License」, 即 1.0 起改採該授權 (見上方 LICENSE 原文).
- Dify: 授權條文載明提供者可調整條款, 但未查到實際改版紀錄, 來源待補.

「組合多個元件時, 最嚴格的條款決定能做什麼」是整理者判斷 (信心: 中), 無外部來源; 授權疊加的討論見 [K4](/know/k4-licenses).
