FROM python:3.11-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -o Acquire::http::Timeout="10" -o Acquire::ForceIPv4="true" \
    && apt-get install -y --no-install-recommends \
       dbus \
       gcc \
       python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8025

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8025"]