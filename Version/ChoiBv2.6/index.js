/*---- 객체 ----*/
const Discord = require('discord.js');
const fs = require('fs');
const moment = require('moment');
const Pingpong = require('pingpong-builder');
const builder = new Pingpong.Ai();
const drply = require('discord-reply');
const keepAlive = require('./server.js');
const client = new Discord.Client();

client.errI = require('./utils/error');

client.admin = require('./configs/admin.js');
client.color = require('./configs/color.js');
client.config = require('./configs/config.js');
client.emote = require('./configs/emoji.js');
client.list = require('./configs/list.js');
client.log = require('./configs/log.js');
client.nullch = require('./configs/nullch.js');
client.commands = new Discord.Collection();

/*---- 명령어 파일 읽기 ----*/
fs.readdirSync('./commands').forEach(dirs => {
	const commands = fs
		.readdirSync(`./commands/${dirs}`)
		.filter(files => files.endsWith('.js'));

	for (const file of commands) {
		const command = require(`./commands/${dirs}/${file}`);
		console.log(`Loaded command: ${file}`);
		client.commands.set(command.name.toLowerCase(), command);
	}
});

/*---- 이벤트 파일 읽기 ----*/
const events = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of events) {
	console.log(`Loaded event: ${file}`);
	const event = require(`./events/${file}`);
	client.on(file.split('.')[0], event.bind(null, client));
}

/*---- 인사 ----*/
client.on('message', message => {
	const msg = message;
	const cmd = msg.content;
	try {
		const hlist = client.list.hlist;
		const hblist = client.list.hblist;

		if (msg.author.bot) return;

		for (var n = 0; n < hlist.length; n++) {
			if (cmd.indexOf(hlist[n]) != -1 && Math.floor(Math.random() * 14) == 0) {
				let r = Math.floor(Math.random() * hblist.length);
				msg.lineReply(`${hblist[r]}~~!!`);
			}
		}

		//if (msg.author.id == client.admin.author) {
		if (cmd.indexOf('최빈') != -1) {
			if (cmd.indexOf(hlist[n]) != -1) return;
			if (cmd.startsWith('C>') || cmd.startsWith('c>')) return;

			var rd = Math.floor(Math.random() * 5);
			if (rd == 0) {
				msg.lineReply('ㅇㅇ!!');
			} else if (rd == 1) {
				msg.lineReply('ㄴㄴ!!');
			} else if (rd == 2) {
				msg.lineReply('웅!!');
			} else if (rd == 3) {
				msg.lineReply('ㄲㅈ');
			} else {
				msg.lineReply('헤헿ㅎ');
			}
			//}
		}
	} catch (e) {
		client.errI(`에러: ${e}`, msg.channel);
		client.errI(
			`명령어: ${cmd}\n에러: ${e}`,
			client.channels.cache.get(client.log.error)
		);
		return;
	}
});

/*---- 수정된 메시지 감지 ----*/
client.on('messageUpdate', (omsg, nmsg) => {
	const omsgct = omsg.content;
	const nmsgct = nmsg.content;
	try {
		if (nmsg.author.bot || nmsg.channel.type === 'dm') return;

		const nullch = client.nullch.hymusic;
		const edtlog = new Discord.MessageEmbed()
			.setTitle('메시지 수정 감지')
			.setURL(nmsg.url)
			.setColor(client.color.edtlog)
			.addField(
				'작성자',
				nmsg.guild.member(nmsg.author).nickname || nmsg.author.username,
				true
			)
			.addField('감지 채널', nmsg.channel, true)
			.addField('기존 메시지', omsgct)
			.addField('수정된 메시지', nmsgct)
			.setTimestamp()
			.setFooter(
				nmsg.author.tag,
				nmsg.author.avatarURL({ dynamic: true, format: 'jpg', size: 2048 })
			);

		if (omsgct == nmsgct) return;
		if (nullch.indexOf(nmsg.channel.id) != -1) return;

		if (nmsg.guild.id == '748542025766273165') {
			client.channels.cache.get(client.log.adminlog2).send(edtlog);
		}

		edtlog.setDescription(`MID: ${nmsg.id} \nAID: ${nmsg.author.id}`);
		client.channels.cache.get(client.log.edtlog).send(edtlog);
	} catch (e) {
		client.errI(
			`명령어: ${nmsgct}\n에러: ${e}`,
			client.channels.cache.get(client.log.error)
		);
		return;
	}
});

