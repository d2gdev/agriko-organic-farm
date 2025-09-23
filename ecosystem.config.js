module.exports = {
  apps: [{
    name: 'agriko-shop',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,

    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,

    // Environment
    cwd: '/var/www/shop',

    // Node args
    node_args: '--max-old-space-size=2048',

    // Monitoring
    pmx: true,
    instance_var: 'INSTANCE_ID'
  }],

  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/agriko-shop.git',
      path: '/var/www/shop',
      'pre-deploy': 'git pull',
      'post-deploy': 'npm ci && npm run build:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/shop'
    }
  }
};