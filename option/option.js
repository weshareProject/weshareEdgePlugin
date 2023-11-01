function $(id){
	return document.getElementById(id);
}


//css样式基础尺寸
const CSS_BASESIZE=[14,16,18,20,24];
//设置存储
const OPTION_STORAGE=chrome.storage.sync;

//设置按钮生成
//btnObj={attr:设置按钮对应的设置属性,value:设置的数值,showval:展示的数值}
function BtnFactory(btnObj){
	let attr=btnObj.attr;
	let value=btnObj.value;
	let showval=btnObj.showval
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
		let btn=BtnFactory({attr:"iconsize",value:value,showval:showval});
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
		let btn=BtnFactory({attr:"fontsize",value:value,showval:showval});
		if(value==fontsize)btn.click();
	}
})();


//获取有笔记的web的url
async function getNoteWebUrl(){
	let resp=await chrome.runtime.sendMessage({op:"getNoteWebUrl"});
	let res=JSON.parse(resp);
	return res;
}

(async ()=>{
	let tp=await getNoteWebUrl();
	let noteweb=$('noteweb');
	if(Object.keys(tp).length<=0){
		noteweb.innerHTML="<div style='color:red;font-size:1.5rem;'>暂无笔记</div>";
	}
	console.log(tp);
	for(let i in tp){
		let it=tp[i];
		console.log(it);
		let url=it["url"];
		let title=it['title'];
		let num=it['num']
		let dv=document.createElement('div');
		dv.innerHTML="<span style='color:blue'>["+num+"笔记]</span>"+title;
		dv.title=url;
		dv.onclick=()=>{
			chrome.tabs.create({url:url});
		}
		dv.classList.add("webitem");
		noteweb.appendChild(dv);
	}
})();