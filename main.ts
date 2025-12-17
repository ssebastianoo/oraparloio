import TelegramBot from 'node-telegram-bot-api';
import sharp from "sharp";

process.env.NTBA_FIX_350 = 'true';

const token = process.env.TOKEN as string;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/^\/oraparloio(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    if (!match || match.length < 2) return;

    const resp = match[1];

    let text = resp?.trim();


    if (!text && msg.reply_to_message) {
        text = msg.reply_to_message.text || '';
    }

    if (!text || text.length === 0) {
        bot.sendMessage(msg.chat.id, 'Usa `/oraparloio <messaggio>`\nEs. `/oraparloio caco`', {
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id,
        }
        );
        return;
    }

    if (text.length > 50) {
        bot.sendMessage(msg.chat.id, 'Il messaggio non può superare i 50 caratteri.', {
            reply_to_message_id: msg.message_id,
        });
        return;
    }

    try {
        const textImage = await sharp({
            text: {
                text: `<span foreground="white">${text}</span>`,
                width: 200,
                height: 200,
                rgba: true,
            }
        })
            .png().resize({ width: 250, height: 68, fit: 'fill' })
            .toBuffer()

        const result = await sharp('base.png').composite([
            {
                input: textImage,
                top: 287,
                left: 255
            }
        ]).toBuffer();

        bot.sendPhoto(msg.chat.id, result, {
            reply_to_message_id: msg.message_id,
        }, {
            contentType: 'image/jpeg',
            filename: 'oraparloio.jpg'
        });
    } catch (error) {
        console.error('Error processing image:', error);
        bot.sendMessage(msg.chat.id, 'Si è verificato un errore durante la generazione dell\'immagine.', {
            reply_to_message_id: msg.message_id,
        });
    }
});