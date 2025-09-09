<?php
// GitHub Webhook for automatic deployment
// Place this file in your web root and configure GitHub webhook to point to it

// Verify GitHub webhook secret (optional but recommended)
//  = 'your-webhook-secret';
//  = ['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (['REQUEST_METHOD'] === 'POST') {
     = json_decode(file_get_contents('php://input'), true);
    
    // Check if it's a push to main branch
    if (isset(['ref']) && ['ref'] === 'refs/heads/main') {
        
        // Log the deployment attempt
        error_log('[' . date('Y-m-d H:i:s') . '] Deployment triggered by GitHub webhook');
        
        // Change to project directory and deploy
         = [
            'cd /var/www/shop',
            'git pull origin main',
            'npm ci --omit=dev',
            'npm run build',
            'pm2 restart agriko || pm2 start npm --name "agriko" -- start',
            'pm2 save'
        ];
        
         = [];
        foreach ( as ) {
             = shell_exec( . ' 2>&1');
            [] = "Command: ";
            [] = "Output: ";
        }
        
        // Log the deployment result
        error_log('[' . date('Y-m-d H:i:s') . '] Deployment completed: ' . implode("\n", ));
        
        http_response_code(200);
        echo "Deployment triggered successfully";
    } else {
        http_response_code(200);
        echo "Not a main branch push, ignoring";
    }
} else {
    http_response_code(405);
    echo "Method not allowed";
}
?>
