module.exports = {
  apps: [{
    name: 'agriko-shop',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/shop',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/agriko-error.log',
    out_file: '/var/log/pm2/agriko-out.log',
    log_file: '/var/log/pm2/agriko-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};