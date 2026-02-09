#!/bin/sh
set -e

# Ensure data directories exist and are writable for the app user
mkdir -p /data/transactions /data/presentations /data/think-link /data/uploads/buildathon
chown -R nestjs:bunjs /data
chmod -R 775 /data

exec su nestjs -s /bin/sh -c "bun run dist/main.js"
