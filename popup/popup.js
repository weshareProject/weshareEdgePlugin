function $(elemId){
	return document.getElementById(elemId)
}

async function getCurrentTab() {
  let queryOptions = { active: true , currentWindow:true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

getCurrentTab().then(v=>{$("url").innerHTML=v['url'];});

let highlightmode=0;

/*
chrome.runtime.sendMessage({op:"get",key:"highlightmode"},response=>{
	if(!response)highlightmode=0;
	else highlightmode=response;
	if(highlightmode==1){
		$("bt").value="标记已开启";
	}else{
		$("bt").value="标记已关闭";
	}
});
*/

/*
async function load(){
	highlightmode=await chrome.storage.sync.get("highlightmode");
	if(!highlightmode)highlightmode=0;
	else highlightmode=highlightmode["highlightmode"];
	if(highlightmode==1){
		$("bt").value="标记已开启";
	}else{
		$("bt").value="标记已关闭";
	}
}

load();


$('bt').addEventListener("click",()=>{
	if(highlightmode==1){
		$("bt").value="标记已关闭";
		highlightmode=0;
	}else{
		$("bt").value="标记已开启";
		highlightmode=1;
	}
	
	chrome.storage.sync.set({"highlightmode":highlightmode});
	
	//chrome.runtime.sendMessage({op:"set",key:"highlightmode",value:highlightmode});
});

*/

$('nl').addEventListener("click",()=>{
	
	chrome.tabs.query({active:true,currentWindow:true},response=>{
		
		chrome.tabs.sendMessage(response[0].id,{op:"addNote",position:"default"});
	});
});