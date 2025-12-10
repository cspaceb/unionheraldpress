# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.14.0
FROM python:${PYTHON_VERSION}-slim

LABEL fly_launch_runtime="flask"

WORKDIR /code

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose Fly.io port
EXPOSE 8080

# Start Flask app
CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0", "--port=8080"]
