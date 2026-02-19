const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

const getCurrentDate = () => {
    const now = new Date();
    // Format: YYYY-MM-DD (String)
    return now.toISOString().split('T')[0];
};

const getCurrentMonthStr = () => {
    const now = new Date();
    // Format: YYYY-MM (String) misal: "2023-10"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // +1 karena index bulan mulai dari 0
    return `${year}-${month}`;
};

module.exports = { formatRupiah, getCurrentDate, getCurrentMonthStr };