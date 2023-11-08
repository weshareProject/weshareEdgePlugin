function $(id){
	return document.getElementById(id);
}


//设置存储
const OPTION_STORAGE=chrome.storage.sync;

//与background交互的操作码
const OPERATION_CODE_OPTION={
	//操作码固定3位
	NO_ACTION:100,
	
	//7xx为设置页面相关功能
	GET_NOTE_WEB_URL:701,

};

//页面笔记载入是否自动展开
$('visibleshow').onclick=async ()=>{
	$('visiblehid').style.borderColor="var(--unchecked)";
	$('visiblehid').style.color="var(--unchecked)";
	$('visibleshow').style.borderColor="var(--checked)";
	$('visibleshow').style.color="var(--checked)";
	
	await OPTION_STORAGE.set({"visible_option":"show"});
};
$('visiblehid').onclick=async ()=>{
	$('visiblehid').style.borderColor="var(--checked)";
	$('visiblehid').style.color="var(--checked)";
	$('visibleshow').style.borderColor="var(--unchecked)";
	$('visibleshow').style.color="var(--unchecked)";
	
	await OPTION_STORAGE.set({"visible_option":"hid"});
};
(async ()=>{
	let vsbop="hid";
	let tp=await OPTION_STORAGE.get('visible_option');
	if(tp['visible_option'])vsbop=tp['visible_option'];
	
	if(vsbop=="show"){
		$("visibleshow").click();
	}else{
		$("visiblehid").click();
	}
})();


//----图标设置begin----
const ICON_BASE=["📌","📝","✒️","💬","📃"];
function iconBtnFactory(icon){
	let btn=document.createElement('div');
	btn.classList.add('setBtn');
	btn.innerHTML=icon;
	async function checked(){
		let btns=$('iconset').querySelectorAll('.setBtn');
		
		for(let i=0;i<btns.length;i++){
			btns[i].style.borderColor="var(--unchecked)";
			btns[i].style.color="var(--unchecked)";
		}
		btn.style.borderColor="var(--checked)";
		btn.style.color="var(--checked)";
		let sav={};
		sav['icon']=icon;
		await OPTION_STORAGE.set(sav);
		
		$('mainicon').innerHTML=icon;
	}
	
	btn.onclick=checked;
	
	$('iconset').appendChild(btn);
	
	return btn;
}
//生成图标大小设定
(async function iconSizeSetting(){
	$('iconset').innerHTML="";
	let icon="📌";
	let tp=await OPTION_STORAGE.get("icon");
	if(tp["icon"])icon=tp["icon"];
	for(let i in ICON_BASE){
		let btn=iconBtnFactory(ICON_BASE[i]);
		if(ICON_BASE[i]==icon)btn.click();
	}
})();
//----图标设置end----






//----尺寸设置begin----
//css样式基础尺寸
const CSS_BASESIZE=[14,16,18,20,24];
//尺寸设置按钮生成
//btnObj={attr:设置按钮对应的设置属性,value:设置的数值,showval:展示的数值}
function sizeBtnFactory(btnObj){
	let attr=btnObj.attr;
	let value=btnObj.value;
	let showval=btnObj.showval;
	let btn=document.createElement('div');
	btn.classList.add('setBtn');
	btn.innerHTML=showval;
	async function checked(){
		let btns=$(attr).querySelectorAll('.setBtn');
		console.log(btns);
		for(let i=0;i<btns.length;i++){
			btns[i].style.borderColor="var(--unchecked)";
			btns[i].style.color="var(--unchecked)";
		}
		btn.style.borderColor="var(--checked)";
		btn.style.color="var(--checked)";
		let sav={};
		sav[attr]=value;
		await OPTION_STORAGE.set(sav);
		
		$('previewDiv').style.setProperty("--"+attr,value);
	}
	
	btn.onclick=checked;
	
	$(attr).appendChild(btn);
	
	return btn;
}
//生成图标大小设定
(async function iconSizeSetting(){
	$('iconsize').innerHTML="";
	let iconsize="24px";
	let tp=await OPTION_STORAGE.get("iconsize");
	if(tp["iconsize"])iconsize=tp["iconsize"];
	for(let i in CSS_BASESIZE){
		let value=CSS_BASESIZE[i]+"px";
		let showval=CSS_BASESIZE[i]*1.5+"px";
		let btn=sizeBtnFactory({attr:"iconsize",value:value,showval:showval});
		if(value==iconsize)btn.click();
	}
})();
//生成文字大小设定
(async function fontSizeSetting(){
	$('fontsize').innerHTML="";
	let fontsize="24px";
	let tp=await OPTION_STORAGE.get("fontsize");
	if(tp["fontsize"])fontsize=tp["fontsize"];
	for(let i in CSS_BASESIZE){
		let value=CSS_BASESIZE[i]+"px";
		let showval=CSS_BASESIZE[i]+"px";
		let btn=sizeBtnFactory({attr:"fontsize",value:value,showval:showval});
		if(value==fontsize)btn.click();
	}
})();
//----尺寸设置end----



