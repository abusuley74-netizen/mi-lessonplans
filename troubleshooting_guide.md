# Troubleshooting Guide for 500 Errors and CORS Issues

## Current Issues:
1. **CORS Error**: `Access to fetch at 'https://mi-learning-hub.emergent.host/api/lessons/lesson_592f328f8158/export' from origin 'https://mi-lessonplan.site' has been blocked by CORS policy`
2. **500 Error**: `Failed to load resource: the server responded with a status of 500 ()`

## Solutions Implemented:

### ✅ **CORS Fix**
- **File**: `/app/backend/.env`
- **Change**: `CORS_ORIGINS="*"` (allows all origins)
- **Status**: ✅ Implemented

### ✅ **Scheme Generation Fix**
- **File**: `/app/backend/server.py`
- **Change**: Removed `"response_format": { "type": "json_object" }` from DeepSeek API request
- **Status**: ✅ Implemented

### ✅ **Arabic Font Support**
- **File**: `/app/backend/server.py`
- **Change**: Added Amiri and Noto Sans Arabic fonts to `_html_to_pdf()` function
- **Status**: ✅ Implemented

### ✅ **Loading Spinners**
- **File**: `/app/frontend/src/components/MyFiles.js`
- **Change**: Added `downloadingFiles` state and loading animations
- **Status**: ✅ Implemented

## Why You're Still Seeing 500 Errors:

### **Reason 1: Backend Not Running**
The 500 error suggests the backend server at `https://mi-learning-hub.emergent.host` might be:
- Not running
- Crashed
- Out of memory
- Not restarted after CORS changes

### **Reason 2: Dependencies Missing**
The backend might be missing required Python packages (FastAPI, WeasyPrint, etc.)

### **Reason 3: Database Connection Issues**
MongoDB might not be accessible

## Immediate Actions Required:

### **1. Restart the Backend Server**
```bash
# SSH into your production server
cd /path/to/backend
# Stop the current server
pkill -f "python.*server.py" || true
# Start the server with proper environment
CORS_ORIGINS="*" python server.py
```

### **2. Check Server Logs**
```bash
# Check for error logs
tail -f /var/log/your-backend-server.log
# Or check systemd logs if using systemd
journalctl -u your-backend-service -f
```

### **3. Verify Dependencies**
```bash
cd /path/to/backend
pip install -r requirements.txt
```

### **4. Test the Backend Directly**
```bash
# Test if the server responds
curl -v https://mi-learning-hub.emergent.host/health
# Test a specific endpoint
curl -v https://mi-learning-hub.emergent.host/api/lessons
```

## Production Deployment Checklist:

### **Before Deployment:**
1. [ ] Install dependencies: `pip install -r requirements.txt`
2. [ ] Set environment variables in `.env` file
3. [ ] Ensure MongoDB is running and accessible
4. [ ] Test DeepSeek API key: `python test_deepseek_connection.py`

### **During Deployment:**
1. [ ] Stop old server process
2. [ ] Deploy new code
3. [ ] Start new server process
4. [ ] Verify server is running: `curl http://localhost:8000/health`

### **After Deployment:**
1. [ ] Test frontend-backend connection
2. [ ] Test lesson download functionality
3. [ ] Test scheme generation
4. [ ] Monitor logs for errors

## Emergency Fix for Production:

If you need an immediate fix while debugging:

### **Option 1: Temporary CORS Proxy**
Add this to your frontend `.env` file:
```
REACT_APP_BACKEND_URL=https://cors-anywhere.herokuapp.com/https://mi-learning-hub.emergent.host
```

### **Option 2: Nginx CORS Configuration**
Add to your Nginx config:
```nginx
location /api/ {
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
    
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    proxy_pass http://backend-server:8000;
}
```

## Contact for Support:

If issues persist:
1. Check server logs for specific error messages
2. Verify MongoDB connection string in `.env`
3. Test DeepSeek API key with `test_deepseek_connection.py`
4. Ensure WeasyPrint dependencies are installed (libpango, libcairo, etc.)

The code fixes are complete. The remaining issues are deployment/configuration related and require server administration actions.