const calculateBalance = (transactions) => {
    return transactions.reduce((acc, tx) => {
        const amt = tx.amount;
        if (tx.type === 'income') return acc + amt;
        if (tx.type === 'expense') return acc - amt;
        if (tx.type === 'saving') return acc - amt;
        return acc;
    }, 0);
};

// Fungsi Baru untuk Laporan (Request dari Controller)
const calculateSummary = (transactions) => {
    let income = 0;
    let expense = 0;
    let saving = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense') expense += tx.amount;
        else if (tx.type === 'saving') saving += tx.amount;
    });

    return { income, expense, saving };
};

module.exports = { calculateBalance, calculateSummary };