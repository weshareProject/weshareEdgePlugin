//笔记设置读取
const NOTE_OPTION=(()=>{
	//设置存储
	const OPTION_STORAGE=chrome.storage.sync;
	//css设置对象的键
	const CSS_OPTION_KEYS=["fontsize","iconsize","bordercolor","bgcolor","fontcolor"];
	//css设置对象
	let css_options={};
	//根据css设置对象为特定元素设置style
	function setElement(elem){
		for(let i in css_options){
			let k="--"+i;
			let v=css_options[i];
			elem.style.setProperty(k,v);
		}
	}
	//页面载入时是否展开笔记设置
	let visible_option=["hid"];
	
	//笔记图标
	let icon=["📌"];
	
	
	//初始化
	async function init(){
		//读取css设置
		for(let i=0;i<CSS_OPTION_KEYS.length;i++){
			let nkey=CSS_OPTION_KEYS[i];
			let rd=await OPTION_STORAGE.get(nkey);
			if(rd[nkey]){
				css_options[nkey]=rd[nkey];
			}
		}
		//读取自动展开设置
		let tp=await OPTION_STORAGE.get("visible_option");
		if(tp['visible_option'])visible_option[0]=tp['visible_option'];
		
		let ic=await OPTION_STORAGE.get("icon");
		if(ic['icon'])icon[0]=ic['icon'];
	}
	
	
	return {
		init:init,
		CSS_OPTIONS:css_options,
		setElement:setElement,
		VISIBLE_OPTIONS:visible_option,
		ICON:icon
	}
})();


//与background交互的操作码
const OPERATION_CODE_NOTE={
	//操作码固定3位
	NO_ACTION:100,
	
	//1xx为笔记相关
	LOAD_NOTE:101,
	NEW_NOTE:102,
	SET_NOTE:103,
	REMOVE_NOTE:104,
	
	//9xx为云服务相关
	GET_PUBLIC_NOTE:908
};



