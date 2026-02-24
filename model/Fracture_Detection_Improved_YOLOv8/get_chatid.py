import os
import requests

token = os.getenv("TELEGRAM_TOKEN")
url = f"https://api.telegram.org/bot{token}/getUpdates"

r = requests.get(url)
print(r.json())

