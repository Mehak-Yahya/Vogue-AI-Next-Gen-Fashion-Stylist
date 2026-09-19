import os
import shutil
import hashlib
import re
import numpy as np
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

# Define local directories relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILES_DIR = os.path.join(BASE_DIR, "files")
DB_DIR = os.path.join(BASE_DIR, "chroma_db")

class LocalTextEmbeddings:
    """Small dependency-free embedder for local Chroma indexing and search."""

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

def build_vector_store():
    print(f"Loading PDFs from: {FILES_DIR}...")
    
    # 1. Load PDFs
    if not os.path.exists(FILES_DIR):
        os.makedirs(FILES_DIR)
        print(f"Created {FILES_DIR}. Place your PDF files here and rerun.")
        return

    pdf_files = sorted(
        file_name
        for file_name in os.listdir(FILES_DIR)
        if file_name.lower().endswith(".pdf")
    )
    if not pdf_files:
        print("No PDF files found! Please place your PDF in 'files/' and try again.")
        return

    print(f"Found {len(pdf_files)} PDF files: {', '.join(pdf_files)}")

    if os.path.exists(DB_DIR):
        shutil.rmtree(DB_DIR)
        print("Cleared existing vector database.")

    loader = PyPDFDirectoryLoader(FILES_DIR)
    documents = loader.load()
    print(f"Loaded {len(documents)} PDF pages.")

    if not documents:
        print("The PDF files did not contain readable pages.")
        return

    loaded_sources = {
        os.path.basename(document.metadata.get("source", ""))
        for document in documents
        if document.page_content.strip()
    }
    unreadable_files = [file_name for file_name in pdf_files if file_name not in loaded_sources]
    for file_name in unreadable_files:
        documents.append(Document(
            page_content=(
                f"Source file: {file_name}. This PDF contains scanned or image-only pages "
                "and requires OCR before its full text can be searched."
            ),
            metadata={"source": os.path.join(FILES_DIR, file_name), "page": 0}
        ))
    if unreadable_files:
        print(f"Added OCR-needed placeholders for: {', '.join(unreadable_files)}")

    # 2. Chunk text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=100
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} text chunks.")

    # 3. Create Embeddings & Store in ChromaDB
    print("Generating vector embeddings...")
    embeddings = LocalTextEmbeddings()

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=DB_DIR
    )
    indexed_files = {
        os.path.basename(chunk.metadata.get("source", ""))
        for chunk in chunks
    }
    print(f"Vector Database successfully stored in: {DB_DIR}")
    print(f"Indexed {len(indexed_files)} PDF files into {vector_store._collection.count()} chunks.")

if __name__ == "__main__":
    build_vector_store()