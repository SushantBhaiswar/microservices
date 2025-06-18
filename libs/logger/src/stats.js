// // ============================================================================
// // ENHANCED STATS SERVICE
// // src/service/statsService.js
// // ============================================================================

// const logger = require('../config/logger');

// class StatsCollector {
//     constructor() {
//         this.stats = {
//             requests: new Map(),
//             responses: new Map(),
//             errors: new Map(),
//             latency: new Map(),
//             systemMetrics: {
//                 startTime: Date.now(),
//                 totalRequests: 0,
//                 totalErrors: 0
//             }
//         };

//         // Cleanup old data every hour
//         setInterval(() => this.cleanup(), 60 * 60 * 1000);
//     }

//     /**
//      * Records a request start
//      */
//     recordRequest(serviceName, method, path) {
//         const key = `${serviceName}:${method}:${path}`;
//         const current = this.stats.requests.get(key) || { count: 0, lastSeen: Date.now() };

//         this.stats.requests.set(key, {
//             count: current.count + 1,
//             lastSeen: Date.now()
//         });

//         this.stats.systemMetrics.totalRequests++;
//     }

//     /**
//      * Records a response
//      */
//     recordResponse(serviceName, method, path, statusCode, duration) {
//         const key = `${serviceName}:${method}:${path}`;

//         // Record response
//         const responseKey = `${key}:${statusCode}`;
//         const current = this.stats.responses.get(responseKey) || { count: 0, avgDuration: 0 };

//         // Calculate rolling average duration
//         const newAvgDuration = ((current.avgDuration * current.count) + duration) / (current.count + 1);

//         this.stats.responses.set(responseKey, {
//             count: current.count + 1,
//             avgDuration: Math.round(newAvgDuration),
//             lastSeen: Date.now()
//         });

//         // Record latency buckets
//         this.recordLatency(serviceName, duration);

//         // Record errors
//         if (statusCode >= 400) {
//             this.recordError(serviceName, statusCode, method, path);
//         }
//     }

//     /**
//      * Records latency in buckets
//      */
//     recordLatency(serviceName, duration) {
//         const latencyKey = serviceName;
//         const current = this.stats.latency.get(latencyKey) || {
//             p50: [],
//             p95: [],
//             p99: [],
//             samples: []
//         };

//         // Keep only last 1000 samples for percentile calculation
//         current.samples.push(duration);
//         if (current.samples.length > 1000) {
//             current.samples = current.samples.slice(-1000);
//         }

//         // Calculate percentiles
//         const sorted = [...current.samples].sort((a, b) => a - b);
//         const len = sorted.length;

//         current.p50 = sorted[Math.floor(len * 0.5)] || 0;
//         current.p95 = sorted[Math.floor(len * 0.95)] || 0;
//         current.p99 = sorted[Math.floor(len * 0.99)] || 0;

//         this.stats.latency.set(latencyKey, current);
//     }

//     /**
//      * Records an error
//      */
//     recordError(serviceName, statusCode, method, path) {
//         const errorKey = `${serviceName}:${statusCode}`;
//         const current = this.stats.errors.get(errorKey) || {
//             count: 0,
//             lastSeen: Date.now(),
//             examples: []
//         };

//         current.count++;
//         current.lastSeen = Date.now();

//         // Keep last 10 error examples
//         current.examples.push({
//             method,
//             path,
//             timestamp: new Date().toISOString()
//         });

//         if (current.examples.length > 10) {
//             current.examples = current.examples.slice(-10);
//         }

//         this.stats.errors.set(errorKey, current);
//         this.stats.systemMetrics.totalErrors++;
//     }

//     /**
//      * Gets comprehensive stats
//      */
//     getStats(detailed = false) {
//         const uptime = Date.now() - this.stats.systemMetrics.startTime;

//         const baseStats = {
//             timestamp: new Date().toISOString(),
//             uptime: {
//                 milliseconds: uptime,
//                 seconds: Math.floor(uptime / 1000),
//                 minutes: Math.floor(uptime / (1000 * 60)),
//                 hours: Math.floor(uptime / (1000 * 60 * 60))
//             },
//             system: {
//                 totalRequests: this.stats.systemMetrics.totalRequests,
//                 totalErrors: this.stats.systemMetrics.totalErrors,
//                 errorRate: this.stats.systemMetrics.totalRequests > 0
//                     ? (this.stats.systemMetrics.totalErrors / this.stats.systemMetrics.totalRequests * 100).toFixed(2) + '%'
//                     : '0%',
//                 requestsPerMinute: this.stats.systemMetrics.totalRequests > 0
//                     ? Math.round(this.stats.systemMetrics.totalRequests / (uptime / (1000 * 60)))
//                     : 0
//             },
//             service: this.getservicetats(detailed)
//         };

