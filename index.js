const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");
    
    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        browser: ["Emperor Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
        await delay(3000);
        const number = "263790136058";
        try {
            let code = await sock.requestPairingCode(number);
            console.log("\n\n====== EMPEROR BOT PAIRING CODE ======");
            console.log("Pairing code for +" + number + ": " + code);
            console.log("Go to WhatsApp > Linked Devices > Link with phone number");
            console.log("=======================================\n\n");
        } catch (e) {
            console.log("Pairing error:", e.message);
        }
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed, reconnecting:", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("Emperor Bot Connected! +263790136058 is LIVE!");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        console.log("Message from " + from + ": " + text);

        if (text.toLowerCase() === ".ping" || text.toLowerCase() === "ping") {
            await sock.sendMessage(from, { text: "🏆 *Emperor Bot is Alive!*\n\n> Pong! 200ms\n> Owner: +263790136058\n> Status: Online 🔥" });
        }
        if (text.toLowerCase() === ".menu" || text.toLowerCase() === "menu") {
            await sock.sendMessage(from, { text: "*👑 EMPEROR BOT MENU 👑*\n\n🏆 Main\n.menu - Show this menu\n.ping - Check bot speed\n.alive - Bot status\n\nYour Bot is LIVE on Render!\nNumber: +263790136058" });
        }
        if (text.toLowerCase() === ".alive") {
            await sock.sendMessage(from, { text: "👑 Emperor Bot is LIVE and running on Render!\n✅ Number: +263790136058" });
        }
    });
}

startBot();
