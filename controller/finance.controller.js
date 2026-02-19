// TAMBAHKAN BARIS INI PALING ATAS
require('dotenv').config();

const db = require('../config/firebase');
const { parseInput } = require('../utils/parser');
const { formatRupiah, getCurrentDate, getCurrentMonthStr } = require('../utils/format');
const { calculateBalance, calculateSummary } = require('../utils/finance');
const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;

// Fungsi Kirim Pesan (Support HTML & Keyboard)
const sendMessage = async (chatId, text, replyMarkup = null) => {
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };

    if (replyMarkup) {
        payload.reply_markup = replyMarkup;
    }

    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, payload);
    } catch (error) {
        console.error("Error sending message:", error.response ? error.response.data : error.message);
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) return res.status(200).send('OK');

        const chatId = message.chat.id;
        const text = message.text;

        console.log(`[${chatId}] Input: ${text}`);

        const result = parseInput(text);

        if (!result) {
            await sendMessage(chatId, "❌ Format salah.\nKetik <b>/start</b> untuk melihat panduan.");
            return res.status(200).send('OK');
        }

        // --- LOGIKA TRANSAKSI ---
        if (result.type === 'transaction') {
            const { txType, amount, note, category } = result.data;

            // Simpan ke Firestore
            const docRef = await db.collection('transactions').add({
                chatId,
                type: txType,
                amount,
                note,
                category,
                date: getCurrentDate(),     // Untuk filter harian
                monthStr: getCurrentMonthStr(), // Untuk filter bulanan
                createdAt: new Date()
            });

            let msg = "";
            if (txType === 'income') msg = `✅ <b>Pemasukan</b> tercatat:\n${formatRupiah(amount)}`;
            else if (txType === 'expense') msg = `✅ <b>Pengeluaran</b> tercatat:\n${formatRupiah(amount)}`;
            else if (txType === 'saving') msg = `💰 <b>Tabungan</b> tercatat:\n${formatRupiah(amount)}`;

            await sendMessage(chatId, msg);
        }

        // --- LOGIKA COMMAND ---
        else if (result.type === 'command') {
            const { action } = result;

            // 1. START / MENU
            if (action === 'start') {
                const menuKeyboard = {
                    keyboard: [
                        ['💰 Cek Saldo', '📊 Laporan Harian'],
                        ['📝 Laporan Bulanan', '❌ Batal/Hapus Menu']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                };

                const welcomeMessage = `
                <b>👋 Selamat Datang di KaosRabit Finance Bot!</b>

                Bot ini mencatat keuanganmu dengan simpel.

                <b>📝 Cara Pakai Cepat:</b>
                <code>+ 50000 gaji</code>      → Catat Pemasukan
                <code>- 15000 makan</code>     → Catat Pengeluaran
                <code>tabung 20000</code>     → Catat Tabungan

                <b>🚀 Fitur Lainnya:</b>
                • Saldo otomatis
                • Laporan Harian & Bulanan
                • Tanpa install aplikasi tambahan

                Klik tombol di bawah untuk mulai! 👇
                `;
                await sendMessage(chatId, welcomeMessage, menuKeyboard);
            }

            // 2. SALDO
            else if (action === 'saldo') {
                const snapshot = await db.collection('transactions')
                    .where('chatId', '==', chatId)
                    .get();

                const txs = snapshot.docs.map(doc => doc.data());
                const balance = calculateBalance(txs);

                await sendMessage(chatId, `💳 <b>Saldo Anda:</b>\n${formatRupiah(balance)}`);
            }

            // 3. LAPORAN HARIAN
            else if (action === 'laporan_harian') {
                const today = getCurrentDate();
                const snapshot = await db.collection('transactions')
                    .where('chatId', '==', chatId)
                    .where('date', '==', today)
                    .orderBy('createdAt', 'desc')
                    .get();

                if (snapshot.empty) {
                    await sendMessage(chatId, "📅 Belum ada transaksi hari ini.");
                } else {
                    const txs = snapshot.docs.map(doc => doc.data());
                    const summary = calculateSummary(txs);

                    let reply = `📊 <b>Laporan Harian (${today})</b>\n\n`;
                    reply += `🟢 Masuk: ${formatRupiah(summary.income)}\n`;
                    reply += `🔴 Keluar: ${formatRupiah(summary.expense)}\n`;
                    reply += `🟡 Tabung: ${formatRupiah(summary.saving)}\n`;
                    reply += `\n<b>Rincian Transaksi:</b>\n`;

                    txs.forEach(tx => {
                        const sign = tx.type === 'income' ? '+' : (tx.type === 'saving' ? '💰' : '-');
                        reply += `${sign} ${formatRupiah(tx.amount)} — ${tx.note}\n`;
                    });

                    await sendMessage(chatId, reply);
                }
            }

            // 4. LAPORAN BULANAN
            else if (action === 'laporan_bulanan') {
                const currentMonth = getCurrentMonthStr();
                const snapshot = await db.collection('transactions')
                    .where('chatId', '==', chatId)
                    .where('monthStr', '==', currentMonth)
                    .orderBy('createdAt', 'desc')
                    .get();

                if (snapshot.empty) {
                    await sendMessage(chatId, "📅 Belum ada transaksi bulan ini.");
                } else {
                    const txs = snapshot.docs.map(doc => doc.data());
                    const summary = calculateSummary(txs);

                    let reply = `📊 <b>Laporan Bulanan (${currentMonth})</b>\n\n`;
                    reply += `🟢 Total Masuk: ${formatRupiah(summary.income)}\n`;
                    reply += `🔴 Total Keluar: ${formatRupiah(summary.expense)}\n`;
                    reply += `🟡 Total Tabung: ${formatRupiah(summary.saving)}\n`;

                    await sendMessage(chatId, reply);
                }
            }

            // 5. HIDE MENU
            else if (action === 'hide_menu') {
                const hideKeyboard = { remove_keyboard: true };
                await sendMessage(chatId, "Menu disembunyikan. Ketik <code>/start</code> untuk menampilkannya kembali.", hideKeyboard);
            }
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send('Error');
    }
};