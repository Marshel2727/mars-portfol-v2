#!/bin/sh
set -eu

UPLOAD_ROOT="/app/app/static/uploads"

mkdir -p "$UPLOAD_ROOT/projects" "$UPLOAD_ROOT/about" "$UPLOAD_ROOT/skills"

if [ -d /app/seed_assets/projects ]; then
  cp -Rn /app/seed_assets/projects/. "$UPLOAD_ROOT/projects/"
fi

if [ -d /app/seed_assets/about ]; then
  cp -Rn /app/seed_assets/about/. "$UPLOAD_ROOT/about/"
fi

flask db upgrade
exec gunicorn -w 4 -b 0.0.0.0:5000 main:app
