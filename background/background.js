
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
	//{网站url:{url:网页url,title:网页title,num:笔记条数}，...}
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
		//console.log(NoteWebUrl);
		await Storage.set({"weshareNoteWebUrl":JSON.stringify(NoteWebUrl)});
	}
	
	//返回指定url的笔记
	async function loadNote(url){
		let res='{}';
		if(NoteWebUrl[url]){
			let ky='weshareNote-'+url;
			let tp=await Storage.get(ky);
			if(tp[ky])res=tp[ky];
		}
		//console.log(res);
		return res;
	}
	
	//保存指定url的笔记
	async function saveNote(urlObj,notes){
		//console.log(urlObj);
		let num=urlObj.num;
		let url=urlObj.url;
		let title=urlObj.title;
		NoteWebUrl[url]={url:url,title:title,num:num};
		if(num<=0){
			delete NoteWebUrl[url];
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
	
	
	//增加笔记
	async function newNote(noteObj){
		
		let uid=noteObj.uid;
		let url=noteObj.url;
		let webtitle=noteObj.webtitle;
		
		if(!uid||!url)return;
		
		let urlObj=NoteWebUrl[url];
		let notes="{}";
		if(urlObj){
			urlObj.num++;
			let tp=await loadNote(url);
			if(tp){
				tp=JSON.parse(tp);
			}else{
				tp={};
			}
			tp[uid]=noteObj;
			notes=JSON.stringify(tp);
		}else{
			let otp={};
			otp[uid]=noteObj;
			notes=JSON.stringify(otp);
			urlObj={url:url,title:webtitle,num:1};
		}
		await saveNote(urlObj,notes);
		await saveNoteWebUrl();
	}
	
	//修改笔记
	async function setNote(noteObj){
		let uid=noteObj.uid;
		let url=noteObj.url;
		let webtitle=noteObj.webtitle;
		
		if(!uid||!url)return;
		let urlObj=NoteWebUrl[url];
		let notes="{}";
		if(urlObj){
			//读取网页笔记存储
			let tp=await loadNote(url);
			if(tp){
				tp=JSON.parse(tp);
			}else{
				tp={};
			}
			//如果有笔记记录则修改,没有则新增
			if(tp[uid]){
				tp[uid]=noteObj;
			}else{
				newNote(noteObj);
				return;
			}
			notes=JSON.stringify(tp);
		}else{
			newNote(noteObj);
			return;
		}
		
		await saveNote(urlObj,notes);
		await saveNoteWebUrl();
	}
	
	//删除笔记
	async function removeNote(noteObj){
		let uid=noteObj.uid;
		let url=noteObj.url;
		let webtitle=noteObj.webtitle;
		
		if(!uid||!url)return;
		let urlObj=NoteWebUrl[url];
		let notes="{}";
		if(urlObj){
			//读取网页笔记存储
			let tp=await loadNote(url);
			if(tp){
				tp=JSON.parse(tp);
			}else{
				tp={};
			}
			
			if(tp[uid]){
				urlObj.num--;
				delete tp[uid];
			}else{
				//没记录,直接return
				return;
			}
			notes=JSON.stringify(tp);
		}else{
			//没记录,直接return
			return;
		}
		
		await saveNote(urlObj,notes);
		await saveNoteWebUrl();
	}
	
	//获取NoteWebUrl
	function getNoteWebUrl(){
		return JSON.stringify(NoteWebUrl);
	}
	
	return {
		init:init,
		loadNote:loadNote,
		newNote:newNote,
		setNote:setNote,
		removeNote:removeNote,
		addNote:newNote,//等同new
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


//云服务管理
let CloudServerManager=(()=>{
	
	//等待上传的笔记
	let waitUploadNotes={};
	
	//用户信息
	let user={userId:"000000",userName:"me",pass:"password"};
	
	//存储api
	const Storage=chrome.storage.local;
	
	
	//后端接口url
	const BACKEND_INTERFACE={
		LOGIN:"",
		UPATE_NOTE:""
	};
	
	
	//登录
	async function login(){
		//TODO
	}
	
	//获取用户信息
	function getUserInfo(){
		return user;
	}
	
	
	//上传笔记 
	async function uploadNote(){
		//TODO
	}
	
	
	//笔记状态
	const NOTE_STATUS={
		NEW:1,//新增
		MOD:2,//修改 
		DEL:3//删除
	}
	
	//深拷贝object
	function clone(obj){
		return {...obj};
	}
	
	
	//增
	function newNote(noteObj){
		let uid=noteObj.uid;
		let ntObj=clone(noteObj);
		ntObj["status"]=NOTE_STATUS.NEW;
		if(waitUploadNotes[uid] && waitUploadNotes[uid]["status"]==NOTE_STATUS.DEL){
			if(waitUploadNotes[uid]["prestatus"]){
				ntObj["status"]=waitUploadNotes[uid]["prestatus"];//还原的笔记,状态也还原 
			}
			//若没有记录前一个状态,代表前一个状态时笔记已经被upload过了,那么还原就是新增
		}
		waitUploadNotes[uid]=ntObj;
		saveWaitUploadNotes();
	}
	
	//改
	function setNote(noteObj){
		let uid=noteObj.uid;
		let ntObj=clone(noteObj);
		ntObj["status"]=NOTE_STATUS.MOD;
		if(waitUploadNotes[uid] && waitUploadNotes[uid]["status"]==NOTE_STATUS.NEW){
			ntObj["status"]=NOTE_STATUS.NEW;//新增的笔记,状态依然记录新增
		}
		waitUploadNotes[uid]=ntObj;
		saveWaitUploadNotes();
	}
	
	//删
	function removeNote(noteObj){
		let uid=noteObj.uid;
		let ntObj=clone(noteObj);
		if(waitUploadNotes[uid]){
			ntObj["prestatus"]=waitUploadNotes[uid]["status"];//记录删除之前的状态,还原笔记时会使用
		}
		ntObj["status"]=NOTE_STATUS.DEL;
		waitUploadNotes[uid]=ntObj;
		saveWaitUploadNotes();
	}
	
	//载入所有waitUploadNotes
	async function loadWaitUploadNotes(){
		let tp=Storage.get("waitUploadNotes");
		if(tp["waitUploadNotes"])waitUploadNotes=JSON.parse(tp["waitUploadNotes"]);
	}
	
	
	//保存所有waitUploadNotes
	async function saveWaitUploadNotes(){
		console.log(waitUploadNotes);
		await Storage.set({"waitUploadNotes":JSON.stringify(waitUploadNotes)});
	}
	
	//初始化
	async function init(){
		loadWaitUploadNotes();
	}
	
	
	return {
		init:init,
		login:login,
		newNote:newNote,
		setNote:setNote,
		removeNote:removeNote,
		addNote:newNote,//等同new
		uploadNote:uploadNote,
		getUserInfo:getUserInfo
	}
	
})();
CloudServerManager.init();


//与background交互的操作码
const OPERATION_CODE={
	//操作码固定3位
	//100为无操作
	NO_ACTION:100,
	
	//1xx为笔记相关
	LOAD_NOTE:101,
	NEW_NOTE:102,
	SET_NOTE:103,
	REMOVE_NOTE:104,
	
	//7xx为设置页面相关功能
	GET_NOTE_WEB_URL:701,
	
	//8xx为回收站相关
	GET_RECYCLE_BIN:801,
	RECYCLE_NOTE:802,
	CLEAR_RECYCLE_NOTE:803
	
};


//操作消息接收
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
	let tp="noaction";
	if(message.op==OPERATION_CODE.LOAD_NOTE){
		//载入指定url笔记
		let url=message.url;
		if(url){
			tp=AllNoteManager.loadNote(url);
		}
	}else if(message.op==OPERATION_CODE.NEW_NOTE){
		//新建笔记
		let noteObj=message.noteObj;
		if(noteObj){
			AllNoteManager.newNote(noteObj);
			CloudServerManager.newNote(noteObj);
		}
	}else if(message.op==OPERATION_CODE.SET_NOTE){
		//修改笔记
		let noteObj=message.noteObj;
		if(noteObj){
			AllNoteManager.setNote(noteObj);
			CloudServerManager.setNote(noteObj);
		}
	}else if(message.op==OPERATION_CODE.REMOVE_NOTE){
		//移除笔记
		let noteObj=message.noteObj;
		if(noteObj){
			AllNoteManager.removeNote(noteObj);
			NoteRecycleBin.addNote(noteObj);
			CloudServerManager.removeNote(noteObj);
		}
	}else if(message.op==OPERATION_CODE.GET_NOTE_WEB_URL){
		//获取所有网页的note信息
		tp=AllNoteManager.getNoteWebUrl();
	}else if(message.op==OPERATION_CODE.GET_RECYCLE_BIN){
		//获取回收站内note
		tp=NoteRecycleBin.getRecycleBin();
	}else if(message.op==OPERATION_CODE.RECYCLE_NOTE){
		//还原note
		let noteObj=message.noteObj;
		if(noteObj){
			NoteRecycleBin.removeNote(noteObj);
			AllNoteManager.addNote(noteObj);
			CloudServerManager.addNote(noteObj);
		}
	}else if(message.op==OPERATION_CODE.CLEAR_RECYCLE_NOTE){
		//清空回收站
		let tp=NoteRecycleBin.clearRecycleBin();
	}
	
	(async()=>{
		let resp=await tp;
		//console.log(resp);
		sendResponse(resp);
	})();
	return true;
});

