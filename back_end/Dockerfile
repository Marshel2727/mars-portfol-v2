FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=main.py

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all other backend files
COPY . .

# Expose the Flask port
EXPOSE 5000

# Run database migrations, then start the app.
CMD ["sh", "-c", "flask db upgrade && gunicorn -w 4 -b 0.0.0.0:5000 main:app"]
