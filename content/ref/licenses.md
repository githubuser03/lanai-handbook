# 授權速查

::: warning 使用前請先看
授權條款會改版 (Dify, MinerU, LobeHub 都曾改過, 改版紀錄來源待補), 以下為 2026-10-26 研究整理, 對外提供服務前請以各專案儲存庫的授權檔為準. 個人與內部使用通常不受影響 (信心: 中). 本頁不構成法律意見, 如有疑義請洽法律顧問.
:::

## OSI 開源與「原始碼公開」

授權是作者對使用方式訂下的規則. 「開源」在業界有明確的定義, 看得到原始碼不等於開源.

OSI (Open Source Initiative) 定義的開源授權不得對使用方式設限. 授權對使用方式有限制者, 原始碼雖然公開, 但不屬於 OSI 開源. 以 n8n 為例, 其授權檔 (Sustainable Use License) 規定軟體只能用於自身內部業務或非商業用途, 與 OSI 開源定義第 6 條 (授權不得限制特定使用領域) 不符. n8n 官方文件亦自述 "according to the Open Source Initiative (OSI), open source licenses can't include limitations on use, so we do not call ourselves open source" (此句引自先前整理, docs.n8n.io 原頁本輪未能擷取, 來源待補).

本手冊對這類專案稱「原始碼公開」, 不稱「開源」.

## 軟體授權

| 專案 | 授權 | OSI 開源 | 對外提供服務時的重點 |
|---|---|---|---|
| Open WebUI | Open WebUI License (BSD-3 條款加品牌條款) | 否 | 品牌條款禁止修改或移除 "Open WebUI" 標示; 例外為任意連續 30 日內終端使用者不超過 50 人, 或取得書面許可或企業授權 |
| LibreChat | MIT (管理面板為 AGPL) | 是 | 管理面板為獨立儲存庫, 授權檔為 AGPL-3.0, 須另行留意 |
| AnythingLLM | MIT | 是 | - |
| LobeHub (原 LobeChat) | LobeHub Community License | 否 | 散布修改後的衍生作品須商業授權, 不適合手冊建議改作 |
| LiteLLM | MIT, `enterprise/` 目錄另有授權 | 部分 | `enterprise/` 目錄的程式碼於正式環境使用須簽訂 BerriAI 企業條款; 「SSO 等功能屬企業版」的說法來源待補 |
| LangGraph 程式庫 | MIT | 是 | 自行部署官方 Agent Server 須提供授權金鑰 (LANGGRAPH_CLOUD_LICENSE_KEY) |
| Langflow | MIT | 是 | - |
| n8n | Sustainable Use License 與 Enterprise License | 否 | 限自身內部業務或非商業用途; 檔名含 `.ee.` 的原始碼須企業授權; 官方自述非開源 |
| Flowise | Apache 2.0 (`packages/server/src/enterprise` 目錄為商業授權) | 部分 | 企業目錄的程式碼須商業授權 |
| Dify | Dify Open Source License (以 Apache 2.0 修改) | 否 | 未經書面授權不得營運多租戶服務 (一個 workspace 為一個租戶); 使用前端 (`web/`) 時不得移除標誌與版權資訊 |
| MinerU | MinerU Open Source License (Apache 2.0 加附加條款; 「3.1.0 起」的版本界線來源待補) | 否 | 月活躍使用者超過 1 億或月營收超過 2,000 萬美元須另取商業授權; 線上服務須標示 |
| Docling | MIT | 是 | - |
| Qdrant | Apache 2.0 | 是 | - |
| Arize Phoenix | Elastic License 2.0 | 否 | 不得將軟體作為託管或管理服務提供給第三方 |
| promptfoo | MIT | 是 | 所有權已變動, 見版本頁 |
| Langfuse | MIT (`ee/` 等目錄另有授權) | 部分 | `ee/` 目錄的程式碼不在 MIT 範圍 |
| llama-swap | MIT | 是 | - |
| pgvector | PostgreSQL License | 是 | - |
| sqlite-vec | MIT 與 Apache 2.0 雙授權 | 是 | 儲存庫同時附兩份授權檔 |

## 模型授權

