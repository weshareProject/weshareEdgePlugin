
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
	
	
	
	//笔记状态常量
	const NOTE_STATUS={
		SAVED:0,//存储完成无变化的笔记
		NEW:1,//新建的笔记
		CHANGED:2,//有修改的笔记
		DELETE:3//删除的笔记
	}
	
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
	
	
	//增加笔记
	async function addNote(noteObj){
		noteObj["status"]=NOTE_STATUS.CHANGED;
		let uid=noteObj.uid;
		let url=noteObj.url;
		let webtitle=noteObj.webtitle;
		let urlObj=NoteWebUrl[url];
		let notes="{}";
		if(urlObj){
			urlObj.num++;
			let ky='weshareNote-'+url;
			let tp=await Storage.get(ky);
			if(tp[ky]){
				tp=JSON.parse(tp[ky]);
				tp[uid]=noteObj;
			}else{
				tp={};
				tp[uid]=noteObj;
			}
			notes=JSON.stringify(tp);
		}else{
			let otp={};
			otp[uid]=noteObj;
			notes=JSON.stringify(otp);
			urlObj={url:url,title:webtitle,num:1,cloud:CLOUD.CHANGED};
		}
		await saveNote(urlObj,notes);
		await saveNoteWebUrl();
	}
	
	return {
		init:init,
		saveNote:saveNote,
		loadNote:loadNote,
		addNote:addNote,
		getNoteWebUrl:getNoteWebUrl
	}
})();
AllNoteManager.init();

//笔记回收站
let NoteRecycleBin=(()=>{
	//存储api
	let Storage=chrome.storage.local;
	
	//回收站
	let recycleBin={};
	
	//读取数据 
	async function init(){
		let tp=await Storage.get("weshareNoteRecycleBin");
		if(tp["weshareNoteRecycleBin"]){
			recycleBin=JSON.parse(tp["weshareNoteRecycleBin"]);
		}
	};
	
	//保存
	async function save(){
		let sav=JSON.stringify(recycleBin);
		await Storage.set({"weshareNoteRecycleBin":sav});
	}
	
	//增加笔记
	function addNote(noteObj){
		let uid=noteObj.uid;
		recycleBin[uid]=noteObj;
		save();
	}
	
	//删除笔记
	function removeNote(noteObj){
		let uid=noteObj.uid;
		if(recycleBin[uid]){
			delete recycleBin[uid];
		}
		save();
	}
	
	//返回回收站内笔记
	function getRecycleBin(){
		return JSON.stringify(recycleBin);
	}
	
	//清空回收站
	function clearRecycleBin(){
		recycleBin={};
		save();
	}
	
	return {
		init:init,
		save:save,
		addNote:addNote,
		removeNote:removeNote,
		getRecycleBin:getRecycleBin,
		clearRecycleBin:clearRecycleBin
	}
})();
NoteRecycleBin.init();



//操作消息接收
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
	}else if(message.op=="deleteNote"){
		let noteObj=message.noteObj;
		if(noteObj)NoteRecycleBin.addNote(noteObj);
	}else if(message.op=="getRecycleBin"){
		tp=NoteRecycleBin.getRecycleBin();
	}else if(message.op=="recycleNote"){
		let noteObj=message.noteObj;
		if(noteObj){
			NoteRecycleBin.removeNote(noteObj);
			AllNoteManager.addNote(noteObj);
		}
	}else if(message.op=="clearRecycleBin"){
		let tp=NoteRecycleBin.clearRecycleBin();
	}
	
	(async()=>{
		let resp=await tp;
		console.log(resp);
		sendResponse(resp);
	})();
	return true;
});