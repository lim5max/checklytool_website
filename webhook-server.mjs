import http from 'http'
import crypto from 'crypto'
import { exec } from 'child_process'
import fs from 'fs'

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const digest = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry.trim());
  fs.appendFileSync('/var/log/webhook-deploy.log', logEntry);
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];
      
      if (!signature || !verifySignature(body, signature)) {
        logMessage('❌ Invalid signature or missing signature');
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }
      
      try {
        const payload = JSON.parse(body);
        
        // Check if it's a push to main branch
        if (payload.ref === 'refs/heads/main') {
          logMessage('🚀 Webhook received for main branch push');
          
          // Execute deployment script
          exec('cd /var/www/checklytool_website && ./deploy.sh', (error, stdout, stderr) => {
            if (error) {
              logMessage(`❌ Deployment failed: ${error.message}`);
              logMessage(`stderr: ${stderr}`);
              return;
            }
            
            logMessage('✅ Deployment completed successfully');
            logMessage(`stdout: ${stdout}`);
          });
          
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Deployment started');
        } else {
          logMessage(`ℹ️ Push to non-main branch: ${payload.ref}`);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Not main branch, skipping deployment');
        }
      } catch (e) {
        logMessage(`❌ Error parsing webhook payload: ${e.message}`);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  logMessage(`🎣 Webhook server listening on port ${PORT}`);
});

process.on('SIGINT', () => {
  logMessage('🛑 Webhook server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});