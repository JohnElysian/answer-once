import {env,pipeline} from '@huggingface/transformers';
import {MODEL,analyse,embeddingTexts} from '../src/core.mjs';
let extractor;
self.onmessage=async event=>{
  try {
    const raw=event.data, texts=embeddingTexts(raw);
    env.allowLocalModels=false;
    if (!extractor) extractor=await pipeline('feature-extraction',MODEL.name,{revision:MODEL.revision,dtype:MODEL.dtype,device:'wasm',progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'status',message:`Downloading public model files: ${Math.round(p.progress ?? 0)}%`});}});
    self.postMessage({type:'status',message:'Model ready. Computing embeddings in this browser…'});
    const start=performance.now(),vectors=[];
    for(let i=0;i<texts.length;i+=8){const tensor=await extractor(texts.slice(i,i+8),{pooling:'mean',normalize:true});vectors.push(...tensor.tolist());}
    const report=analyse(raw,vectors);
    report.execution={runtime:'browser / WASM',inferenceAndAnalysisMs:Math.round(performance.now()-start)};
    self.postMessage({type:'result',report});
  } catch(error) {self.postMessage({type:'error',message:error.message});}
};
