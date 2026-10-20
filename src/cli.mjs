#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {analyse,embeddingTexts} from './core.mjs';
import {createEmbedder} from './embed.mjs';

try {
  const args=process.argv.slice(2), known=new Set(['--demo','--offline','--input','--out','--help']);
  if (!args.length || args.includes('--help')) {
    console.log('Answer Once — local semantic backlog triage\nnode src/cli.mjs --demo [--offline] [--out NEWFILE.json]\nnode src/cli.mjs --input batch.json [--offline] [--out NEWFILE.json]\nFirst run downloads a public model; --offline requires a populated cache. No messages or replies are sent.');
    process.exit(0);
  }
  const flags={};
  for (let i=0;i<args.length;i++) {
    const key=args[i];
    if (!known.has(key) || key in flags) throw new Error(`Unknown or repeated argument: ${key}`);
    if (['--input','--out'].includes(key)) {
      if (!args[i+1] || args[i+1].startsWith('--')) throw new Error(`${key} needs a filename.`);
      flags[key]=args[++i];
    } else flags[key]=true;
  }
  if (Boolean(flags['--demo']) === Boolean(flags['--input'])) throw new Error('Choose --demo OR --input.');
  const raw=JSON.parse(await readFile(flags['--demo']?new URL('../demo/input.json',import.meta.url):flags['--input'],'utf8'));
  const texts=embeddingTexts(raw), start=performance.now();
  console.error(flags['--offline']?'Loading cached model with remote loading disabled…':'Loading model; a first-run download may be required…');
  const embed=await createEmbedder({offline:Boolean(flags['--offline'])}), loaded=performance.now();
  const report=analyse(raw,await embed(texts));
  report.execution={runtime:process.version,platform:process.platform,offline:Boolean(flags['--offline']),modelLoadMs:Math.round(loaded-start),inferenceAndAnalysisMs:Math.round(performance.now()-loaded)};
  const json=JSON.stringify(report,null,2)+'\n';
  if (flags['--out']) { await writeFile(flags['--out'],json,{flag:'wx'}); console.error(`Wrote ${flags['--out']} (existing files are never overwritten).`); }
  else console.log(json);
  console.error(`${report.summary.tickets} tickets → ${report.summary.questionGroups} groups; ${report.summary.suggestedAnswers} source suggestions; ${report.summary.needsAnswer} need answers. Review required; no replies sent.`);
} catch(error) { console.error(`Answer Once: ${error.message}`); process.exitCode=1; }
