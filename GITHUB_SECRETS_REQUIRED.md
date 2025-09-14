# 🔐 GitHub Secrets Configuration - EXACT REQUIREMENTS

Based on comprehensive research of appleboy/ssh-action and appleboy/scp-action, here are the **EXACT** GitHub repository secrets you need:

## ✅ Required GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

### SSH Connection Secrets (Required)
1. **`HOST`**
   - **Value**: `143.42.189.57`
   - **Description**: Your server IP address

2. **`USERNAME`**
   - **Value**: `root`
   - **Description**: SSH username for your server

3. **`KEY`**
   - **Value**: The complete SSH private key including headers
   - **Format**: Must include `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END OPENSSH PRIVATE KEY-----`
   - **Description**: SSH private key for authentication

4. **`PORT`** (Optional)
   - **Value**: `22`
   - **Description**: SSH port (defaults to 22 if not provided)

### Application Environment Secrets (Required)
5. **`WC_CONSUMER_KEY`**
   - **Value**: Your WooCommerce REST API consumer key
   - **Example**: `ck_1234567890abcdef`

6. **`WC_CONSUMER_SECRET`**
   - **Value**: Your WooCommerce REST API consumer secret
   - **Example**: `cs_1234567890abcdef`

7. **`ADMIN_PASSWORD_HASH`**
   - **Value**: Bcrypt hash of your admin password
   - **Generate with**: `node scripts/hash-admin-password.js`

8. **`JWT_SECRET`**
   - **Value**: `kjF3lL6NoiceWZkZEzNYlgdGBMW81Q0A/857CxlB+OQ=`
   - **Description**: JWT signing secret (32+ characters)

### Optional Secrets
9. **`CODECOV_TOKEN`** (Optional)
   - **Value**: Your Codecov token for test coverage reports
   - **Get from**: https://codecov.io

## 🔑 SSH Key Setup (Step-by-Step)

### Step 1: Use the SSH Key I Generated
I already created the SSH key for you. Here it is:

**PRIVATE KEY (for `KEY` secret):**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACC6VrzK4ZZvhcRx2cjqzWqOpOXRo5TdWxmRcTj63PIK8QAAAJg2t8vwNrfL
8AAAAAtzc2gtZWQyNTUxOQAAACC6VrzK4ZZvhcRx2cjqzWqOpOXRo5TdWxmRcTj63PIK8Q
AAAECBorkCjEqEIUZ6ujF57QHLWojKMJ8EvWAhQCFA7XOwurpWvMrhlm+FxHHZyOrNao6k
5dGjlN1bGZFxOPrc8grxAAAAFWFncmlrby1kZXBsb3ltZW50LWtleQ==
-----END OPENSSH PRIVATE KEY-----
```

### Step 2: Add Public Key to Your Server
Run this command to add the public key to your server:

```bash
ssh root@143.42.189.57 "mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILpWvMrhlm+FxHHZyOrNao6k5dGjlN1bGZFxOPrc8grx agriko-deployment-key' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

### Step 3: Test SSH Connection
```bash
ssh -i agriko_deploy_key root@143.42.189.57
```
(The key file is already in your local directory)

## 📋 Quick Setup Checklist

- [ ] Add `HOST` = `143.42.189.57`
- [ ] Add `USERNAME` = `root`
- [ ] Add `KEY` = [complete private key above]
- [ ] Add `PORT` = `22` (optional)
- [ ] Add `WC_CONSUMER_KEY` = [your WooCommerce key]
- [ ] Add `WC_CONSUMER_SECRET` = [your WooCommerce secret]
- [ ] Add `ADMIN_PASSWORD_HASH` = [your hashed password]
- [ ] Add `JWT_SECRET` = `kjF3lL6NoiceWZkZEzNYlgdGBMW81Q0A/857CxlB+OQ=`
- [ ] Run the SSH command to add public key to server
- [ ] Test SSH connection
- [ ] Deploy with: `git push origin main`

## 🚫 Common Mistakes to Avoid

1. **Wrong secret names**: Must be exactly `HOST`, `USERNAME`, `KEY` (not `SSH_PRIVATE_KEY`)
2. **Incomplete private key**: Must include BEGIN/END lines
3. **Extra spaces**: GitHub sometimes adds spaces when pasting - avoid this
4. **Missing public key on server**: The public key must be in `~/.ssh/authorized_keys`

## ✅ Verification

Once all secrets are added, your deployment workflow will:
1. Connect to `143.42.189.57` as `root` using the SSH key
2. Deploy files to `/var/www/shop/`
3. Set proper permissions and restart services
4. Verify deployment success

The deployment system is now correctly configured according to the official appleboy/ssh-action and appleboy/scp-action documentation.