# M1 推論伺服器

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-26
- 待查證: 本章所有指令依官方文件整理, 尚未在實機執行; llama.cpp 與 LM Studio 的操作步驟本輪未核對, 僅列定位; 標示「推論」的段落未有官方文件依據; M1.10 節的 vLLM 指令依官方文件改寫, 未實機驗證, 以 `Authorization: Bearer` 標頭帶金鑰的寫法未找到 vLLM 官方 curl 範例; vLLM 映像在唯讀模型目錄與 `HF_HUB_OFFLINE=1` 下能否完整離線啟動, 本輪未驗證
:::

**結論**: 初階讀者以 Ollama 完成第一次對話最快: 安裝, 執行一行指令, 即可開始. 完成後再依[組裝總覽](/build/overview)加上介面 (M2). 本章也整理上線前常遺漏的五項工作: GPU 驅動確認, 模型下載驗證, 離線安裝, 日誌, 以及參數調校. 多人同時使用時改用 vLLM, 見 M1.10 節.

**這一塊在圖上的位置**: VM 推論區的 vLLM (個人或低階硬體用 Ollama 或 llama.cpp). **前置模組**: M0. **完成後的狀態**: 本機模型可以回答問題, 並以 OpenAI 相容 API 提供給其他元件.

## M1.1 Ollama, llama.cpp 與 LM Studio 的選擇

| 工具 | 定位 | 適用讀者 | 本章是否提供步驟 |
|---|---|---|---|
| Ollama | 命令列加背景服務, 內建模型下載與管理 | 初階到中階, 想最快開始 | 是 |
| llama.cpp (llama-server) | 底層推論引擎, 可調參數最多 | 想精細控制, 或搭配 llama-swap 者 | 否 (未核對, 請讀官方文件) |
| LM Studio | 桌面圖形介面 | 不想用命令列者 | 否 (未核對, 請讀官方文件) |

以上定位為整理者的歸納 (信心: 中). 版本資訊見[版本頁](/ref/versions).

## M1.2 用 Ollama 完成第一次對話

### 安裝

| 系統 | 做法 | 系統需求 (來源: Ollama 文件) |
|---|---|---|
| macOS | 下載 `ollama.dmg`, 把應用程式拖曳到「應用程式」資料夾 | macOS Sonoma (v14) 以上; Apple M 系列可用 GPU, x86 僅 CPU |
| Windows | 執行 `OllamaSetup.exe`, 不需要系統管理員權限 | Windows 10 22H2 以上; 二進位安裝至少 4GB 磁碟空間; NVIDIA 驅動 551.61 以上 |
| Linux | `curl -fsSL https://ollama.com/install.sh \| sh` | 見 8.4 節 |

Linux 的一行安裝指令會直接執行從網路下載的腳本. 受管制的環境, 建議改用 8.6 節的手動安裝, 並先檢視內容.

### 第一次對話

```bash
ollama run <模型名稱>
```

指令會先下載模型, 再進入對話; 輸入 `/bye` 離開 (來源: Ollama 文件 Quickstart). 模型名稱請從 Ollama 官方模型庫 (ollama.com 網站) 選擇, 並依 [K2](/know/k2-quantization)確認記憶體放得下.

### 常用管理指令

| 指令 | 用途 |
|---|---|
| `ollama pull <模型名稱>` | 只下載, 不進入對話 |
| `ollama ls` | 列出已下載的模型 |
| `ollama ps` | 列出執行中的模型 |
| `ollama stop <模型名稱>` | 停止執行中的模型 |
| `ollama rm <模型名稱>` | 移除模型 |
| `ollama serve` | 啟動服務 |

來源: Ollama 文件 CLI reference.

### 確認服務可用

Ollama 預設只綁定 `127.0.0.1` 的 11434 連接埠 (來源: Ollama FAQ). 下列指令可確認 API 回應 (範例格式依 Ollama 文件的 `/api/generate` 用法, 欄位以官方文件為準):

```bash
curl http://localhost:11434/api/generate -d '{"model": "<模型名稱>", "prompt": "你好", "stream": false}'
```

## M1.3 確認安裝結果的最短檢核

- [ ] `ollama -v` 顯示版本 (Linux 手動安裝頁面以此驗證), 並記錄到版本紀錄 ([O2](/ops/versioning))
- [ ] `ollama run` 能完成一次回答
- [ ] 回答時查看 GPU 使用量 (NVIDIA 可用 `nvidia-smi`), 確認模型確實在 GPU 上
- [ ] 其他裝置無法連到 11434 連接埠 (尚未打算對外開放時)

