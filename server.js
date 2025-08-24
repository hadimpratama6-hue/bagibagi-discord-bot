// server.js
const express = require("express");
const fetch = require("node-fetch");
const { createHmac, timingSafeEqual } = require("crypto");

const app = express();
app.use(express.json());

// Ambil dari environment variables di Railway
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN; // Webhook Token dari Bagibagi

// Fungsi verifikasi signature
function isValidSignature(body, token, signature) {
  const generated = createHmac("sha256", token)
    .update(JSON.stringify(body))
    .digest("hex");
  const sigBuf = Buffer.from(signature, "hex");
  const genBuf = Buffer.from(generated, "hex");
  return timingSafeEqual(sigBuf, genBuf);
}

// Endpoint untuk menerima webhook dari Bagibagi
app.post("/bagibagi", async (req, res) => {
  const signature = req.header("X-Bagibagi-Signature");
  if (!signature || !isValidSignature(req.body, WEBHOOK_TOKEN, signature)) {
    return res.status(401).send("Invalid signature");
  }

  const { name = "Anonim", amount = 0, message = "", transaction_id } = req.body;

  // Buat embed Discord
  const embed = {
    title: "📌 Donasi Baru Diterima!",
    color: 0x2ecc71,
    fields: [
      { name: "👤 Nama", value: name, inline: true },
      { name: "💵 Jumlah", value: `Rp${amount.toLocaleString()}`, inline: true },
      { name: "📝 Pesan", value: message || "-", inline: false },
      {
        name: "🔗 Link Donasi",
        value: `[Dukung juga di sini](https://bagibagi.co/donate/${transaction_id})`,
        inline: false,
      },
    ],
    footer: { text: "bagibagi.co | Terima kasih atas dukungannya ❤️" },
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "bagibagi.co",
        avatar_url: "https://bagibagi.co/favicon.png",
        embeds: [embed],
      }),
    });
    res.status(200).send("OK");
  } catch (err) {
    console.error("Error sending to Discord:", err);
    res.status(500).send("Error");
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server jalan di port ${PORT}`));
