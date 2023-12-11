//发信息
async function SendMessage(messageObj){
	await chrome.runtime.sendMessage({op:100});
	let res = await chrome.runtime.sendMessage(messageObj);
	return res;
}

(async ()=>{
	let ret=await SendMessage({op:905});
	document.getElementById('test').innerHTML=JSON.stringify(ret);
	
})();