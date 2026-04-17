import urllib.request
import json
import logging

logger = logging.getLogger(__name__)

def sync_with_chatbot(title: str, content: str, category: str = "news"):
    """
    Sends a request to the RAG Chatbot to add newly created content
    (blog posts or events) to its FAISS memory.
    """
    # Assuming the app runs on default port 8000
    url = "http://127.0.0.1:8000/chatbot/memory/add"
    payload = {
        "title": f"[{category.upper()}] {title}", 
        "content": content
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            return result
    except Exception as e:
        logger.error(f"Failed to update chatbot memory: {e}")
        return False
