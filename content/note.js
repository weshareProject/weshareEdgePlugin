
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
			let num=Object.keys(NoteList).length;
			let urlObj={url:window.location.href,title:document.title,num:num};
			console.log(urlObj);
			await chrome.runtime.sendMessage({op:"saveNote",urlObj:urlObj,notes:JSON.stringify(NoteList)});
			
		}else if(storageOption==STORAGE_OPTION.CLOUD){
			//由于云存储转移到background,此处不进行操作了
			saveNote(STORAGE_OPTION.LOCAL);
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
			//由于云存储转移到background,此处不进行操作了
			loadNote(STORAGE_OPTION.LOCAL);
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
		
		let content="weshareNote";
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
	
	//笔记的div
	let NoteParentDiv=null;//最外层的div
	let HiddenDiv=[];//可以隐藏的div
	
	
	//----拖拽功能begin----
	//拖拽参数
	let xfix=0;
	let yfix=0;
	//拖拽开始
	function dragNoteStart() {
		let tg=NoteParentDiv;
		if(tg.dataset.draggable=="true"){
			xfix = event.pageX - tg.offsetLeft;
			yfix = event.pageY - tg.offsetTop;
		}
	}
	//拖拽结束
	function dragNoteEnd() {
		let tg=NoteParentDiv;
		
		if(tg.dataset.draggable=="true"){
			tg.style.left = event.pageX - xfix + "px";
			tg.style.top = event.pageY - yfix + "px";
			
			let top_=tg.style.top;
			let left=tg.style.left;
			let sta=NOTE_STATUS.CHANGED;
		
			noteObj['position']['top']=top_;
			noteObj['position']['left']=left;
			noteObj['status']=sta;
		
			NoteManager.save();
		}
	}
	//增加拖拽功能
	function addDragFunc(ele){
		ele.dataset.draggable="true";
		ele.setAttribute("draggable","true");
		ele.addEventListener("dragstart",dragNoteStart);
		ele.addEventListener("dragend",dragNoteEnd);
	}
	//----拖拽功能end----
	
	
	
	
	//----编辑保存功能begin----
	//存储原本的内容
	let preInner="";
	//获取原本存储的内容
	function getPreInner(event){
		let tg=event.target;
		preInner=tg.innerHTML;
	}
	//内容改变自动保存功能
	function changeNote(event){
		let tg=event.target;
		let newInner=tg.innerHTML;
		if(newInner!=preInner){
			//如果和之前的内容不一样则保存
			let sta=NOTE_STATUS.CHANGED;
			noteObj['status']=sta;
			noteObj["content"]=tg.innerHTML;
			NoteManager.save();
		}
	}
	//为元素添加编辑保存功能
	function addEditFunc(ele){
		ele.setAttribute("contenteditable","true");
		ele.onblur=changeNote;
		ele.onfocus=getPreInner;
	}
	//----编辑保存功能end----
	
	
	
	//----删除功能begin----
	//删除笔记功能
	function deleteNote(event){
		let sta=NOTE_STATUS.DELETE;
		noteObj['status']=sta;
		
		//TODO:同步需要移除下面这行
		NoteManager.deleteNote(noteObj);
		
		NoteManager.save();
		document.body.removeChild(NoteParentDiv);
	}
	function addDeleteFunc(ele){
		ele.ondblclick=deleteNote;
	}
	//----删除功能end----
	
	
	
	//----隐藏/显示功能begin----
	//可视状态
	let visibleStatue=true;
	//显示
	function show(){
		for(let i in HiddenDiv){
			HiddenDiv[i].style.display="var(--basedisplay)";
		}
		visibleStatue=true;
	}
	//隐藏
	function hid(){
		for(let i in HiddenDiv){
			HiddenDiv[i].style.display="none";
		}
		visibleStatue=false;
	}
	//改变可视状态
	function changeVisible(){
		if(visibleStatue==true){
			hid();
		}else{
			show();
		}
	}
	//为元素增加改变可视状态功能
	function addChangeVisibleFunc(ele){
		ele.onclick=()=>{
			changeVisible();
		};
	}
	//----隐藏/显示功能end----
	
	
	
	//创建相关div
	function createNoteDiv(){
		//最外层父div创建
		NoteParentDiv=document.createElement("div");
		NoteParentDiv.classList.add('weshareNoteParentDiv');
		NOTE_OPTION.setElement(NoteParentDiv);
		NoteParentDiv.style.top=noteObj["position"]["top"];
		NoteParentDiv.style.left=noteObj["position"]["left"];
		NoteParentDiv.dataset.permission=noteObj["permission"];
		NoteParentDiv.dataset.ownerId=noteObj["ownerId"];
		NoteParentDiv.dataset.ownerName=noteObj["ownerName"];
		addDragFunc(NoteParentDiv);//添加拖拽功能
		
		
		//内部主题创建
		let NoteBody=document.createElement("div");
		NoteBody.classList.add('weshareNoteBody');
		NoteBody.innerHTML=noteObj["content"];
		addEditFunc(NoteBody);//添加编辑功能
		HiddenDiv.push(NoteBody);
		
		//隐藏/展开图标
		let hidBtn=document.createElement('div');
		hidBtn.classList.add('weshareNoteIcon');
		hidBtn.innerHTML="💬";
		addChangeVisibleFunc(hidBtn);
		
		
		//删除图标
		let delBtn=document.createElement('div');
		delBtn.classList.add('weshareNoteIcon');
		delBtn.innerHTML="🗑️";
		addDeleteFunc(delBtn);
		HiddenDiv.push(delBtn);
		
		//放入父div中
		NoteParentDiv.appendChild(hidBtn);
		NoteParentDiv.appendChild(delBtn);
		NoteParentDiv.appendChild(NoteBody);
		
		//父div放入body中
		document.body.appendChild(NoteParentDiv);
	}
	
	
	return {
		createNoteDiv:createNoteDiv,
		changeVisible:changeVisible,
		show:show,
		hid:hid
	}
}


//笔记设置读取
let NOTE_OPTION=(()=>{
	
	//设置存储
	const OPTION_STORAGE=chrome.storage.sync;
	
	//css设置对象的键
	const CSS_OPTION_KEYS=["fontsize","iconsize","bordercolor","bgcolor","fontcolor"];
	
	//css设置对象
	let css_options={};
	
	//根据css设置对象为特定元素设置style
	function setElement(elem){
		let sty="";
		for(let i in css_options){
			sty+="--"+i+":";
			sty+=css_options[i]+";";
		}
		elem.style=sty;
	}

	//初始化
	async function init(){
		for(let i=0;i<CSS_OPTION_KEYS.length;i++){
			let nkey=CSS_OPTION_KEYS[i];
			let rd=await OPTION_STORAGE.get(nkey);
			if(rd[nkey]){
				css_options[nkey]=rd[nkey];
			}
		}
	}
	init();
	
	return { 
		CSS_OPTIONS:css_options,
		setElement:setElement
	}
})();