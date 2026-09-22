import os
import hashlib
import re
import numpy as np
from dotenv import load_dotenv
from langchain_chroma import Chroma

try:
    from groq import Groq
except ImportError:
    Groq = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "chroma_db")
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

LLAMA_MODEL = os.getenv("LLAMA_MODEL", "openai/gpt-oss-120b")

class LocalTextEmbeddings:
    dimensions = 384

    def _embed(self, text):
        vector = np.zeros(self.dimensions, dtype=np.float32)
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "little") % self.dimensions
            vector[index] += 1.0
        norm = np.linalg.norm(vector)
        return (vector / norm if norm else vector).tolist()

    def embed_documents(self, texts):
        return [self._embed(text) for text in texts]

    def embed_query(self, text):
        return self._embed(text)

def get_rag_retriever():
    if not os.path.exists(DB_DIR):
        raise FileNotFoundError(f"ChromaDB not found at {DB_DIR}. Run ingest.py first!")

    embeddings = LocalTextEmbeddings()
    vector_store = Chroma(
        persist_directory=DB_DIR,
        embedding_function=embeddings
    )
    return vector_store.as_retriever(search_kwargs={"k": 3})

def get_indexed_sources():
    embeddings = LocalTextEmbeddings()
    vector_store = Chroma(
        persist_directory=DB_DIR,
        embedding_function=embeddings
    )
    metadata = vector_store.get(include=["metadatas"]).get("metadatas", [])
    return sorted({
        os.path.basename(item["source"])
        for item in metadata
        if item and item.get("source")
    })

def detect_response_language(question):
    roman_urdu_words = {
        "aj", "aaj", "kia", "kya", "pehnu", "pehnun", "kaise", "kesa",
        "kaisa", "mujhe", "mere", "meri", "liye", "rang", "kapray", "kapre",
        "chahiye", "batao", "bataein", "acha", "achay", "hai", "hain",
    }
    words = set(re.findall(r"[a-z]+", question.lower()))
    return "Roman Urdu" if words & roman_urdu_words else "English"

def clean_guidance(text):
    cleaned = re.sub(r"\*{1,3}|_{1,3}", "", text or "")
    return cleaned.strip()

def synthesize_guidance(season_name, user_question, retrieved_contexts, history=None):
    response_language = detect_response_language(user_question)
    season_context = (
        f"the user's optional color season ({season_name})"
        if season_name
        else "no color season; answer from the user's question"
    )
    fallback = (
        "Aapke sawal ke mutabiq practical fashion guidance dein, aur zaroorat ho "
        "to colors, fabrics aur drapes ko aapke undertone ke saath harmonize karein."
        if response_language == "Roman Urdu"
        else "Based on the fashion research, here is practical guidance tailored to "
        "your question."
    )
    api_key = os.getenv("LLAMA_API_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key:
        return fallback
    if Groq is None:
        raise RuntimeError("Groq is not installed. Run: pip install groq")

    context_text = "\n\n".join(
        context.replace("\n", " ").strip() for context in retrieved_contexts
    )
    client = Groq(api_key=api_key)
    completion = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the Vogue AI Style Consultant. Use the supplied research "
                    "context to answer the user's fashion questions, including outfits, "
                    "fit, fabrics, styling, accessories, occasions, care, and color. "
                    "Give concise, friendly, practical coaching. Use the optional color "
                    "season only when it helps; never force a color-season answer onto "
                    "a general question. Do not invent citations or claim expertise "
                    "outside fashion and styling.\n\n"
                    "Language rules: detect the language and writing style of the "
                    "user's question. Reply ONLY in English for English questions. "
                    "Reply ONLY in Roman Urdu for Roman Urdu questions such as "
                    "'aj kia pehnu'. Use Latin letters only for Roman Urdu. Never use "
                    "Hindi, Urdu, Arabic, or Devanagari script. Never reply in any "
                    "third language. Do not repeat the user's question or ask "
                    "unnecessary generic questions. Do not use Markdown emphasis "
                    "markers such as ** or __."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Required response language: {response_language}\n"
                    f"Optional color season: {season_name or 'Not provided'}\n"
                    f"Conversation so far: {history or 'This is the first message.'}\n"
                    f"Question: {user_question or 'Give me a useful fashion recommendation.'}\n\n"
                    f"Research context:\n{context_text}\n\n"
                    "Give a structured recommendation in short bullet points."
                ),
            },
        ],
        temperature=0.3,
        max_tokens=500,
    )
    return clean_guidance(completion.choices[0].message.content)

def query_rag_chatbot(season_name: str = "", user_question: str = "", history=None):
    retriever = get_rag_retriever()
    
    # Formulate search prompt
    search_prompt = user_question or "fashion styling, outfits, fabrics, fit, and accessories"
    if season_name:
        search_prompt += f" Color season context: {season_name}."

    docs = retriever.invoke(search_prompt)
    retrieved_contexts = [doc.page_content for doc in docs]

    summary_points = []
    for i, context in enumerate(retrieved_contexts, 1):
        clean_text = context.replace("\n", " ").strip()
        summary_points.append(f"Excerpt {i}: {clean_text[:200]}...")

    guidance = synthesize_guidance(season_name, user_question, retrieved_contexts, history)

    return {
        "season": season_name,
        "question": user_question or "General Styling Rules",
        "retrieved_evidence": summary_points,
        "sources_used": sorted({
            os.path.basename(doc.metadata["source"])
            for doc in docs
            if doc.metadata.get("source")
        }),
        "indexed_sources": get_indexed_sources(),
        "guidance": guidance,
        "llm_used": bool(os.getenv("LLAMA_API_KEY") or os.getenv("GROQ_API_KEY")),
        "raw_context_used": retrieved_contexts,
    }

if __name__ == "__main__":
    # Test execution
    test_res = query_rag_chatbot("Warm Spring", "What colors should I wear?")
    print("Test RAG Output:\n", test_res)