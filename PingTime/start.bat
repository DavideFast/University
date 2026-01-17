:: Get curent directory
set CURR_DIR=%~dp0
echo Current Directory: %CURR_DIR%
:: Change to the current directory
cd /d %CURR_DIR%
:: run backend server in an other window
echo Starting backend server...
start cmd /k "cd /d %CURR_DIR%backend && node index.js && echo Backend server started successfully."
echo Backend server startup initiated in a new window.
:: Start frontend server
echo Starting frontend server...
cd frontend
npm start