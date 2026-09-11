import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "supportiq")

client = MongoClient(MONGO_URI)

db = client[DATABASE_NAME]

users_collection = db["users"]
tickets_collection = db["tickets"]
predictions_collection = db["predictions"]


def test_database():
    try:
        client.admin.command("ping")
        return True
    except Exception:
        return False
