import os
import re
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

# Automatically loads your GOOGLE_API_KEY from the .env file
load_dotenv()

os.environ["USER_AGENT"] = "InfoClubBot/1.0"

def build_school_memory():
    print("Scraping ENSA Marrakech website...")
    urls = [
        "https://ensa-marrakech.uca.ma/en/",
        "https://ensa-marrakech.uca.ma/en/school/presentation-of-the-institution/",
        "https://ensa-marrakech.uca.ma/en/student-life/clubs/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/egt/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/gcdste/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/gi/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/gil/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/rssp/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/seecs/",
        "https://ensa-marrakech.uca.ma/en/training/continuing-education/",
        "https://ensa-marrakech.uca.ma/en/training/continuing-education/lemalog/",
        "https://ensa-marrakech.uca.ma/en/school/departments/",
        "https://ensa-marrakech.uca.ma/en/school/organizational-chart/",
        "https://ensa-marrakech.uca.ma/en/school/listening-and-incubation-unit/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/egt/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/gcdste/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/gi/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/gil/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/rssp/",
        "https://ensa-marrakech.uca.ma/en/training/initial-training/seecs/",
        "https://ensa-marrakech.uca.ma/en/training/continuing-education/",
        "https://ensa-marrakech.uca.ma/en/training/continuing-education/lemalog/",
        "https://ensa-marrakech.uca.ma/en/school/departments/",
        "https://ensa-marrakech.uca.ma/en/school/organizational-chart/",
        "https://ensa-marrakech.uca.ma/en/school/listening-and-incubation-unit/ "
    ]
    
    loader = WebBaseLoader(urls)
    documents = loader.load()

    print("Cleaning the HTML noise...")
    for doc in documents:
        doc.page_content = re.sub(r'\n+', '\n', doc.page_content).strip()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=100
    )
    chunks = text_splitter.split_documents(documents)
    
    print("Generating embeddings with Gemini and building the FAISS database...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    # Process sequentially in batches to respect the 100 requests/minute free tier limit
    vector_store = None
    batch_size = 20
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        print(f"Processing chunk {i + 1} to {min(i + batch_size, len(chunks))} of {len(chunks)}...")
        
        if vector_store is None:
            vector_store = FAISS.from_documents(batch, embeddings)
        else:
            vector_store.add_documents(batch)
            
        # Add a delay between batches
        if i + batch_size < len(chunks):
            print("Waiting 15 seconds to respect Gemini API free tier rate limits...")
            time.sleep(15)
    
    vector_store.save_local("ensa_faiss_index")
    print("SUCCESS! Database saved to /ensa_faiss_index")

if __name__ == "__main__":
    build_school_memory()