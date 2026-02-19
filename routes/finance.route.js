const express = require('express');
const router = express.Router();
const financeController = require('../controller/finance.controller');

// Route Webhook Telegram
router.get('/webhook', (req, res) => {
    res.send('Bot endpoint is alive! Waiting for POST from Telegram...');
});

router.post('/webhook', financeController.handleWebhook);

// Route Tes Koneksi (Opsional, untuk cek Vercel jalan atau tidak)
router.get('/', (req, res) => {
    res.send('Bot is running on Vercel!');
});

module.exports = router;