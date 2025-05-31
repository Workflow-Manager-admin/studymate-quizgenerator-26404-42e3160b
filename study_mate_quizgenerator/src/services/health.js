// Service providing health status logic for StudyMate QuizGenerator

class HealthService {
  // PUBLIC_INTERFACE
  /**
   * Get the status of the health check (may be extended for DB, etc.)
   * @returns {{status: string, message: string, timestamp: string, environment: string}}
   */
  getStatus() {
    return {
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

module.exports = new HealthService();
