import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/chatbot",
    tags=["Chatbot"]
)

# Define the data structure for the user's request
class QuestionRequest(BaseModel):
    question: str

class MemoryAddRequest(BaseModel):
    title: str
    content: str

# Paths for the FAISS index
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "ensa_faiss_index")

# Initialize components lazily to avoid startup errors if API key is missing
embeddings = None
vector_store = None
rag_chain = None

def get_dynamic_context():
    """Fetches the latest events and news from the DB to give the bot real-time context."""
    from core.database import engine
    from sqlmodel import Session, select
    from models.models import Post, Event
    import datetime

    try:
        with Session(engine) as session:
            # Fetch latest 3 news
            posts = session.exec(
                select(Post).where(Post.is_published == True).order_by(Post.created_at.desc()).limit(3)
            ).all()
            news_txt = "\n".join([f"- News: {p.title} ({p.created_at.strftime('%Y-%m-%d')})" for p in posts])
            
            # Fetch latest 3 upcoming events
            events = session.exec(
                select(Event).where(Event.starts_at >= datetime.datetime.utcnow()).order_by(Event.starts_at.asc()).limit(3)
            ).all()
            events_txt = "\n".join([f"- Événement: {e.title} à {e.location} le {e.starts_at.strftime('%Y-%m-%d %H:%M')}" for e in events])
            
            return f"\n\nDernières Actualités:\n{news_txt}\n\nÉvénements à venir:\n{events_txt}"
    except Exception as e:
        print(f"[DEBUG] Error fetching dynamic context: {e}")
        return ""

def init_rag():
    global embeddings, vector_store, rag_chain
    
    if rag_chain is not None:
        return
    
    try:
        print("[DEBUG] Initializing Google Generative AI Embeddings...")
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        
        print(f"[DEBUG] Checking if FAISS index exists at: {INDEX_PATH}")
        if not os.path.exists(INDEX_PATH):
            print(f"[DEBUG] ERROR: FAISS index NOT found at {INDEX_PATH}")
            raise FileNotFoundError(f"FAISS index not found at {INDEX_PATH}. Please run CreateMemory.py first.")
        
        print("[DEBUG] Loading FAISS local index...")
        vector_store = FAISS.load_local(
            INDEX_PATH, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
        print("[DEBUG] FAISS index loaded successfully.")

        print("[DEBUG] Setting up retriever...")
        retriever = vector_store.as_retriever(search_kwargs={"k": 6})

        print("[DEBUG] Initializing ChatGoogleGenerativeAI (gemini-2.5-flash)...")
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)

        print("[DEBUG] Building RAG chain...")
        dynamic_info = get_dynamic_context()
        
        system_prompt = (
            "Tu es l'assistant expert du Club Génie Informatique (CGI) de l'ENSA Marrakech. "
            "Ton rôle est de répondre aux questions en utilisant le contexte fourni. "
            "Le contexte contient des informations sur l'organisation, les membres du bureau, et l'histoire du club.\n\n"
            "Voici les informations temps-réel issues de la base de données (prioritaires):"
            f"{dynamic_info}"
            "\n\nContexte: {context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])

        def format_docs(docs):
            print(f"[DEBUG] Formatting {len(docs)} documents for context.")
            return "\n\n".join(doc.page_content for doc in docs)

        rag_chain = (
            {"context": retriever | format_docs, "input": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        print("[DEBUG] RAG chain initialization COMPLETE.")
    except Exception as e:
        print(f"Error initializing RAG: {e}")
        raise e

@router.post("/ask")
async def ask_question(request: QuestionRequest):
    print(f"[DEBUG] Received question: {request.question}")
    try:
        print("[DEBUG] Calling init_rag()...")
        init_rag()
        print("[DEBUG] Invoking RAG chain...")
        answer = rag_chain.invoke(request.question)
        print("[DEBUG] Answer generated successfully.")
        return {"answer": answer}
    except Exception as e:
        print(f"[DEBUG] CRITICAL ERROR in ask_question: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/memory/add")
async def add_memory(request: MemoryAddRequest):
    """
    Endpoint for syncing new content with the existing FAISS index real-time.
    """
    from langchain_core.documents import Document
    global vector_store
    
    try:
        init_rag()
        doc = Document(
            page_content=f"Title: {request.title}\n{request.content}", 
            metadata={"source": "manual_add"}
        )
        vector_store.add_documents([doc])
        vector_store.save_local(INDEX_PATH)
        return {"status": "success", "message": "Vector store updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
