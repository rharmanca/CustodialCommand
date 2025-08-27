# Testing Guide for Custodial Command

This guide helps you test and diagnose form submission issues in the Custodial Command application.

## 🚀 Quick Start

### 1. Start the Server (Clean)
```bash
npm run start:clean
```
This will automatically kill any existing processes on port 5000 and start a fresh server.

### 2. Test Form Submissions
```bash
npm run test:forms
```
This runs a comprehensive test of all form submission types.

## 🧪 Available Tests

### Health Check
```bash
npm run test:health
```
Quick server and database connectivity test.

### Form Submissions
```bash
npm run test:forms
```
Comprehensive test of:
- Single room inspections
- Building inspections  
- Custodial notes
- Server health

### Debug Submission
```bash
npm run test:debug
```
Detailed debugging of the submission workflow.

## 🔍 Troubleshooting

### Port Conflicts
If you get `EADDRINUSE` errors:
```bash
# Kill processes on port 5000
kill -9 $(lsof -ti:5000) 2>/dev/null

# Start server
npm run dev
```

### Database Issues
If you get 500 Internal Server Error:
1. Check if `DATABASE_URL` is set in your environment
2. Run `npm run db:push` to ensure schema is up to date
3. Verify database connectivity

### Form Submission Failures
Common issues and solutions:

1. **503 Service Unavailable**
   - Server not running
   - Port conflicts
   - Solution: Use `npm run start:clean`

2. **500 Internal Server Error**
   - Database connection issues
   - Missing environment variables
   - Solution: Check database configuration

3. **Validation Errors**
   - Missing required fields
   - Invalid data format
   - Solution: Check form data structure

## 📊 Test Results

Tests will show:
- ✅ **PASS**: Feature working correctly
- ❌ **FAIL**: Feature has issues
- ⚠️ **WARNING**: Potential issues detected

## 🛠️ Manual Testing

### Test Single Room Inspection
1. Navigate to "Single Area Inspection"
2. Fill out all required fields
3. Submit the form
4. Check for success message

### Test Building Inspection
1. Navigate to "Building Inspection"
2. Fill out building details
3. Add room inspections
4. Complete the inspection

### Test Custodial Notes
1. Navigate to "Report A Custodial Concern"
2. Fill out the form
3. Submit the note
4. Verify it appears in the data

## 🔧 Environment Setup

Make sure you have:
- `DATABASE_URL` configured
- Server running on port 5000
- All dependencies installed (`npm install`)

## 📝 Logs

Check server logs for detailed error information:
```bash
npm run dev
```

Look for:
- Database connection errors
- Validation failures
- File upload issues
- Authentication problems

## 🆘 Getting Help

If tests continue to fail:
1. Check the server logs
2. Verify environment configuration
3. Test database connectivity
4. Review the error messages in test output
