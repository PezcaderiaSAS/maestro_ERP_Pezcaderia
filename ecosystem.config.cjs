/**
 * ecosystem.config.cjs
 * PM2 Ecosystem configuration for MaestroPescadería 24/7 Infinite Control Loop.
 */

module.exports = {
  apps: [
    {
      name: 'maestro-control-loop',
      script: 'scripts/daemon/worker.cjs',
      cwd: __dirname,
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      windowsHide: true,
      out_file: './logs/daemon/pm2-stdout.log',
      error_file: './logs/daemon/pm2-stderr.log',
      merge_logs: true,
      // Credenciales Evolution API y banderas del daemon se cargan automáticamente desde `.env` / `.env.local` vía scripts/daemon/env.cjs
      env: {
        NODE_ENV: 'production',
        MAESTRO_DAEMON_MODE: 'pm2',
        CYCLE_INTERVAL_SECONDS: '60',
        WHATSAPP_WEBHOOK_PORT: '3005',
      },
    },
  ],
};
