# TrustBuddy Troubleshooting Guide

## Common Issues and Solutions

### 1. JSON Syntax Error in package.json
**Error:** `SyntaxError: Expected double-quoted property name in JSON`
**Solution:** ✅ **FIXED** - The package.json file has been corrected to remove duplicate dependencies and trailing commas.

### 2. Module Not Found Errors
**Error:** `Module not found: Can't resolve './services/api'`
**Solution:** Ensure all files are in the correct locations:
- `frontend/src/services/api.js` - API service
- `frontend/src/config.js` - Configuration
- `frontend/src/context/LanguageContext.jsx` - Language context
- `frontend/src/data/translations.js` - Translations

### 3. Backend Connection Issues
**Error:** `Backend service is not available`
**Solution:**
1. Start the backend server:
   ```bash
   cd backend
   python main.py
   ```
2. Check if port 8000 is available
3. Verify Python dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

### 4. Frontend Build Issues
**Error:** `npm start` fails
**Solution:**
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
3. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 5. Tailwind CSS Not Working
**Error:** Styles not applying
**Solution:**
1. Verify `tailwind.config.js` exists
2. Check `src/index.css` has Tailwind directives
3. Restart the development server

### 6. CORS Issues
**Error:** `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy`
**Solution:** ✅ **FIXED** - CORS middleware is already configured in the backend.

### 7. API Endpoint Not Found
**Error:** `404 Not Found` for API calls
**Solution:**
1. Verify backend is running on `http://localhost:8000`
2. Check API endpoints in `backend/main.py`
3. Test with curl:
   ```bash
   curl http://localhost:8000/health
   ```

### 8. ML Models Not Loading
**Error:** `Model loading failed`
**Solution:**
1. Check internet connection (models download on first run)
2. Ensure sufficient disk space
3. Wait for initial model download (may take several minutes)

### 9. React Version Issues
**Error:** `React version conflicts`
**Solution:** ✅ **FIXED** - Using React 19.1.0 with compatible dependencies.

### 10. Port Already in Use
**Error:** `EADDRINUSE: address already in use :::3000`
**Solution:**
1. Kill existing processes:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```
2. Or use different ports:
   ```bash
   # Frontend
   PORT=3001 npm start
   
   # Backend
   python main.py --port 8001
   ```

## Quick Fix Commands

### Windows
```batch
# Clean install
cd frontend && rmdir /s node_modules && del package-lock.json && npm install
cd ../backend && pip install -r requirements.txt --force-reinstall

# Start services
start.bat
```

### Linux/Mac
```bash
# Clean install
cd frontend && rm -rf node_modules package-lock.json && npm install
cd ../backend && pip install -r requirements.txt --force-reinstall

# Start services
./start.sh
```

## Verification Steps

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Frontend Build:**
   ```bash
   cd frontend && npm run build
   ```

3. **Integration Test:**
   ```bash
   python test_integration.py
   ```

## Environment Requirements

- **Node.js:** 16+ (for frontend)
- **Python:** 3.8+ (for backend)
- **npm:** Latest version
- **pip:** Latest version

## Still Having Issues?

1. Check the browser console for JavaScript errors
2. Check the backend terminal for Python errors
3. Verify all files are in the correct locations
4. Try the setup script: `setup_and_test.bat`

## Support

If issues persist, check:
- Browser console logs
- Backend server logs
- Network connectivity
- Firewall settings 