## M1.4 GPU 驅動確認

未確認驅動時, 模型可能自動改用 CPU 執行, 速度差距很大, 且不易察覺 (信心: 高, 屬一般經驗).

| 平台 | 條件 | 確認方式 |
|---|---|---|
| NVIDIA | 運算能力 5.0 以上, 驅動 550 以上; 運算能力 5.0 至 6.2 的舊卡須驅動 570 以上; Windows 需 551.61 以上 | `nvidia-smi` 能列出顯示卡 |
| AMD (Linux) | ROCm v7 驅動; 另需下載 ROCm 套件 | 依 AMD 文件; Ollama 頁面未提供驗證指令 |
| AMD (Windows) | 支援 ROCm v7 / HIP7 的驅動, 或支援 Vulkan 的 Radeon 驅動 | 依 AMD 文件 |
| Apple Silicon | 透過 Metal API 提供 GPU 加速 | 無需額外驅動 |

來源: Ollama 文件 GPU support, Linux, Windows.

**排除方式** (來源: Ollama 文件 Troubleshooting 與 GPU support):

1. 用容器執行時, 先測試 `docker run --gpus all ubuntu nvidia-smi`. 測試失敗時, Ollama 也看不到 NVIDIA 顯示卡.
2. Linux 在休眠喚醒後找不到 GPU 時, 官方提供的暫時解法是重新載入驅動模組: `sudo rmmod nvidia_uvm && sudo modprobe nvidia_uvm`.
3. 設定 `OLLAMA_DEBUG=1` 後, GPU 偵測期間會輸出額外資訊.
4. 多張顯示卡時, 以 `CUDA_VISIBLE_DEVICES` 指定使用的卡; 官方建議用 UUID 而非數字編號, UUID 可用 `nvidia-smi -L` 查詢.

## M1.5 模型下載與驗證

模型檔是第三方提供的大型二進位資料, 下載後應確認「檔案完整」與「來源可信」兩件事, 兩者不同 (信心: 高).

| 驗證事項 | 做法 |
|---|---|
| 來源可信 | 只從官方組織帳號或知名發布者下載; 確認授權 (見[授權速查](/ref/licenses)); 優先 safetensors 或 GGUF, 避免來源不明的 pickle 檔 |
| 版本可追溯 | 下載時指定 revision (commit hash), 不使用會變動的 main |
| 檔案完整 | 比對校驗碼 |

**Hugging Face 的做法** (來源: Hugging Face 文件 CLI guide):

```bash
# 下載指定檔案, 並指定 revision
hf download <組織/模型庫> <檔名> --revision <commit hash>

# 驗證本機快取的檔案與 Hub 上的校驗碼是否一致
hf cache verify <組織/模型庫>
```

全部相符時會顯示 `All checksums match.`; 有不符時會列出清單並以非零狀態碼結束. 預設只對缺少或多餘的檔案發出警告, 要視為錯誤須加 `--fail-on-missing-files --fail-on-extra-files`.

注意: 校驗碼比對只證明「和 Hub 上的一致」, 不證明發布者可信.

**登記表**: 每個模型記錄下列欄位, 之後回退或稽核時才查得到.

| 欄位 | 範例 |
|---|---|
| 模型庫與檔名 | |
| revision (commit hash) | |
| 下載日期 | |
| 授權 | |
| 校驗結果 | |
| 使用者與用途 | |

**匯入 Ollama**: 本機的 GGUF 檔以 Modelfile 匯入. Modelfile 內寫 `FROM /path/to/file.gguf`, 再執行 `ollama create <名稱>` (來源: Ollama 文件 Import).

## M1.6 離線安裝

適用於不能連網的環境. 以下步驟中, 標示「推論」者尚未有官方文件說明, 請先在測試環境確認.

**準備 (在可連網的機器)**:

1. **Ollama 程式**: Linux 下載 `ollama-linux-amd64.tar.zst` (AMD 另需 `ollama-linux-amd64-rocm.tar.zst`); Windows 下載 `OllamaSetup.exe`; macOS 下載 `ollama.dmg` (來源: Ollama 文件各平台頁).
2. **模型**: 兩種做法.
   - 在可連網機器 `ollama pull` 後, 複製模型目錄到離線機器. 模型目錄位置: macOS `~/.ollama/models`, Linux `/usr/share/ollama/.ollama/models`, Windows `C:\Users\%username%\.ollama\models`, 可用 `OLLAMA_MODELS` 指定 (來源: Ollama FAQ). 直接複製目錄是否可用屬推論, 信心: 中.
   - 下載 GGUF 檔, 在離線機器用 Modelfile 匯入 (見 8.5 節).
