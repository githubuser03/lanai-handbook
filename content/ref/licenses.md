---
description: "個人與內部使用多半不受授權限制, 限制集中在「對外提供服務」與「散布」."
---

# 授權速查

::: info 本頁屬性
- 等級: 參考資料
- 狀態: 可閱讀
- 資料基準日: 2026-10-27
- 實機驗證: 不適用
:::

**結論**: 個人與內部使用多半不受授權限制, 限制集中在「對外提供服務」與「散布」. 對外提供服務前, 先確認表中標為非 OSI 開源的元件, 以及模型授權的條件 (例如使用者數門檻, 標示義務, 研究用途限定), 最嚴格的條款決定能做什麼 (信心: 中).

::: warning 使用前請先看
授權條款會改版 (MinerU 與 LobeHub 都曾改過, 見頁尾「授權改版紀錄」; Dify 的條文載明提供者可調整條款), 以下為 2026-10-27 研究整理, 對外提供服務前請以各專案儲存庫的授權檔為準. 個人與內部使用通常不受影響 (信心: 中). 本頁不構成法律意見, 如有疑義請洽法律顧問.
:::

## OSI 開源與「原始碼公開」

授權是作者對使用方式訂下的規則. 「開源」在業界有明確的定義, 看得到原始碼不等於開源.

OSI (Open Source Initiative) 定義的開源授權不得對使用方式設限. 授權對使用方式有限制者, 原始碼雖然公開, 但不屬於 OSI 開源. 以 n8n 為例, 其授權檔 (Sustainable Use License) 規定軟體只能用於自身內部業務或非商業用途, 與 OSI 開源定義第 6 條 (授權不得限制特定使用領域) 不符. n8n 官方文件也自述: 原始碼依 Sustainable Use License 公開, 但「open source licenses can't include limitations on use, so we do not call ourselves open source」(來源: n8n 文件 Community license, 2026-10-27 擷取).

本手冊對這類專案稱「原始碼公開」, 不稱「開源」.

## 軟體授權

下表依手冊架構列出各軟體在系統中的角色, 再列授權. 角色欄的模組代號見[架構圖](/start/map).

