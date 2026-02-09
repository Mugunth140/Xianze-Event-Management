#!/bin/bash
# Setup script for XIANZE Mail Server

if [ "$1" != "add" ]; then
    echo "Usage: ./setup-mail.sh add <email> <password>"
    echo "Example: ./setup-mail.sh add contact@xianze.tech MySecretPassword123"
    exit 1
fi

EMAIL=$2
PASSWORD=$3

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "Error: Email and Password are required."
    exit 1
fi

echo "Creating email account: $EMAIL"
docker exec -ti xianze-mailserver setup email add "$EMAIL" "$PASSWORD"

echo "---------------------------------------------------"
echo "✅ Account created successfully!"
echo "---------------------------------------------------"
echo "Next Steps via DNS (Cloudflare/GoDaddy/etc):"
echo "1. MX Record: @ -> mail.xianze.tech (Priority 10)"
echo "2. A Record: mail -> <YOUR_SERVER_IP>"
echo "3. SPF Record (TXT): v=spf1 mx ~all"
echo "4. DKIM Record (TXT): Run 'docker exec -ti xianze-mailserver setup config dkim' to get keys"
echo "---------------------------------------------------"
