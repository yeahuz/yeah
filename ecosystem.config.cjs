module.exports = {
  apps: [
    {
      name: "needs",
      script: "npm",
      args: "start",
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
