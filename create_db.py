import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

DATA_PATH = "datasets"
CHROMA_DIR = "chroma_db/chroma_db_mpnet"
COLLECTION_NAME = "portfolio_collection"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"


def create_database():
    print("🚀 Starting the process ChromaDB initializing...")

    loader = DirectoryLoader(
        path=DATA_PATH,
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={'encoding': 'utf-8'}
    )
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
    )
    reviews_docs = text_splitter.split_documents(documents)

    embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    Chroma.from_documents(
        documents=reviews_docs,
        embedding=embedding_model,
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME
    )

    print("🎉 ChromaDB created successfully")


if __name__ == "__main__":
    create_database()
