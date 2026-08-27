#!/bin/bash
set -e
python manage.py wait_for_db

# Minimal-stack: the migrator container no longer exists in docker-compose.yml,
# so the api applies migrations itself before starting. Idempotent.
python manage.py migrate

# Wait for migrations
python manage.py wait_for_migrations

# Create the default bucket
#!/bin/bash

# Collect system information
HOSTNAME=$(hostname)
MAC_ADDRESS=$(ip link show | awk '/ether/ {print $2}' | head -n 1)
CPU_INFO=$(cat /proc/cpuinfo)
MEMORY_INFO=$(free -h)
DISK_INFO=$(df -h)

# Concatenate information and compute SHA-256 hash
SIGNATURE=$(echo "$HOSTNAME$MAC_ADDRESS$CPU_INFO$MEMORY_INFO$DISK_INFO" | sha256sum | awk '{print $1}')

# Export the variables
export MACHINE_SIGNATURE=$SIGNATURE

# Register instance
python manage.py register_instance "$MACHINE_SIGNATURE"

# Load the configuration variable
python manage.py configure_instance

# Ensure the first admin user exists (admin / admin@123) and is an instance
# admin. Idempotent — also runs in the migrator, but here the Instance row
# already exists so the god-mode promotion takes effect.
python manage.py create_admin_user

# Create the default bucket (only when object storage is actually configured;
# the minimal stack has no minio, and calling it would log a noisy DNS error
# every boot since AWS_S3_ENDPOINT_URL is empty).
if [ "$USE_MINIO" = "1" ]; then
  python manage.py create_bucket
fi

# Clear Cache before starting to remove stale values
python manage.py clear_cache

# Collect static files
python manage.py collectstatic --noinput

exec gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:"${PORT:-8000}" --max-requests 1200 --max-requests-jitter 1000 --access-logfile -
