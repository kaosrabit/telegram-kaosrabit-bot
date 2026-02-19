// TAMBAHKAN BARIS INI PALING ATAS
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const financeRoutes = require('./routes/finance.route');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Routes
// Kita mount routes ke root /api/webhook nantinya
app.use('/', financeRoutes);

// Untuk Local Development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app untuk Vercel
module.exports = app;