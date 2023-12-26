document.cookie = "key=value; SameSite=None; Secure";


//发信息
async function SendMessage(messageObj){
	await chrome.runtime.sendMessage({op:100});
	let res = await chrome.runtime.sendMessage(messageObj);
	return res;
}

window.onload=async()=>{
	let ret=await SendMessage({op:905});
	let myframe=document.getElementById('myframe');
	console.log(ret);
	myframe.contentWindow.postMessage(JSON.stringify(ret),"*");
};