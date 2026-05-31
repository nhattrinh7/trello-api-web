module.exports = {
  apps: [{
    name: 'trello-api-tqd',
    script: './build/src/server.js',
    env: {
      BUILD_MODE: 'production',
      PORT: 8017
    }
  }]
}