/*---- 삭제된 메시지 감지 ----*/
client.on('messageDelete', async messageD => {
	await Discord.Util.delayFor(900);

	const msg = messageD;
	const msgct =
		msg.content /*||
		msg.attachments.first().url*/ ||
		'확인 불가 (지원되지 않는 형식)';
	try {
		if (msg.author.bot || msg.channel.type === 'dm') return;
		if (msg.attachments.size > 0) return;

		const nullch = client.nullch.hymusic;
		const fetchedLogs = await msg.guild
			.fetchAuditLogs({
				limit: 99,
				type: 'MESSAGE_DELETE'
			})
			.catch(() => ({
				entries: []
			}));
		const auditEntry = fetchedLogs.entries.find(
			a =>
				a.target.id === msg.author.id &&
				a.extra.channel.id === msg.channel.id &&
				Date.now() - a.createdTimestamp < 20000
		);
		const executor = auditEntry ? auditEntry.executor.tag : '알수없음';
		const delog = new Discord.MessageEmbed()
			.setTitle('메시지 삭제 감지')
			.setColor(client.color.delog)
			.addField(
				'삭제 정보 (작성자:삭제자)',
				(msg.guild.member(msg.author).nickname || msg.author.username) +
					' : ' +
					executor,
				true
			)
			.addField('감지 채널', msg.channel, true)
			.addField('메시지', msgct)
			.setTimestamp()
			.setFooter(
				msg.author.tag,
				msg.author.avatarURL({
					dynamic: true,
					format: 'jpg',
					size: 2048
				})
			);

		if (nullch.indexOf(msg.channel.id) != -1) return;

		if (msg.guild.id == '748542025766273165') {
			client.channels.cache.get(client.log.adminlog2).send(delog);
		}

		delog.setDescription(`MID: ${msg.id} \nAID: ${msg.author.id}`);
		client.channels.cache.get(client.log.delog).send(delog);
	} catch (e) {
		client.errI(
			`명령어: ${msgct}\n에러: ${e}`,
			client.channels.cache.get(client.log.error)
		);
		return;
	}
});

/*---- 삭제된 미디어 감지 ----*/
client.on('messageDelete', async messageD => {
	await Discord.Util.delayFor(900);

	const msg = messageD;
	const cmd = msg.content;
	try {
		if (msg.author.bot) return;
		if (!msg.attachments.size > 0) return;

		const nullch = client.nullch.hymusic;
		const fetchedLogs = await msg.guild
			.fetchAuditLogs({
				limit: 99,
				type: 'MESSAGE_DELETE'
			})
			.catch(() => ({
				entries: []
			}));
		const auditEntry = fetchedLogs.entries.find(
			a =>
				a.target.id === msg.author.id &&
				a.extra.channel.id === msg.channel.id &&
				Date.now() - a.createdTimestamp < 20000
		);
		const executor = auditEntry ? auditEntry.executor.tag : '알수없음';
		const encodeURL = msg.attachments.first().url;
		const imglog = new Discord.MessageEmbed()
			.setTitle('미디어 삭제 감지')
			.setURL(encodeURL)
			.setColor(client.color.imglog)
			.setThumbnail(encodeURL)
			//.setImage(encodeURL)
			.addField(
				'보낸 사람',
				msg.guild.member(msg.author).nickname || msg.author.username,
				true
			)
			.addField('감지 채널', msg.channel, true)
			.addField(
				'삭제 정보 (작성자:삭제자)',
				(msg.guild.member(msg.author).nickname || msg.author.username) +
					' : ' +
					executor,
				false
			)
			.setTimestamp()
			.setFooter(
				msg.author.tag,
				msg.author.avatarURL({ dynamic: true, format: 'jpg', size: 2048 })
			);

		if (nullch.indexOf(msg.channel.id) != -1) return;

		if (msg.guild.id == '698355063915282432') {
			client.channels.cache.get(client.log.adminlog1).send(imglog);
		}

		if (msg.guild.id == '748542025766273165') {
			client.channels.cache.get(client.log.adminlog2).send(imglog);
		}

		imglog.setDescription(`MID: ${msg.id} \nAID: ${msg.author.id}`);
		client.channels.cache.get(client.log.imglog).send(imglog);
	} catch (e) {
		client.errI(
			`명령어: ${cmd}\n에러: ${e}`,
			client.channels.cache.get(client.log.error)
		);
		return;
	}
});

/*---- 1:1 대화 ----*/
client.on('message', message => {
	const msg = message;
	const cmd = msg.content;
	let purl =
		'https://builder.pingpong.us/api/builder/603825b5e4b078d873a0a451/integration/v0.2/custom/{sessionId}';
	let ptoken = client.config.ptoken;
	try {
		if (cmd.startsWith('C>') || cmd.startsWith('c>')) {
			builder
				.get(cmd.replace('>', ''), {
					id: builder.resolve_id(purl),
					token: ptoken,
					sessionid: client.user.id
				})
				.then(res => {
					for (var x of res.contents) {
						const clog = new Discord.MessageEmbed()
							.setColor('#00FF13')
							.setFooter(
								message.author.tag,
								message.author.avatarURL({
									dynamic: true,
									format: 'jpg',
									size: 2048
								})
							)
							.setTimestamp();
						const embed = new Discord.MessageEmbed()
							.setColor('#00EBF4')
							.setFooter(
								message.author.tag,
								message.author.avatarURL({
									dynamic: true,
									format: 'jpg',
									size: 2048
								})
							)
							.setTimestamp();
						if (x.type == 'text') {
							embed.setDescription(x.content);
							clog.setDescription('{ ' + cmd + ' } \n' + x.content);
						} else if (x.type == 'image') {
							embed.setImage(x.content + '?size=400');
							clog.setImage(x.content + '?size=400');
						}
						msg.lineReply(x.content);
						client.channels.cache.get(client.log.talk).send(clog);
					}
				})
				//.then(console.log)
				.catch(console.error);
		}
	} catch (e) {
		client.errI(`에러: ${e}`, msg.channel);
		client.errI(
			`명령어: ${cmd}\n에러: ${e}`,
			client.channels.cache.get(client.log.error)
		);
		return;
	}
});

/*---- 봇 추가 ----*/
client.on('guildCreate', guild => {});

/*---- 봇 삭제 ----*/
client.on('guildDelete', guild => {});

/*---- 서버 ----*/
keepAlive();
client.login(client.config.token);
