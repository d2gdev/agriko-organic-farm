# URGENT: Security Actions Required

## 🚨 CRITICAL: Rotate WooCommerce API Keys

**Date:** 2025-01-30
**Priority:** CRITICAL - Complete immediately

### Exposed Credentials (NOW INVALID - MUST ROTATE)
The following API credentials were exposed in the codebase with NEXT_PUBLIC_ prefix and need immediate rotation:

- Consumer Key: `ck_6e5fcf7e4b224581d099eb44498b1265962e1d67`
- Consumer Secret: `cs_7c9aebc4f99129936a20719530bc846b9fb18a99`

### Steps to Rotate Keys:

1. **Log into WooCommerce Admin**
   - Go to https://agrikoph.com/wp-admin
   - Navigate to WooCommerce → Settings → Advanced → REST API

2. **Revoke Old Keys**
   - Find the API key ending in `...962e1d67`
   - Click "Revoke" to immediately disable it

3. **Generate New Keys**
   - Click "Add key"
   - Description: "Agriko Shop API - Secure"
   - User: Select appropriate user
   - Permissions: Read/Write
   - Click "Generate API key"

4. **Update .env.local**
   - Replace the old keys with new ones:
   ```
   WC_CONSUMER_KEY=<new_consumer_key>
   WC_CONSUMER_SECRET=<new_consumer_secret>
   ```

5. **Test API Connection**
   ```bash
   npm run dev
   # Visit http://localhost:3000 and verify products load
   ```

6. **Deploy Updates**
   - Update production environment variables
   - Restart the application

## Additional Security Recommendations

1. **Never commit .env.local to git**
   - Verify .gitignore includes `.env.local`

2. **Use environment-specific credentials**
   - Different keys for development/staging/production

3. **Regular key rotation**
   - Rotate keys every 90 days
   - Document rotation in security log

## Verification Checklist
- [ ] Old keys revoked in WooCommerce
- [ ] New keys generated
- [ ] .env.local updated
- [ ] API connectivity tested
- [ ] Production environment updated
- [ ] No NEXT_PUBLIC_ prefix on sensitive keys