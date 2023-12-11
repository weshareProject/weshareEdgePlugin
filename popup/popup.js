function $(elemId){
	return document.getElementById(elemId)
}

//发送信息
async function SendMessage(message){
	await chrome.runtime.sendMessage({op:100});//唤醒background
	let tp=await chrome.runtime.sendMessage(message);
	return tp;
}

//获取当前tab
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
	chrome.tabs.create({url:"/option/option.html"});
});

//公开笔记开关
$('publicNote').addEventListener('click',()=>{
	(async ()=>{
		let tab=await getCurrentTab();
		if(tab[0]){
			chrome.tabs.sendMessage(tab[0].id,{op:"publicNoteSwitch"});
		}
	})();
});

//侧边栏
$('sidebar').addEventListener('click',()=>{
	(async ()=>{
		let tab=await getCurrentTab();
		if(chrome.sidePanel && tab[0]){
			chrome.sidePanel.open({tabId:tab[0].id});
		}
	})();
});

//定位笔记
$('locnote').addEventListener('click',()=>{
	(async ()=>{
		let tab=await getCurrentTab();
		if(tab[0]){
			chrome.tabs.sendMessage(tab[0].id,{op:"locateNote"});
		}
	})();
});


//添加高亮
$('highlight').addEventListener('click',()=>{
	(async ()=>{
		let tab=await getCurrentTab();
		if(tab[0]){
			chrome.tabs.sendMessage(tab[0].id,{op:"highlight"});
		}
	})();
});


//账户显示
(async ()=>{
	let usr=await SendMessage({op:905});
	if(usr.token && usr.userName){
		$('account').innerHTML="当前账号:<span style='color:green'>"+usr.userName+"</span>";
	}else{
		$('account').innerHTML="当前账号:<span style='color:red'>未登录</span>";
	}
	
})();
