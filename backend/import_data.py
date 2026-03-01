import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Initialize Firebase
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# Folder containing JSON files
DATA_FOLDER = "database"

def upload_collection(file_name):
    file_path = os.path.join(DATA_FOLDER, file_name)
    
    with open(file_path, "r") as f:
        data = json.load(f)

    for collection_name, documents in data.items():
        for doc_id, doc_data in documents.items():
            db.collection(collection_name).document(doc_id).set(doc_data)

    print(f"✅ Uploaded {file_name}")

# Upload all files
upload_collection("skills.json")
upload_collection("role_rules.json")
upload_collection("jobs.json")
upload_collection("courses.json")

print("🔥 ALL DATA IMPORTED SUCCESSFULLY")