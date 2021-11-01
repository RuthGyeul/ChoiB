const { MessageEmbed } = require('discord.js');

/*
const errI = require('../error/error');

try {
} catch (e) {
errI(`에러: ${e}`, msg.channel);
errI(`에러: ${e}`, client.channels.cache.get(client.logs.error));
return;
}
*/

module.exports = async (text, channel) => {
	let embed = new MessageEmbed()
		.setColor('RED')
		.setDescription(text)
		.setFooter('Something went wrong');
	await channel.send(embed);
};
