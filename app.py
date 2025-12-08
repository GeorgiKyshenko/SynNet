import json
from flask import Flask, render_template, jsonify, request, render_template_string
from nbconvert.exporters import HTMLExporter
import nbformat
import pandas as pd
from data import portfolio_data
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_chroma import Chroma
from langchain_community.docstore.document import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
import datetime
from dotenv import load_dotenv
import os

app = Flask(__name__)
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
LLM_MODEL_NAME = 'mistralai/mixtral-8x7b-instruct'
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
QUERY_LOG_FILE = "logs/user_queries.log"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# df = pd.read_csv("datasets/reviews.csv.")
# reviews_docs = [Document(page_content=text) for text in df['review']]

# loader = DirectoryLoader(
#     path="datasets",
#     glob="**/*.md",
#     loader_cls=TextLoader,
#     loader_kwargs={'encoding': 'utf-8'}
# )
# documents = loader.load()

# text_splitter = RecursiveCharacterTextSplitter(
#     chunk_size=1000,
#     chunk_overlap=100,
# )
# docs = text_splitter.split_documents(documents)

model_name = "sentence-transformers/all-mpnet-base-v2"
embedding_model = HuggingFaceEmbeddings(model_name=model_name)

vector_db = Chroma(
    persist_directory="chroma_db/chroma_db_mpnet",
    embedding_function=embedding_model,
    collection_name="portfolio_collection"
)
# this code creates and loads Chroma on every run of the app.py file, now the logic of creation is in another file and the code above
# loads it directly without creating it on every run of the script!

# vector_db = Chroma.from_documents(
#     documents=docs,
#     embedding=embedding_model,
#     persist_directory="chroma_db/chroma_db_mpnet",
#     collection_name="portfolio_collection"
# )

chat_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", temperature=0, google_api_key=GOOGLE_API_KEY)

# chat_model = ChatOpenAI(
#     openai_api_base=OPENROUTER_BASE_URL,
#     openai_api_key=OPENROUTER_API_KEY,
#     model=LLM_MODEL_NAME,
#     temperature=0.1)

instruction_str = """
You are a personal assistant that speaks on behalf of me, as if you are my friend who knows me well. Although we are friends, dont refer to me as "My friend" in this scenario
you are my assistant. Answer all questions as though you are representing me directly.
Don't use technical terms in your answer related to the instruction i gave you. Do not use "Oh" consistently.
When speaking on behalf of me, always refer to me as “him”.
Never use “they” or any gender-neutral pronoun when referring to the user.
Use only masculine pronouns: he, him, his. Dont start any conversations other than answering questions about me and dont ask any question!
You can close the conversation politely without asking extra question!

Your tone should be friendly and personal, but not overly emotional. 
If the context does not contain the answer, clearly state that you don’t know.

Context: {context}
"""

system_prompt = SystemMessagePromptTemplate(
    prompt=PromptTemplate(
        input_variables=['context'], template=instruction_str)
)

human_prompt = HumanMessagePromptTemplate(
    prompt=PromptTemplate(input_variables=['question'], template="{question}")
)

messages = [system_prompt, human_prompt]

prompt_template = ChatPromptTemplate(
    input_variables=["context", "question"],
    messages=messages,
)

retriever = vector_db.as_retriever(k=10)

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt_template
    | chat_model
    | StrOutputParser()
)


@app.errorhandler(404)
def page_not_found(error):
    return render_template('error_404.html'), 404


def render_ipynb_to_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        nb = nbformat.read(f, as_version=4)

    for cell in nb.cells:
        if 'outputs' in cell:
            new_outputs = []
            for output in cell.outputs:
                if output.output_type in ('stream', 'execute_result', 'display_data', 'error'):
                    if 'data' in output and 'application/vnd.jupyter.widget-view+json' in output.data:
                        del output.data['application/vnd.jupyter.widget-view+json']
                    new_outputs.append(output)
            cell.outputs = new_outputs

    if 'widgets' in nb.metadata:
        del nb.metadata['widgets']

    html_exporter = HTMLExporter()
    body, _ = html_exporter.from_notebook_node(nb)

    return render_template_string(body)


@app.route('/')
def index():
    grouped_projects = {
        'ML': [p for p in portfolio_data['projects'] if p.get('category') == 'ML'],
        'DL': [p for p in portfolio_data['projects'] if p.get('category') == 'DL'],
        'DS': [p for p in portfolio_data['projects'] if p.get('category') == 'DS'],
    }

    template_data = portfolio_data.copy()
    template_data['grouped_projects'] = grouped_projects

    return render_template('index.html', portfolio_data=template_data, json_data=json.dumps(template_data))


@app.route('/get_project_data/<project_id>')
def get_project_data(project_id):
    project_data = next(
        (p for p in portfolio_data['projects'] if p['id'] == project_id), None)

    if not project_data:
        return jsonify({'error': 'Project not found.'}), 404

    try:
        file_path = project_data.get('ipynb_file')

        if not file_path:
            return jsonify({'error': 'Notebook file path not defined in data.'}), 404

        rendered_html = render_ipynb_to_html(file_path)

        return jsonify({
            'title': project_data['title'],
            'ipynb_content': rendered_html
        })
    except FileNotFoundError:
        return jsonify({'error': f'Notebook file not found.'}), 404
    except Exception as e:
        app.logger.error(f"Error rendering notebook: {e}")
        return jsonify({'error': f'Error rendering notebook: {str(e)}'}), 500


def log_user_query(query):
    timestamp = datetime.datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    log_entry = f"{timestamp} USER QUERY: {query}\n"

    try:
        with open(QUERY_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Error writing to file: {e}")


def log_chatbot_answer(answer):
    timestamp = datetime.datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    log_entry = f"{timestamp} Chatbot Answer: {answer}\n"

    try:
        with open(QUERY_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Error writing to file: {e}")


@app.route('/api/chatbot', methods=['POST'])
def chatbot_api():

    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    user_query = data.get('message', '').strip()

    if not user_query:
        return jsonify({'error': 'Message cannot be empty'}), 400

    log_user_query(user_query)

    answer = chain.invoke(user_query)

    log_chatbot_answer(answer)

    return jsonify({'response': answer})


# if __name__ == '__main__':
    # app.run(debug=True)
    # port = int(os.environ.get('PORT', 5000))