| 專案 | 在系統中的角色 | 授權 | OSI 開源 | 對外提供服務時的重點 |
|---|---|---|---|---|
| Open WebUI | 使用者介面層 (M2): 在瀏覽器裡和模型對話的網頁介面 | Open WebUI License (BSD-3 條款加品牌條款) | 否 | 品牌條款禁止修改或移除 "Open WebUI" 標示; 例外為任意連續 30 日內終端使用者不超過 50 人, 或取得書面許可或企業授權 |
| LibreChat | 使用者介面層 (M2): Open WebUI 的替代對話介面 | MIT (管理面板為 AGPL) | 是 | 管理面板為獨立儲存庫, 授權檔為 AGPL-3.0, 須另行留意 |
| AnythingLLM | 使用者介面層 (M2): 內建文件問答的對話介面 | MIT | 是 | - |
| LobeHub (原 LobeChat) | 使用者介面層: 對話介面, 手冊未採用 | LobeHub Community License | 否 | 散布修改後的衍生作品須商業授權, 不適合手冊建議改作 |
| LiteLLM | 閘道層 (M5): 擋在介面與推論伺服器之間, 集中管理 API 金鑰, 配額與模型路由 | MIT, `enterprise/` 目錄另有授權 | 部分 | `enterprise/` 目錄的程式碼於正式環境使用須簽訂 BerriAI 企業條款; 管理介面的 SSO 自 v1.76.0 起 5 位使用者以內免費, 超過須企業授權; 稽核紀錄, 角色權限控管等也列為企業功能 |
| LangGraph 程式庫 | 代理層 (M8): 用程式定義代理流程的程式庫; Agent Server 是執行這些流程的伺服器 | MIT | 是 | 程式庫本身為 MIT; 自架 Agent Server 須 Enterprise 方案與隨方案提供的授權金鑰 (LANGGRAPH_CLOUD_LICENSE_KEY) |
| Langflow | 低程式碼平台: 以拖拉方式組出 AI 流程的視覺化工具, 手冊未採用 | MIT | 是 | - |
| n8n | 流程自動化層 (M9): 以節點串接排程, API 與模型呼叫的自動化平台 | Sustainable Use License 與 Enterprise License | 否 | 限自身內部業務或非商業用途; 檔名含 `.ee.` 的原始碼須企業授權; 官方自述非開源 |
| Flowise | 低程式碼平台: 以拖拉方式組出 AI 流程的工具, 手冊未採用 | Apache 2.0 (`packages/server/src/enterprise` 目錄為商業授權) | 部分 | 企業目錄的程式碼須商業授權 |
| Dify | 低程式碼平台: 讓使用者以拖拉方式組出 AI 應用流程, 並內建知識庫的平台 | Dify Open Source License (以 Apache 2.0 修改) | 否 | 未經書面授權不得營運多租戶服務 (一個 workspace 為一個租戶); 使用前端 (`web/`) 時不得移除標誌與版權資訊 |
| MinerU | 文件解析工具: 把 PDF 等文件轉成文字與表格, 手冊未採用 (M4 採 Docling 或 Marker) | MinerU Open Source License (Apache 2.0 加附加條款; 3.1.0 起採用, 3.0.x 以前為 AGPL-3.0) | 否 | 月活躍使用者超過 1 億或月營收超過 2,000 萬美元須另取商業授權; 線上服務須標示 |
| Docling | 文件解析 (M4): 把 PDF, Word 等文件轉成適合檢索的文字 | MIT | 是 | - |
| Qdrant | 向量庫 (M4): 存放文件段落的向量, 依意思找出相關段落 | Apache 2.0 | 是 | - |
| Arize Phoenix | 可觀測層 (M6): 記錄並檢視每次模型呼叫的追蹤平台 | Elastic License 2.0 | 否 | 不得將軟體作為託管或管理服務提供給第三方 |
| promptfoo | 評估 (M6) 與模型入庫 (M3): 用測試集比較模型回答; 旗下 ModelAudit 掃描模型檔 | MIT | 是 | 所有權已變動, 見版本頁 |
| Langfuse | 可觀測層 (M6): 追蹤模型呼叫與評估結果的平台 | MIT (`ee/` 等目錄另有授權) | 部分 | `ee/` 目錄的程式碼不在 MIT 範圍 |
| llama-swap | 模型切換層 (M1): 依請求自動切換載入的模型, 讓多個模型輪流使用顯示記憶體 | MIT | 是 | - |
| pgvector | 向量庫 (M4): 讓 PostgreSQL 資料庫支援向量搜尋的擴充套件 | PostgreSQL License | 是 | - |
| sqlite-vec | 向量庫 (M4): 讓 SQLite 支援向量搜尋的擴充套件, 適合單機 | MIT 與 Apache 2.0 雙授權 | 是 | 儲存庫同時附兩份授權檔 |

## 模型授權