3. **容器映像**: 在可連網機器用 `docker pull` 取得固定版本映像, 再以 `docker save` 匯出, 離線機器以 `docker load` 匯入 (Docker 指令的通用做法, 未實機驗證).
4. **校驗碼**: 為每個檔案產生 SHA-256, 複製到離線機器後重新計算並比對 (如 `sha256sum`).

**Linux 手動安裝** (來源: Ollama 文件 Linux):

```bash
sudo tar x -C /usr -f ollama-linux-amd64.tar.zst   # 解壓縮到 /usr (指令形式為依官方範例改寫)
sudo useradd -r -s /bin/false -U -m -d /usr/share/ollama ollama
sudo usermod -a -G ollama $(whoami)
```

之後依官方頁面建立 `/etc/systemd/system/ollama.service`, 執行 `sudo systemctl daemon-reload` 與 `sudo systemctl enable ollama`. 官方頁面的壓縮格式為 `.tar.zst`, 離線機器須有支援 zstd 的 tar.

**離線環境的注意事項**:

- Open WebUI 的內建檢索功能首次使用時, 可能需要下載嵌入模型. 離線環境請事先確認並預先放入 (未驗證).
- 離線環境的更新流程相同, 只是改由可移除媒體傳遞. 更新前仍要備份並跑測試集 ([O2](/ops/versioning)).
- 傳入媒體先掃毒, 並保留校驗碼清單.

## M1.7 日誌

發生問題時, 應先查看日誌. 位置如下 (來源: Ollama 文件 Troubleshooting):

| 環境 | 查看方式 |
|---|---|
| macOS | `cat ~/.ollama/logs/server.log` |
| Linux (systemd) | `journalctl -u ollama --no-pager --follow --pager-end` |
| Docker 容器 | `docker logs <container-name>` |
| 手動執行 `ollama serve` | 日誌顯示在該終端機 |
| Windows | 檔案總管開啟 `%LOCALAPPDATA%\Ollama`, 最新的是 `server.log` |

**維運建議** (信心: 中, 屬一般經驗):

- 記錄日誌的保留期間與磁碟占用, 避免日誌占滿磁碟空間.
- 先確認日誌是否含有對話內容, 再決定存取權限與保留天數 (本輪未驗證 Ollama 與介面的日誌內容).
- 每週檢查時順便掃一次錯誤訊息, 特別是 GPU 偵測失敗與記憶體不足.
- 需要更多資訊時才開啟 `OLLAMA_DEBUG=1`, 事後關閉.

## M1.8 參數調校

Ollama 以環境變數設定. 預設值與用途如下 (來源: Ollama FAQ):

| 環境變數 | 預設值 | 用途與調整原則 |
|---|---|---|
| `OLLAMA_HOST` | `127.0.0.1:11434` | 綁定位址. 改成 `0.0.0.0` 會開放給其他裝置, 僅在有防火牆與存取控制時才做 |
| `OLLAMA_CONTEXT_LENGTH` | 依顯示記憶體而定: 小於 24GiB 為 4k, 24 至 48GiB 為 32k, 48GiB 以上為 256k (來源: Ollama 文件 Context length) | 上下文長度. 加大會增加記憶體占用 (見 K2.3 節); 官方建議代理與程式工具至少設 64000 |
| `OLLAMA_NUM_PARALLEL` | 1 | 每個模型同時處理的請求數. 所需記憶體隨它與上下文長度的乘積增加 |
| `OLLAMA_MAX_LOADED_MODELS` | GPU 數量 x 3 (CPU 推論為 3) | 可同時載入的模型數 |
| `OLLAMA_MAX_QUEUE` | 512 | 忙碌時的排隊上限, 超過時回應 503 |
| `OLLAMA_MODELS` | 見 8.6 節 | 模型存放目錄; Linux 標準安裝須讓 `ollama` 使用者有讀寫權限: `sudo chown -R ollama:ollama <directory>` |

**Linux 以 systemd 設定環境變數**:

```bash
systemctl edit ollama.service
# 在 [Service] 區段加入, 例如:
#   Environment="OLLAMA_CONTEXT_LENGTH=8192"
systemctl daemon-reload
systemctl restart ollama
```

**調校順序** (信心: 中, 屬推論): 先用預設值跑通; 只在實際需要時調整一項, 並用 [M6](/build/m6-observability)測試集與耗時記錄比較前後差異; 一次只改一項, 才知道哪個變動有效.

macOS 的環境變數設定方式, Ollama 文件頁面未說明, 本輪未核對.

