from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from logging_service import LoggingService
import asyncio
import json

router = APIRouter(prefix="/api/console", tags=["Console"])


@router.get("/logs")
async def get_recent_logs(count: int = 100, level: str = None):
    logger = LoggingService.get_instance()
    entries = logger.get_recent(count, level)
    return [e.model_dump() for e in entries]


@router.post("/logs/clear")
async def clear_logs():
    logger = LoggingService.get_instance()
    logger.clear()
    return {"status": "cleared"}


@router.get("/stream")
async def stream_console_logs(request: Request):
    logger = LoggingService.get_instance()
    queue = logger.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    entry = await asyncio.wait_for(queue.get(), timeout=30)
                    yield {
                        "event": "log",
                        "data": json.dumps(entry.model_dump()),
                    }
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": ""}
        finally:
            logger.unsubscribe(queue)

    return EventSourceResponse(event_generator())
