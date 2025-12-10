import os
import json
import uuid
from pathlib import Path

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    abort,
)

import boto3
from botocore.client import Config

# --- App setup ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    instance_path=str(BASE_DIR / "instance"),
    instance_relative_config=True,
)

# Local folders (still used for instance data; uploads now go to R2)
INSTANCE_FOLDER = BASE_DIR / "instance"
DATA_FILE = INSTANCE_FOLDER / "articles.json"

INSTANCE_FOLDER.mkdir(parents=True, exist_ok=True)

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB


# --- Cloudflare R2 config ----------------------------------------------

R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "unionheraldpress")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_PUBLIC_BASE_URL = os.getenv("R2_PUBLIC_BASE_URL", "").rstrip("/")

if not all([R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL]):
    raise RuntimeError(
        "R2 configuration missing. Make sure R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, "
        "R2_SECRET_ACCESS_KEY, and R2_PUBLIC_BASE_URL are set as environment variables."
    )

r2_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT_URL,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)


# --- Helpers -----------------------------------------------------------

def load_articles():
    if not DATA_FILE.exists():
        return {}
    with DATA_FILE.open("r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def save_articles(data):
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def allowed_file(filename):
    allowed = {"png", "jpg", "jpeg", "gif", "webp"}
    if "." not in filename:
        return False
    return filename.rsplit(".", 1)[1].lower() in allowed


def upload_to_r2(file_storage, key: str):
    """
    Upload a Werkzeug FileStorage to Cloudflare R2 at the given object key.
    """
    file_storage.stream.seek(0)
    extra_args = {
        "ContentType": file_storage.mimetype or "application/octet-stream",
    }
    r2_client.upload_fileobj(
        file_storage.stream,
        R2_BUCKET_NAME,
        key,
        ExtraArgs=extra_args,
    )


def r2_url_for(key: str) -> str:
    """
    Build the public URL for an object key using the R2 public base URL.
    """
    return f"{R2_PUBLIC_BASE_URL}/{key.lstrip('/')}"


# --- Routes ------------------------------------------------------------

@app.route("/", methods=["GET", "POST"])
def create_article():
    """
    Create page:
      - User enters headline
      - User uploads:
          • OG preview image
          • Troll article image
      - Saves both to Cloudflare R2
      - Stores object keys in JSON
      - Redirects to shareable URL
    """
    error = None

    if request.method == "POST":
        headline = request.form.get("headline", "").strip()

        og_file = request.files.get("og_image")
        troll_file = request.files.get("troll_image")

        # Validation
        if not headline:
            error = "Headline is required."
        elif not og_file or og_file.filename == "":
            error = "Preview image is required."
        elif not troll_file or troll_file.filename == "":
            error = "Troll article image is required."
        elif not allowed_file(og_file.filename):
            error = "Preview image must be PNG, JPG, JPEG, GIF, or WEBP."
        elif not allowed_file(troll_file.filename):
            error = "Troll image must be PNG, JPG, JPEG, GIF, or WEBP."

        else:
            # Generate unique ID for this article
            article_id = uuid.uuid4().hex[:10]

            # Extensions
            og_ext = og_file.filename.rsplit(".", 1)[1].lower()
            troll_ext = troll_file.filename.rsplit(".", 1)[1].lower()

            # Object keys in R2 (you can adjust the prefix structure if you like)
            og_key = f"articles/{article_id}_og.{og_ext}"
            troll_key = f"articles/{article_id}_troll.{troll_ext}"

            # Upload to R2
            upload_to_r2(og_file, og_key)
            upload_to_r2(troll_file, troll_key)

            # Save metadata
            articles = load_articles()
            articles[article_id] = {
                "id": article_id,
                "headline": headline,
                "og_key": og_key,
                "troll_key": troll_key,
            }
            save_articles(articles)

            return redirect(url_for("view_article", article_id=article_id, _external=False))

    return render_template("create.html", error=error)


@app.route("/a/<article_id>")
def view_article(article_id):
    """
    Article page:
      - Shows only the troll image (from R2)
      - OG tags use the preview image (from R2)
    """
    articles = load_articles()
    article = articles.get(article_id)

    if not article:
        abort(404)

    # New-style R2 keys
    if "og_key" in article and "troll_key" in article:
        og_url = r2_url_for(article["og_key"])
        troll_url = r2_url_for(article["troll_key"])
    else:
        # Backwards compatibility fallback, if any old entries exist
        og_url = ""
        troll_url = ""

    page_url = request.url

    return render_template(
        "article.html",
        article=article,
        og_url=og_url,
        troll_url=troll_url,
        page_url=page_url,
    )


# --- Entry -------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
