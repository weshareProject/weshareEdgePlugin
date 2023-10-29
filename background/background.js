
/*
let data={};

function save(){
	chrome.storage.sync.set({'data':JSON.stringify(data)});
}

function load(){
	chrome.storage.sync.get('data',(data_)=>{
		if(data_['data'])data=JSON.parse(data_['data']);
		else data={};
		console.log(data);
	});	
}

load();

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
		if(message.op=="set"){
			data[message.key]=message.value;
			save();
			
		}else if(message.op=="get"){
			sendResponse(data[message.key]);
		}
		
		console.log(data);
		
		return true;
});
*/


//右键添加笔记

chrome.runtime.onInstalled.addListener(()=>{
	chrome.contextMenus.create({
		title:"添加笔记",
		contexts:["all"],
		id:"weshareAddnote"
	});
	
	chrome.contextMenus.create({
		title:"高亮标记",
		contexts:["selection"],
		id:"weshareHighlight"
	});
});


chrome.contextMenus.onClicked.addListener((info,tab)=>{
	if(info.menuItemId=='weshareAddnote'){
		chrome.tabs.sendMessage(tab.id,{op:"addNote",position:"clickpoint"});
	}else if(info.menuItemId=='weshareHighlight'){
		chrome.tabs.sendMessage(tab.id,{op:"highlight"});
	}
});