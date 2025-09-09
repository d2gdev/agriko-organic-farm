#!/usr/bin/env bash
set -euo pipefail

# Usage: ./setup-deployment.sh OWNER REPO TOKEN
# Example: ./setup-deployment.sh d2gdev agriko-organic-farm ghp_xxxxxxxxxxxx

OWNER="$1"; REPO="$2"; TOKEN="$3"

echo "Setting up automated deployment for $OWNER/$REPO..."

# Check if tweetsodium is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Install tweetsodium if not available
if ! node -e "require('tweetsodium')" 2>/dev/null; then
    echo "Installing tweetsodium..."
    npm install -g tweetsodium
fi

# Define secrets
declare -A S=(
  [SSH_PRIVATE_KEY]=""
  [SERVER_HOST]="shop.agrikoph.com"
  [SERVER_USER]="root"
  [DEPLOY_PATH]="/var/www/shop"
  [NEXT_PUBLIC_WC_API_URL]="https://agrikoph.com/wp-json/wc/v3"
  [WC_CONSUMER_KEY]="ck_6e5fcf7e4b224581d099eb44498b1265962e1d67"
  [WC_CONSUMER_SECRET]="cs_7c9aebc4f99129936a20719530bc846b9fb18a99"
)

# Get GitHub repository public key
echo "Getting repository public key..."
readarray -t PUB < <(curl -s -H "Authorization: Bearer $TOKEN"   -H "Accept: application/vnd.github+json"   https://api.github.com/repos/$OWNER/$REPO/actions/secrets/public-key | jq -r '.key,.key_id')

if [ ${#PUB[@]} -ne 2 ]; then
    echo "Error: Could not retrieve repository public key. Please check your token and repository access."
    exit 1
fi

PUBKEY="${PUB[0]}"; KEYID="${PUB[1]}"

echo "Public key retrieved successfully."

# Function to encrypt secrets
enc() { 
    node -e "const s=require('tweetsodium');const k=Buffer.from('$PUBKEY','base64');const m=Buffer.from(process.argv[1]);process.stdout.write(Buffer.from(s.seal(m,k)).toString('base64'))" "$1"; 
}

# Set each secret
echo "Setting GitHub Actions secrets..."
for NAME in "${!S[@]}"; do
  VAL="${S[$NAME]}"; ENC=$(enc "$VAL")
  
  RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT     -H "Authorization: Bearer $TOKEN"     -H "Accept: application/vnd.github+json"     "https://api.github.com/repos/$OWNER/$REPO/actions/secrets/$NAME"     -d "{\"encrypted_value\":\"$ENC\",\"key_id\":\"$KEYID\"}")
    
  HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  
  if [ $HTTP_STATUS -eq 201 ] || [ $HTTP_STATUS -eq 204 ]; then
    echo "✓ Set $NAME"
  else
    echo "✗ Failed to set $NAME (HTTP $HTTP_STATUS)"
  fi
done

echo ""
echo "🎉 Deployment automation setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the following SSH public key as a deploy key to your GitHub repository:"
echo "   Repository Settings > Deploy keys > Add deploy key"
echo ""
cat ~/.ssh/id_ed25519_deploy.pub
echo ""
echo "2. Make sure to check 'Allow write access' when adding the deploy key"
echo "3. Push this workflow file to your repository:"
echo "   git add .github/workflows/deploy.yml"
echo "   git commit -m 'Add automated deployment workflow'"
echo "   git push origin main"
echo ""
echo "4. Your application will now automatically deploy when you push to the main branch!"
