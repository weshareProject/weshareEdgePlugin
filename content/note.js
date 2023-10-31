
//笔记状态常量
const NOTE_STATUS={
	SAVED:0,//存储完成无变化的笔记
	NEW:1,//新建的笔记
	CHANGED:2,//有修改的笔记
	DELETE:3//删除的笔记
}


//NoteManager负责所有Note的载入和管理
let NoteManager=(()=>{
	//记录所有note
	let NoteList={};
	/*
	单个笔记基本格式:	uid:{"uid":uid,"content":内容,position位置:{top:top坐标,left:left坐标,type:类型},"permission":private/public,"ownerId":创建者，"ownerName":创建者昵称,status:状态};
	*/
	
	//存储设置常量
	const STORAGE_OPTION={
		LOCAL:0,
		CLOUD:1,
		AUTO:2
	};
	
	//初始化
	async function init(){
		document.body.setAttribute("ondragover", "event.preventDefault()");
		await loadNote();
	}
	
	//生成uid
	function createUID(){
		return Date.now();
	}
	
	//保存数据
	async function saveNote(storageOption=STORAGE_OPTION.AUTO){
		if(storageOption==STORAGE_OPTION.LOCAL){
			console.log(NoteList);
			await chrome.runtime.sendMessage({op:"saveNote",url:window.location.href,notes:JSON.stringify(NoteList)});
			
		}else if(storageOption==STORAGE_OPTION.CLOUD){
			//TODO
		}else{
			saveNote(STORAGE_OPTION.LOCAL);
		}
	}
	
	//载入数据
	async function loadNote(storageOption=STORAGE_OPTION.AUTO){
		if(storageOption==STORAGE_OPTION.LOCAL){
			let nt=await chrome.runtime.sendMessage({op:"loadNote",url:window.location.href});
			console.log(nt);
			if(nt)NoteList=JSON.parse(nt);
		
			console.log(NoteList);
			for(let it in NoteList){
				if(NoteList[it]['status']==NOTE_STATUS.DELETE){
					continue;
				}
				NoteFactory(NoteList[it]).createNoteDiv();
			}
		}else if(storageOption==STORAGE_OPTION.CLOUD){
			//TODO
		}else{
			loadNote(STORAGE_OPTION.LOCAL);
		}
	}
	
	//设置note
	function setNote(noteObj){
		let uid=noteObj[uid];
		if(uid)NoteList[uid]=noteObj;
	}
	
	//删除note
	function deleteNote(noteObj){
		let uid=noteObj["uid"];
		if(NoteList[uid]){
			delete NoteList[uid];
		}
	}
	

	//新建note
	function newNote(po={x:100,y:100}){
		let uid=createUID();
		let sta=NOTE_STATUS.NEW;
		const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
		const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
		
		//检验是否在页面范围内
		if(po.x<=0||po.y<=0){
			po.x=100;
			po.y=100;
		}
		
		let content="text here";
		let top_=Number(scrollTop)+Number(po.y)+"px";
		let left=Number(scrollLeft)+Number(po.x)+"px";
		let noteojb={"uid":uid,"content":content,"position":{"top":top_,"left":left},"permission":"private","ownerId":"000000000000","ownerName":"me","status":sta};
		NoteList[uid]=noteojb;
		NoteManager.save();
		
		NoteFactory(NoteList[uid]).createNoteDiv();
		
	}
	
	
	return {
		init:init,
		save:saveNote,
		load:loadNote,
		setNote:setNote,
		deleteNote:deleteNote,
		newNote:newNote
	}
	
})();

NoteManager.init();


//NoteFactory用于创建单个Note相关的DIV并维护
function NoteFactory(noteObj){
	
	
	//----拖拽功能begin----
	//拖拽参数
	let xfix=0;
	let yfix=0;
	//拖拽开始
	function dragNoteStart(event) {
		let tg=event.target;
		if(tg.dataset.draggable=="true"){
			xfix = event.pageX - tg.offsetLeft;
			yfix = event.pageY - tg.offsetTop;
		}
	}
	//拖拽结束
	function dragNoteEnd(event) {
		let tg=event.target;
		
		if(tg.dataset.draggable=="true"){
			tg.style.left = event.pageX - xfix + "px";
			tg.style.top = event.pageY - yfix + "px";
		}
		
		let top_=tg.style.top;
		let left=tg.style.left;
		let sta=NOTE_STATUS.CHANGED;
		
		noteObj['position']['top']=top_;
		noteObj['position']['left']=left;
		noteObj['status']=sta;
		
		//NoteManager.setNote(noteObj);
		NoteManager.save();
		
	}
	//增加拖拽功能
	function addDragFunc(ele){
		ele.addEventListener("dragstart",dragNoteStart);
		ele.addEventListener("dragend",dragNoteEnd);
	}
	//----拖拽功能end----
	
	
	//删除笔记功能
	function deleteNote(event){
		let tg=event.target;
		
		let sta=NOTE_STATUS.DELETE;
		noteObj['status']=sta;
		
		//TODO:同步需要移除此行
		NoteManager.deleteNote(noteObj);
		
		NoteManager.save();
		
		document.body.removeChild(tg);
	}
	//内容改变自动保存功能
	function changeNote(event){
		let tg=event.target;
		let sta=NOTE_STATUS.CHANGED;
		noteObj['status']=sta;
		noteObj["content"]=tg.innerHTML;
		
		NoteManager.save();
	}
	//为笔记增加功能
	function addFunc(ele){
		addDragFunc(ele);
		ele.oncontextmenu=(event)=>{
			event.target.onblur=null;
			deleteNote(event);
			return false;
		};
		//ele.addEventListener("blur",Note.changeNote);
		ele.onblur=changeNote;
	}
	
	//创建相关div
	function createNoteDiv(){
		let dv=document.createElement("div");
		
		dv.innerHTML=noteObj["content"];
		dv.style.top=noteObj["position"]["top"];
		dv.style.left=noteObj["position"]["left"];
		
		dv.dataset.permission=noteObj["permission"];
		dv.dataset.ownerId=noteObj["ownerId"];
		dv.dataset.ownerName=noteObj["ownerName"];
		
		dv.classList.add("weshareNote");
		dv.setAttribute("contenteditable","true");
		dv.setAttribute("draggable","true");
		dv.dataset.draggable=true;
		addFunc(dv);
		document.body.appendChild(dv);
	}
	
	
	return {
		createNoteDiv:createNoteDiv
	}
}
