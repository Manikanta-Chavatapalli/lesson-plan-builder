class SSEService {
  constructor() {
    this.clients = [];
  }

  addClient(res) {
    this.clients.push(res);

    res.on('close', () => {
      this.clients = this.clients.filter(client => client !== res);
    });
  }

  broadcast(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(client => {
      client.write(payload);
    });
  }
}

export default new SSEService();
