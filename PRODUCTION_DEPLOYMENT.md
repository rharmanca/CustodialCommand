# Production Deployment Guide

## Production Readiness Status: ✅ READY

This Custodial Command application has been optimized for production deployment with comprehensive security, monitoring, and performance enhancements.

## Key Production Features

### 🔒 Security
- **Rate limiting**: API endpoints protected against abuse
- **Input validation**: All user inputs sanitized and validated
- **Security headers**: Comprehensive HTTP security headers via Helmet
- **CORS protection**: Configured for safe cross-origin requests
- **Request size limits**: Prevents large payload attacks

### 📊 Monitoring & Observability
- **Structured logging**: JSON logging for production environments
- **Health checks**: `/health` endpoint for monitoring systems
- **Metrics collection**: `/metrics` endpoint for performance tracking
- **Request tracing**: Unique request IDs for debugging
- **Error tracking**: Comprehensive error logging and handling

### ⚡ Performance
- **Gzip compression**: All responses compressed for faster delivery
- **Bundle optimization**: Production builds optimized for size and speed
- **Database query optimization**: Proper indexing and query patterns
- **Memory monitoring**: Built-in memory usage tracking

## Deployment Steps

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
nano .env
```

### 2. Database Setup
```bash
# Push database schema
npm run db:push
```

### 3. Build Application
```bash
# Build for production
npm run build
```

### 4. Start Production Server
```bash
# Start in production mode
npm start
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `development` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | - |
| `PORT` | No | Server port | `5000` |
| `SESSION_SECRET` | Recommended | Session encryption key | Generated |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window | `100` |

## Health Monitoring

### Health Check Endpoint
```
GET /health
```

Response includes:
- System status and uptime
- Database connection status
- Memory usage statistics
- Application version

### Metrics Endpoint
```
GET /metrics
```

Provides request counts, error rates, and performance metrics.

## Security Considerations

### Headers Applied
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Rate Limiting
- API routes: 100 requests per 15 minutes
- Sensitive operations: 10 requests per 15 minutes
- Configurable via environment variables

### Input Validation
- All API endpoints use Zod schema validation
- SQL injection protection
- XSS prevention
- Request size limits (10MB max)

## Database Schema

The application uses PostgreSQL with the following optimized schema:
- **inspections**: Main inspection records
- **room_inspections**: Individual room inspection data
- **custodial_notes**: General custodial notes
- **users**: User authentication (if enabled)

Foreign key constraints ensure data integrity.

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database server is running
   - Ensure firewall allows connections

2. **Memory Issues**
   - Monitor `/health` endpoint for memory usage
   - Consider increasing server memory if usage > 80%

3. **Rate Limiting Errors**
   - Check if requests exceed configured limits
   - Adjust `RATE_LIMIT_MAX_REQUESTS` if needed

### Logs

- Development: Human-readable console logs
- Production: Structured JSON logs for log aggregation systems
- All requests include unique request IDs for tracing

## Performance Benchmarks

Expected performance on standard deployment:
- **Response Time**: < 200ms for API requests
- **Throughput**: 100+ requests/second
- **Memory Usage**: < 512MB under normal load
- **Database Queries**: Optimized with proper indexing

## Maintenance

### Regular Tasks
1. Monitor `/health` and `/metrics` endpoints
2. Review error logs for issues
3. Update dependencies monthly
4. Backup database regularly

### Scaling Considerations
- Application is stateless and can be horizontally scaled
- Database connection pooling recommended for high load
- Consider CDN for static assets in high-traffic scenarios

## Support

For production issues:
1. Check `/health` endpoint status
2. Review application logs
3. Verify environment configuration
4. Check database connectivity

The application is now production-ready with enterprise-grade security, monitoring, and performance optimizations.