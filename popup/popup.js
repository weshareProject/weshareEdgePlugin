function $(elemId){
	return document.getElementById(elemId)
}

async function getCurrentTab() {
  let queryOptions = { active: true , currentWindow:true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

(async ()=>{
	let v=await getCurrentTab()
	$('url').innerHTML=v['url'];
})();



$('nl').addEventListener("click",()=>{
	
	chrome.tabs.query({active:true,currentWindow:true},response=>{
		
		chrome.tabs.sendMessage(response[0].id,{op:"addNote",position:"default"});
	});
});

$('setting').addEventListener('click',()=>{
	chrome.tabs.create({url:"/option/option.html"});
});