## M1.9 常見錯誤排除

| 現象 | 可能原因 | 處理 |
|---|---|---|
| 載入失敗或速度極慢 | 記憶體不足, 模型退回 CPU | 換較小的模型或量化, 或降低上下文 (K2); 確認 GPU (8.4 節) |
| 下載中斷 | 網路不穩 | 重新執行 `ollama pull`; Hugging Face 中斷留下的 `.incomplete` 檔可用 `hf cache prune` 清除 |
| 連接埠衝突 | 11434 已有其他程式占用 | Linux 可用 `ss -ltnp` 查詢占用的程式 (通用指令, 未驗證) |
| 回應 503 | 排隊已滿 | 檢視 `OLLAMA_MAX_QUEUE` 與使用人數 |
| 模型目錄權限錯誤 | `ollama` 使用者無權限 | `sudo chown -R ollama:ollama <directory>` |
| 休眠後改用 CPU | NVIDIA 驅動模組狀態異常 | 見 8.4 節 |

## M1.10 多人共用時改用 vLLM

多人同時使用, 或需要 Prometheus 指標與更廣的 GPU 支援時, 推論區改用 vLLM 的 OpenAI 相容伺服器. 個人或低階硬體仍以 Ollama 或 llama.cpp 為首選 (選型判斷為本手冊的架構決定, 信心: 中高). vLLM 的安全前提是「只有閘道區連得到它」: 它的 API 金鑰只保護部分路徑, 不能當作唯一防線.

### 硬體與平台需求

下列條件取自 vLLM 文件 GPU Installation:

| 平台 | 條件 |
|---|---|
| 作業系統 | 只支援 Linux; 不支援原生 Windows, 須改用 WSL |
| NVIDIA | 運算能力 (compute capability) 7.5 以上, 例如 T4, RTX 20 系列, A100, L4, H100 |
| AMD | ROCm 6.3 以上; 支援 MI200, MI300, MI350 (MI350 須 ROCm 7.0 以上), Radeon RX 7900 與 9000 系列等 |
| Intel | Intel Data Center GPU 與 Arc GPU, 官方描述為基本推論與服務功能 |

在 Proxmox VE 上, 推論區 VM 以 GPU 直通取得顯示卡 (見 M0.1 節). VM 內用 Docker 執行時, NVIDIA 顯示卡須先安裝驅動與 NVIDIA Container Toolkit (來源: Docker 文件 GPU access). AMD 與 Intel 各有官方映像 (`vllm/vllm-openai-rocm`, `vllm/vllm-openai-xpu`) (來源: vLLM 文件 Using Docker).

### 以 Docker 執行 OpenAI 相容伺服器

vLLM 官方的 Docker 範例如下 (來源: vLLM 文件 Using Docker):

```bash
docker run --runtime nvidia --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --env "HF_TOKEN=$HF_TOKEN" \
    -p 8000:8000 \
    --ipc=host \
    vllm/vllm-openai:latest \
    --model Qwen/Qwen3-0.6B
```

`--ipc=host` (或改用 `--shm-size`) 讓容器使用主機的共用記憶體; vLLM 底層的 PyTorch 以共用記憶體在行程間交換資料, 張量平行推論特別需要 (來源同上).

官方範例會從 Hugging Face 下載模型, 並發布到主機所有位址. 推論區改成下列寫法 (依 vLLM 文件 Using Docker, Engine Arguments, Security 與 Docker 文件 Port publishing and mapping 整理, 未實機驗證):

```bash
set -a; . ./.env; set +a          # .env 權限 600, 內含 VLLM_API_KEY

docker run -d --name vllm --restart always \
  --runtime nvidia --gpus all \
  --ipc=host \
  -p <推論區 VM 的內網位址>:8000:8000 \
  -v /mnt/models:/models:ro \
  -e HF_HUB_OFFLINE=1 \
  -e VLLM_API_KEY="$VLLM_API_KEY" \
  vllm/vllm-openai@sha256:<摘要值> \
  --model /models/<組織>/<模型>/<revision> \
  --served-model-name <對外模型名稱>
```

逐項說明:

