FROM python:3.11-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

RUN sed -i 's/deb.debian.org/cdn-fastly.deb.debian.org/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
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