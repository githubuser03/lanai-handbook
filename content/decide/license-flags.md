---
description: "個人與內部使用通常不受授權限制影響 (信心: 中), 但研究或非商業用途限定的模型授權例外, 公司內部的日常工作也不能用."
---

# 授權紅旗

::: info 本頁屬性
- 等級: 決策參考
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-27
- 待查證: 授權條款會改版, 對外提供服務前請以各專案儲存庫的授權檔為準; 本頁不構成法律意見; Dify 授權的實際改版紀錄公開資料查無 (2026-10-27 查詢); 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 個人與內部使用通常不受授權限制影響 (信心: 中), 但研究或非商業用途限定的模型授權例外, 公司內部的日常工作也不能用. 一旦要對外提供服務, 或把多個元件組成產品, 就要先檢查下列紅旗. 各元件的授權明細見[授權速查](/ref/licenses).

授權 (license) 是軟體或模型作者訂下的使用規則, 規定誰可以用, 怎麼用, 能不能修改與再散布. 授權可以想成租屋契約: 自住時多數條款用不到, 一旦轉租或改作營業用, 契約中的限制才開始發揮作用. 下表的「紅旗」就是這類對外提供服務時才會碰到的限制.

表中元件在系統中的角色: n8n 是串接排程與 API 的流程自動化平台 (M9); Dify 是以拖拉方式組出 AI 應用流程並內建知識庫的平台; LobeHub 與 Open WebUI 是在瀏覽器裡和模型對話的介面 (M2); MinerU 是把 PDF 等文件轉成文字的解析工具; Arize Phoenix 是記錄模型呼叫的追蹤平台 (M6); LiteLLM 是集中管理金鑰與配額的模型閘道 (M5); LibreChat 是另一款對話介面; LangGraph 是撰寫代理流程的程式庫 (M8). 各元件的完整角色與授權見[授權速查](/ref/licenses).

| 紅旗 | 說明 | 涉及的元件 (依授權速查) |
|---|---|---|
| 原始碼公開但非 OSI 開源 | 授權對使用方式設有限制, 不能當作一般開源元件處理 | n8n, Dify, LobeHub, MinerU, Arize Phoenix, Open WebUI (品牌條款) |
| 品牌或標示條款 | 限制修改或移除標示 | Open WebUI, Dify |
| 多租戶服務限制 | 未經書面授權不得營運多租戶服務 | Dify |
| 規模或營收門檻 | 超過門檻須另取商業授權 | MinerU |
| 衍生作品散布限制 | 散布修改後的衍生作品須商業授權 | LobeHub |
| 部分目錄或功能另有授權 | 同一專案內不同目錄授權不同 | LiteLLM (`enterprise/` 目錄), LibreChat (管理面板為另一儲存庫, 授權為 AGPL), LangGraph (程式庫為 MIT, 自架官方 Agent Server 須 Enterprise 方案與授權金鑰) |
| 模型授權 | 須申請下載, 或附使用條款 | Llama 4 Community License, Gemma 條款 (Gemma 4 以前; Gemma 4 為 Apache 2.0) |
| 研究或非商業用途限定 | 公司員工的日常工作, 營利目的的測試與 PoC 都不在允許範圍; 這一類連內部使用都受限 | Mistral AI Research License (例如 Mistral-Large-Instruct-2411), CC BY-NC 類授權的模型 (例如 xLAM-2-8b-fc-r) |
| 授權會改版 | 同一專案可能在新版改授權 | MinerU (3.1.0 起由 AGPL-3.0 改為自訂授權), LobeHub (1.0 起由 MIT 改為自訂授權); Dify 的授權條文載明提供者可調整條款 |

表中的 OSI (Open Source Initiative) 是維護開源定義的組織, 符合其定義的授權才稱為開源; 多租戶指同一套系統同時服務多個彼此獨立的客戶或組織.

## 建議做法

1. 對外提供服務前, 列出所有元件與模型的授權, 找出上表中有紅旗的元件.
2. 有紅旗的元件時, 優先尋找授權較寬鬆的替代品, 其次才評估取得商業授權.
3. 組合多個元件時, 最嚴格的條款決定能做什麼 (信心: 中).
4. 記錄所用版本的授權原文與取得日期, 授權改版時才能比對.
5. 有疑義時請洽法律顧問.

