import express from 'express';
import { ExpressPeerServer } from 'peer';
import morgan from 'morgan';
import winston from 'winston';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();
const server = createServer(app);

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());
app.use(express.static('dist'));

// PeerJS server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});

app.use('/peer', peerServer);

// Store room data
const idMap = {}//new Map();

app.use((req, res, next) => {
  next();
  logger.info(JSON.stringify(idMap, null, 2));
});

// Routes
app.post('/createRoom', (req, res) => {
  const { peerId } = req.body;
  const code = Math.random().toString().substring(2, 8);
  idMap[code] = [peerId];
  
  logger.info(`Room created with code: ${code}`);
  res.json({ code, connections: idMap[code] });
});

app.patch('/addRoom', (req, res) => {
  const { code, peerId } = req.body;
  
  if (!idMap[code]) {
    logger.error(`Room not found: ${code}`);
    return res.status(404).json({ error: 'Room not found' });
  }
  
  idMap[code].push(peerId);
  logger.info(`Peer ${peerId} joined room ${code}`);
  res.json({ 
    success: true,
    peerCount: idMap[code].length,
    connections: idMap[code]
  });
});

app.delete('/leaveRoom', (req, res) => {
  const { code, peerId } = req.body;
  
  if (idMap[code]) {
    const peers = idMap[code];
    peers.delete(peerId);
    
    if (peers.size === 0) {
      delete idMap[code];
      logger.info(`Room ${code} deleted`);
    }
    
    logger.info(`Peer ${peerId} left room ${code}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// Serve frontend in production
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});