//         if (detailed) {
//             baseStats.latency = this.getLatencyStats();
//             baseStats.errors = this.getErrorStats();
//             baseStats.endpoints = this.getEndpointStats();
//         }

//         return baseStats;
//     }

//     /**
//      * Gets service-level statistics
//      */
//     getservicetats(detailed) {
//         const servicetats = {};
//         const now = Date.now();
//         const oneHour = 60 * 60 * 1000;

//         // Aggregate by service
//         this.stats.requests.forEach((data, key) => {
//             const [serviceName] = key.split(':');

//             if (!servicetats[serviceName]) {
//                 servicetats[serviceName] = {
//                     requests: 0,
//                     responses: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
//                     errors: 0,
//                     lastActivity: null
//                 };
//             }

//             // Only count recent requests (last hour)
//             if (now - data.lastSeen < oneHour) {
//                 servicetats[serviceName].requests += data.count;
//                 servicetats[serviceName].lastActivity = new Date(data.lastSeen).toISOString();
//             }
//         });

//         // Add response data
//         this.stats.responses.forEach((data, key) => {
//             const [serviceName, method, path, statusCode] = key.split(':');

//             if (servicetats[serviceName] && now - data.lastSeen < oneHour) {
//                 const statusClass = Math.floor(parseInt(statusCode) / 100) + 'xx';
//                 if (servicetats[serviceName].responses[statusClass] !== undefined) {
//                     servicetats[serviceName].responses[statusClass] += data.count;
//                 }

//                 if (detailed) {
//                     if (!servicetats[serviceName].endpoints) {
//                         servicetats[serviceName].endpoints = {};
//                     }
//                     const endpointKey = `${method} ${path}`;
//                     servicetats[serviceName].endpoints[endpointKey] = {
//                         requests: data.count,
//                         avgDuration: data.avgDuration,
//                         statusCode: parseInt(statusCode)
//                     };
//                 }
//             }
//         });

//         // Calculate error rates
//         Object.keys(servicetats).forEach(serviceName => {
//             const service = servicetats[serviceName];
//             const totalResponses = Object.values(service.responses).reduce((a, b) => a + b, 0);
//             service.errors = service.responses['4xx'] + service.responses['5xx'];
//             service.errorRate = totalResponses > 0
//                 ? ((service.errors / totalResponses) * 100).toFixed(2) + '%'
//                 : '0%';
//             service.successRate = totalResponses > 0
//                 ? (((service.responses['2xx'] + service.responses['3xx']) / totalResponses) * 100).toFixed(2) + '%'
//                 : '0%';
//         });

//         return servicetats;
//     }

//     /**
//      * Gets latency statistics
//      */
//     getLatencyStats() {
//         const latencyStats = {};

//         this.stats.latency.forEach((data, serviceName) => {
//             latencyStats[serviceName] = {
//                 p50: data.p50,
//                 p95: data.p95,
//                 p99: data.p99,
//                 sampleCount: data.samples.length
//             };
//         });

//         return latencyStats;
//     }

//     /**
//      * Gets error statistics
//      */
//     getErrorStats() {
//         const errorStats = {};
//         const now = Date.now();
//         const oneHour = 60 * 60 * 1000;

//         this.stats.errors.forEach((data, key) => {
//             if (now - data.lastSeen < oneHour) {
//                 const [serviceName, statusCode] = key.split(':');

//                 if (!errorStats[serviceName]) {
//                     errorStats[serviceName] = {};
//                 }

//                 errorStats[serviceName][statusCode] = {
//                     count: data.count,
//                     lastSeen: new Date(data.lastSeen).toISOString(),
//                     recentExamples: data.examples.slice(-3) // Last 3 examples
//                 };
//             }
//         });

//         return errorStats;
//     }

//     /**
//      * Gets endpoint-level statistics
//      */
//     getEndpointStats() {
//         const endpointStats = {};
//         const now = Date.now();
//         const oneHour = 60 * 60 * 1000;

//         this.stats.responses.forEach((data, key) => {
//             if (now - data.lastSeen < oneHour) {
//                 const [serviceName, method, path, statusCode] = key.split(':');
//                 const endpointKey = `${method} ${path}`;

