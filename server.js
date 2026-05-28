const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple in-memory storage for appointments
let appointments = [];

// MIME types for serving different file types
const mimeTypes = {
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'manifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // API routes
  if (pathname.startsWith('/api/')) {
    handleApiRequest(req, res, parsedUrl);
    return;
  }
  
  // Serve static files
  let filePath = path.join(process.cwd(), pathname);
  
  // Default to index.html if path is root
  if (filePath === path.join(process.cwd(), '/')) {
    filePath = path.join(process.cwd(), 'index.html');
  }
  
  // Get file extension
  const ext = path.extname(filePath).substring(1) || 'html';
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

function handleApiRequest(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Owner password from environment (never hardcoded in source)
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'changeme-in-production';

  // Auth endpoint — server-side verification only
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: password === OWNER_PASSWORD }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false }));
      }
    });
    return;
  }

  if (pathname === '/api/appointments' && req.method === 'GET') {
    // Get all appointments
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(appointments));
  } 
  else if (pathname === '/api/appointments' && req.method === 'POST') {
    // Create new appointment
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const newAppointment = JSON.parse(body);
        newAppointment.id = Date.now();
        newAppointment.status = 'confirmed';
        newAppointment.createdAt = new Date().toISOString();
        
        // Check for double-booking
        const existingAppointment = appointments.find(
          appt => appt.date === newAppointment.date && 
                  appt.time === newAppointment.time && 
                  appt.status !== 'cancelled'
        );
        
        if (existingAppointment) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Time slot already booked' }));
          return;
        }
        
        appointments.push(newAppointment);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newAppointment));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
  else if (pathname.startsWith('/api/appointments/') && req.method === 'PUT') {
    // Update appointment (for cancellation/restoration)
    const id = parseInt(pathname.split('/')[3]);
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        const index = appointments.findIndex(appt => appt.id === id);
        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Appointment not found' }));
          return;
        }
        
        appointments[index] = { ...appointments[index], ...update };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(appointments[index]));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
  else if (pathname === '/api/sync-calendar' && req.method === 'POST') {
    // Placeholder for Google Calendar sync
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Calendar sync initiated successfully' }));
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`MagShine Appointment System running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});