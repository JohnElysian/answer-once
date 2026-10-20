import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {env} from '@huggingface/transformers';
import {analyse,embeddingTexts} from '../src/core.mjs';
import {createEmbedder} from '../src/embed.mjs';

// Deliberately use only synthetic inputs. A warmed model cache is required.
let networkAttempts=0;
const denyFetch=async()=>{networkAttempts++;throw new Error('Network disabled by offline verification.');};
globalThis.fetch=denyFetch;
env.fetch=denyFetch;
const raw=JSON.parse(await readFile(new URL('../demo/input.json',import.meta.url),'utf8'));
const started=performance.now(),embed=await createEmbedder({offline:true}),loaded=performance.now();
const report=analyse(raw,await embed(embeddingTexts(raw)));
const elapsed=Math.round(performance.now()-loaded);
for(const ticket of report.tickets){
  const expected=Number(ticket.id.slice(1))<=2?'password':Number(ticket.id.slice(1))<=4?'export':Number(ticket.id.slice(1))<=6?'notifications':null;
  assert.equal(ticket.answer?.id ?? null,expected);
  if(ticket.answer) assert.equal(ticket.answer.quote,raw.answers.find(a=>a.id===expected).body);
}
assert.deepEqual(report.summary,{tickets:10,suggestedAnswers:6,needsAnswer:4,questionGroups:6,repeatedQuestionGroups:4});
assert.equal(networkAttempts,0);
report.execution={runtime:process.version,platform:process.platform,transformersVersion:env.version,offline:true,fetchAttempts:networkAttempts,modelLoadMs:Math.round(loaded-started),inferenceAndAnalysisMs:elapsed};
await writeFile(new URL('../demo/result.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:'Known-source fixture answers, exact quotations, abstentions, conservative groups, denied-fetch offline run',...report.summary,...report.execution},null,2));