//                 if (!endpointStats[endpointKey]) {
//                     endpointStats[endpointKey] = {
//                         service: serviceName,
//                         requests: 0,
//                         avgDuration: 0,
//                         statusCodes: {}
//                     };
//                 }

//                 endpointStats[endpointKey].requests += data.count;
//                 endpointStats[endpointKey].statusCodes[statusCode] = data.count;

//                 // Weighted average duration
//                 const currentTotal = endpointStats[endpointKey].avgDuration * (endpointStats[endpointKey].requests - data.count);
//                 const newTotal = currentTotal + (data.avgDuration * data.count);
//                 endpointStats[endpointKey].avgDuration = Math.round(newTotal / endpointStats[endpointKey].requests);
//             }
//         });

//         return endpointStats;
//     }

//     /**
//      * Cleans up old data
//      */
//     cleanup() {
//         const now = Date.now();
//         const cutoff = 24 * 60 * 60 * 1000; // 24 hours

//         [this.stats.requests, this.stats.responses, this.stats.errors].forEach(map => {
//             for (const [key, data] of map.entries()) {
//                 if (now - data.lastSeen > cutoff) {
//                     map.delete(key);
//                 }
//             }
//         });

//         logger.info('[StatsCollector] Cleaned up old statistics data');
//     }

//     /**
//      * Resets all statistics
//      */
//     reset() {
//         this.stats = {
//             requests: new Map(),
//             responses: new Map(),
//             errors: new Map(),
//             latency: new Map(),
//             systemMetrics: {
//                 startTime: Date.now(),
//                 totalRequests: 0,
//                 totalErrors: 0
//             }
//         };
//     }
// }

// // Export singleton instance
// module.exports = new StatsCollector();

// // ============================================================================
// // ENHANCED STATS ROUTES
// // src/routes/statsRoutes.js
// // ============================================================================

// const express = require('express');
// const statsCollector = require('../service/statsService');

// const router = express.Router();

// /**
//  * Basic stats endpoint
//  * GET /stats
//  */
// router.get('/', (req, res) => {
//     const detailed = req.query.detailed === 'true';
//     const stats = statsCollector.getStats(detailed);
//     res.json(stats);
// });

// /**
//  * Service-specific stats
//  * GET /stats/service/:serviceName
//  */
// router.get('/service/:serviceName', (req, res) => {
//     const { serviceName } = req.params;
//     const allStats = statsCollector.getStats(true);

//     if (!allStats.service[serviceName]) {
//         return res.status(404).json({
//             error: 'Service not found',
//             availableservice: Object.keys(allStats.service)
//         });
//     }

//     res.json({
//         service: serviceName,
//         stats: allStats.service[serviceName],
//         latency: allStats.latency[serviceName] || null
//     });
// });

// /**
//  * Health status based on stats
//  * GET /stats/health
//  */
// router.get('/health', (req, res) => {
//     const stats = statsCollector.getStats();
//     const service = Object.entries(stats.service);

//     const healthStatus = {
//         status: 'healthy',
//         timestamp: stats.timestamp,
//         checks: {
//             uptime: stats.uptime.hours > 0 ? 'healthy' : 'warning',
//             errorRate: parseFloat(stats.system.errorRate) < 5 ? 'healthy' : 'unhealthy',
//             service: {}
//         }
//     };

//     // Check each service health
//     service.forEach(([serviceName, servicetats]) => {
//         const errorRate = parseFloat(servicetats.errorRate);
//         healthStatus.checks.service[serviceName] = {
//             status: errorRate < 10 ? 'healthy' : 'unhealthy',
//             errorRate: servicetats.errorRate,
//             lastActivity: servicetats.lastActivity
//         };
//     });

//     // Overall status
//     const unhealthyservice = Object.values(healthStatus.checks.service)
//         .filter(s => s.status === 'unhealthy').length;

//     if (unhealthyservice > 0 || healthStatus.checks.errorRate === 'unhealthy') {
//         healthStatus.status = 'unhealthy';
//         res.status(503);
//     }

//     res.json(healthStatus);
// });

// /**
//  * Reset stats (for testing/maintenance)
//  * POST /stats/reset
//  */
// router.post('/reset', (req, res) => {
//     statsCollector.reset();
//     res.json({
//         message: 'Statistics reset successfully',
//         timestamp: new Date().toISOString()
//     });
// });

// module.exports = router;