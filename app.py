from flask import Flask, request, jsonify, render_template, redirect, flash
import fitz
from model_engine import analyze_contract

app = Flask(__name__)
app.secret_key = "supersecretkey"

# # ── Allow the browser to talk to Flask during local dev ──────────────────────
# @app.after_request
# def add_cors(response):
#     response.headers["Access-Control-Allow-Origin"]  = "*"
#     response.headers["Access-Control-Allow-Headers"] = "Content-Type"
#     response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
#     return response

# ── Pages ─────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("home.html")

# ── Main analysis endpoint ────────────────────────────────────────────────────
@app.route('/analyze', methods=['POST'])
def analyze():
    text_content = ""
    
    pasted_text = request.form.get('contract_text')

    if pasted_text and pasted_text.strip():
        text_content = pasted_text

    if 'contract_file' in request.files:
        file = request.files['contract_file']
        if file.filename != '' and file.filename.endswith('.pdf'):
            doc = fitz.open(stream=file.read(), filetype="pdf")
            text_content = "".join([page.get_text() for page in doc])

    # 🔴 THIS IS THE FIX
    if not text_content:
        return render_template("home.html", error="Please upload a PDF or paste contract text before submitting.")  

    results = analyze_contract(text_content)

    return render_template('result.html', report=results)


if __name__ == "__main__":
    # debug=True auto-reloads on file changes during development
    app.run(debug=True, port=5000)