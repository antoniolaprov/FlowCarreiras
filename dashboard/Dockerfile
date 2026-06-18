FROM python:3.12-slim

WORKDIR /app

# Dependências de sistema mínimas para psycopg2-binary já vêm prontas;
# instala só o que o pip precisa.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY .streamlit/ .streamlit/
COPY app.py .

EXPOSE 8501

# Health check pelo endpoint interno do Streamlit
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8501/dashboard/_stcore/health')" || exit 1

CMD ["streamlit", "run", "app.py"]
