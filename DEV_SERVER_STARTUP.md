# Stable Development Server Startup Procedure

## Prerequisites
- Node.js 18+ installed
- npm dependencies installed (`npm install`)
- Environment variables configured in `.env.local`

## Startup Commands

### Clean Startup (Recommended)
```bash
# 1. Kill any existing dev servers
pkill -f "next dev" || true

# 2. Clear Next.js cache
rm -rf .next

# 3. Clear webpack cache 
rm -rf node_modules/.cache

# 4. Start development server
npm run dev
```

### Quick Startup (If no issues)
```bash
npm run dev
```

## Expected Output
```
> agriko@1.0.0 dev
> next dev

   ▲ Next.js 15.5.2
   - Local:        http://localhost:300X
   - Network:      http://192.168.1.2:300X
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 3s
```

## Port Information
- Server will automatically find available port (3000, 3006, 3007, 3008, etc.)
- Current stable port: 3008
- Admin dashboard: http://localhost:[PORT]/admin
- API endpoints: http://localhost:[PORT]/api/

## Troubleshooting

### Port Conflicts
- If port 3000 is in use, Next.js automatically selects next available port
- Check process using port: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

### Cache Issues
- Always clear .next directory if experiencing compilation errors
- Clear node_modules/.cache for webpack issues
- Restart IDE if TypeScript errors persist

### Environment Variables
Required variables in `.env.local`:
- `NEXT_PUBLIC_WC_API_URL`
- `WC_CONSUMER_KEY` 
- `WC_CONSUMER_SECRET`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## Verification Steps
1. Server starts without compilation errors
2. Homepage loads at http://localhost:[PORT]
3. Admin login works at http://localhost:[PORT]/admin/login
4. No console errors in browser developer tools
5. API endpoints respond correctly

## Common Issues
- **Fast Refresh errors**: Usually resolved by clearing cache
- **Hydration mismatches**: Check for Date.now() usage in components
- **TypeScript errors**: Verify all imports and type definitions
- **Authentication issues**: Check JWT_SECRET and admin credentials

Last Updated: Current session
Server Status: ✅ Stable on port 3008