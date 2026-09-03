FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=main.py

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all other backend files
COPY . .
RUN chmod +x scripts/start.sh

# Expose the Flask port
EXPOSE 5000

# Seed an empty upload volume, run migrations, then start the app.
CMD ["/app/scripts/start.sh"]
