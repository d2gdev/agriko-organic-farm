<?php
// GitHub Webhook for automatic deployment

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    
    // Check if it's a push to main branch
    if (isset($payload['ref']) && $payload['ref'] === 'refs/heads/main') {
        
        // Log the deployment attempt
        error_log('[' . date('Y-m-d H:i:s') . '] Deployment triggered by GitHub webhook');
        
        // Change to project directory and deploy
        $commands = [
            'cd /var/www/shop',
            'git pull origin main',
            'npm ci --omit=dev',
            'npm run build',
            'pm2 restart agriko || pm2 start npm --name "agriko" -- start',
            'pm2 save'
        ];
        
        $output = [];
        foreach ($commands as $command) {
            $result = shell_exec($command . ' 2>&1');
            $output[] = "Command: $command";
            $output[] = "Output: $result";
        }
        
        // Log the deployment result
        error_log('[' . date('Y-m-d H:i:s') . '] Deployment completed: ' . implode("\n", $output));
        
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
