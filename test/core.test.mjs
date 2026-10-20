import test from 'node:test';
import assert from 'node:assert/strict';
import {analyse,cosine,embeddingTexts,validateInput} from '../src/core.mjs';

const input={tickets:[{id:'A',text:'Question A'},{id:'B',text:'Question B'}],answers:[{id:'x',title:'Answer X',body:'Verbatim <body> & source.',source:'manual:x'},{id:'y',title:'Answer Y',body:'Other.',source:'manual:y'}]};
test('suggestions quote original source and leave weak matches unanswered',()=>{
  const report=analyse(input,[[1,0,0],[0,0,1],[1,0,0],[0,1,0]]);
  assert.equal(report.tickets[0].answer.quote,input.answers[0].body);
  assert.equal(report.tickets[1].answer,null);
  assert.equal(report.summary.needsAnswer,1);
});
test('ambiguous nearest neighbours abstain even with high similarity',()=>{
  const report=analyse(input,[[1,0],[0,1],[1,0],[1,0]]);
  assert.equal(report.tickets[0].score,1);
  assert.equal(report.tickets[0].status,'needs_answer');
});
test('complete-link grouping prevents chaining A→B→C when A and C differ',()=>{
  const raw={...input,tickets:[{id:'A',text:'A'},{id:'B',text:'B'},{id:'C',text:'C'}]};
  const report=analyse(raw,[[1,0],[Math.sqrt(0.5),Math.sqrt(0.5)],[0,1],[1,0],[0,1]],{clusterThreshold:0.7});
  assert.deepEqual(report.clusters.map(g=>g.ticketIds),[['A','B'],['C']]);
});
test('input is sorted consistently before embedding and analysis',()=>{
  const raw={...input,tickets:[...input.tickets].reverse()};
  assert.deepEqual(embeddingTexts(raw),['Question A','Question B','Answer X','Answer Y']);
});
test('reject duplicate ids, oversized input and invalid vectors',()=>{
  assert.throws(()=>validateInput({...input,tickets:[input.tickets[0],input.tickets[0]]}),/Duplicate/);
  assert.throws(()=>validateInput({...input,tickets:[{id:'x',text:'a'.repeat(2001)}]}),/2000/);
  assert.throws(()=>cosine([0,0],[1,0]),/nonzero/);
  assert.throws(()=>cosine([NaN],[1]),/finite/);
  assert.throws(()=>analyse(input,[[1,0]]),/one embedding/);
  assert.throws(()=>analyse(input,[[1,0],[0,1],[1,0],[0,1]],{answerMargin:-1}),/Thresholds/);
});
