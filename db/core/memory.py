import urllib.request
import json
import logging

logger = logging.getLogger(__name__)

def add_blog_to_memory(title: str, content: str):
    """
    Sends a request to the RAG Chatbot to add the newly published blog 
    to its FAISS memory, keeping the AI synchronized with real-time news.
    """
    url = "http://127.0.0.1:8001/memory/add"
    data = json.dumps({"title": title, "content": content}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            return result
    except Exception as e:
        logger.error(f"Failed to update chatbot memory: {e}")
        return False
