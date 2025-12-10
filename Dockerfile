# syntax=docker/dockerfile:1

FROM python:3.12-slim

LABEL fly_launch_runtime="flask"

WORKDIR /code

# Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

EXPOSE 8080

# Ensure Flask knows what to run
ENV FLASK_APP=app.py
ENV PORT=8080

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=8080"]
