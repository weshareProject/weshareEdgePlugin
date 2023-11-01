
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
	//{网站url:{url:网页url,title:网页title,num:笔记条数,cloud:是否云同步}，...}
	let NoteWebUrl={};
	
	//云同步常量
	const CLOUD={
		SAVED:0,//已经云同步保存
		CHANGED:1//有变更尚未云同步
	}
	
	//存储api
	let Storage=chrome.storage.local;
	
	//初始化
	async function init(){
		let tp=await Storage.get("weshareNoteWebUrl");
		if(tp['weshareNoteWebUrl'])NoteWebUrl=JSON.parse(tp['weshareNoteWebUrl']);
		console.log(NoteWebUrl);
	}
	
	//保存NoteWebUrl表
	async function saveNoteWebUrl(){
		console.log(NoteWebUrl);
		await Storage.set({"weshareNoteWebUrl":JSON.stringify(NoteWebUrl)});
	}
	
	//保存指定url的笔记
	async function saveNote(urlObj,notes){
		console.log(urlObj);
		let tpnote=JSON.parse(notes);
		let num=urlObj.num;
		let url=urlObj.url;
		let title=urlObj.title;
		NoteWebUrl[url]={url:url,title:title,num:num,cloud:CLOUD.CHANGED};
		if(num<=0){
			delete NoteWebUrl[url];
			//TODO 同步时需要标记移除,同步后再delete
		}
		saveNoteWebUrl();
		
		let saveObj={};
		saveObj["weshareNote-"+url]=notes;
		await Storage.set(saveObj);
		if(num<=0){
			let ky='weshareNote-'+url;
			Storage.remove(ky);
		}
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
	
	//获取NoteWebUrl
	function getNoteWebUrl(){
		return JSON.stringify(NoteWebUrl);
	}
	
	return {
		init:init,
		saveNote:saveNote,
		loadNote:loadNote,
		getNoteWebUrl:getNoteWebUrl
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
		let urlObj=message.urlObj;
		let notes=message.notes;
		if(urlObj && notes){
			AllNoteManager.saveNote(urlObj,notes);
			tp="save finish";
		}
	}else if(message.op=="getNoteWebUrl"){
		tp=AllNoteManager.getNoteWebUrl();
	}
	
	(async()=>{
		let resp=await tp;
		console.log(resp);
		sendResponse(resp);
	})();
	return true;
});