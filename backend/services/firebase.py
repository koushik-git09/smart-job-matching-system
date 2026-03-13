import firebase_admin
from firebase_admin import credentials, firestore

from google.cloud import firestore as g_firestore

import os
import base64
import json
from typing import cast


def _get_firebase_credential() -> credentials.Base:
    """Return Firebase Admin credentials.

    Supported sources (first match wins):
    - FIREBASE_SERVICE_ACCOUNT_JSON: raw JSON for a service account
    - FIREBASE_SERVICE_ACCOUNT_B64: base64-encoded JSON for a service account
    - GOOGLE_APPLICATION_CREDENTIALS: path to a service account JSON file
    - backend/firebase-key.json: local dev fallback
    """

    sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        info = json.loads(sa_json)
        return credentials.Certificate(info)

    sa_b64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_B64")
    if sa_b64:
        raw = base64.b64decode(sa_b64.encode("utf-8")).decode("utf-8")
        info = json.loads(raw)
        return credentials.Certificate(info)

    gac = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if gac:
        return credentials.Certificate(os.path.abspath(gac))

    key_path = os.path.join(os.path.dirname(__file__), "..", "firebase-key.json")
    return credentials.Certificate(os.path.abspath(key_path))


cred = _get_firebase_credential()

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db: g_firestore.Client = cast(g_firestore.Client, firestore.client())
