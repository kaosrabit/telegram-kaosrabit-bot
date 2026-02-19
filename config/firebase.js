const admin = require('firebase-admin');

let db;

try {
    // Cek apakah FIREBASE_KEY ada
    if (!process.env.FIREBASE_KEY) {
        throw new Error("FIREBASE_KEY tidak ditemukan di Environment Variables!");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    db = admin.firestore();
    console.log("✅ Firebase Connected");

} catch (error) {
    console.error("❌ Gagal inisialisasi Firebase:", error.message);
}

module.exports = db;