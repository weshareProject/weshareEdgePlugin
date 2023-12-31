
//右键菜单添加
chrome.runtime.onInstalled.addListener(()=>{
	chrome.contextMenus.create({
		title:"添加笔记",
		contexts:["page"],
		id:"weshareAddnote"
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
		return JSON.parse(res);
	}
	
	//保存指定url的笔记
	async function saveNote(urlObj,notes){
		//console.log(urlObj);
		console.log(notes);
		let num=urlObj.num;
		//num=Object.keys(notes).length;
		let url=urlObj.url;
		let title=urlObj.title;
		NoteWebUrl[url]={url:url,title:title,num:num};
		if(num<=0){
			delete NoteWebUrl[url];
		}
		saveNoteWebUrl();
		
		let saveObj={};
		saveObj["weshareNote-"+url]=JSON.stringify(notes);
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
		let notes={};
		if(urlObj){
			urlObj.num++;
			let tp=await loadNote(url);
			tp[uid]=noteObj;
			notes=tp;
		}else{
			let otp={};
			otp[uid]=noteObj;
			notes=otp;
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
		let notes={};
		if(urlObj){
			//读取网页笔记存储
			let tp=await loadNote(url);
			//如果有笔记记录则修改,没有则新增
			if(tp[uid]){
				tp[uid]=noteObj;
			}else{
				newNote(noteObj);
				return;
			}
			notes=tp;
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
		let notes={};
		if(urlObj){
			//读取网页笔记存储
			let tp=await loadNote(url);
			if(tp[uid]){
				urlObj.num--;
				delete tp[uid];
			}else{
				//没记录,直接return
				return;
			}
			notes=tp;
		}else{
			//没记录,直接return
			return;
		}
		
		await saveNote(urlObj,notes);
		await saveNoteWebUrl();
	}
	
	//获取NoteWebUrl
	function getNoteWebUrl(){
		return NoteWebUrl;
	}
	
	//清除存储笔记
	async function clearAll(){
		NoteWebUrl={};
		console.log('clear all notes');
		await saveNoteWebUrl();
	}
	
	return {
		init:init,
		loadNote:loadNote,
		newNote:newNote,
		setNote:setNote,
		removeNote:removeNote,
		addNote:newNote,//等同new
		getNoteWebUrl:getNoteWebUrl,
		clearAll:clearAll
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
	
	//存储api
	const Storage=chrome.storage.local;
	
	
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
	async function newNote(noteObj){
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
		await saveWaitUploadNotes();
		checkupload();
	}
	
	//改
	async function setNote(noteObj){
		let uid=noteObj.uid;
		let ntObj=clone(noteObj);
		ntObj["status"]=NOTE_STATUS.MOD;
		if(waitUploadNotes[uid] && waitUploadNotes[uid]["status"]==NOTE_STATUS.NEW){
			ntObj["status"]=NOTE_STATUS.NEW;//新增的笔记,状态依然记录新增
		}
		waitUploadNotes[uid]=ntObj;
		await saveWaitUploadNotes();
		checkupload();
	}
	
	//删
	async function removeNote(noteObj){
		let uid=noteObj.uid;
		let ntObj=clone(noteObj);
		if(waitUploadNotes[uid]){
			ntObj["prestatus"]=waitUploadNotes[uid]["status"];//记录删除之前的状态,还原笔记时会使用
		}
		ntObj["status"]=NOTE_STATUS.DEL;
		waitUploadNotes[uid]=ntObj;
		await saveWaitUploadNotes();
		checkupload();
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
	
	//用户信息
	//{userName:用户名,pass:密码,token:token，expirationTime:token过期时间点}
	let user={userName:null,pass:null,token:null,expirationTime:null};
	
	
	//fetch
	async function easyFetch(url,{method="GET",headers={"Content-Type": "application/json"},content={}}){
		let ret={ok:false,code:0,data:{},message:"unknow error"};
		try{
			let fetchObj={
				method:method,
				headers:headers,
			};
			if(method!='GET'){
				fetchObj.body=JSON.stringify(content);
			}
			let resp=await fetch(url,fetchObj);
			let response=await resp.json();
		
			if(resp.ok){
				ret.code=response.code;
				ret.data=response.data;
				ret.message=response.message;
			}else{
				throw new Error({code:resp.status,data:resp.statusText,message:resp.statusText});
			}
			
		}catch(error){
			if(error.code){
				ret=error;
			}else{
				ret.code=400;
				ret.message="fetch failed";
				ret.data=error;
			}
		}
		
		if(ret.code>=200&&ret.code<300){
			ret.ok=true;
		}else{
			ret.ok=false;
		}
		
		console.log(ret);
		
		return ret;
	}
		
	//后端API
	const BACKEND_API=(()=>{
		//后端url
		const backendURL="http://127.0.0.1:8080";
		
		//登录
		let LOGIN=backendURL+"/user/login";
		//注销
		let LOGOUT=backendURL+"/user/logout";
		//上传笔记
		let UPLOAD_NOTE=backendURL+"/note/s";
		//下载用户笔记
		let DOWNLOAD_NOTE=backendURL+"/note/user";
		
		//获取公开笔记
		let GET_PUBLIC_NOTE=backendURL+"/note/t";
		
		//点赞笔记
		let LIKE_NOTE=backendURL+"/note/";
		
		return {
			LOGIN:LOGIN,
			LOGOUT:LOGOUT,
			UPLOAD_NOTE:UPLOAD_NOTE,
			DOWNLOAD_NOTE:DOWNLOAD_NOTE,
			GET_PUBLIC_NOTE:GET_PUBLIC_NOTE,
			LIKE_NOTE:LIKE_NOTE
		};
	})();
	
	
	//登录
	async function login(usr=user){
		if(!usr || !usr.pass || !usr.userName){
			return "<span style='color:red'>请输入用户名或密码</span>";
		}
		let ret="login";
		
		let fetchObj={
				method:"POST",
				content:{"username":usr.userName,"password":usr.pass}
			};
		
		let response=await easyFetch(BACKEND_API.LOGIN,fetchObj);
		if(response.ok){
			user.pass=usr.pass;
			user.userName=usr.userName;
			user.token=response.data.tokenHead+" "+response.data.token;
			user.expirationTime=Date.now()+5*60*1000;//TODO:后台返回生存时间
			let sav={};
			sav["weshareUser"]=JSON.stringify(user);
			Storage.set(sav);
			let dlret=await downloadNote();
			ret+="<br>"+dlret;
		}else{
			user.pass=null;
			user.userName=null;
			user.token=null;
			user.expirationTime=null;
			ret=response.message;
		}
		
		return ret;
	}
	
	//注销
	async function logout(){
		let ret="logout";
		let fetchObj={	
				method:"POST",
				headers:{
					"Content-Type": "application/json",
					"Authorization":user.token
				}
			};
		
		//进行上传
		ret=await uploadNote();
		
		let response=await easyFetch(BACKEND_API.LOGOUT,fetchObj);
		user.pass=null;
		user.userName=null;
		user.token=null;
		user.expirationTime=null;
		if(response.ok){
			ret+="<br>"+"logout";
			AllNoteManager.clearAll();
		}else{
			ret+="<br>"+response.message;
		}
		
		let sav={};
		sav["weshareUser"]=JSON.stringify(user);
		Storage.set(sav);

		return ret;
	}
	
	//检查token，若过期则重新登录
	async function checkToken(){
		if(user.token && user.expirationTime){
			let ntime=Date.now();
			if(ntime>user.expirationTime){
				await login();
			}
		}
	}
	
	//获取用户信息
	async function getUserInfo(){
		await checkToken();
		return user;
	}
	
	//上传检测
	async function checkupload(){
		if(user.token){
			let lastupload=await Storage.get('lastuploadtime');
			if(!lastupload)lastupload=0;
			let nowtime=Date.now();
			if((nowtime-lastupload)>6000){
				uploadNote();
				Storage.set({'lastuploadtime':nowtime});
			}
		}
	}
	
	//上传笔记 
	async function uploadNote(){
		let ret="uploadNote failed";
		await checkToken();
		if(!user.token){
			return ret+":no token";
		}
		let newnotes=[];
		let modnotes=[];
		let delnotes=[];
		
		for(let i in waitUploadNotes){
			let handleNote=waitUploadNotes[i];
			//console.log(handleNote);
			if(handleNote['status']==NOTE_STATUS.DEL){
				delnotes.push(i);
			}else{
				if(!handleNote.isPublic){
					handleNote.isPublic=0;
				}
				let uploadObj={
					"content": handleNote.content,
					"createTime":handleNote.createtime,
					"tempId": handleNote.uid,
					"isPublic":handleNote.isPublic,
					"url":handleNote.url,
					"position":JSON.stringify(handleNote.position)
				};
				
				if(handleNote['status']==NOTE_STATUS.NEW){
					newnotes.push(uploadObj);
				}else if(handleNote['status']==NOTE_STATUS.MOD){
					modnotes.push(uploadObj);
				}	
			}
		}
		
		console.log(newnotes);
		console.log(modnotes);
		console.log(delnotes);
		
		let newresponse={ok:false};
		let modresponse={ok:false};
		let delresponse={ok:false};
		let fetchObj={
			headers:{
				"Content-Type": "application/json",
				"Authorization":user.token
			}
		};
		ret="";
		//上传新建笔记
		if(newnotes.length>0){
			fetchObj.method="POST";
			fetchObj.content=newnotes;
			newresponse=await easyFetch(BACKEND_API.UPLOAD_NOTE,fetchObj);
			
			if(newresponse.ok){
				for(let i=0;i<newnotes.length;i++){
					let uid=newnotes[i].tempId;
					delete waitUploadNotes[uid];
				}
				saveWaitUploadNotes();
				console.log('new upload success');
			}
			ret+="NEW:"+newresponse.message+"<br>";
		}
		
		//上传修改笔记
		if(modnotes.length>0){
			fetchObj.method="PUT";
			fetchObj.content=modnotes;
			modresponse=await easyFetch(BACKEND_API.UPLOAD_NOTE,fetchObj); 
			
			if(modresponse.ok){
				for(let i=0;i<modnotes.length;i++){
					let uid=modnotes[i].tempId;
					delete waitUploadNotes[uid];
				}
				saveWaitUploadNotes();
				console.log('mod upload success');
			}
			ret+="MOD:"+modresponse.message+"<br>";
		}
		
		//上传删除笔记
		if(delnotes.length>0){
			fetchObj.method="DELETE";
			fetchObj.content=delnotes;
			delresponse=await easyFetch(BACKEND_API.UPLOAD_NOTE,fetchObj); 
		
			if(delresponse.ok){
				for(let i=0;i<delnotes.length;i++){
					let uid=delnotes[i];
					delete waitUploadNotes[uid];
				}
				saveWaitUploadNotes();
				console.log('del upload success');
			}
			ret+="DEL:"+delresponse.message+"<br>";
		}
		
		if(""==ret){
			ret="Nothing to Upload<br>";
		}
		
		return ret;
	}
	
	//下载笔记 
	async function downloadNote(){
		let ret="downloadNote failed<br>";
		await checkToken();
		
		//TODO
		if(!user.token){
			return ret+':no token';
		}
		
		let fetchObj={
			method:"GET",
			headers:{
				"Content-Type": "application/json",
				"Authorization":user.token
			}
		};
		
		let dlresponse=await easyFetch(BACKEND_API.DOWNLOAD_NOTE,fetchObj);
		if(!dlresponse.ok){
			return ret;
		}
		
		ret="download finished<br>";
		
		let notes=dlresponse.data;
		if(!notes)notes=[];
		console.log(notes);
		AllNoteManager.clearAll();
		for(let i=0;i<notes.length;i++){
			
			notes[i].uid=notes[i].tempId;
			delete notes[i].tempId;
			notes[i].position=JSON.parse(notes[i].position);
			//console.log(notes[i]);
			await AllNoteManager.addNote(notes[i]);
		}
		
		//console.log(notes);
		
		return ret;
	}
	
	//获取指定url界面所有public笔记
	async function getPublicNote(url){
		//TODO
		console.log('getPublicNote');
		let res=[];
		let fetchObj={
			method:"GET",
			headers:{
				"Content-Type": "application/json",
				"Authorization":user.token
			}     
		}; 
		let pnresponse=await easyFetch(BACKEND_API.GET_PUBLIC_NOTE+"?url='"+btoa(url)+"'",fetchObj);
		if(!pnresponse.ok){
			return [];
		}else{
			res=pnresponse.data;
		}
		res.forEach(item=>{
			item.position=JSON.parse(item.position);
			item.uid=item.tempId;
			item.likenum=item.likedNum;
		});
		console.log(res);
		return res;
	}

	//点赞笔记
	async function likeNote(uid){
		console.log('like '+uid);
		let ret="fail to fetch";
		let fetchObj={
			method:"PUT",
			headers:{
				"Content-Type": "application/json",
				"Authorization":user.token
			}     
		}; 
		let response=await easyFetch(BACKEND_API.LIKE_NOTE+uid,fetchObj);
		if(response.ok){
			ret=response.message;
		}

		return ret;
	}

	//初始化
	async function init(){
		await loadWaitUploadNotes();
		
		let tp=await Storage.get("weshareUser");
		if(tp["weshareUser"])user=JSON.parse(tp["weshareUser"]);
		await checkToken();
	}
	
	
	return {
		init:init,
		login:login,
		logout:logout,
		newNote:newNote,
		setNote:setNote,
		removeNote:removeNote,
		addNote:newNote,//等同new
		uploadNote:uploadNote,
		downloadNote:downloadNote,
		getUserInfo:getUserInfo,
		getPublicNote:getPublicNote,
		likeNote:likeNote
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
	CLEAR_RECYCLE_NOTE:803,
	
	//9xx为云服务相关
	LOGIN:901,
	LOGOUT:902,
	CLOUD_UPLOAD:903,
	CLOUD_DOWNLOAD:904,
	GET_USER_INFO:905,
	
	GET_PUBLIC_NOTE:908,
	MANUAL_CLOUD:909,
	
	LIKE_NOTE:912
	
};

//message接收处理
let MessageHandler=(()=>{
	let handlers={};
	
	//no action
	handlers[OPERATION_CODE.NO_ACTION]=function(message){
		//noaction
		return "noaction";
	};
	
	//载入笔记
	handlers[OPERATION_CODE.LOAD_NOTE]=function(message){
		let url=message.url;
		let tp="load note failed";
		if(url){
			tp=AllNoteManager.loadNote(url);
		}
		return tp;
	};
	
	//新建笔记
	handlers[OPERATION_CODE.NEW_NOTE]=function(message){
		let noteObj=message.noteObj;
		let tp="new note failed"
		if(noteObj){
			AllNoteManager.newNote(noteObj);
			CloudServerManager.newNote(noteObj);
			tp="new note finish";
		}
		return tp;
	};
	
	//修改笔记
	handlers[OPERATION_CODE.SET_NOTE]=function(message){
		let noteObj=message.noteObj;
		let tp="set note failed"
		if(noteObj){
			AllNoteManager.setNote(noteObj);
			CloudServerManager.setNote(noteObj);
			tp="set note finish";
		}
		return tp;
	};
	
	
	//移除笔记
	handlers[OPERATION_CODE.REMOVE_NOTE]=function(message){
		let noteObj=message.noteObj;
		let tp="remove note failed"
		if(noteObj){
			AllNoteManager.removeNote(noteObj);
			NoteRecycleBin.addNote(noteObj);
			CloudServerManager.removeNote(noteObj);
			tp="remove note finish";
		}
		return tp;
	};
	
	//获取所有网页的note信息
	handlers[OPERATION_CODE.GET_NOTE_WEB_URL]=function(message){
		return AllNoteManager.getNoteWebUrl();
	};
	
	//获取回收站内note
	handlers[OPERATION_CODE.GET_RECYCLE_BIN]=function(message){
		return NoteRecycleBin.getRecycleBin();
	};
	
	//还原note
	handlers[OPERATION_CODE.RECYCLE_NOTE]=function(message){
		let noteObj=message.noteObj;
		let tp="recycle note failed";
		if(noteObj){
			NoteRecycleBin.removeNote(noteObj);
			AllNoteManager.addNote(noteObj);
			CloudServerManager.addNote(noteObj);
			tp="recycle note finish";
		}
		return tp;
	};
	
	//清空回收站
	handlers[OPERATION_CODE.CLEAR_RECYCLE_NOTE]=function(message){
		return NoteRecycleBin.clearRecycleBin();
	};
	
	//账户登录
	handlers[OPERATION_CODE.LOGIN]=function(message){
		return CloudServerManager.login(message.user);
	};
	
	//账户注销
	handlers[OPERATION_CODE.LOGOUT]=function(message){
		return CloudServerManager.logout();
	};
	
	//上传笔记
	handlers[OPERATION_CODE.CLOUD_UPLOAD]=function(message){
		return CloudServerManager.uploadNote();
	};
	
	//下载笔记
	handlers[OPERATION_CODE.CLOUD_DOWNLOAD]=function(message){
		return CloudServerManager.downloadNote();
	};
	
	//获取用户信息
	handlers[OPERATION_CODE.GET_USER_INFO]=function(message){
		return CloudServerManager.getUserInfo();
	};
	
	//获取当前页面公开笔记
	handlers[OPERATION_CODE.GET_PUBLIC_NOTE]=function(message){
		let url=message.url;
		return CloudServerManager.getPublicNote(url);
	};
	
	//手动同步
	handlers[OPERATION_CODE.MANUAL_CLOUD]=async function(message){
		let ret="";
		ret+=await CloudServerManager.uploadNote();
		ret+=await CloudServerManager.downloadNote();
		return ret;
	};
	
	//like笔记
	handlers[OPERATION_CODE.LIKE_NOTE]=async function(message){
		let uid=message.uid;
		return CloudServerManager.likeNote(uid);
	}
	
	return handlers;
})();


//操作消息接收
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
	let tp="noaction";
	if(message.op){
		let handler=MessageHandler[message.op];
		if(handler)tp=handler(message);
	}
	
	(async()=>{
		let resp=await tp;
		//if(resp!="noaction")console.log(resp);
		sendResponse(resp);
	})();
	return true;
});



