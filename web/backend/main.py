from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import admin, final_quest, players, quests, sync, trips

app = FastAPI(title="Suffer API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(trips.router, prefix="/api")
app.include_router(players.router, prefix="/api")
app.include_router(quests.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(final_quest.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "service": "suffer-api"}

