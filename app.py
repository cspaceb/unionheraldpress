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

# --- App setup ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    instance_path=str(BASE_DIR / "instance"),
    instance_relative_config=True,
)

# Folders
UPLOAD_FOLDER = BASE_DIR / "static" / "uploads"
INSTANCE_FOLDER = BASE_DIR / "instance"
DATA_FILE = INSTANCE_FOLDER / "articles.json"

UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
INSTANCE_FOLDER.mkdir(parents=True, exist_ok=True)

app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB


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


# --- Routes ------------------------------------------------------------

@app.route("/", methods=["GET", "POST"])
def create_article():
    """
    Create page:
      - User enters headline
      - User uploads:
          • OG preview image
          • Troll article image
      - Saves both
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
            # Generate unique ID
            article_id = uuid.uuid4().hex[:10]

            # Extract extensions
            og_ext = og_file.filename.rsplit(".", 1)[1].lower()
            troll_ext = troll_file.filename.rsplit(".", 1)[1].lower()

            # Filenames
            og_filename = f"{article_id}_og.{og_ext}"
            troll_filename = f"{article_id}_troll.{troll_ext}"

            # Save both files
            og_path = UPLOAD_FOLDER / og_filename
            troll_path = UPLOAD_FOLDER / troll_filename

            og_file.save(og_path)
            troll_file.save(troll_path)

            # Save metadata
            articles = load_articles()
            articles[article_id] = {
                "id": article_id,
                "headline": headline,
                "og_filename": og_filename,
                "troll_filename": troll_filename,
            }
            save_articles(articles)

            return redirect(url_for("view_article", article_id=article_id, _external=False))

    return render_template("create.html", error=error)


@app.route("/a/<article_id>")
def view_article(article_id):
    """
    Article page:
      - Shows only the troll image
      - OG tags use preview image only
    """
    articles = load_articles()
    article = articles.get(article_id)

    if not article:
        abort(404)

    # URLs for both images
    og_url = url_for(
        "static",
        filename=f"uploads/{article['og_filename']}",
        _external=True,
    )

    troll_url = url_for(
        "static",
        filename=f"uploads/{article['troll_filename']}",
        _external=True,
    )

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