//----颜色设置begin----
//需要设置的颜色属性
const CSS_COLORATTR=["bordercolor","bgcolor","fontcolor"];
const CSS_COLORATTR_DESCRIE={"bordercolor":"边框颜色","bgcolor":"背景颜色","fontcolor":"字体颜色"};
//颜色设置按钮生成
//cbtnObj={attr:设置属性,value:属性值,showval:按钮上展示的内容}
function colorBtnFactory(cbtnObj){
	let attr=cbtnObj.attr;
	let value=cbtnObj.value;
	let showval=cbtnObj.showval;
	
	//看到的假按钮
	let fakebtn=document.createElement('div');
	fakebtn.classList.add('setBtn');
	fakebtn.innerHTML=showval;
	//实际的真按钮
	let truebtn=document.createElement('input');
	truebtn.type="color";
	truebtn.classList.add('hidden');
	truebtn.value=value;
	//绑定二者
	fakebtn.onclick=()=>{truebtn.click()};
	//变化存储
	truebtn.onchange=async ()=>{
		let newval=truebtn.value;
		$('previewDiv').style.setProperty("--"+attr,newval);
		let sav={};
		sav[attr]=newval;
		console.log(sav);
		await OPTION_STORAGE.set(sav);
	};
	
	//放入面板
	$('colorset').appendChild(fakebtn);
	$('colorset').appendChild(truebtn);
}
//载入颜色设置
(async ()=>{
	let colors={"bordercolor":"black","bgcolor":"white","fontcolor":"black"};
	for(let i=0;i<CSS_COLORATTR.length;i++){
		let nattr=CSS_COLORATTR[i];
		let tp=await OPTION_STORAGE.get(nattr);
		if(tp[nattr])colors[nattr]=tp[nattr];
	}
	
	for(let attr in colors){
		colorBtnFactory({attr:attr,value:colors[attr],showval:CSS_COLORATTR_DESCRIE[attr]});
		$('previewDiv').style.setProperty("--"+attr,colors[attr]);
	}
})();
//----颜色设置end----





//获取有笔记的web的url
async function getNoteWebUrl(){
	let resp=await chrome.runtime.sendMessage({op:OPERATION_CODE_OPTION.GET_NOTE_WEB_URL});
	return resp;
}
//展示记了笔记的网站
async function weburlInit(){
	let tp=await getNoteWebUrl();
	let noteweb=$('noteweb');
	if(tp=="{}"){
		noteweb.innerHTML="<div style='color:red;font-size:1.5rem;'>暂无笔记</div>";
	}else{
		tp=JSON.parse(tp);
		for(let i in tp){
			let it=tp[i];
			let url=it["url"];
			let title=it['title'];
			if(!title)title=url;
			let num=it['num'];
			let dv=document.createElement('div');
			dv.innerHTML="<span style='color:blue'>["+num+"笔记]</span>"+title;
			dv.title=url;
			dv.onclick=()=>{
				chrome.tabs.create({url:url});
			}
			dv.classList.add("webitem");
			noteweb.appendChild(dv);
		}
	}
}
(async ()=>{
	await chrome.runtime.sendMessage({op:OPERATION_CODE_OPTION.NO_ACTION});//唤醒background
	await weburlInit();
})();

//打开回收站
$('recycleBin').onclick=async ()=>{
	await chrome.runtime.sendMessage({op:OPERATION_CODE_OPTION.NO_ACTION});//唤醒background
	chrome.tabs.create({url:"/option/recycleBin.html"});
};