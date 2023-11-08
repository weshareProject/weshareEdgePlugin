function $(elemId){
	return document.getElementById(elemId)
}

async function getCurrentTab() {
  let queryOptions = { active: true , currentWindow:true };
  let tab = await chrome.tabs.query(queryOptions);
  return tab;
}

//添加笔记
$('addnote').addEventListener("click",()=>{
	(async ()=>{
		let tab=await getCurrentTab();
		chrome.tabs.sendMessage(tab[0].id,{op:"addNote",position:"default"});
	})();
});
//跳转设定
$('setting').addEventListener('click',()=>{
	chrome.runtime.sendMessage({op:100});
	chrome.tabs.create({url:"/option/option.html"});
});

//公开笔记开关
$('publicNote').addEventListener('click',()=>{
	(async ()=>{
		let tab=await getCurrentTab();
		chrome.tabs.sendMessage(tab[0].id,{op:"publicNoteSwitch"});
	})();
});

$('account').innerHTML="当前账户:"+"<span style='color:red'>未登录</span>"