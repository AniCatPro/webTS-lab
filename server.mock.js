// server.mock.js
const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();


server.use(middlewares);
server.use(jsonServer.bodyParser);


// Normalized filtering for /api/files
server.get('/api/files', (req, res, next) => {
    const db = router.db; // lowdb instance
    const { parentId, q, type, page = 1, pageSize = 20 } = req.query;
    let items = db.get('files').value();
    if (parentId !== undefined) items = items.filter(it => String(it.parentId) === String(parentId));
    if (q) items = items.filter(it => it.name.toLowerCase().includes(String(q).toLowerCase()));
    if (type) items = items.filter(it => it.type === type);
    const total = items.length;
    const p = Number(page), ps = Number(pageSize);
    const data = items.slice((p-1)*ps, p*ps);
    res.json({ data, total, page: p, pageSize: ps });
});


server.get('/api/files/:id', (req, res) => {
    const db = router.db; const id = req.params.id;
    const item = db.get('files').find({ id }).value();
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
});


server.get('/api/files/:id/text', (req, res) => {
    const db = router.db; const id = req.params.id;
    const file = db.get('files').find({ id }).value();
    if (!file || file.kind !== 'file' || !(file.mimeType||'').startsWith('text')) return res.status(400).json({ message: 'Not a text file' });
    const rec = db.get('texts').find({ fileId: id }).value() || { content: '' };
    server.listen(4000, () => console.log('Mock API on http://localhost:4000/api'));