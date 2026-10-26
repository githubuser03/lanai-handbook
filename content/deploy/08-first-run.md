# 第 8 章 第一次在本機執行模型

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-26
- 待查證: 本章所有指令依官方文件整理, 尚未在實機執行; llama.cpp 與 LM Studio 的操作步驟本輪未核對, 僅列定位; 標示「推論」的段落未有官方文件依據
:::

**結論**: 初階讀者以 Ollama 完成第一次對話最快: 安裝, 執行一行指令, 即可開始. 完成後再依[第 9 章](/deploy/09-architectures)加上介面. 本章也整理上線前常遺漏的五項工作: GPU 驅動確認, 模型下載驗證, 離線安裝, 日誌, 以及參數調校.

## 8.1 Ollama, llama.cpp 與 LM Studio 的選擇

| 工具 | 定位 | 適用讀者 | 本章是否提供步驟 |
|---|---|---|---|
| Ollama | 命令列加背景服務, 內建模型下載與管理 | 初階到中階, 想最快開始 | 是 |
| llama.cpp (llama-server) | 底層推論引擎, 可調參數最多 | 想精細控制, 或搭配 llama-swap 者 | 否 (未核對, 請讀官方文件) |
| LM Studio | 桌面圖形介面 | 不想用命令列者 | 否 (未核對, 請讀官方文件) |

以上定位為整理者的歸納 (信心: 中). 版本資訊見[版本頁](/ref/versions).

## 8.2 用 Ollama 完成第一次對話

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

指令會先下載模型, 再進入對話; 輸入 `/bye` 離開 (來源: Ollama 文件 Quickstart). 模型名稱請從 Ollama 官方模型庫 (ollama.com 網站) 選擇, 並依[第 5 章](/select/05-quantization)確認記憶體放得下.

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

## 8.3 確認安裝結果的最短檢核

- [ ] `ollama -v` 顯示版本 (Linux 手動安裝頁面以此驗證), 並記錄到版本紀錄 ([第 19 章](/ops/19-versioning))
- [ ] `ollama run` 能完成一次回答
- [ ] 回答時查看 GPU 使用量 (NVIDIA 可用 `nvidia-smi`), 確認模型確實在 GPU 上
- [ ] 其他裝置無法連到 11434 連接埠 (尚未打算對外開放時)

## 8.4 GPU 驅動確認

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

## 8.5 模型下載與驗證

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

## 8.6 離線安裝

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
- 離線環境的更新流程相同, 只是改由可移除媒體傳遞. 更新前仍要備份並跑測試集 ([第 19 章](/ops/19-versioning)).
- 傳入媒體先掃毒, 並保留校驗碼清單.

## 8.7 日誌

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

## 8.8 參數調校

Ollama 以環境變數設定. 預設值與用途如下 (來源: Ollama FAQ):

| 環境變數 | 預設值 | 用途與調整原則 |
|---|---|---|
| `OLLAMA_HOST` | `127.0.0.1:11434` | 綁定位址. 改成 `0.0.0.0` 會開放給其他裝置, 僅在有防火牆與存取控制時才做 |
| `OLLAMA_CONTEXT_LENGTH` | 4096 | 上下文長度. 加大會增加記憶體占用 (見第 5.3 節) |
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

**調校順序** (信心: 中, 屬推論): 先用預設值跑通; 只在實際需要時調整一項, 並用[第 14 章](/apply/14-evaluation)測試集與耗時記錄比較前後差異; 一次只改一項, 才知道哪個變動有效.

macOS 的環境變數設定方式, Ollama 文件頁面未說明, 本輪未核對.

## 8.9 常見錯誤排除

| 現象 | 可能原因 | 處理 |
|---|---|---|
| 載入失敗或速度極慢 | 記憶體不足, 模型退回 CPU | 換較小的模型或量化, 或降低上下文 (第 5 章); 確認 GPU (8.4 節) |
| 下載中斷 | 網路不穩 | 重新執行 `ollama pull`; Hugging Face 中斷留下的 `.incomplete` 檔可用 `hf cache prune` 清除 |
| 連接埠衝突 | 11434 已有其他程式占用 | Linux 可用 `ss -ltnp` 查詢占用的程式 (通用指令, 未驗證) |
| 回應 503 | 排隊已滿 | 檢視 `OLLAMA_MAX_QUEUE` 與使用人數 |
| 模型目錄權限錯誤 | `ollama` 使用者無權限 | `sudo chown -R ollama:ollama <directory>` |
| 休眠後改用 CPU | NVIDIA 驅動模組狀態異常 | 見 8.4 節 |

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
