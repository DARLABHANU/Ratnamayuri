const { execSync } = require('child_process');

try {
  console.log('Searching for processes on port 8000...');
  // Find PID of process listening on port 8000
  const output = execSync('netstat -ano').toString();
  const lines = output.split('\n').filter(line => line.includes(':8000') && line.includes('LISTENING'));
  
  if (lines.length > 0) {
    const parts = lines[0].trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    console.log(`Found process with PID ${pid} on port 8000. Killing it...`);
    execSync(`taskkill /F /PID ${pid}`);
    console.log('Successfully killed the process!');
  } else {
    console.log('No active process found listening on port 8000.');
  }
} catch (error) {
  console.error('Error while trying to kill process on port 8000:', error.message);
}
