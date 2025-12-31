# import os
# from langchain_community.document_loaders import DirectoryLoader, TextLoader
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_community.vectorstores import Chroma

from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, TextLoader
import os
from dotenv import load_dotenv

load_dotenv()
DATA_PATH = "datasets"
CHROMA_DIR = "chroma_db/chroma_db_mpnet"
COLLECTION_NAME = "portfolio_collection"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"


# def create_database():
#     print("🚀 Starting the process ChromaDB initializing...")

#     loader = DirectoryLoader(
#         path=DATA_PATH,
#         glob="**/*.md",
#         loader_cls=TextLoader,
#         loader_kwargs={'encoding': 'utf-8'}
#     )
#     documents = loader.load()

#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size=1000,
#         chunk_overlap=100,
#     )
#     reviews_docs = text_splitter.split_documents(documents)

#     embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
#     Chroma.from_documents(
#         documents=reviews_docs,
#         embedding=embedding_model,
#         persist_directory=CHROMA_DIR,
#         collection_name=COLLECTION_NAME
#     )

#     print("🎉 ChromaDB created successfully")


# if __name__ == "__main__":
#     create_database()

HF_TOKEN = os.getenv("HUGGINGFACE_API")

# 2. Вземи своя API Key от Pinecone Dashboard
PINECONE_API = os.getenv("PINECONE_API")
INDEX_NAME = "syn-net"


def main():
    print("Initializing HuggingFace Endpoint Embeddings...")
    embeddings = HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-mpnet-base-v2",
        task="feature-extraction",
        huggingfacehub_api_token=HF_TOKEN
    )

    print("Load info.md file")
    # Увери се, че имаш папка 'data' с .txt файлове в нея
    loader = DirectoryLoader(
        path=DATA_PATH,
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={'encoding': 'utf-8'}
    )
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )
    docs = text_splitter.split_documents(documents)
    print(f"Създадени са {len(docs)} текстови парчета.")

    pc = Pinecone(
        api_key=PINECONE_API)
    existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]
    print(existing_indexes)
    index = pc.Index(INDEX_NAME)

    print(
        f"Uploading the vectors in Pinecone (Index: {INDEX_NAME})...")

    vectorstore = PineconeVectorStore(
        embedding=embeddings,
        index=index,
        pinecone_api_key=PINECONE_API
    )
    vectorstore.add_documents(docs)

    print("✅ All done! Data is stored in Pinecone.")


if __name__ == "__main__":
    main()
