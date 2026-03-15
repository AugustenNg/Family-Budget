// PM2 Ecosystem Configuration — CFO Family Finance
// Chi bind vao Tailscale IP de dam bao bao mat
module.exports = {
  apps: [{
    name: 'cfo-family',
    cwd: '/nas_data/augustNg/File/Family Budget',
    script: 'node_modules/.bin/next',
    args: 'start -H 0.0.0.0 -p 3000',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    },
    // Logs
    error_file: '/nas_data/augustNg/File/Family Budget/self-hosted/logs/error.log',
    out_file: '/nas_data/augustNg/File/Family Budget/self-hosted/logs/app.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Auto restart
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,

    // Memory limit
    max_memory_restart: '512M',

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
  }],
}
