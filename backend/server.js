const app = require('./src/app');
const { runMigrations } = require('./database/migrations/runMigrations');
const { seedDatabase } = require('./database/seeds/seedDatabase');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('Starting server...');
    
    // Skip migrations and seeding - already done by docker-entrypoint.sh
    // Just start the express server
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Health check available at http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
