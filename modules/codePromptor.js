module.exports.prompt = async (message, notice) => {
	const promptRes = {
		noticeMsg: null,
		responseMsg: null,
		error: null
	};
	let code = Math.floor(Math.random() * 100000).toString();
	if (code.length < 5) {while (code.length < 5) code = "0" + code;}

	await message.channel.send(notice + "\nType `" + code + "` to proceed. This operation will time out in 30 seconds.")
		.then(async noticeMsg => {
			promptRes.noticeMsg = noticeMsg;
			await message.channel.awaitMessages(msg => msg.author.id == message.author.id, {
				max: 1,
				time: 30000,
				errors: ["time"]
			})
				.then(collected => {
					promptRes.responseMsg = collected.values().next().value;
					if (promptRes.responseMsg.content != code) promptRes.error = "You provided an invalid response, cancelling the operation.";
				})
				.catch(() => promptRes.error = "Operation has timed out after 30 seconds.");
		})
		.catch(() => promptRes.error = "Error occurred with the code promptor. Maybe try again?");
	return promptRes;
};