| 模型 | 授權 | 備註 |
|---|---|---|
| Llama 系列 (含 Prompt Guard 2, Llama Guard 4) | Llama 4 Community License | 對話模型, 以及判斷輸入是否為攻擊或違規內容的護欄分類模型. Hugging Face 上須登入並填表取得存取權. 授權要點: 以 Llama 4 版本發布日為準, 發布日前一個月的月活躍使用者超過 7 億者須向 Meta 申請授權 (一次性判定); 須顯示 "Built with Llama"; 須遵守 Acceptable Use Policy |
| nomic-embed-text-v2-moe | Apache 2.0 | 嵌入模型 (M4), 把文字轉成向量. Nomic AI 發布, 總參數 475M, 每次運算啟用 305M (MoE) |
| EmbeddingGemma | Gemma Terms of Use | 嵌入模型 (M4). Google 發布, 約 3 億參數; 須接受條款才能下載. 條款要點: 散布時須轉遞使用限制並附條款全文; Google 不主張對輸出內容的權利 |
| Gemma-3-TAIDE-12b-Chat-2602 | Gemma-TAIDE (TAIDE G 類) 模型授權條款, 另受 Gemma Terms of Use 約束 | 繁體中文對話模型, 基底為 google/gemma-3-12b-pt; 須接受條款才能下載. 條款授予非專屬, 全球, 無償的使用授權, 條文未設使用者數或營收門檻, 散布衍生模型時可向使用者收費; 散布時須附 Gemma Terms of Use 聲明並標示源自 TAIDE G 類模型及 taide.tw; 衍生模型在中華民國境內外提供使用授權, 或參加國內組織舉辦的排名比賽時, 須在模型說明中以顯著方式標示為 TAIDE G 類模型的衍生作品 (條款第七條); 不得用於軍事或非法目的, 不得產生非法或不當言論, 也不得表示內容由人類生成; 條款修訂於發布時立即生效 |
| llama-nemotron-rerank-1b-v2 | OpenMDW-1.1, 另附 Llama 3.2 Community License | 重排序模型 (M4), 把檢索結果重新排序. NVIDIA 發布, 以 Llama-3.2-1B 微調; 模型卡標示可商用. Llama 3.2 授權要點: 以 Llama 3.2 版本發布日為準, 發布日前一個月的月活躍使用者超過 7 億者須向 Meta 申請授權 (一次性判定); 散布時須附授權副本並顯著標示 "Built with Llama"; 以其訓練或微調並散布的模型, 名稱開頭須含 "Llama"; 須遵守 Acceptable Use Policy; 準據法為美國加州法 |
| mmarco-mMiniLMv2-L12-H384-v1 | Apache 2.0 | 重排序模型 (M4). cross-encoder 發布的多語言模型, 以機器翻譯的 MS MARCO 訓練 |

其餘模型授權見 [K4](/know/k4-licenses).

## 授權疊加

組合多個元件後再對外提供服務時, 最嚴格的條款決定能做什麼 (信心: 中). 原始碼公開但非 OSI 開源的元件清單: Open WebUI, Dify, LobeHub, MinerU, Arize Phoenix, n8n; 模型端另有 Llama 4 Community License.

## 參考來源

授權條款全文與官方頁面 (2026-10-26 擷取, 2026-10-27 補充):

