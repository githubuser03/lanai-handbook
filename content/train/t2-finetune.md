# T2 微調實作與部署

::: info 本章屬性
- 等級: ○ 依情境
- 狀態: 撰寫中 (僅有大綱)
- 資料基準日: 2026-10-26
- 待查證: Axolotl, LLaMA-Factory, MLX-LM 僅確認存在與用途, 未驗證安裝與繁體中文支援; QLoRA 顯示記憶體為官方標示的最低值; 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**本章要回答的問題**: 如何在有限顯示記憶體下完成一次可驗證的微調?

## T2.1 LoRA 與 QLoRA 原理

微調是用自己的資料, 在現成模型上再訓練一次. LoRA (Low-Rank Adaptation, 低秩適配) 不改動原模型的全部參數, 只另外訓練一小組附加參數; QLoRA 再把原模型量化, 進一步減少所需的顯示記憶體. 可以想成在原本的教科書上貼便利貼補充, 而不是重印整本書.

待撰寫要點:

- 低秩適配的概念, 以及為何顯示記憶體需求大幅下降

## T2.2 環境, 工具與繁體中文資料集

待撰寫要點:

- 工具候選: Unsloth, Axolotl, LLaMA-Factory, MLX-LM(後三者僅確認為微調工具, 安裝與繁體中文支援尚未驗證; 見參考來源)
- 繁體中文資料集的來源與授權

## T2.3 沿用 M6 測試集驗證, 轉檔上線與回退

待撰寫要點:

- 微調前後以同一份測試集比較
- 轉成 GGUF 並量化, 接入推論引擎
- 保留原模型, 以便回退

## 已有的研究資料

QLoRA 顯示記憶體估算(來源: Unsloth 官方文件 Unsloth Requirements, 2026-10-26 查證): 8B 模型約 6GB, 14B 模型約 8.5GB. 官方說明這是 4 位元 QLoRA 的最低值, 實際用量依模型與批次大小而增加.

## 參考來源

本章尚為大綱, 目前的事實性陳述只有 QLoRA 顯示記憶體估算與工具候選. 該估算原標示為「經研究 1 整理」(研究 1 為內部研究紀錄, 非公開來源), 現已改以 Unsloth 官方文件核對, 數字相符.

- **QLoRA 顯示記憶體**: Unsloth 文件的 VRAM 表列出 QLoRA (4 位元) 8B 為 6GB, 14B 為 8.5GB; 同表 LoRA (16 位元) 8B 為 22GB, 14B 為 33GB. 文件註明這些數字是絕對最低值, 某些模型需要更多. [Unsloth 文件: Unsloth Requirements](https://docs.unsloth.ai/get-started/beginner-start-here/unsloth-requirements)
- **工具候選**: Unsloth 文件如上. Axolotl 自述為免費開源的 LLM 微調框架; LLaMA-Factory 自述可用 CLI 與 Web UI 微調 100 多種大型語言模型; MLX LM 自述為在 Apple silicon 上以 MLX 生成文字與微調大型語言模型的 Python 套件. 以上只確認工具的用途, 授權, 安裝步驟與繁體中文資料支援尚未查證. [Axolotl 文件](https://docs.axolotl.ai/), [LLaMA-Factory 文件](https://llamafactory.readthedocs.io/en/latest/), [MLX LM README](https://raw.githubusercontent.com/ml-explore/mlx-lm/main/README.md)
- **LoRA 與 QLoRA 的做法**: LoRA 凍結預訓練權重, 只訓練注入的低秩矩陣; QLoRA 在 4 位元量化的模型上訓練 LoRA. [Hu 等人, LoRA: Low-Rank Adaptation of Large Language Models (2021)](https://arxiv.org/abs/2106.09685), [Dettmers 等人, QLoRA: Efficient Finetuning of Quantized LLMs (2023)](https://arxiv.org/abs/2305.14314)
- **繁體中文資料集, 轉檔上線**: 尚未撰寫, 撰寫時須補來源.
- **文中的類比 (教科書上貼便利貼)**: 整理者所寫, 無外部來源, 不應當作技術定義引用.
