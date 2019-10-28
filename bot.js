const Discord = new require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL'] });

/** @namespace process.env.BOT_TOKEN */

const prefixes = ['=', `<@636961108648919050>`];
const emojis = {
  yes: '636203217188814858',
  no: '636203217377689620'
};

const roles = {
  admin: '636642066621005865',
};

const channels = {
  official: '636187292310175795',
  unofficial: '636485567990988805',
  extended: '636675053152370720'
};

module.exports = {
    0: '0⃣', 1: '1⃣',
    2: '2⃣', 3: '3⃣', 4: '4⃣', 5: '5⃣',
    6: '6⃣', 7: '7⃣', 8: '8⃣'
};

multipleReact = async (message, arr) => {
  if (0 in arr) await message.react(arr.shift()).then(() => multipleReact(message, arr).catch());
};

emoji = (id) => client.emojis.get(id);

client.on('ready', () => console.log('Bot is ready'));

client.on('messageReactionAdd', async (reaction, user) => {
  if (!reaction.message.guild || user.bot) return;

  if (reaction.message.partial) {
    try {
			await reaction.message.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
		};
  };

  if (user.id === reaction.message.author.id && reaction.message.channel.id === channels.extended) {
    reaction.users.remove(user);
    user.send('Ты не можешь голосовать за свои же варианты в расширенных опросах');
  }

  if (reaction.message.channel.id === channels.extended && reaction.emoji.name === '⭐' && reaction.message.guild.members.get(user.id).roles.has(roles.admin)) {
    user.send(`В расширенный опрос добавлен новый вариант:\nАвтор варианта: ${reaction.message.author.tag}. Вариант: ${reaction.message.content}`);
  };

  if (reaction.message.channel.id === channels.unofficial) {
    if (reaction.emoji.name === '⭐' && reaction.message.guild.members.get(user.id).roles.has(roles.admin)) {
      client.channels.get(channels.official).send(reaction.message, {embed: reaction.message.embeds[0].setTitle(`${reaction.message.embeds[0].title}. Опрос попал сюда из канала #unofficial-votes`)});
    };
  };

  if (reaction.message.author.id === client.user.id) {
    const id = reaction.message.embeds[0].footer.text.match(/Автор голосования - .*?#[0-9]{4} \(([0-9]+)\)/)[1];
    const pollAuthor = client.users.get(id);
    if (pollAuthor.id === user.id) {
      await user.send('Ты не можешь голосовать за свои опросы')
      reaction.users.remove(user);
    };

    if (reaction.message.embeds[0].title.match(/Без мультичойс/i)); {
      let count = 0;
      reaction.message.reactions.forEach(async r => {
        const users = await r.users.fetch();
        if (users.find(u => u.id === user.id)) count++;
        if (count > 1) {
          await user.send('Ты не можешь голосовать за несколько вариантов в опросе без опции "Мультичойс"');
          return reaction.users.remove(user);
        };
      });
    };
  };
});

client.on('message', message => {
  if (!message.guild || message.author.bot) return;
  if (message.channel.id === channels.extended) multipleReact(message, [emoji(emojis.yes), emoji(emojis.no)]);

  const prefix = prefixes.find(p => message.content.toLowerCase().startsWith(p));
  if (message.channel.id === channels.unofficial && !prefix) {
    message.delete();
    return message.author.send('В этом канале можно делать только опросы');
  };

  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const poll = message.content.slice(prefix.length).trim().split(/;+/g);
  const command = args.shift().toLowerCase();

  if (command === 'eval') {
    try {
      message.channel.send(`//Success ✅\n${eval(args.join(' '))}`, {code: 'js', split: '\n'});
    } catch (err) {
      message.channel.send(`//Error ❎\n${err}`, {code: 'js'});
    }
  };

  if (command === 'help') {
    const embed = new Discord.MessageEmbed()
    .setTitle('Небольшая инструкция по боту Aristotle')
    .setColor('af00ff')
    .setDescription(`**Это довольно простой приватный бот для сервера "${message.guild.name}". Созданный ${client.users.get('242975403512168449').tag}. Его задача - следить за соблюдением правил опросов и помогать создавать опросы. Команды:\n\n${prefixes[0]}poll \`Содержание вопроса;Вариант ответа 1;Вариант ответа 2;Вариант ответа 3 и т. д.\` - Создание опроса.\nПри добавлении опции \`-multichoice\`, \`-multi\`, \`-мультичойс\` или \`-мульти\` под опросом можно будет голосовать сразу за несколько вариантов ответа. Пример использования:\n${prefixes[0]}poll \`-multi Каких ботов добавить?; Vexera; Pollux; Tatsumaki; Statbot\`**`)
    message.channel.send(embed)
  }

  if (['poll', 'vote'].includes(command)) {
    message.delete();
    let multichoice = false;
    const multichoiceReg = /-multi-?(choice)?|-мульти-?(чойс)?/g;
    if (!poll[1]) return message.author.send(`Нельзя создавать пустые голосования, лол. Правильное использование:\n\`${prefix}poll Сервер скатился?;Да;Нет\``);
    const question = args.join(' ').match(/(.*?);/g)[0].slice(0, -1);
    if (question.match(multichoiceReg)) multichoice = true;
    if (poll[9]) return message.author.send('Голосование нельзя делать с более чем 8-ю вариантами');
    let variants = '';
    let reactArray = [];
    for (let i = 1; i < poll.length; i++) {
        variants += `${module.exports[i]} ${poll[i]}\n`;
        reactArray.push(module.exports[i]);
    };

    const embed = new Discord.MessageEmbed()
    .setTitle(multichoice? 'Мультичойс' : 'Без мультичойс')
    .setDescription(variants)
    .setColor('af00ff')
    .setFooter(`Автор голосования - ${message.author.tag} (${message.author.id})`);

    message.channel.send(`**:bar_chart: ${question.replace(multichoiceReg, '').trim()}**`, embed).catch(msg => {
      message.author.send('Лимит символов превышен. Пожалуйста, сделайте голосование более компактным');
    }).then(msg => multipleReact(msg, reactArray));

  } else if (message.channel.id === channels.unofficial) {
    message.delete();
    return message.author.send('В этом канале можно делать только опросы');
  }
});

client.login(process.env.BOT_TOKEN);