| 設定 | 作用 | 依據 |
|---|---|---|
| `-p <內網位址>:8000:8000` | 只在推論區 VM 的內網介面發布; 8000 是 vLLM 預設連接埠 | Docker 文件 Port publishing and mapping; vLLM 文件 CLI serve |
| `-v /mnt/models:/models:ro` | 以唯讀方式掛載 M3 的模型存放區, 容器無法改動模型檔 | Docker 文件 Bind mounts; 見 M3.3 節 |
| `--model /models/...` | `--model` 接受 Hugging Face 模型名稱或路徑; 改指向存放區內含 revision 的路徑, 不從網路下載 | vLLM 文件 Engine Arguments |
| `HF_HUB_OFFLINE=1` | 不對 Hugging Face Hub 發出任何 HTTP 請求 | Hugging Face 文件 Environment variables |
| `VLLM_API_KEY` | 與 `--api-key` 等效; 以環境變數傳入, 金鑰不出現在指令參數中 | vLLM 文件 Security, Quickstart |
| `@sha256:<摘要值>` | 以摘要值鎖定映像, 不使用官方範例的 `latest` | Docker 文件 docker image pull; 見 O2 |
| `--served-model-name` | API 中使用的模型名稱; 未設定時沿用 `--model` 的值 | vLLM 文件 Engine Arguments |

不設 `HF_TOKEN`: 推論區只讀本地存放區, 不需要 Hugging Face 金鑰 (推論, 信心: 中高). `--revision` 與 `--tokenizer-revision` 用於指定 Hub 上的版本 (來源: vLLM 文件 Engine Arguments); 改用本地路徑時, revision 已經寫在 M3 的存放路徑中.

常用的資源參數 (來源: vLLM 文件 Engine Arguments): `--gpu-memory-utilization` 預設 0.92, 是模型執行器可使用的 GPU 記憶體比例; `--max-model-len` 未指定時從模型設定推導; 多張 GPU 時以 `--tensor-parallel-size` 指定張量平行數, 預設 1. 調整原則與 M1.8 節相同: 先用預設值跑通, 一次只改一項.

### 加固: API 金鑰只是縱深防禦

**`--api-key` 的保護範圍有限**. vLLM 文件 Security 指出, `--api-key` (或 `VLLM_API_KEY`) 只套用到 `/v1`, `/v2`, `/inference` 與 `/cohere` 開頭的路徑, 並明確建議不要只靠它保護 vLLM. 即使設定了金鑰, 下列端點仍不需驗證 (來源: vLLM 文件 Security):

- `/invocations`: SageMaker 相容端點, 與 `/v1` 端點走相同的推論功能
- `/pooling`, `/classify`, `/score`, `/rerank` 等非 `/v1` 版本
- `/metrics`, `/tokenize`, `/detokenize`, `/health`, `/version`
- `/pause`, `/abort_requests`, `/update_weights` 等營運控制端點

**因應方式**:

1. **網路限制是主要防線**: 推論區只接受閘道區連線 (另加稽核區抓取指標), 規則見 M0.2 節. vLLM 文件也建議防火牆只開放 API 伺服器使用的 TCP 連接埠.
2. **需要更細的控管時, 在推論區 VM 內加反向代理**: vLLM 文件指出最有效的做法是放在反向代理之後, 只放行預定開放的端點, 其餘一律封鎖. 實務上可只開放 `/v1` 給閘道區, `/metrics` 給稽核區 (後半為推論, 信心: 中).
3. **多人隔離交給閘道**: vLLM 文件說明同一個伺服器行程內的租戶之間沒有隔離, 建議每個租戶各跑一個實例, 或改用閘道. 本手冊由 LiteLLM 發給每位使用者個別金鑰與配額 (見 M5).

**其他設定** (來源: vLLM 文件 Security, CLI serve, Engine Arguments):

- `--trust-remote-code` 預設為 False, 保持關閉. 即使如此, 引擎本身仍可能有缺陷, 例如 GHSA-3c86-2m5g-59q7 在特定架構下忽略了這個設定 (見 M3.1 節), 因此模型一律經 M3 入庫流程.
- 正式環境不要設定 `VLLM_SERVER_DEV_MODE=1`.
- `--enable-tokenizer-info-endpoint` 預設關閉, 開啟後可能暴露對話範本與 tokenizer 設定, 保持關閉.
- 不需要 API 說明頁時, 可加 `--disable-fastapi-docs` 關閉 OpenAPI schema, Swagger UI 與 ReDoc.
- 多節點部署時, 節點間通訊預設不安全, 官方要求放在隔離的網路.

**版本**: 本手冊的研究整理以 0.11.1 為最低版本 (2025 年多個遠端執行程式碼等級的漏洞). 2026-08 公告的 GHSA-3c86-2m5g-59q7 修補版為 0.28.0 (來源: vLLM GitHub Security Advisory), 因此依目前公告, 至少要 0.28.0. vLLM 公告更新頻繁, 請訂閱 GitHub Security Advisories, 並以[版本頁](/ref/versions)與 [O3](/ops/advisories) 為準.

