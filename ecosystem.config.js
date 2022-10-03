module.exports = {
  apps: [
    {
      name: "needs",
      script: "pnpm",
      args: "start",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
