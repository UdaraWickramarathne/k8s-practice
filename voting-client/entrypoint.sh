#!/bin/sh

# Replace placeholders with runtime env vars
envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

# Start Nginx
exec "$@"
