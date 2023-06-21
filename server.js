const TelegramBot = require("node-telegram-bot-api");
const { xodim, ish } = require("./question");
require("dotenv").config();

let bot = new TelegramBot(process.env.TOKEN, {
  polling: true,
});

let customers = {};
let customersI = {};
let admin = process.env.ADMIN_ID;
let commands = ["Ish kerak", "Xodim kerak"];
let homeBtns = {
  keyboard: [[{ text: "Ish kerak" }, { text: "Xodim kerak" }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const confirm = {
  inline_keyboard: [
    [
      { text: "✅", callback_data: "yes" },
      { text: "❎", callback_data: "no" },
    ],
  ],
};


bot.onText(/\/start/, async (msg) => {
  let { id: userId } = msg.from;
  customersI[userId] = 0;
  customers[userId] = [];
  try {
    bot.sendMessage(
      userId,
      `Assalomu alekum *${msg.from.first_name}* botimizga xush kelibsiz. Siz bu botda IT sohasida ish, xodim, sherik topishingiz mumkun`,
      {
        parse_mode: "Markdown",
        reply_markup: homeBtns,
      }
    );
  } catch (error) {
    bot.sendMessage(
      userId,
      "Kechirasiz xatolik kelib chiqdi agar bu takrorlansa adminlarga murojat qiling @Mr_Valiyev"
    );
  }
});

function* genFunc() {
  while (1) {
    let [id, ques] = yield;
    bot.sendMessage(id, ques, { parse_mode: "Markdown" });
  }
}

let questionGiver = genFunc();
questionGiver.next();
bot.on("message", (msg) => {
  try {
    if (msg.text == "/start" || msg.from.is_bot) return;
    let { id: userId } = msg.from;

    if (!commands.includes(msg.text) && customersI[userId] == 0) {
      bot.sendMessage(userId, `Iltimos bot tugmalaridan birini tanlang`, {
        parse_mode: "Markdown",
        reply_markup: homeBtns,
      })
      return;
    }

    if (!customers[userId]) {
      customers[userId] = [];
      customersI[userId] = 0;
    }
    if (commands.includes(msg.text)) {
      customersI[userId] = 0;
    }
    customers[userId].push(msg.text);

    if (customersI[userId] < xodim.length) {
      if (customersI[userId] == 0) {
        bot.sendMessage(
          userId,
          `*${msg.text.substring(
            0,
            msg.text.length - 6
          )} topish uchun ariza berish* \n\nHozir sizga birnecha savollar beriladi.\nHar biriga javob bering.\nOxirida agar hammasi to'g'ri bo'lsa,\n✅ tugmasini bosing va arizangiz Adminga yuboriladi.`,
          {
            parse_mode: "Markdown",
            reply_markup: { remove_keyboard: true },
          }
        );
      }
      if (customers[userId][0] == "Ish kerak") {
        questionGiver.next([userId, xodim[customersI[userId]++]]);
      } else if (customers[userId][0] == "Xodim kerak") {
        questionGiver.next([userId, ish[customersI[userId]++]]);
      }
    } else {
      bot.sendMessage(userId, render(userId, msg.from.username), {
        parse_mode: "HTML",
        reply_markup: confirm,
      });
    }
  } catch (error) {
    bot.sendMessage(
      userId,
      "Kechirasiz xatolik kelib chiqdi agar bu takrorlansa adminlarga murojat qiling @Mr_Valiyev"
    );
  }
});

bot.on("callback_query", async (msg) => {
  let { id: userId } = msg.from;
  if (msg.data == "yes") {
    if (userId != admin) {
      await bot.sendMessage(admin, render(userId, msg.from.username), {
        parse_mode: "HTML",
        reply_markup: confirm,
      });
      bot.deleteMessage(userId, msg.message.message_id);
      bot.sendMessage(
        userId,
        `*📪 So'rovingiz tekshirish uchun adminga jo'natildi!*\n\nE'lon 24-48 soat ichida kanalda chiqariladi.`,
        { parse_mode: "Markdown" }
      );
      customers[userId] = [];
    } else {
      let t = msg.message.text;
      bot.sendMessage("@JobHire_uz", t);
      bot.deleteMessage(admin, msg.message.message_id);
      customers[userId] = [];
    }
  } else if (msg.data == "no") {
      customers[userId] = [];
      customersI[userId] = 0;
    bot.deleteMessage(userId, msg.message.message_id);
  }

  bot.sendMessage(
    userId,
    "🎛Yana elon berish uchun bolimlardan birini tanlang!",
    { reply_markup: homeBtns }
  );
}); 


function render(userId, username) {
  if (customers[userId][0] == "Ish kerak") {
    return `<b>${customers[userId][0]}:</b>
    
👨‍💼 Xodim:  <b>${customers[userId][1]}</b>
🕑 Yosh: ${customers[userId][2]}
📚 Texnologiya: <b>${customers[userId][3]}</b>
🇺🇿 Telegram: @${username}
📞 Aloqa: ${customers[userId][4]}
🌐 Hudud: <b>${customers[userId][5]}</b>
💰 Narxi: ${customers[userId][6]}
💼 Kasbi :  ${customers[userId][7]}
🕰 Murojaat qilish vaqti: ${customers[userId][8]}
🔎 Maqsad: ${customers[userId][9]} 
    
#Xodim`;
  } else {
    return `Xodim kerak:

🏢 Idora: ${customers[userId][1]}
📚 Texnologiya: ${customers[userId][2]} 
🇺🇿 Telegram:@${username} 
📞 Aloqa:  ${customers[userId][3]}
🌐 Hudud: ${customers[userId][4]} 
✍️ Mas'ul: ${customers[userId][5]}
🕰 Murojaat vaqti: ${customers[userId][6]}
🕰 Ish vaqti: ${customers[userId][7]} 
💰 Maosh: ${customers[userId][8]}
‼️ Qo'shimcha: ${customers[userId][9]}

#ishJoyi `;
  }
}