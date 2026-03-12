import time
import asyncio
from collections import deque
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum


class LogLevel(str, Enum):
    INFO = "info"
    WARN = "warn"
    ERROR = "error"
    DEBUG = "debug"


class LogEntry(BaseModel):
    timestamp: float
    level: LogLevel
    source: str
    message: str


class LoggingService:
    _instance = None

    def __init__(self, max_entries=500):
        self._buffer = deque(maxlen=max_entries)
        self._subscribers: list = []

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def log(self, level: LogLevel, source: str, message: str):
        entry = LogEntry(
            timestamp=time.time(),
            level=level,
            source=source,
            message=message,
        )
        self._buffer.append(entry)
        for queue in self._subscribers:
            try:
                queue.put_nowait(entry)
            except asyncio.QueueFull:
                pass

    def info(self, source: str, message: str):
        self.log(LogLevel.INFO, source, message)

    def warn(self, source: str, message: str):
        self.log(LogLevel.WARN, source, message)

    def error(self, source: str, message: str):
        self.log(LogLevel.ERROR, source, message)

    def debug(self, source: str, message: str):
        self.log(LogLevel.DEBUG, source, message)

    def get_recent(self, count: int = 100, level: Optional[str] = None) -> List[LogEntry]:
        entries = list(self._buffer)
        if level and level != "all":
            entries = [e for e in entries if e.level == level]
        return entries[-count:]

    def clear(self):
        self._buffer.clear()

    def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue(maxsize=100)
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        if queue in self._subscribers:
            self._subscribers.remove(queue)
