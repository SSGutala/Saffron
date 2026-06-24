#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
export $(grep -v '^#' .env | xargs)

echo "Starting Saffron on http://0.0.0.0:9000 ..."
exec npm run start
