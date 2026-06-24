#!/usr/bin/env bash
# Run this on YOUR Mac to stop whatever is on port 3000 (e.g. portfolio)
PID=$(lsof -ti :3000 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Killing process(es) on port 3000: $PID"
  kill -9 $PID
  echo "Port 3000 is free."
else
  echo "Nothing running on port 3000."
fi
