module.exports = {
  apps: [
    {
      name: "retrovault",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/home/apesch/.openclaw/workspace/second-brain",

      // Process settings
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",  // Only listen on localhost — nginx proxies to us
      },

      // Logging
      out_file: "/home/apesch/.openclaw/workspace/second-brain/logs/pm2-out.log",
      error_file: "/home/apesch/.openclaw/workspace/second-brain/logs/pm2-err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Restart behavior
      exp_backoff_restart_delay: 100,
      min_uptime: "10s",
    },
  ],
};