## 參考來源

本頁的紅旗分類與建議做法是整理者的歸納 (信心: 中, 推論); 各元件的授權內容以下列授權原文為準. 授權原文由 raw.githubusercontent.com 擷取, 擷取日 2026-10-26 (2026-10-27 補充官方文件), 授權會改版, 引用前請重新核對.

**「原始碼公開」與 OSI 開源的界線**

- OSI 的開源定義第 6 條: 授權不得限制任何人在特定領域使用程式. 授權對使用方式設限者, 依此條不屬 OSI 開源 (整理者依條文判斷, 信心: 中). [The Open Source Definition (OSI)](https://opensource.org/osd)
- n8n 官方文件自述: 依 OSI, 開源授權不能限制使用方式, 因此不稱自己為開源; Sustainable Use License 限定只能用於自己的內部業務或非商業, 個人用途, 散布須免費且非商業. [n8n 文件: Community license](https://docs.n8n.io/n8n-community-license/), [n8n 文件: Sustainable Use License](https://docs.n8n.io/n8n-community-license/sustainable-use-license)
- Open WebUI: LICENSE 第 4 條禁止更動, 移除或遮蔽「Open WebUI」品牌, 例外為任一 30 天內終端使用者不超過 50 人, 以實質貢獻者身分取得書面許可 (官方說明僅限特例), 或取得企業授權. 官方文件說明 v0.6.6 起的授權不是 OSI 核准的開源授權. [LICENSE 原文](https://raw.githubusercontent.com/open-webui/open-webui/main/LICENSE), [Open WebUI 文件: License](https://docs.openwebui.com/license)
- Dify: 以 Apache 2.0 修改, 附加條件為未經書面授權不得用原始碼營運多租戶環境 (一個 workspace 為一個租戶), 使用前端時不得移除或修改 LOGO 與著作權資訊; 貢獻者同意提供者可調整授權. [LICENSE 原文](https://raw.githubusercontent.com/langgenius/dify/main/LICENSE), [Dify 文件: Open Source License](https://docs.dify.ai/policies/open-source)
- Arize Phoenix: Elastic License 2.0, 條文禁止將軟體以託管或受管服務提供給第三方, 並禁止規避授權金鑰功能. [LICENSE 原文](https://raw.githubusercontent.com/Arize-ai/phoenix/main/LICENSE)

**規模門檻, 衍生作品與部分目錄另有授權**

- MinerU: 以 Apache 2.0 加附加條款; 合併計算月活躍使用者超過 1 億, 或月總收入超過 2,000 萬美元, 須另取商業授權; 對第三方提供線上服務須標示使用 MinerU; 未取得授權或未標示, 授權自動終止. [LICENSE 原文](https://raw.githubusercontent.com/opendatalab/MinerU/master/LICENSE.md)
- LobeHub (原 LobeChat): 1.0 起採 LobeHub Community License, 可作為前後端服務商用 (不修改原始碼), 開發並散布衍生作品須取得商業授權. [LICENSE 原文](https://raw.githubusercontent.com/lobehub/lobe-chat/main/LICENSE)
- LiteLLM: `enterprise/` 目錄內容依該目錄的 LICENSE, 其餘為 MIT. 官方文件列出 SSO, 稽核紀錄, 角色權限控管等企業功能; 管理介面 SSO 自 v1.76.0 起 5 位使用者以內免費, 超過須企業授權. [LICENSE 原文](https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE), [LiteLLM 文件: Enterprise](https://docs.litellm.ai/docs/enterprise), [LiteLLM 文件: Admin UI SSO](https://docs.litellm.ai/docs/proxy/admin_ui_sso.md)
- LibreChat: 主儲存庫為 MIT; 管理面板是另一個儲存庫 (ClickHouse/librechat-admin-panel), LICENSE 為 GNU AGPL v3, 官方文件頁連到該儲存庫. [主儲存庫 LICENSE](https://raw.githubusercontent.com/danny-avila/LibreChat/main/LICENSE), [管理面板 LICENSE](https://raw.githubusercontent.com/ClickHouse/librechat-admin-panel/main/LICENSE), [LibreChat 文件: Admin Panel](https://www.librechat.ai/docs/features/admin_panel)
- LangGraph Agent Server: 自架的獨立伺服器部署文件列出環境變數 `LANGGRAPH_CLOUD_LICENSE_KEY` (啟動時驗證一次), 並要求連線到 LangChain 端點做授權驗證與用量回報 (非隔離網路時). 官方的自架部署總覽寫明「Self-hosted deployments require an Enterprise plan and the LangSmith license key delivered with that plan」, 並把 standalone server 列為三種自架方式之一 (2026-10-27 擷取). [LangChain 文件: Self-host standalone servers](https://docs.langchain.com/langsmith/deploy-standalone-server), [LangChain 文件: Self-hosted 部署總覽](https://docs.langchain.com/langsmith/deploy-to-self-hosted-overview)

**模型授權**

- Llama 4 Community License (2025-04-05 生效): 以 Llama 4 版本發布日為準, 發布日前一個月的月活躍使用者超過 7 億者須向 Meta 申請授權; 散布時須顯著標示「Built with Llama」; 須遵守 Acceptable Use Policy. Hugging Face 上的模型頁需登入並填寫表單後才能存取. [Llama 4 Community License](https://www.llama.com/llama4/license/), [Hugging Face: Llama-4-Scout-17B-16E-Instruct](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct)
- Gemma: Gemma Terms of Use (2026-04-01 修訂) 適用於 Gemma 4 以前的模型, 使用限制納入 Prohibited Use Policy; Gemma 4 另依 Apache 2.0 發布. [Gemma Terms of Use](https://ai.google.dev/gemma/terms), [Google Open Source Blog: Gemma 4 與 Apache 2.0](https://opensource.googleblog.com/2026/03/gemma-4-expanding-the-gemmaverse-with-apache-20.html)

- 研究或非商業用途限定: Mistral AI Research License 把公司員工或外包人員在日常工作中的使用, 以及以營收為目的的活動, 排除在研究用途之外 (要點見 [K4](/know/k4-licenses)); xLAM-2-8b-fc-r 的模型卡標示 cc-by-nc-4.0, 並說明僅供研究用途. [Mistral AI Research License (MRL-0.1)](https://mistral.ai/static/licenses/MRL-0.1.md), [Hugging Face: Salesforce/Llama-xLAM-2-8b-fc-r](https://huggingface.co/Salesforce/Llama-xLAM-2-8b-fc-r)

**授權會改版**

- MinerU: PyPI 套件中繼資料顯示 3.0.0 與 3.0.9 為 `AGPL-3.0`, 3.1.0 改為 `LicenseRef-MinerU-Open-Source-License`, 附帶的授權檔也隨之更換 (2026-10-27 以 `pip download` 取得兩版套件後比對, 屬整理者查證). 另有 GitHub 發行說明的彙整鏡像記載 3.1.0 (2026-04-18) 改授權 (二手來源). [MinerU 授權檔](https://raw.githubusercontent.com/opendatalab/MinerU/master/LICENSE.md), [newreleases.io: MinerU 3.1.0 (二手來源)](https://newreleases.io/project/github/opendatalab/MinerU/release/mineru-3.1.0-released)
- LobeHub: 官方部落格 (2024-03-28) 說明專案自始採 MIT, 1.0 起改為附加商業授權條款的授權; LICENSE 檔頭寫明「From 1.0, LobeChat is licensed under the LobeHub Community License」. [LobeHub 部落格: Towards LobeChat 1.0](https://lobehub.com/pt-BR/blog/towards-lobe-chat-v1), [LICENSE 原文](https://raw.githubusercontent.com/lobehub/lobe-chat/main/LICENSE)
- Dify: 授權條文與官方文件都載明「The producer can adjust the open-source agreement to be more strict or relaxed」; 實際改版的日期與內容, 公開資料查無 (2026-10-27 查詢, 含 Dify 官方文件與授權資料庫 ScanCode LicenseDB). [Dify 文件: Open Source License](https://docs.dify.ai/policies/open-source), [ScanCode LicenseDB: dify-exception-apache-2.0](https://scancode-licensedb.aboutcode.org/dify-exception-apache-2.0.html)

「組合多個元件時, 最嚴格的條款決定能做什麼」是整理者判斷 (信心: 中), 無外部來源; 授權疊加的討論見 [K4](/know/k4-licenses).

文中的類比 (租屋契約): 整理者所寫, 無外部來源, 不應當作技術定義引用.
