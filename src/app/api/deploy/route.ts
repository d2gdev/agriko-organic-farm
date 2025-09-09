import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Check if it's a push to main branch
    if (payload.ref === 'refs/heads/main') {
      console.log('Deployment triggered by GitHub webhook');
      
      // Execute deployment commands
      const commands = [
        'cd /var/www/shop',
        'git pull origin main',
        'npm ci --omit=dev', 
        'npm run build',
        'pm2 restart agriko-shop'
      ];
      
      // Execute commands sequentially
      for (const command of commands) {
        try {
          const { stdout, stderr } = await execAsync(command);
          console.log(`Command: ${command}`);
          console.log(`Output: ${stdout}`);
          if (stderr) console.error(`Error: ${stderr}`);
        } catch (error) {
          console.error(`Failed to execute: ${command}`, error);
        }
      }
      
      return NextResponse.json({ message: 'Deployment triggered successfully' });
    } else {
      return NextResponse.json({ message: 'Not a main branch push, ignoring' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Deployment webhook endpoint' });
}
