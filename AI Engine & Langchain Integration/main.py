import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# 1. Load your Google API Key securely from the .env file
load_dotenv()
# 2. Initialize the FastAPI app
app = FastAPI(title="InfoClub AI API", description="RAG Chatbot for Team Atlas")

# 3. Define the data structure for the user's request
class QuestionRequest(BaseModel):
    question: str

# 4. Load the memory and the Gemini AI model
print("Loading AI memory and Gemini model...")
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

# Load the FAISS database you built with CreateMemory.py
vector_store = FAISS.load_local(
    "ensa_faiss_index", 
    embeddings, 
    allow_dangerous_deserialization=True
)

retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# Set up Gemini 2.5 Flash as the brain
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)

# 5. Create the exact instructions for the bot
system_prompt = (
    "You are a helpful and intelligent assistant for the ENSA Marrakech InfoClub. "
    "Use the following pieces of retrieved context to answer the user's question. "
    "If you don't know the answer based on the context, just say that you don't know. "
    "Keep your answers concise and accurate.\n\n"
    "Context: {context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

# 6. Chain it all together into a single pipeline using LCEL
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "input": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 7. Create the API Endpoint
@app.post("/ask")
async def ask_question(request: QuestionRequest):
    try:
        answer = rag_chain.invoke(request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)