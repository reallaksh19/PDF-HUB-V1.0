#!/bin/bash
HOST=${HOST:-127.0.0.1}
PORT=${PORT:-8000}

# Add --reload only for dev
if [ "$RELOAD" = "true" ]; then
    RELOAD_FLAG="--reload"
else
    RELOAD_FLAG=""
fi

exec uvicorn app.main:app --host "$HOST" --port "$PORT" --proxy-headers $RELOAD_FLAG
