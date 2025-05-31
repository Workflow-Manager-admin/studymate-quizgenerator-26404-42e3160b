// Health check controller for StudyMate QuizGenerator

const healthService = require('../services/health');

class HealthController {
  // PUBLIC_INTERFACE
  /**
   * Health check endpoint for liveness/readiness probes.
   * @param {Express.Request} req
   * @param {Express.Response} res
   */
  check(req, res) {
    const healthStatus = healthService.getStatus();
    return res.status(200).json(healthStatus);
  }
}

module.exports = new HealthController();
