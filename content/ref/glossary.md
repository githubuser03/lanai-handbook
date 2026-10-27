---
description: "本頁列出手冊常用的術語, 每個術語附上本手冊採用的寫法與一句說明; 各章第一次出現時另有較完整的解釋."
---

# 術語對照

::: info 本頁屬性
- 等級: 參考資料
- 中文譯名已以國家教育研究院樂詞網核對 (2026-10-27); 樂詞網未收錄的術語依台灣業界用法, 表中逐項註明.
- 處理方式分三種: 有通用中文譯名者用中文, 首次出現附原文; 業界慣用英文者直接用英文; 沒有通用譯名者保留英文, 不自創譯名.
- 新增或修改術語請開 PR, 並在說明中附上所依據的台灣用法來源.
:::

本頁列出手冊常用的術語, 每個術語附上本手冊採用的寫法與一句說明; 各章第一次出現時另有較完整的解釋.

## 採用中文

| 中文 | 原文 | 說明 | 樂詞網 |
|---|---|---|---|
| 推論 | inference | 使用已訓練好的模型產生回答 | [有收錄](https://terms.naer.edu.tw/detail/89096/) |
| 微調 | fine-tuning | 以少量資料調整既有模型 | [有收錄](https://terms.naer.edu.tw/detail/3375368/) |
| 預訓練 | pretraining | 從零開始訓練模型 | 未收錄, 依台灣業界用法 |
| 權重 | weights | 模型學到的內容, 以大量數字 (參數) 存成檔案 | [有收錄 (加權, 權重)](https://terms.naer.edu.tw/detail/f9ace75b631d682f8aee3bee8d83f1ca/) |
| 量化 | quantization | 把權重的數字存得粗略一些, 讓檔案變小, 所需記憶體變少 | [有收錄](https://terms.naer.edu.tw/detail/1218298/) |
| 檢索增強生成 | RAG (Retrieval-Augmented Generation) | 先檢索文件, 再讓模型依文件回答 | 未收錄, 依台灣業界用法 |
| 嵌入 | embedding | 把文字轉成一串數字 (向量), 意思相近的文字, 數字也相近 | [收錄 embed 為嵌入](https://terms.naer.edu.tw/detail/13788338/) |
| 向量庫 | vector database | 儲存與查詢向量的資料庫, 用來找出意思相近的段落 | 未收錄, 依台灣業界用法 |
| 重排序 | reranking | 依與問題的相關程度, 對檢索結果重新排序 | 未收錄, 依台灣業界用法 |
| 閘道 | gateway | 統一入口, 負責路由, 金鑰與配額 | [有收錄 (閘道, 閘道器)](http://terms.naer.edu.tw/detail/62037/) |
| 沙箱 | sandbox | 隔離的執行環境, 裡面的程式出問題時不會影響主機 | [有收錄](https://terms.naer.edu.tw/detail/1305842/) |
| 護欄 | guardrail | 檢查模型輸入與輸出的機制 | 未收錄, 依台灣業界用法 |
| 提示注入 | prompt injection | 在輸入中夾帶指令, 誘使模型偏離原本任務 | 未收錄, 依台灣業界用法 |
| 工具呼叫 | function calling / tool calling | 模型輸出結構化指令, 由程式執行 | 未收錄, 依台灣業界用法 |
| 供應鏈 | supply chain | 軟體所依賴的上游元件與發布流程 | [有收錄](https://terms.naer.edu.tw/detail/2913438/) |
| 摘要值 | digest | 容器映像的雜湊值, 用來鎖定確切內容 | [收錄 digest 為摘要](https://terms.naer.edu.tw/detail/7641709/) |
| 上下文 | context | 模型一次能處理的輸入範圍 | [有收錄](https://terms.naer.edu.tw/detail/191137/) |
| 稽核 | audit | - | [有收錄 (稽核, 審查)](https://terms.naer.edu.tw/detail/3369871/) |
| 利害關係人 | stakeholder | - | [有收錄](http://terms.naer.edu.tw/detail/2918203/?index=7) |

## 保留英文

| 術語 | 說明 |
|---|---|
| token | 模型處理文字時切出的最小單位. 不譯為「詞元」, 因該詞為中國大陸官方定名 (來源: 世界日報 2026-03-25 報導) |
| KV cache | 推論時暫存注意力運算結果的記憶體, 讓模型不必每次重算前文 |
| LoRA, QLoRA | 低秩適配微調方法: 不改動原模型的全部參數, 只訓練一小組附加參數; QLoRA 另把原模型量化, 進一步減少所需記憶體 |
| MCP | Model Context Protocol, 模型與外部工具之間的協定 |
| PoC, scope, onboarding, roadmap, runbook | 業界慣用英文 |
| GGUF, safetensors | 模型檔格式 |
| 開源 / 原始碼公開 | 見[授權速查](/ref/licenses): 前者指符合 OSI 定義, 後者指原始碼可看但使用有限制 |

## 常見工具與服務

下列工具在多個章節出現, 此處只說明各自在架構中的角色; 授權見[授權速查](/ref/licenses), 版本見[版本與漏洞](/ref/versions).

| 工具 | 角色 |
|---|---|
| Ollama, llama.cpp, vLLM | 推論伺服器: 載入模型檔, 對其他程式提供呼叫模型的 API (見 [M1](/build/m1-inference)) |
| Open WebUI | 使用者介面: 讓使用者在瀏覽器裡和模型對話, 並管理知識庫 (見 [M2](/build/m2-ui-proxy)) |
| LiteLLM | 模型閘道: 所有模型呼叫的統一入口, 負責轉送, 金鑰與配額 (見 [M5](/build/m5-gateway-identity)) |
| Keycloak | 身分驗證服務: 管理帳號與群組, 讓各服務共用同一套登入 (SSO) (見 [M5](/build/m5-gateway-identity)) |
| Qdrant | 向量庫: 存放文件段落的向量, 依意思找出相近段落 (見 [M4](/build/m4-retrieval)) |
| n8n | 流程自動化平台: 依排程或事件串接各系統, 自動執行固定流程 (見 [M9](/build/m9-automation)) |
| OPA | 政策引擎: 依事先寫好的規則判斷某個動作准不准執行 (見 [M8](/build/m8-agent-governance)) |
| LangGraph | 代理開發框架: 把模型, 工具與判斷步驟串成可追蹤的流程 (見 [M8](/build/m8-agent-governance)) |
| Docker | 容器工具: 把服務與執行環境包成映像, 在隔離的容器中執行 (見 [M0](/build/m0-foundation)) |
| Hugging Face | 模型分享網站: 多數開放權重模型從這裡下載 (見 [M3](/build/m3-model-intake)) |

## 禁用的中國大陸用語

軟件, 信息, 數據(指一般資料), 網絡, 質量, 項目, 用戶, 默認, 文件(指 file), 接口, 代碼, 算法, 智能, 審計, 利益相關者, 最佳實踐. 一律改用台灣慣用語.

## 參考來源

- 國家教育研究院樂詞網 (雙語詞彙, 學術名詞暨辭書資訊網): 表中「樂詞網」欄的連結為各詞的詞條頁, 2026-10-27 以搜尋結果查詢; 標「未收錄」者為當日查無對應詞條.

名詞解釋為整理者撰寫, 專有名詞定義參考下列來源 (2026-10-26 擷取):

- RAG: [Lewis 等人, Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (2020)](https://arxiv.org/abs/2005.11401)
- LoRA: [Hu 等人, LoRA: Low-Rank Adaptation of Large Language Models (2021)](https://arxiv.org/abs/2106.09685)
- QLoRA: [Dettmers 等人, QLoRA: Efficient Finetuning of Quantized LLMs (2023)](https://arxiv.org/abs/2305.14314)
- 提示注入: [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- MCP: [Model Context Protocol 規格 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)
- GGUF: [GGUF 格式說明, ggml 儲存庫](https://raw.githubusercontent.com/ggml-org/ggml/master/docs/gguf.md)
- safetensors: [Safetensors 文件, Hugging Face](https://huggingface.co/docs/safetensors/index)
- 開源 / 原始碼公開: [The Open Source Definition, OSI](https://opensource.org/osd)
- token 譯名: [世界日報, AI大模型術語「Token」譯名爭論不休 官方終於定名了](https://www.worldjournal.com/wj/story/121343/9402011)
- 禁用的中國大陸用語清單與各術語對照為整理者依台灣慣用說法編寫, 無單一外部來源.
- 常見工具與服務的角色說明: 整理者依各工具官方文件與本手冊各章歸納, 原始來源列在所連結章節的「參考來源」.
