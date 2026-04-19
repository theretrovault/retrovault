const path = require('path');

const ROOT = "/home/apesch/.openclaw/workspace/retrovault";

function makeApp(name, runtimeEnv, port) {
  const suffix = runtimeEnv === 'prod' ? 'prod' : runtimeEnv;
  return {
    name,
    script: "node_modules/.bin/next",
    args: "start",
    cwd: ROOT,

    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",

    env: {
      NODE_ENV: "production",
      RETROVAULT_ENV: runtimeEnv,
      PORT: port,
      HOSTNAME: "127.0.0.1",
      RETROVAULT_DATA_DIR: path.join(ROOT, 'data', suffix),
      RETROVAULT_CONFIG_PATH: path.join(ROOT, 'data', suffix, 'app.config.json'),
      RETROVAULT_SCRAPERS_PATH: path.join(ROOT, 'data', suffix, 'scrapers.json'),
      RETROVAULT_DB_PATH: path.join(ROOT, 'data', suffix, 'retrovault.db'),
      DATABASE_URL: `file:${path.join(ROOT, 'data', suffix, 'retrovault.db')}`,
    },

    out_file: path.join(ROOT, 'logs', `${name}-out.log`),
    error_file: path.join(ROOT, 'logs', `${name}-err.log`),
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",

    exp_backoff_restart_delay: 100,
    min_uptime: "10s",
  };
}

module.exports = {
  apps: [
    makeApp('retrovault-prod', 'prod', 3000),
    makeApp('retrovault-dev', 'dev', 3001),
    makeApp('retrovault-nightly', 'nightly', 3002),
  ],
};
