:: Get curent directory
set CURR_DIR=%~dp0
echo Current Directory: %CURR_DIR%
:: Change to the current directory
cd /d %CURR_DIR%
:: run install for backend in an other window
echo Installing required backend dependencies...
start cmd /k "cd /d %CURR_DIR%backend && npm install && echo Backend dependencies installed successfully."
echo Backend dependencies installation initiated in a new window.
:: Install dependencies using pip
echo Installing required frontend dependencies...
cd frontend
npm install
cd ..
echo Frontend dependencies installed successfully.