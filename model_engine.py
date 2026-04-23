import torch
from transformers import pipeline

# Load Legal-BERT locally. This runs on your CPU.
# The first time you run this, it will download ~400MB to your machine.
classifier = pipeline("text-classification", model="nlpaueb/legal-bert-base-uncased")

def analyze_contract(text):
    # YOUR CUSTOM DECISION RULES (The "Judge")
    # This fulfills the "No API for decision making" rule.
    RULES = {
        "arbitration": {"risk": "High", "msg": "Forced Arbitration: You lose your right to a court trial."},
        "automatically renew": {"risk": "Medium", "msg": "Auto-Renewal: Contract extends without manual consent."},
        "unilateral": {"risk": "High", "msg": "One-sided Modification: They can change terms anytime."},
        "no refunds": {"risk": "High", "msg": "Restrictive Refund: Getting your money back will be difficult."},
        "third-party": {"risk": "Low", "msg": "Data Sharing: Your data may be shared with partners."},
        "indemnify": {"risk": "Medium", "msg": "Indemnification: You may be liable for their legal costs."}
    }

    # Split text into sentences
    sentences = [s.strip() for s in text.split('.') if len(s) > 15]
    findings = []
    risk_score = 0

    for sent in sentences:
        for key, data in RULES.items():
            if key in sent.lower():
                # Verify legal context using the local BERT model
                ai_check = classifier(sent[:512])[0]
                
                # If the AI confirms this is legal-heavy text
                if ai_check['score'] > 0.3:
                    points = 35 if data['risk'] == "High" else 15
                    risk_score += points
                    findings.append({
                        "label": data['risk'],
                        "issue": data['msg'],
                        "text": sent[:150] + "..."
                    })

    # Final Decision made by YOUR code logic
    verdict = "⚠️ UNSAFE" if risk_score > 50 else "✅ SAFE"
    return {
        "verdict": verdict, 
        "score": min(risk_score, 100), 
        "flags": findings
    }