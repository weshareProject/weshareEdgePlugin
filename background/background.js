
//右键菜单添加
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

//右键菜单监听添加
chrome.contextMenus.onClicked.addListener((info,tab)=>{
	if(info.menuItemId=='weshareAddnote'){
		chrome.tabs.sendMessage(tab.id,{op:"addNote",position:"clickpoint"});
	}else if(info.menuItemId=='weshareHighlight'){
		chrome.tabs.sendMessage(tab.id,{op:"highlight"});
	}
});

//笔记管理员
let AllNoteManager=(()=>{
	//网站笔记表
	//{网站url：笔记条数，...}
	let NoteWebUrl={};
	
	//存储api
	let Storage=chrome.storage.local;
	
	//初始化
	async function init(){
		let tp=await Storage.get("weshareNoteWebUrl");
		if(tp['weshareNoteWebUrl'])NoteWebUrl=JSON.parse(tp['weshareNoteWebUrl']);
		//console.log(NoteWebUrl);
	}
	
	//保存NoteWebUrl表
	async function saveNoteWebUrl(){
		console.log(NoteWebUrl);
		await Storage.set({"weshareNoteWebUrl":JSON.stringify(NoteWebUrl)});
	}
	
	//保存指定url的笔记
	async function saveNote(url,notes){
		let tpnote=JSON.parse(notes);
		let num=Object.keys(tpnote).length;
		NoteWebUrl[url]=num;
		if(num<=0)delete NoteWebUrl[url];
		saveNoteWebUrl();
		
		let saveObj={};
		saveObj["weshareNote-"+url]=notes;
		await Storage.set(saveObj);
		//console.log(saveObj);
	}
	
	//返回指定url的笔记
	async function loadNote(url){
		let res='{}';
		if(NoteWebUrl[url]){
			let ky='weshareNote-'+url;
			let tp=await Storage.get(ky);
			console.log(tp);
			if(tp[ky])res=tp[ky];
		}
		//console.log(res);
		return res;
	}
	
	return {
		init:init,
		saveNote:saveNote,
		loadNote:loadNote
	}
})();
AllNoteManager.init();


//笔记存取功能
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
	let tp="no action";
	if(message.op=="loadNote"){
		let url=message.url;
		if(url){
			tp=AllNoteManager.loadNote(url);
		}
	}else if(message.op=="saveNote"){
		let url=message.url;
		let notes=message.notes;
		if(url&&notes){
			AllNoteManager.saveNote(url,notes);
			tp="save finish";
		}
	}
	
	(async()=>{
		let resp=await tp;
		console.log(resp);
		sendResponse(resp);
	})();
	return true;
});