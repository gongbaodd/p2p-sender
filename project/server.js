import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());

let clients = [];

function sendEventToClients(timestamp) {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify({ timestamp })}\n\n`);
  });
}

app.get('/click', (req, res) => {
  const timestamp = new Date().toISOString();
  sendEventToClients(timestamp);
  res.json({ timestamp });
});

app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});