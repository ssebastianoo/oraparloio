import TelegramBot from 'node-telegram-bot-api';
import sharp from "sharp";

process.env.NTBA_FIX_350 = 'true';

const token = process.env.TOKEN as string;
const bot = new TelegramBot(token, { polling: true });

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        stream.once('end', () => resolve(Buffer.concat(chunks)));
        stream.once('error', reject);
    });
}

function escapeChars(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function oraParloIo(image: sharp.Sharp, msg: TelegramBot.Message) {
    const resized = await image
        .png()
        .resize({ width: 250, height: 68, fit: 'fill' })
        .toBuffer()

    const result = await sharp('base.png').composite([
        {
            input: resized,
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
}

async function sendError(msg: TelegramBot.Message, error: any) {
    console.error('Error processing image:', error);
    bot.sendMessage(msg.chat.id, 'Si è verificato un errore durante la generazione dell\'immagine.', {
        reply_to_message_id: msg.message_id,
    });
}

async function handlePicture(msg: TelegramBot.Message) {
    const stream = bot.getFileStream(msg.photo![0].file_id);
    const buffer = await streamToBuffer(stream);

    try {
        const img = await sharp(buffer).toBuffer();
        await oraParloIo(sharp(img), msg);
    } catch (error) {
        await sendError(msg, error);
    }
}

async function handleText(msg: TelegramBot.Message, arg: string) {

    let text = arg;

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
                text: `<span foreground="white">${escapeChars(text)}</span>`,
                width: 200,
                height: 200,
                rgba: true,
            }
        })
        await oraParloIo(textImage, msg);
    } catch (error) {
        await sendError(msg, error);
    }
}

bot.on('photo', async (msg, match) => {
    if (!msg.caption || !msg.caption.toLowerCase().startsWith('/oraparloio')) return;

    await handlePicture(msg);
});

bot.onText(/^\/ora(parloio)?(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    if (!match || match.length < 2) return;

    const text = match[1]?.trim();

    if (!text && msg.reply_to_message && msg.reply_to_message.photo) {
        await handlePicture(msg.reply_to_message);
        return;
    }

    await handleText(msg, text);
});

bot.onText(/^\/start(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    bot.sendMessage(msg.chat.id, 'Ora parlo io.\n\nUsa <code>/oraparloio &lt;messaggio&gt;</code>\n\n<i>Es. <code>/oraparloio caco</code></i>', {
        reply_to_message_id: msg.message_id,
        parse_mode: 'HTML'
    });
});