### 工具呼叫解析器與對話範本要和模型一起鎖定

要讓模型自行決定是否呼叫工具 (`tool_choice` 為 `auto`), 須同時設定兩個參數 (來源: vLLM 文件 Tool Calling 與 CLI serve):

- `--enable-auto-tool-choice`: 啟用自動工具選擇, 預設 False.
- `--tool-call-parser <名稱>`: 依模型選擇解析器, 從模型輸出中擷取工具呼叫. 文件列出的解析器包含 `hermes`, `mistral`, `llama3_json`, `pythonic`, `deepseek_v3`, `openai`, `qwen3_xml` 等.

部分模型另需 `--chat-template` 指定能處理 `tool` 角色訊息的對話範本, vLLM 的 examples 目錄提供了範本檔. 官方範例如下 (來源: vLLM 文件 Tool Calling):

```bash
vllm serve meta-llama/Llama-3.1-8B-Instruct \
    --enable-auto-tool-choice \
    --tool-call-parser llama3_json \
    --chat-template examples/tool_chat_template_llama3.1_json.jinja
```

指定函式名稱 (named function) 與 `required` 兩種模式則預設支援, 以結構化輸出保證能解析 (來源同上). 另外, 模型沒有對話範本時, Chat Completions API 無法處理對話, 須以 `--chat-template` 指定範本檔 (來源: vLLM 文件 Online Serving).

解析器與範本選錯時, 工具呼叫可能解析失敗或格式錯誤, 而且不一定會報錯 (推論, 信心: 中). 因此每個模型上線時, 把下列四項一起記入 [O2](/ops/versioning) 的版本紀錄表, 任一項變動都視為升級, 先跑 M6 測試集:

| 欄位 | 範例 |
|---|---|
| 模型路徑 (含 revision) | `/models/<組織>/<模型>/<revision>` |
| vLLM 映像摘要值 | `vllm/vllm-openai@sha256:<摘要值>` |
| `--tool-call-parser` | `<解析器名稱>` |
| `--chat-template` | 範本檔的路徑與 SHA-256 |

自訂的範本檔與模型一起經 M3 入庫, 放在模型存放區, 以唯讀方式掛載. 範本是會在伺服器上渲染的程式邏輯 (見 M3.1 節), 不要從網路直接引用.

### Prometheus 指標

vLLM 的 OpenAI 相容伺服器在 `/metrics` 端點提供 Prometheus 格式的指標, 例如 `vllm:num_requests_running` (執行中的請求數), `vllm:kv_cache_usage_perc` (KV cache 使用率, 1 代表 100%), `vllm:time_to_first_token_seconds` (首個 token 延遲的直方圖) (來源: vLLM 文件 Metrics). 稽核區的 Prometheus 定期抓取這個端點 (見 [M6](/build/m6-observability)). `/metrics` 不受 API 金鑰保護, 而且包含模型, 吞吐量與佇列等資訊 (來源: vLLM 文件 Security), 防火牆只開放給稽核區.

### 驗收測試

指令依 vLLM 文件 Quickstart 與 Metrics 的範例改寫, 未實機驗證. 金鑰放在 `Authorization: Bearer` 標頭是 OpenAI 相容 API 的慣例; vLLM 文件只說明金鑰須放在標頭中, 本輪未找到官方的 curl 範例.

```bash
# 從閘道區: 帶金鑰應成功, 不帶金鑰應回應錯誤
curl http://<推論區位址>:8000/v1/models -H "Authorization: Bearer <金鑰>"
curl http://<推論區位址>:8000/v1/models

# 從稽核區: 可讀取指標
curl http://<推論區位址>:8000/metrics
```

- [ ] 從閘道區帶金鑰可列出模型, 不帶金鑰時回應錯誤
- [ ] 從入口區, 自動化區與使用者網段連 8000 連接埠失敗 (M0.5 節)
- [ ] 容器內無法寫入 `/models`
- [ ] 中斷推論區的對外連線後重新啟動容器, 服務仍可正常啟動 (確認不依賴 Hugging Face 下載)
- [ ] 啟動參數中沒有 `--trust-remote-code`, 映像以摘要值指定
- [ ] 工具呼叫測試題 (M6) 通過, 解析器與範本已記入版本紀錄表

## M1.11 同一台機器常駐多個模型

