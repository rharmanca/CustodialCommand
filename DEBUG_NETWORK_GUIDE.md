
# Network Request Debugging Guide

## Using Browser Developer Tools

### Chrome/Edge/Firefox:
1. Open Developer Tools (F12)
2. Go to the "Network" tab
3. Clear existing requests (🚫 button)
4. Attempt a form submission
5. Look for requests to `/api/inspections` or `/api/custodial-notes`

### Key Information to Check:
- **Status Code**: Should be 200 for success
- **Request Headers**: Check Content-Type
- **Request Payload**: Verify data being sent
- **Response**: Check error messages
- **Timing**: Look for timeouts

### Common Issues:
- **400 Bad Request**: Validation errors
- **413 Payload Too Large**: File upload size exceeded
- **422 Unprocessable Entity**: Schema validation failed
- **500 Internal Server Error**: Server/database issues
- **Network Error**: Connection issues

### Export Network Log:
Right-click in Network tab → Save all as HAR file
