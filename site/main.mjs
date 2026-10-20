import './style.css';
import input from '../demo/input.json';
import recorded from '../demo/result.json';
let current=recorded,filter='all',worker;
const byId=id=>document.getElementById(id);
byId('input').value=JSON.stringify(input,null,2);
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function render(){
  const metrics=byId('metrics');metrics.replaceChildren();
  for(const [key,label]of[['tickets','questions in batch'],['questionGroups','small question groups'],['suggestedAnswers','source suggestions'],['needsAnswer','questions need answers']]){const div=element('div',undefined,'metric');div.append(element('b',String(current.summary[key])),element('span',label));metrics.append(div);}
  const groups=byId('groups');groups.replaceChildren();
  for(const group of current.clusters){
    if(filter==='unanswered'&&!group.needsAnswer||filter==='source'&&group.needsAnswer)continue;
    const card=element('article',undefined,'group'),top=element('div',undefined,'group-top');
    top.append(element('h3',group.representative),element('span',group.needsAnswer?'Needs an answer':'Review source','pill'+(group.needsAnswer?' gap':'')));
    card.append(top,element('p',`${group.ticketIds.length} question${group.ticketIds.length===1?'':'s'} · ${group.ticketIds.join(', ')}`,'ticketline'));
    const tickets=group.ticketIds.map(id=>current.tickets.find(t=>t.id===id));
    if(tickets.length>1)card.append(element('p',tickets.slice(1).map(t=>t.text).join(' · '),'ticket-text'));
    const unique=new Map();
    for(const ticket of tickets)if(ticket.answer)unique.set(ticket.answer.id,ticket.answer);
    for(const answer of unique.values()){
      const source=element('div',undefined,'source');source.append(element('div','EXACT SOURCE EXCERPT · CHECK BEFORE REPLYING','source-label'),element('blockquote',answer.quote),element('cite',answer.source));card.append(source);
    }
    if(group.needsAnswer)card.append(element('p','No sufficiently clear source for at least one question. Review these questions and write an answer card if appropriate.','gap-note'));
    card.append(element('p',tickets.map(t=>`${t.id}: similarity ${t.score.toFixed(3)}, margin ${t.margin.toFixed(3)}`).join(' · '),'scores'));
    groups.append(card);
  }
}
byId('edit').onclick=()=>{byId('editor').hidden=!byId('editor').hidden;if(!byId('editor').hidden)byId('input').focus();};
byId('run').onclick=()=>{
  let raw;
  try{raw=JSON.parse(byId('input').value);}catch{byId('status').textContent='Please correct the input JSON before running.';return;}
  byId('run').disabled=true;byId('status').textContent='Loading the public model for local inference. No batch text is uploaded.';
  if(!worker){worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});worker.onmessage=event=>{const msg=event.data;if(msg.type==='result'){current=msg.report;byId('status').textContent=`Live browser model run · ${current.execution.inferenceAndAnalysisMs} ms inference + analysis · review required`;byId('run').disabled=false;render();}else{byId('status').textContent=msg.message;if(msg.type==='error')byId('run').disabled=false;}};worker.onerror=event=>{byId('status').textContent=`Model error: ${event.message}. You can still inspect the recorded demo or use the Node CLI.`;byId('run').disabled=false;};}
  worker.postMessage(raw);
};
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===button));render();});
byId('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));const link=element('a');link.href=url;link.download='answer-once-report.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();