- [Open Source Definition, OSI](https://opensource.org/osd)
- [Open WebUI 授權檔](https://raw.githubusercontent.com/open-webui/open-webui/main/LICENSE)
- [LibreChat 授權檔](https://raw.githubusercontent.com/danny-avila/LibreChat/main/LICENSE), [LibreChat 管理面板授權檔](https://raw.githubusercontent.com/ClickHouse/librechat-admin-panel/main/LICENSE), [LibreChat 管理面板文件](https://www.librechat.ai/docs/features/admin_panel)
- [AnythingLLM 授權檔](https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/master/LICENSE)
- [LobeHub Community License](https://raw.githubusercontent.com/lobehub/lobe-chat/main/LICENSE)
- [LiteLLM 授權檔](https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE), [LiteLLM enterprise 授權檔](https://raw.githubusercontent.com/BerriAI/litellm/main/enterprise/LICENSE.md), [LiteLLM 文件: Enterprise (企業功能清單)](https://docs.litellm.ai/docs/enterprise), [LiteLLM 文件: Admin UI SSO (v1.76.0 起 5 位使用者以內免費)](https://docs.litellm.ai/docs/proxy/admin_ui_sso.md)
- [LangGraph 授權檔](https://raw.githubusercontent.com/langchain-ai/langgraph/main/LICENSE), [LangChain 文件: 自行部署 standalone server](https://docs.langchain.com/langsmith/deploy-standalone-server), [LangChain 文件: Self-hosted 部署總覽 (自架須 Enterprise 方案與授權金鑰)](https://docs.langchain.com/langsmith/deploy-to-self-hosted-overview)
- [Langflow 授權檔](https://raw.githubusercontent.com/langflow-ai/langflow/main/LICENSE)
- [n8n 授權檔](https://raw.githubusercontent.com/n8n-io/n8n/master/LICENSE.md), [n8n 文件: Community license (非 OSI 開源的自述)](https://docs.n8n.io/n8n-community-license/)
- [Flowise 授權檔](https://raw.githubusercontent.com/FlowiseAI/Flowise/main/LICENSE.md)
- [Dify 授權檔](https://raw.githubusercontent.com/langgenius/dify/main/LICENSE), [Dify 文件: Open Source License](https://docs.dify.ai/policies/open-source)
- [MinerU 授權檔](https://raw.githubusercontent.com/opendatalab/MinerU/master/LICENSE.md)
- [Docling 授權檔](https://raw.githubusercontent.com/docling-project/docling/main/LICENSE)
- [Qdrant 授權檔](https://raw.githubusercontent.com/qdrant/qdrant/master/LICENSE)
- [Arize Phoenix 授權檔](https://raw.githubusercontent.com/Arize-ai/phoenix/main/LICENSE)
- [promptfoo 授權檔](https://raw.githubusercontent.com/promptfoo/promptfoo/main/LICENSE)
- [Langfuse 授權檔](https://raw.githubusercontent.com/langfuse/langfuse/main/LICENSE)
- [llama-swap 授權檔](https://raw.githubusercontent.com/mostlygeek/llama-swap/main/LICENSE.md), [pgvector 授權檔](https://raw.githubusercontent.com/pgvector/pgvector/master/LICENSE), [sqlite-vec MIT 授權檔](https://raw.githubusercontent.com/asg017/sqlite-vec/main/LICENSE-MIT), [sqlite-vec Apache 2.0 授權檔](https://raw.githubusercontent.com/asg017/sqlite-vec/main/LICENSE-APACHE)

模型授權 (官方授權頁與模型卡):

- [Hugging Face 模型卡: nvidia/llama-nemotron-rerank-1b-v2](https://huggingface.co/nvidia/llama-nemotron-rerank-1b-v2)
- [Hugging Face 模型卡: cross-encoder/mmarco-mMiniLMv2-L12-H384-v1](https://huggingface.co/cross-encoder/mmarco-mMiniLMv2-L12-H384-v1/blob/265d6fb9678e8fc6b1adeda526533b2a1f1a7f07/README.md)
- [Llama 4 Community License Agreement](https://dev.meta.ai/llama/llama4/license), [Llama Guard 4 模型卡](https://huggingface.co/meta-llama/Llama-Guard-4-12B), [Llama Prompt Guard 2 模型卡](https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-86M)
- [Gemma Terms of Use](https://ai.google.dev/gemma/terms), [EmbeddingGemma 模型卡](https://huggingface.co/google/embeddinggemma-300m)
- [nomic-embed-text-v2-moe 模型卡](https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe)
- [Gemma-3-TAIDE-12b-Chat-2602 模型卡](https://huggingface.co/taide/Gemma-3-TAIDE-12b-Chat-2602), [國研院 TAIDE 模型下載與授權條款頁 (Llama3-TAIDE 與 Gemma-TAIDE 兩套條款全文)](https://taide.stpi.niar.org.tw/public/download-model)
- [Llama 3.2 Community License (Meta 發布於 Hugging Face 模型庫的授權檔)](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct/blob/main/LICENSE.txt)

授權改版紀錄 (2026-10-27 查詢):

- MinerU: 比對 PyPI 上的套件中繼資料, 3.0.0 與 3.0.9 標示 `License: AGPL-3.0`, 附帶的授權檔為 GNU AGPL v3; 3.1.0 改為 `LicenseRef-MinerU-Open-Source-License`, 授權檔為 MinerU Open Source License. 版本界線因此在 3.1.0 (以 `pip download` 取得兩版套件後比對, 屬整理者查證). [MinerU 授權檔](https://raw.githubusercontent.com/opendatalab/MinerU/master/LICENSE.md)
- LobeHub: 官方部落格 (2024-03-28) 說明專案自始採 MIT, 1.0 起改為附加商業授權條款的授權; 現行 LICENSE 檔頭寫明 1.0 起採 LobeHub Community License. [LobeHub 部落格: Towards LobeChat 1.0](https://lobehub.com/pt-BR/blog/towards-lobe-chat-v1), [LobeHub Community License](https://raw.githubusercontent.com/lobehub/lobe-chat/main/LICENSE)
- Dify: 授權條文與官方文件都載明提供者可將條款調整得更嚴或更寬; 實際改版的日期與內容, 公開資料查無.

所有權變動的來源見[版本頁](/ref/versions).
