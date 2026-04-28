import os
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
transactions_col = db["transactions"]

app = FastAPI(title="Personal Finance Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TransactionCreate(BaseModel):
    type: Literal["income", "expense"]
    amount: float = Field(ge=0)
    category: str
    description: str
    date: str  # ISO date string YYYY-MM-DD


class TransactionUpdate(BaseModel):
    type: Optional[Literal["income", "expense"]] = None
    amount: Optional[float] = Field(default=None, ge=0)
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None


class Transaction(BaseModel):
    id: str
    type: Literal["income", "expense"]
    amount: float
    category: str
    description: str
    date: str
    created_at: Optional[str] = None


def _to_model(doc: dict) -> Transaction:
    return Transaction(
        id=doc["id"],
        type=doc["type"],
        amount=doc["amount"],
        category=doc["category"],
        description=doc["description"],
        date=doc["date"],
        created_at=doc.get("created_at"),
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/transactions", response_model=List[Transaction])
async def list_transactions():
    docs = await transactions_col.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
    return [_to_model(d) for d in docs]


@app.post("/api/transactions", response_model=Transaction, status_code=201)
async def create_transaction(payload: TransactionCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "type": payload.type,
        "amount": round(payload.amount, 2),
        "category": payload.category.strip(),
        "description": payload.description.strip(),
        "date": payload.date,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await transactions_col.insert_one(doc)
    doc.pop("_id", None)
    return _to_model(doc)


@app.put("/api/transactions/{tx_id}", response_model=Transaction)
async def update_transaction(tx_id: str, payload: TransactionUpdate):
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "amount" in updates:
        updates["amount"] = round(updates["amount"], 2)
    if "category" in updates:
        updates["category"] = updates["category"].strip()
    if "description" in updates:
        updates["description"] = updates["description"].strip()

    result = await transactions_col.find_one_and_update(
        {"id": tx_id},
        {"$set": updates},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _to_model(result)


@app.delete("/api/transactions/{tx_id}", status_code=204)
async def delete_transaction(tx_id: str):
    result = await transactions_col.delete_one({"id": tx_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return None


@app.post("/api/transactions/seed", response_model=List[Transaction])
async def seed_transactions():
    """Seed default sample data only if collection is empty."""
    count = await transactions_col.count_documents({})
    if count > 0:
        docs = await transactions_col.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=1000)
        return [_to_model(d) for d in docs]

    seed = [
        {"type": "income", "amount": 3500, "category": "Salary", "description": "Monthly salary", "date": "2026-04-01"},
        {"type": "expense", "amount": 1200, "category": "Rent", "description": "April rent", "date": "2026-04-01"},
        {"type": "expense", "amount": 85, "category": "Groceries", "description": "Weekly groceries", "date": "2026-04-05"},
        {"type": "expense", "amount": 45, "category": "Transportation", "description": "Gas", "date": "2026-04-07"},
        {"type": "income", "amount": 200, "category": "Freelance", "description": "Side project", "date": "2026-04-10"},
    ]
    now = datetime.now(timezone.utc).isoformat()
    docs = [
        {**s, "id": str(uuid.uuid4()), "created_at": now} for s in seed
    ]
    await transactions_col.insert_many(docs)
    for d in docs:
        d.pop("_id", None)
    return [_to_model(d) for d in docs]
