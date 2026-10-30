import asyncio
from app.db.session import engine
from app.db.base import Base
import app.models

async def main():
    print("Testing DB connection...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("SUCCESS: Database connected and tables created/verified!")
    except Exception as e:
        print(f"DB ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
