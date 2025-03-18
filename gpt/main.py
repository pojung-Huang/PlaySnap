import os
from dotenv import load_dotenv
from openai import OpenAI

# 載入環境變數
load_dotenv()

# 初始化 OpenAI 客戶端
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def chat_with_gpt(prompt):
    try:
        # 呼叫 ChatGPT API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"發生錯誤：{str(e)}"

def main():
    print("歡迎使用 ChatGPT 聊天程式！")
    print("輸入 'quit' 結束對話")
    
    while True:
        user_input = input("\n請輸入您的問題：")
        if user_input.lower() == 'quit':
            break
            
        response = chat_with_gpt(user_input)
        print("\nChatGPT 的回應：")
        print(response)

if __name__ == "__main__":
    main() 