| 模型 | 授權 | 備註 |
|---|---|---|
| Llama 系列 (含 Prompt Guard 2, Llama Guard 4) | Llama 4 Community License | Hugging Face 上須登入並填表取得存取權. 授權要點: 前一曆月月活躍使用者逾 7 億須向 Meta 申請授權; 須顯示 "Built with Llama"; 須遵守 Acceptable Use Policy |
| Snowflake Arctic Embed L v2.0 | Apache 2.0 | Snowflake 發布, 約 5.7 億參數, 模型卡標示可免費商用 |
| EmbeddingGemma | Gemma Terms of Use | Google 發布, 約 3 億參數; 須接受條款才能下載. 條款要點: 散布時須轉遞使用限制並附條款全文; Google 不主張對輸出內容的權利 |
| Gemma-3-TAIDE-12b-Chat-2602 | (Gemma 版次)-TAIDE 模型授權條款 | 基底為 google/gemma-3-12b-pt; 須接受條款才能下載; 條款全文在外部連結, 商用條件本輪未擷取, 來源待補 |
| llama-nemotron-rerank-1b-v2 | OpenMDW-1.1, 另附 Llama 3.2 Community License | NVIDIA 發布的重排序模型, 以 Llama-3.2-1B 微調; 模型卡標示可商用. Llama 3.2 授權條款本輪未擷取, 對外提供服務前請讀全文 |
| mmarco-mMiniLMv2-L12-H384-v1 | Apache 2.0 | cross-encoder 發布的多語言重排序模型, 以機器翻譯的 MS MARCO 訓練 |

其餘模型授權見 [K4](/know/k4-licenses).

## 授權疊加

組合多個元件後再對外提供服務時, 最嚴格的條款決定能做什麼 (信心: 中). 原始碼公開但非 OSI 開源的元件清單: Open WebUI, Dify, LobeHub, MinerU, Arize Phoenix, n8n; 模型端另有 Llama 4 Community License.

## 參考來源

授權條款全文與官方頁面 (2026-10-26 擷取):

- [Open Source Definition, OSI](https://opensource.org/osd)
- [Open WebUI 授權檔](https://raw.githubusercontent.com/open-webui/open-webui/main/LICENSE)
- [LibreChat 授權檔](https://raw.githubusercontent.com/danny-avila/LibreChat/main/LICENSE), [LibreChat 管理面板授權檔](https://raw.githubusercontent.com/ClickHouse/librechat-admin-panel/main/LICENSE), [LibreChat 管理面板文件](https://www.librechat.ai/docs/features/admin_panel)
- [AnythingLLM 授權檔](https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/master/LICENSE)
- [LobeHub Community License](https://raw.githubusercontent.com/lobehub/lobe-chat/main/LICENSE)
- [LiteLLM 授權檔](https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE), [LiteLLM enterprise 授權檔](https://raw.githubusercontent.com/BerriAI/litellm/main/enterprise/LICENSE.md)
- [LangGraph 授權檔](https://raw.githubusercontent.com/langchain-ai/langgraph/main/LICENSE), [LangChain 文件: 自行部署 standalone server](https://docs.langchain.com/langsmith/deploy-standalone-server)
- [Langflow 授權檔](https://raw.githubusercontent.com/langflow-ai/langflow/main/LICENSE)
- [n8n 授權檔](https://raw.githubusercontent.com/n8n-io/n8n/master/LICENSE.md)
- [Flowise 授權檔](https://raw.githubusercontent.com/FlowiseAI/Flowise/main/LICENSE.md)
- [Dify 授權檔](https://raw.githubusercontent.com/langgenius/dify/main/LICENSE)
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
- [Snowflake Arctic Embed L v2.0 模型卡](https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0)
- [Gemma-3-TAIDE-12b-Chat-2602 模型卡](https://huggingface.co/taide/Gemma-3-TAIDE-12b-Chat-2602)

所有權變動的來源見[版本頁](/ref/versions).

尚未查證: n8n 官方文件的 OSI 自述原句, LiteLLM 企業版功能範圍, MinerU 授權變更的版本界線, TAIDE 授權的商用條件.
