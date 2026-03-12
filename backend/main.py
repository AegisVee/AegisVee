from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import rag, hil, sdk, projects, logic, system, tests, drawio
# v2 ASPICE routers
from routers import requirements as req_router
from routers import architecture as arch_router
from routers import verification as verif_router
from routers import traceability as trace_router
from routers import compliance as comp_router
from routers import evidence as evid_router
# v2.0 AI Plugin Architecture routers
from routers import ai_settings as ai_settings_router
from routers import plugins as plugins_router
from routers import console as console_router
# v3.0 Block & V&V Rules routers
from routers import blocks as blocks_router
from routers import vnv_rules as vnv_rules_router
from logging_service import LoggingService, LogLevel
import time
import threading
from contextlib import asynccontextmanager
import rag_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run storage migrations then initialize RAG in background
    from storage import init_storage
    init_storage()

    # v2.0: Initialize AI provider manager from settings
    from ai_settings_storage import load_ai_settings
    from ai_providers.provider_manager import ProviderManager
    ai_settings = load_ai_settings()
    ProviderManager.initialize(ai_settings)

    threading.Thread(target=rag_service.initialize_rag, daemon=True).start()

    logger = LoggingService.get_instance()
    logger.info("system", "AegisVee backend started")
    logger.info("system", f"AI provider: {ai_settings.active_provider}")
    yield
    logger.info("system", "AegisVee backend shutting down")

app = FastAPI(title="AegisVee MVP API", lifespan=lifespan)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    logger = LoggingService.get_instance()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        level = LogLevel.ERROR if response.status_code >= 400 else LogLevel.INFO
        logger.log(level, "api", f"{request.method} {request.url.path} [{response.status_code}] {process_time*1000:.0f}ms")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error("api", f"{request.method} {request.url.path} ERROR: {str(e)} {process_time*1000:.0f}ms")
        raise

# 允許前端 React 存取
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers — v1 preserved
app.include_router(rag.router)
app.include_router(hil.router)
app.include_router(sdk.router)
app.include_router(projects.router)
app.include_router(logic.router)
app.include_router(system.router)
app.include_router(tests.router)
app.include_router(drawio.router)
# v2 ASPICE routers
app.include_router(req_router.router)
app.include_router(arch_router.router)
app.include_router(verif_router.router)
app.include_router(trace_router.router)
app.include_router(comp_router.router)
app.include_router(evid_router.router)
# v2.0 AI Plugin Architecture routers
app.include_router(ai_settings_router.router)
app.include_router(plugins_router.router)
# v2.0 Console
app.include_router(console_router.router)
# v3.0 Blocks & V&V Rules
app.include_router(blocks_router.router)
app.include_router(vnv_rules_router.router)

@app.get("/")
def read_root():
    return {"status": "AegisVee Engine is Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