**結論**: 同機常駐 3 個約 35B 的模型時, 先確認權重加上 KV 快取放得進顯示記憶體 (估算見 K3.4 節), 再選擇服務方式. 多併發且要穩定常駐, 建議每個模型各跑一個 vLLM 行程, 前面由 LiteLLM 分流 (M5.5 節); 低併發的小團隊可用 Ollama 或 llama-swap 依需求載入與卸載. 不建議把「單一 vLLM 伺服器同時服務多個模型」當作選項, 因為 vLLM 官方 FAQ 說明單一 OpenAI 相容伺服器不支援同時服務多個模型, 建議以多個實例加路由層處理 (來源: vLLM 文件 FAQ).

| 方式 | 官方說法 | 優點 | 限制 | 適用情境 |
|---|---|---|---|---|
| 每個模型一個 vLLM 行程, 以 `--gpu-memory-utilization` 分配 | 該參數是「單一實例的使用上限」, 預設 0.92, 同一張卡上有其他 vLLM 實例也無妨, 例如兩個實例各設 0.5 (來源: vLLM 文件 Engine Arguments) | 模型常駐, 沒有切換延遲; 各模型可獨立重啟 | 比例須手動配置, 總和須小於 1; vLLM 論壇 (二手來源) 有回報指出 V1 引擎在同卡啟動第二個行程常因記憶體剖析失敗, 與官方說明有出入, 須實測啟動順序 | 多併發, 3 個模型都要常駐 |
| 同上, 改用 `--kv-cache-memory-bytes` 直接指定 KV 快取大小 | 設定後會忽略 `--gpu-memory-utilization`, 且只在同一張卡, 啟動時空閒記憶體相同的前提下有效 (來源: vLLM 文件 Engine Arguments) | 避開比例配置的剖析問題 | 須自行換算每個模型需要的 KV 快取 (K3.4 節) | 同卡多行程啟動不穩時的替代做法 (推論, 信心: 中) |
| NVIDIA MIG 硬體切分 | RTX PRO 6000 Blackwell Server Edition 規格表列「最多 4 個 24GB 的 MIG」; Workstation Edition 的 PNY 規格表列 4x24GB, 2x48GB, 1x96GB 的切分 (來源: NVIDIA 規格 PDF 與 PNY 規格表; NVIDIA 官網的 Workstation 頁面僅在 Max-Q 段落提到最多 4 個隔離實例, 未明確對應各版本) | 硬體層隔離, 一個行程異常不影響其他 | 切分檔位固定; 24GB 的切片放不下 FP8 的 35B 模型 (約 35GB); 3 個實例的混合檔位 (例如 48+24+24) 查無資料 | 多個小模型 (嵌入模型, 7B 級); 35B 級模型建議 2 個 48GB 的切片 |
| Ollama 依需求載入 | `OLLAMA_MAX_LOADED_MODELS` 預設為 GPU 數量乘以 3, 記憶體足夠才會同時載入; 新模型必須完整放進顯示記憶體; `OLLAMA_KEEP_ALIVE` 預設 5 分鐘 (來源: Ollama 文件 FAQ) | 設定最簡單, 閒置時自動卸載 | 輪替時須重新載入; 併發與批次處理效率不如 vLLM (整理者判斷, 無官方數字) | 小團隊, 低併發 |
| llama-swap 依需求載入 | 預設同一時間只執行一個模型; 以群組的 `swap`, `exclusive`, `persistent` 設定可讓多個模型同時常駐; `healthCheckTimeout` 預設 120 秒, 請求會等到端點就緒 (來源: llama-swap 文件 Configuration) | 可混用 vLLM, llama.cpp 等後端 | 官方未提供切換延遲的實測數字; 冷啟動時間以健康檢查逾時上限為界 | 模型數量多於記憶體, 使用頻率不高 |
| vLLM sleep mode | Level 1 把權重移到 CPU 記憶體並丟棄 KV 快取, Level 2 兩者都丟棄; 伺服器模式須設 `VLLM_SERVER_DEV_MODE=1` 並加 `--enable-sleep-mode`, 端點為 `/sleep`, `/wake_up`, `/is_sleeping`; 官方警告這是開發用端點, 不得對使用者開放 (來源: vLLM 文件 Sleep Mode) | 不須重啟行程, 官方稱喚醒比完整重新載入快 (無秒數) | 並非為模型輪替設計, 文件未談多模型; Level 1 須有足夠的 CPU 記憶體容納權重 | 同一模型的間歇釋放, 不建議作為多模型方案 |

vLLM 官方文件沒有「多模型輪替」功能 (查無). 輪替的實際延遲取決於儲存讀取速度, 引擎初始化與 CUDA graph 建立, 須在自己的硬體上實測, 本手冊不提供估計值.

