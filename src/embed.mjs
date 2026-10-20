import { fileURLToPath } from 'node:url';
import { env, AutoTokenizer, AutoModel, FeatureExtractionPipeline } from '@huggingface/transformers';
import { MODEL } from './core.mjs';

export async function createEmbedder({offline=false}={}) {
  env.cacheDir=fileURLToPath(new URL('../.cache/',import.meta.url));
  env.allowRemoteModels=!offline;
  env.allowLocalModels=offline;
  env.localModelPath='';
  // Explicit component loading avoids a remote repository-file discovery step.
  // This lets a warmed cache run with remote model access disabled.
  const options={revision:MODEL.revision,dtype:MODEL.dtype,device:'cpu',local_files_only:offline};
  const location=offline?`${env.cacheDir.replaceAll('\\','/')}${MODEL.name}/${MODEL.revision}`:MODEL.name;
  const [tokenizer,model]=await Promise.all([AutoTokenizer.from_pretrained(location,options),AutoModel.from_pretrained(location,options)]);
  const extractor=new FeatureExtractionPipeline({task:'feature-extraction',tokenizer,model});
  return async texts => {
    const result=[];
    for (let i=0;i<texts.length;i+=8) {
      const tensor=await extractor(texts.slice(i,i+8),{pooling:'mean',normalize:true});
      result.push(...tensor.tolist());
    }
    return result;
  };
}
