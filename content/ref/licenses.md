# 授權速查

::: warning 使用前請先看
授權條款會改版 (Dify, MinerU, LobeHub 都曾改過), 以下為 2026-10-26 研究整理, 對外提供服務前請以各專案儲存庫的授權檔為準. 個人與內部使用通常不受影響 (信心: 中). 本頁不構成法律意見, 如有疑義請洽法律顧問.
:::

## OSI 開源與「原始碼公開」

OSI (Open Source Initiative) 定義的開源授權不得對使用方式設限. 授權對使用方式有限制者, 原始碼雖然公開, 但不屬於 OSI 開源. 以 n8n 為例, 官方文件 (docs.n8n.io) 自述 "according to the Open Source Initiative (OSI), open source licenses can't include limitations on use, so we do not call ourselves open source".

本手冊對這類專案稱「原始碼公開」, 不稱「開源」.

## 軟體授權

| 專案 | 授權 | OSI 開源 | 對外提供服務時的重點 |
|---|---|---|---|
| Open WebUI | BSD-3 加品牌條款 | 否 | 品牌條款限制修改或移除標示 |
| LibreChat | MIT (管理面板為 AGPL) | 是 | 管理面板的 AGPL 條款須另行留意 |
| AnythingLLM | MIT | 是 | - |
| LobeHub (原 LobeChat) | LobeHub Community License | 否 | 散布修改後的衍生作品須商業授權, 不適合手冊建議改作 |
| LiteLLM | MIT, `enterprise/` 目錄另有授權 | 部分 | SSO 等功能屬企業版 |
| LangGraph 程式庫 | MIT | 是 | 官方 Agent Server 在正式環境須授權金鑰 |
| Langflow | MIT | 是 | - |
| n8n | Sustainable Use License 與 Enterprise License | 否 | 官方自述非開源 |
| Flowise | Apache 2.0 (企業目錄另計, 未驗證) | 是 | - |
| Dify | Dify Open Source License (以 Apache 2.0 修改) | 否 | 未經書面授權不得營運多租戶服務; 不得移除標誌 |
| MinerU | 3.1.0 起自訂授權 | 否 | 月活躍使用者超過 1 億或月營收超過 2,000 萬美元須另取商業授權; 線上服務須標示 |
| Docling | MIT | 是 | - |
| Qdrant | Apache 2.0 | 是 | - |
| Arize Phoenix | Elastic License 2.0 | 否 | - |
| promptfoo | MIT | 是 | 所有權已變動, 見版本頁 |
| Langfuse | MIT | 是 | - |
| llama-swap, pgvector, sqlite-vec | 待核對 | - | 訓練資料內資訊, 可能已過時 |

## 模型授權

| 模型 | 授權 | 備註 |
|---|---|---|
| Llama 系列 (含 Prompt Guard 2, Llama Guard 4) | Llama 4 Community License | 須申請下載 |
| Qwen3-Embedding | Apache 2.0 | 來源: 研究 2 |
| EmbeddingGemma | Gemma 條款 | - |

其餘模型授權於 K4 整理, 該章尚在撰寫中.

## 授權疊加

組合多個元件後再對外提供服務時, 最嚴格的條款決定能做什麼 (信心: 中). 原始碼公開但非 OSI 開源的元件清單: Open WebUI, Dify, LobeHub, MinerU, Arize Phoenix, n8n; 模型端另有 Llama 4 Community License.