**建議的啟動方式** (推論, 信心: 中): 先啟動最大的模型, 再依序啟動其他兩個; 每啟動一個, 就用 `nvidia-smi` 確認剩餘顯示記憶體, 再決定下一個行程的 `--gpu-memory-utilization`. 三個行程都穩定後, 重新啟動其中一個, 確認它能在其他兩個運作的狀態下重新取得記憶體. 這個「單獨重啟」測試列入驗收 (M1.11 節末的檢核).

**檢核**

- [ ] 三個模型的行程都在運作, 加總的顯示記憶體使用量低於卡的容量, 並預留給 CUDA 執行環境的空間.
- [ ] 逐一重新啟動單一行程, 其餘行程不受影響, 重啟的行程能重新取得記憶體.
- [ ] 三個模型同時被請求時 (模擬預期的並行數), 檢查 vLLM 的搶佔 (preemption) 次數與延遲是否在可接受範圍 (見 M8.5 節的容量說明).

## 參考來源

- [Ollama 文件: FAQ](https://docs.ollama.com/faq)
- [Ollama 文件: Quickstart](https://docs.ollama.com/quickstart)
- [Ollama 文件: CLI reference](https://docs.ollama.com/cli)
- [Ollama 文件: Linux](https://docs.ollama.com/linux)
- [Ollama 文件: Windows](https://docs.ollama.com/windows)
- [Ollama 文件: macOS](https://docs.ollama.com/macos)
- [Ollama 文件: GPU support](https://docs.ollama.com/gpu)
- [Ollama 文件: Troubleshooting](https://docs.ollama.com/troubleshooting)
- [Ollama 文件: Import](https://docs.ollama.com/import)
- [Hugging Face 文件: CLI guide](https://huggingface.co/docs/huggingface_hub/guides/cli)
- [vLLM 文件: GPU Installation](https://docs.vllm.ai/en/latest/getting_started/installation/gpu/)
- [vLLM 文件: Using Docker](https://docs.vllm.ai/en/latest/deployment/docker/)
- [vLLM 文件: Quickstart](https://docs.vllm.ai/en/latest/getting_started/quickstart/)
- [vLLM 文件: Engine Arguments](https://docs.vllm.ai/en/latest/configuration/engine_args/)
- [vLLM 文件: CLI serve](https://docs.vllm.ai/en/latest/cli/serve/)
- [vLLM 文件: Security](https://docs.vllm.ai/en/latest/usage/security/)
- [vLLM 文件: Tool Calling](https://docs.vllm.ai/en/latest/features/tool_calling/)
- [vLLM 文件: Online Serving](https://docs.vllm.ai/en/latest/serving/online_serving/)
- [vLLM 文件: Metrics](https://docs.vllm.ai/en/latest/usage/metrics/)
- [vLLM GitHub Security Advisories](https://github.com/vllm-project/vllm/security/advisories)
- [vLLM GitHub Security Advisory: GHSA-3c86-2m5g-59q7](https://github.com/vllm-project/vllm/security/advisories/GHSA-3c86-2m5g-59q7)
- [Hugging Face 文件: Environment variables](https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables)
- [Docker 文件: GPU access](https://docs.docker.com/engine/containers/gpu/)
- [Docker 文件: Port publishing and mapping](https://docs.docker.com/engine/network/port-publishing/)
- [Docker 文件: Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
- [Docker 文件: docker image pull](https://docs.docker.com/reference/cli/docker/image/pull/)
- [Ollama 文件: Context length](https://docs.ollama.com/context-length)
- [vLLM 文件: Frequently Asked Questions](https://docs.vllm.ai/en/latest/usage/faq/)
- [vLLM 文件: Engine Arguments](https://docs.vllm.ai/en/latest/configuration/engine_args/)
- [vLLM 文件: Sleep Mode](https://docs.vllm.ai/features/sleep_mode.html)
- [vLLM 文件: Optimization and Tuning](https://docs.vllm.ai/en/latest/configuration/optimization/)
- [llama-swap 文件: Configuration](https://github.com/mostlygeek/llama-swap/wiki/Configuration)
- [NVIDIA: RTX PRO 6000 Blackwell 工作站 GPU](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/)
- [NVIDIA RTX PRO 6000 Blackwell Server Edition 規格表 (Akamai 託管)](https://www.akamai.com/site/en/documents/corporate/nvidia-rtx-pro-6000-blackwell-server-edition-datasheet.pdf)
- [vLLM 論壇: 2 vLLM containers on a single GPU](https://discuss.vllm.ai/t/2-vllm-containers-on-a-single-gpu/608/2) (二手來源, 社群討論)
