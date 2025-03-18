# ChatGPT API 串接程式

這是一個簡單的 ChatGPT API 串接程式，使用 Python 實作。

## 安裝需求

1. Python 3.7 或更高版本
2. 安裝必要套件：
   ```bash
   pip install -r requirements.txt
   ```

## 設定

1. 複製 `.env.example` 檔案並重新命名為 `.env`
2. 在 `.env` 檔案中設定您的 OpenAI API 金鑰：
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## 使用方法

執行以下指令啟動程式：
```bash
python main.py
```

- 輸入您的問題並按 Enter
- 輸入 'quit' 結束對話

## 注意事項

- 請確保您有有效的 OpenAI API 金鑰
- API 金鑰請妥善保管，不要分享給他人
- 使用 API 可能會產生費用，請注意使用量 