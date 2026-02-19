const parseInput = (text) => {
    const cleanText = text.trim().toLowerCase();

    // 1. Perintah Dasar
    if (cleanText === 'saldo' || cleanText === '/saldo') return { type: 'command', action: 'saldo' };

    // Handle Tombol Menu (Sesuai teks di controller)
    if (cleanText === 'laporan harian') return { type: 'command', action: 'laporan_harian' };
    if (cleanText === 'laporan bulanan') return { type: 'command', action: 'laporan_bulanan' };
    if (cleanText === 'batal/hapus menu' || cleanText.includes('batal')) return { type: 'command', action: 'hide_menu' };

    if (cleanText === 'bantuan' || cleanText === '/start' || cleanText === 'menu') {
        return { type: 'command', action: 'start' };
    }

    // 2. Transaksi Tabungan
    if (cleanText.startsWith('tabung')) {
        const match = cleanText.match(/tabung\s+(\d+)\s*(.*)?/);
        if (match) {
            return {
                type: 'transaction',
                data: {
                    txType: 'saving',
                    amount: parseInt(match[1]),
                    note: match[2] || 'Tabungan',
                    category: 'Tabungan'
                }
            };
        }
    }

    // 3. Transaksi Income/Expense (+/-)
    const match = cleanText.match(/^([\+\-])?(\d+)\s*(.*)?/);
    if (match) {
        const sign = match[1];
        const amount = parseInt(match[2]);
        const note = match[3] || 'Transaksi';
        let txType = 'expense';

        if (sign === '+') txType = 'income';
        else if (sign === '-') txType = 'expense';
        else txType = 'expense'; // Default jika tidak ada tanda

        return {
            type: 'transaction',
            data: {
                txType,
                amount,
                note,
                category: 'Umum'
            }
        };
    }

    return null;
};

module.exports = { parseInput };