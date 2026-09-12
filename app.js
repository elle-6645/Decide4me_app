
let foods=[], history=[];
const $=id=>document.getElementById(id);
const mealNames={breakfast:"Breakfast",lunch:"Lunch",dinner:"Dinner"};
async function loadFoods(){
 try{
  const r=await fetch("./data/foods.json"); if(!r.ok) throw new Error();
  foods=await r.json(); $("dataPill").textContent=`${foods.length} foods loaded`;
  $("foodOptions").innerHTML=foods.map(f=>`<option value="${f.name}">`).join("");
 }catch(e){$("dataPill").textContent="Food database unavailable"; showError("Could not load the food database.");}
}
function showError(msg){$("errorBox").textContent=msg;$("errorBox").classList.remove("hidden")}
function clearError(){$("errorBox").classList.add("hidden")}
function selectedMeals(){return [...document.querySelectorAll('#mealPicker input:checked')].map(x=>x.value)}
function avoidList(){return $("avoidInput").value.toLowerCase().split(",").map(x=>x.trim()).filter(Boolean)}
function filteredFoods(meal){
 const diet=$("diet").value, avoid=avoidList();
 return foods.filter(f=>f.meal.includes(meal))
 .filter(f=>!avoid.some(a=>f.name.toLowerCase().includes(a)))
 .filter(f=>diet==="all" || (diet==="vegetarian" ? !/chicken|salmon|beef|pork|turkey|fish|shrimp/i.test(f.name) : !/chicken|salmon|beef|pork|turkey|fish|shrimp|egg|yogurt/i.test(f.name)));
}
function score(f){
 const p=$("priority").value;
 let s=f.protein*2+f.fiber*2-f.sodium/120-f.satFat;
 if(p==="protein") s+=f.protein*2.2;
 if(p==="fiber") s+=f.fiber*2.5;
 if(p==="sodium") s-=f.sodium/50;
 history.forEach(h=>{if(h.food===f.name)s-=8});
 return s;
}
function pick(meal,used=[]){
 let list=filteredFoods(meal).filter(f=>!used.includes(f.name));
 if(!list.length) list=filteredFoods(meal);
 return [...list].sort((a,b)=>score(b)-score(a))[0];
}
function addHistory(){
 const name=$("foodInput").value.trim(); if(!name)return;
 const food=foods.find(f=>f.name.toLowerCase()===name.toLowerCase());
 if(!food){showError("Please choose a food from the USDA food list.");return}
 history.push({meal:$("historyMealType").value,food:food.name}); $("foodInput").value=""; renderTags(); clearError();
}
function renderTags(){
 $("historyTags").innerHTML=history.map((h,i)=>`<span class="tag">${mealNames[h.meal]}: ${h.food} <button onclick="history.splice(${i},1);renderTags()" aria-label="Remove">×</button></span>`).join("");
}
function reason(f){
 const p=$("priority").value;
 if(p==="protein") return `High protein (${f.protein} g/100 g) supports your protein priority.`;
 if(p==="fiber") return `Good fiber (${f.fiber} g/100 g) supports your fiber priority.`;
 if(p==="sodium") return `Relatively low sodium (${f.sodium} mg/100 g) fits your sodium priority.`;
 return `Balanced choice with ${f.protein} g protein and ${f.fiber} g fiber per 100 g.`;
}
function card(meal,f){return `<article class="meal-card"><div class="meal-title">${mealNames[meal]}</div><h3>${f.name}</h3><div class="nutrients"><span>Protein ${f.protein}g</span><span>Fiber ${f.fiber}g</span><span>Sodium ${f.sodium}mg</span></div><p class="reason">${reason(f)}</p></article>`}
function build(){
 clearError(); const meals=selectedMeals(); if(!meals.length){showError("Select at least one meal period.");return}
 $("plannerView").classList.add("hidden"); $("resultView").classList.remove("hidden");
 const today={}; let used=[];
 meals.forEach(m=>{today[m]=pick(m,used);used.push(today[m].name)});
 $("todayCards").innerHTML=meals.map(m=>card(m,today[m])).join("");
 $("resultSummary").textContent=`Based on ${$("priority").selectedOptions[0].text.toLowerCase()} priority, your preferences, and ${history.length} recent food${history.length===1?"":"s"}.`;
 buildWeek();
 window.scrollTo({top:0,behavior:"smooth"});
}
function buildWeek(){
 const meals=selectedMeals(), days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], rows=[];
 const used=[];
 days.forEach((d,i)=>{const picks={}; meals.forEach(m=>{const f=pick(m,used);picks[m]=f;used.push(f.name)});rows.push({d,picks})});
 $("scheduleTable").querySelector("thead").innerHTML=`<tr><th>Day</th>${meals.map(m=>`<th>${mealNames[m]}</th>`).join("")}</tr>`;
 $("scheduleTable").querySelector("tbody").innerHTML=rows.map(r=>`<tr><th>${r.d}</th>${meals.map(m=>`<td>${r.picks[m].name}</td>`).join("")}</tr>`).join("");
}
$("addHistoryBtn").addEventListener("click",addHistory);
$("foodInput").addEventListener("keydown",e=>{if(e.key==="Enter")addHistory()});
$("generateBtn").addEventListener("click",build);
$("regenerateBtn").addEventListener("click",buildWeek);
$("editBtn").addEventListener("click",()=>{$("resultView").classList.add("hidden");$("plannerView").classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})});
loadFoods();
