module.exports = {
  apps: [
    {
      name: "needs",
      script: "npm",
      args: "start",
      instances: 2,
      exec_mode: "cluster",
      restart_delay: 10000,
      listen_timeout: 10000,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
