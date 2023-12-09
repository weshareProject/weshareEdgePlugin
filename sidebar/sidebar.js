//发信息
async function SendMessage(messageObj){
	await chrome.runtime.sendMessage({op:OPERATION_CODE_NOTE.NO_ACTION});
	let res = await chrome.runtime.sendMessage(messageObj);
	return res;
}

(async ()=>{
	let ret=await SendMessage({op:905});
	document.getElementById('test').innerHTML=ret;
	
})();