export const DEFAULTS = Object.freeze({ answerThreshold: 0.5, answerMargin: 0.06, clusterThreshold: 0.73 });
export const MODEL = Object.freeze({ name: 'Xenova/all-MiniLM-L6-v2', revision: '751bff37182d3f1213fa05d7196b954e230abad9', dtype: 'q8' });

function requiredText(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${name} must be nonempty text, at most ${max} characters.`);
  return value.trim();
}

export function validateInput(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tickets) || !Array.isArray(raw.answers)) throw new Error('Input requires tickets and answers arrays.');
  if (!raw.tickets.length || raw.tickets.length > 250 || !raw.answers.length || raw.answers.length > 100) throw new Error('Use 1–250 tickets and 1–100 answer cards per batch.');
  const ids = new Set();
  const items = (rows, kind) => rows.map((row, i) => {
    if (!row || typeof row !== 'object') throw new Error(`Invalid ${kind} row ${i}.`);
    const id = requiredText(row.id, `${kind} id`, 80);
    if (ids.has(`${kind}:${id}`)) throw new Error(`Duplicate ${kind} id: ${id}`);
    ids.add(`${kind}:${id}`);
    return kind === 'ticket'
      ? { id, text: requiredText(row.text, `Ticket ${id}`, 2000) }
      : { id, title: requiredText(row.title, `Answer ${id} title`, 200), body: requiredText(row.body, `Answer ${id} body`, 2000), source: requiredText(row.source, `Answer ${id} source`, 500) };
  });
  return { tickets: items(raw.tickets, 'ticket').sort((a,b) => a.id.localeCompare(b.id)), answers: items(raw.answers, 'answer').sort((a,b) => a.id.localeCompare(b.id)) };
}

export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) throw new Error('Embedding dimensions do not match.');
  let dot=0, normA=0, normB=0;
  for (let i=0; i<a.length; i++) {
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i])) throw new Error('Embeddings must contain finite numbers.');
    dot += a[i]*b[i]; normA += a[i]*a[i]; normB += b[i]*b[i];
  }
  if (!normA || !normB) throw new Error('Embedding norm must be nonzero.');
  return Math.max(-1, Math.min(1, dot/Math.sqrt(normA*normB)));
}

export function analyse(raw, vectors, options={}) {
  const data=validateInput(raw), settings={...DEFAULTS,...options};
  for (const [name,value] of Object.entries(settings)) {
    if (!(name in DEFAULTS) || !Number.isFinite(value) || value < 0 || value > 1) throw new Error('Thresholds must be numbers between zero and one.');
  }
  if (!Array.isArray(vectors) || vectors.length !== data.tickets.length+data.answers.length) throw new Error('Expected one embedding per ticket and answer title.');
  const n=data.tickets.length, ticketVectors=vectors.slice(0,n), answerVectors=vectors.slice(n);
  const tickets=data.tickets.map((ticket,i) => {
    const candidates=data.answers.map((answer,j) => ({id:answer.id,score:cosine(ticketVectors[i],answerVectors[j])})).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id));
    const first=candidates[0], margin=first.score-(candidates[1]?.score ?? 0);
    const found=first.score >= settings.answerThreshold && margin >= settings.answerMargin;
    const card=data.answers.find(answer=>answer.id===first.id);
    return {...ticket,status:found?'review_suggested_answer':'needs_answer',score:first.score,margin,candidates:candidates.slice(0,2),answer:found?{id:card.id,title:card.title,quote:card.body,source:card.source}:null};
  });
  // Complete-link clustering: every pair must pass, avoiding transitive chains.
  const groups=[];
  tickets.forEach((ticket,i) => {
    const group=groups.find(g => g.indices.every(j => cosine(ticketVectors[i],ticketVectors[j]) >= settings.clusterThreshold));
    if (group) group.indices.push(i); else groups.push({indices:[i]});
  });
  const clusters=groups.map((g,i)=>({id:`group-${i+1}`,ticketIds:g.indices.map(j=>tickets[j].id),representative:tickets[g.indices[0]].text,needsAnswer:g.indices.some(j=>tickets[j].status==='needs_answer')}));
  return {schemaVersion:1,model:MODEL,settings,notice:'Similarity is not a probability or factual validation. Review every suggestion. No replies are sent.',summary:{tickets:tickets.length,suggestedAnswers:tickets.filter(t=>t.answer).length,needsAnswer:tickets.filter(t=>!t.answer).length,questionGroups:clusters.length,repeatedQuestionGroups:clusters.filter(g=>g.ticketIds.length>1).length},tickets,clusters};
}

export function embeddingTexts(raw) {
  const data=validateInput(raw);
  // Embed questions against card titles, not body text: long prose can dilute intent.
  // The body is quoted verbatim only after the threshold and margin checks pass.
  return [...data.tickets.map(t=>t.text),...data.answers.map(a=>a.title)];
}
