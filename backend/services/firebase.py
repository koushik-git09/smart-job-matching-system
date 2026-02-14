import firebase_admin
from firebase_admin import credentials, firestore

import os

_KEY_PATH = os.path.join(os.path.dirname(__file__), "..", "firebase-key.json")
cred = credentials.Certificate(os.path.abspath(_KEY_PATH))

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