//NoteManager负责所有Note的载入和管理
let NoteManager=(()=>{
	//记录本页面所有note
	let NoteList={};
	/*
	笔记基本格式:	
	{uid:{
		"uid":uid,
		"content":内容,
		position位置:{
			top:top坐标,
			left:left坐标,
			type:类型},
		"permission":private/public,
		"ownerId":创建者,
		"ownerName":创建者昵称,
		status:状态,
	    url:所在网页url,
		webtitle:所在网页title,
		createtime:创建时间
	}...};
	*/
	
	//发信息
	async function SendMessage(messageObj){
		await chrome.runtime.sendMessage({op:OPERATION_CODE_NOTE.NO_ACTION});
		let res = await chrome.runtime.sendMessage(messageObj);
		return res;
	}
	
	//初始化
	async function init(){
		document.body.setAttribute("ondragover", "event.preventDefault()");
		await loadNote();
	}
	
	//生成uid
	function createUID(){
		let prefix="temp";
		let timestamp=Date.now();//时间戳
		let postfix=(()=>{
			return Math.random().toString(36).slice(-8) || "nufix";//随机后缀
		})();
		let uid=prefix+timestamp.toString(36)+postfix;
		return uid;
	}
	
	//获取webURL
	function getWebUrl(){
		return window.location.href;
	}
	
	//生成webObj
	function getWebObj(){
		return {url:getWebUrl(),title:document.title};
	}
	
	//载入数据
	async function loadNote(){
		
		let nt=await SendMessage({op:OPERATION_CODE_NOTE.LOAD_NOTE,url:getWebUrl()});
		if(nt)NoteList=nt;
		
		console.log(NoteList);
		for(let it in NoteList){
			let note=NoteFactory(NoteList[it])
			note.createNoteDiv();//建立div块
				
			//是否展开
			if(NOTE_OPTION.VISIBLE_OPTIONS[0]=="show"){
				note.show();
			}else{
				note.hid();
			}
		}
	}
	
	//新建note
	async function newNote(po={x:100,y:100}){
		let uid=createUID();
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
		let noteob={"uid":uid,"content":content,"position":{"top":top_,"left":left},"permission":"private","ownerId":"000000000000","ownerName":"me","url":getWebUrl(),"webtitle":document.title,"createtime":Date.now()};
		NoteList[uid]=noteob;
		
		await SendMessage({op:OPERATION_CODE_NOTE.NEW_NOTE,noteObj:NoteList[uid],webObj:getWebObj()});//发送到background
		
		NoteFactory(NoteList[uid]).createNoteDiv();
		
	}
	
	//修改note
	async function setNote(noteObj){
		let uid=noteObj["uid"];
		if(uid){
			NoteList[uid]=noteObj;
			await SendMessage({op:OPERATION_CODE_NOTE.SET_NOTE,noteObj:NoteList[uid],webObj:getWebObj()});//发送到background
		}
	}
	
	//删除note
	async function removeNote(noteObj){
		let uid=noteObj["uid"];
		if(NoteList[uid]){
			await SendMessage({op:OPERATION_CODE_NOTE.REMOVE_NOTE,noteObj:NoteList[uid],webObj:getWebObj()});//发送到background
			delete NoteList[uid];
		}
	}
	
	//克隆笔记
	async function cloneNote(noteObj){
		let uid=createUID();
		
		let noteob={"uid":uid,"content":noteObj.content,"position":noteObj.position,"permission":"private","ownerId":"000000000000","ownerName":"me","url":getWebUrl(),"webtitle":document.title,"createtime":Date.now()};
		NoteList[uid]=noteob;
		
		await SendMessage({op:OPERATION_CODE_NOTE.NEW_NOTE,noteObj:NoteList[uid],webObj:getWebObj()});//发送到background
		
		NoteFactory(NoteList[uid]).createNoteDiv();
		
	}
	

	return {
		init:init,
		loadNote:loadNote,
		newNote:newNote,
		setNote:setNote,
		removeNote:removeNote,
		cloneNote:cloneNote
	}
	
})();


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
		
			noteObj['position']['top']=top_;
			noteObj['position']['left']=left;
		
			NoteManager.setNote(noteObj);
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
		preInner=tg.innerText;
	}
	//内容改变自动保存功能
	function changeNote(event){
		let tg=event.target;
		let newInner=tg.innerText;
		if(newInner!=preInner){
			//如果和之前的内容不一样则保存
			noteObj["content"]=tg.innerText;
			NoteManager.setNote(noteObj);
			NoteParentDiv.title=tg.innerText;
		}
	}
	//为元素添加编辑保存功能
	function addEditFunc(ele){
		ele.setAttribute("contenteditable","true");
		ele.onblur=changeNote;
		ele.onfocus=getPreInner;
	}
	//添加字数监测
	function addWnumMonitor(ele){
		//字数监测
		const maxwnum=800;//最大字数上限
		ele.addEventListener('keydown',(event)=>{
			let tg=event.target;
			tg.dataset.wnum=tg.innerText.length;
			if(tg.innerText.length > maxwnum+10){
				event.preventDefault();
			}
		});
		ele.addEventListener('keyup',(event)=>{
			let tg=event.target;
			tg.dataset.wnum=tg.innerText.length;
			if(tg.innerText.length > maxwnum+10){
				tg.innerText=tg.innerText.substr(0,maxwnum);
				tg.dataset.wnum=tg.innerText.length;
				event.preventDefault();
			}
		});
	}
	//----编辑保存功能end----
	
	
	
	//----删除功能begin----
	//删除笔记功能
	async function removeNote(event){
		
		await NoteManager.removeNote(noteObj);
		
		document.body.removeChild(NoteParentDiv);
	}
	function addDeleteFunc(ele){
		ele.ondblclick=removeNote;
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
		addDragFunc(NoteParentDiv);//添加拖拽功能
		
		
		//内部主题创建
		let NoteBody=document.createElement("div");
		NoteBody.classList.add('weshareNoteBody');
		NoteBody.innerHTML=noteObj["content"];
		addEditFunc(NoteBody);//添加编辑功能
		addWnumMonitor(NoteBody);//添加字数监测
		HiddenDiv.push(NoteBody);
		NoteBody.dataset.wnum=NoteBody.innerText.length;
		
		NoteParentDiv.title=NoteBody.innerText;
		
		//隐藏/展开图标
		let hidBtn=document.createElement('div');
		hidBtn.classList.add('weshareNoteIcon');
		hidBtn.innerHTML=NOTE_OPTION.ICON[0];
		addChangeVisibleFunc(hidBtn);
		
		
		//删除图标
		let delBtn=document.createElement('div');
		delBtn.classList.add('weshareNoteIcon');
		delBtn.innerHTML="🗑️";
		addDeleteFunc(delBtn);
		delBtn.title="双击删除笔记";
		HiddenDiv.push(delBtn);
		
		//信息图标
		let infBtn=document.createElement('div');
		infBtn.classList.add('weshareNoteIcon');
		infBtn.innerHTML="📅";
		let infs="";
		if(noteObj.createtime){
			let tm=new Date(noteObj.createtime);
			infs+="创建时间:"+tm.toLocaleString();
		}
		infBtn.title=infs;
		HiddenDiv.push(infBtn);
		
		//放入父div中
		NoteParentDiv.appendChild(hidBtn);
		NoteParentDiv.appendChild(delBtn);
		NoteParentDiv.appendChild(infBtn);
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

//PublicNoteManager管理当前页面的公开笔记
let PublicNoteManager=(()=>{
	
	let parentDiv;//父div
	let HiddenDiv=[];//可以隐藏的div
	let bodyDiv;//主体div
	//该页面公开笔记
	let publicNotes=[];
	let notesIndex=0;//当前笔记index
	let indexDiv;//显示index的div框
	let infDiv;//信息框
	let likeBtn;//like按钮
	
	//下一个index
	function nextIndex(){
		notesIndex++;
		if(notesIndex>=publicNotes.length){
			notesIndex=0;
		}
	}
	
	//上一个index
	function prevIndex(){
		notesIndex--;
		if(notesIndex<0){
			notesIndex=publicNotes.length-1;
		}
	}
	
	//根据index更新Div内容
	function updateDiv(){
		if(publicNotes.length<=0){
			bodyDiv.innerHTML="此页面暂无公开笔记";
			bodyDiv.dataset.wnum=0;
			indexDiv.innerHTML="0/0";
			infDiv.title="暂无信息";
			const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
			const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
			
			parentDiv.style.top=Number(scrollTop)+Number(100)+"px";
			parentDiv.style.left=Number(scrollLeft)+Number(100)+"px";
			
			return;
		}
				
		let noteObj=publicNotes[notesIndex];
		bodyDiv.innerText=noteObj.content;//笔记body更新
		bodyDiv.dataset.wnum=bodyDiv.innerText.length;
		indexDiv.innerHTML=(notesIndex+1)+"/"+publicNotes.length;//index更新 
		
		//信息更新
		let infs="";
		if(noteObj.ownerName){
			infs+="创建者:"+noteObj.ownerName+"\n";
		}
		if(noteObj.createtime){
			let tm=new Date(noteObj.createtime);
			infs+="创建时间:"+tm.toLocaleString();
		}
		infDiv.title=infs;
		
		//like更新
		if(noteObj.like && noteObj.like=='like'){
			likeBtn.innerHTML="❤️";
		}else{
			likeBtn.innerHTML="🤍";
		}
		//likenum更新
		if(noteObj.likenum){
			likeBtn.title=noteObj.likenum+" likes";
		}else{
			likeBtn.title="0 likes";
		}
		
		
		let pos=noteObj.position;
		if(pos){
			let top_=pos.top;
			let left=pos.left;
			parentDiv.style.top=top_;
			parentDiv.style.left=left;
			let ht=document.documentElement.clientHeight || document.body.clientHeight;
			window.scrollTo({left:parentDiv.offsetLeft,top:parentDiv.offsetTop-ht/4,behavior:'smooth'});
		}
	}
	
	//发信息
	async function SendMessage(messageObj){
		await chrome.runtime.sendMessage({op:OPERATION_CODE_NOTE.NO_ACTION});
		let res = await chrome.runtime.sendMessage(messageObj);
		return res;
	}
	
	
	//获取webURL
	function getWebUrl(){
		return window.location.href;
	}
	
	
	//载入公开笔记
	async function load(){
		let tp=await SendMessage({op:OPERATION_CODE_NOTE.GET_PUBLIC_NOTE,url:getWebUrl()});
		if(tp){
			publicNotes=JSON.parse(tp);
		}
		notesIndex=0;
		console.log(publicNotes);
		updateDiv();
	}
	
	
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
	
	//改变父元素显示状态
	let hasLoad=false;
	async function changeParentDivVisible(){
		if(parentDiv.style.display=="none"){
			if(!hasLoad){
				await load();
				hasLoad=true;
			}
			parentDiv.style.display="block";
		}else{
			parentDiv.style.display="none";
		}
		
	}

	
	//----拖拽功能begin----
	//拖拽参数
	let xfix=0;
	let yfix=0;
	//拖拽开始
	function dragNoteStart() {
		let tg=parentDiv;
		if(tg.dataset.draggable=="true"){
			xfix = event.pageX - tg.offsetLeft;
			yfix = event.pageY - tg.offsetTop;
		}
	}
	//拖拽结束
	function dragNoteEnd() {
		let tg=parentDiv;
		if(tg.dataset.draggable=="true"){
			tg.style.left = event.pageX - xfix + "px";
			tg.style.top = event.pageY - yfix + "px";
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
	
	//like按钮点击
	async function likeBtnClick(){
		if(!publicNotes[notesIndex]){
				return;
		}
		
		let tg=publicNotes[notesIndex];
		
		if(tg.like && tg.like=='like' ){
			delete tg.like;
			likeBtn.innerHTML="🤍";
			if(tg.likenum){
				tg.likenum--;
				likeBtn.title=tg.likenum+" likes";
				if(tg.likenum<=0){
					likeBtn.title="0 likes";
					delete tg.likenum;
				}
			}
			//TODO			
		}else{
			publicNotes[notesIndex].like='like';
			likeBtn.innerHTML="❤️";
			if(tg.likenum){
				tg.likenum++;
			}else{
				tg.likenum=1;
			}
			likeBtn.title=tg.likenum+" likes";
			//TODO
		}
	}

	//初始化
	function init(){
		parentDiv=document.createElement('div');
		parentDiv.classList.add('weshareNoteParentDiv');
		NOTE_OPTION.setElement(parentDiv);
		addDragFunc(parentDiv);
		
		//隐藏/展开图标
		let hidBtn=document.createElement('div');
		hidBtn.classList.add('weshareNoteIcon');
		hidBtn.classList.add('weshareDashedBorder');
		hidBtn.innerHTML="💬";
		addChangeVisibleFunc(hidBtn);
		parentDiv.appendChild(hidBtn);
		
		//like栏
		likeBtn=document.createElement('div');
		likeBtn.classList.add('weshareNoteIcon');
		likeBtn.classList.add('weshareDashedBorder');
		likeBtn.innerHTML="🤍";
		likeBtn.onclick=likeBtnClick;
		HiddenDiv.push(likeBtn);
		parentDiv.appendChild(likeBtn);
		
		//信息图标
		infDiv=document.createElement('div');
		infDiv.classList.add('weshareNoteIcon');
		infDiv.classList.add('weshareDashedBorder');
		infDiv.innerHTML="📅";
		parentDiv.appendChild(infDiv);
		HiddenDiv.push(infDiv);
		
		//翻页栏
		let pageline=document.createElement('div');
		pageline.classList.add('weshareOpLine');
		HiddenDiv.push(pageline);
		//下一条笔记
		let nextd=document.createElement('a');
		nextd.style.display="inline-block";
		nextd.innerHTML=">";
		nextd.onclick=()=>{
			nextIndex();
			updateDiv();
		};
		
		//前一条笔记
		let pred=document.createElement('a');
		pred.style.display="inline-block";
		pred.innerHTML="<";
		pred.onclick=()=>{
			prevIndex();
			updateDiv();
		};
		
		//当前笔记index
		indexDiv=document.createElement('div');
		indexDiv.innerHTML="0/0";
		indexDiv.style.display="inline-block";
		
		pageline.appendChild(pred);
		pageline.appendChild(document.createTextNode("\xa0\xa0"));
		pageline.appendChild(indexDiv);
		pageline.appendChild(document.createTextNode("\xa0\xa0"));
		pageline.appendChild(nextd);
		pageline.appendChild(document.createTextNode("\xa0\xa0"));
		
		//克隆笔记功能
		let cloneBtn=document.createElement('div');
		cloneBtn.innerHTML="CLONE";
		cloneBtn.style.display="inline-block";
		cloneBtn.onclick=()=>{
			if(publicNotes[notesIndex]){
				NoteManager.cloneNote(publicNotes[notesIndex]);
				if(publicNotes[notesIndex].position.top==parentDiv.style.top){
					parentDiv.style.top=parentDiv.offsetTop+parentDiv.offsetHeight+"px";
				}
			}
		};
		pageline.appendChild(cloneBtn);
		
		
		//内容主体
		bodyDiv=document.createElement('div');
		bodyDiv.classList.add('weshareNoteBody');
		bodyDiv.classList.add('weshareDashedBorder');
		HiddenDiv.push(bodyDiv);
		parentDiv.appendChild(bodyDiv);
		
		parentDiv.appendChild(pageline);
		
		parentDiv.style.display="none";
		document.body.appendChild(parentDiv);
	}

	return {
		init:init,
		load:load,
		changeParentDivVisible:changeParentDivVisible
	}
	
})();



//整个界面初始化
(async function init(){
	await chrome.runtime.sendMessage({op:OPERATION_CODE_NOTE.NO_ACTION});//唤醒一下background
	await NOTE_OPTION.init();//必须先初始化设置
	NoteManager.init();
	PublicNoteManager.init();
})();