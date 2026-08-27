#!/bin/bash
set -e

python manage.py wait_for_db $1

python manage.py migrate $1

# Create the first admin user (admin / admin@123) once the DB is ready
python manage.py create_admin_user $1