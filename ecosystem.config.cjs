module.exports = {
  apps: [
    {
      name: "needs",
      script: "./src/index.js",
      instances: 2,
      exec_mode: "cluster",
      restart_delay: 10000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "needs-staging",
      script: "./src/index.js",
      instances: 1,
      exec_mode: "cluster",
      restart_delay: 10000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: "staging",
      }
    },
  ],
};
