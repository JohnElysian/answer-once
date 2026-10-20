# Answer Once

Local, open-weight AI for the questions that keep coming back. Give it a small support backlog and existing answer cards. It groups similar questions, retrieves exact source excerpts, and leaves a queue of questions that need an answer.

It is a review tool. It does not generate answers, verify a handbook, send replies, connect to a help desk, or modify source files.

## Run on Windows, macOS or Linux

Node.js 22.12 or newer is required. Tested on Windows with Node 24.20.0.

```sh
npm ci
npm run demo
```

The first online run downloads the public, ungated MiniLM model. Inference runs on the local CPU. The q8 weights are about 23 MB, plus tokenizer files and runtime dependencies. After the cache is populated:

```sh
npm run demo:offline
npm run test:offline
```

`test:offline` replaces both the library and global fetch functions with a denying stub. It checks the actual model's source selections, exact quotes, abstentions, groups and zero attempted fetches on the included synthetic fixture. It refreshes `demo/result.json`, which is intentionally a generated demo record. This is application-level offline verification; it does not inspect operating-system network traffic.

## Use your own batch

Create JSON with these arrays:

```json
{
  "tickets": [{"id":"Q1","text":"How do I reset my password?"}],
  "answers": [{"id":"password","title":"How do I reset a forgotten password?","body":"Your actual approved reset instructions.","source":"Handbook / Accounts / Reset"}]
}
```

```sh
node src/cli.mjs --input batch.json --offline --out new-report.json
```

The optional output path must not already exist. The CLI reads only the named JSON and model files; it never traverses your folders. No file content is uploaded to a model service. Use short questions and question-shaped card titles: the model embeds titles, then quotes each selected card's body verbatim. Source fields are labels, not fetched URLs. Do not include private data in the public demo examples.

## Browser demo

```sh
npm run dev
npm run build
```

Open the local Vite address shown by `npm run dev`. `npm run build` produces `dist/`, a static site that can be hosted on GitHub Pages. It initially displays the **recorded Windows run**, clearly labelled. Press **Run the local AI demo** to run the model in a browser worker, or **Use my own JSON** to supply a batch. The browser downloads public model/runtime files, then computes embeddings locally. Browser cache availability varies; the explicit offline mode is provided by the Node CLI. No analytics, login, reply service or API key is included.

## How it decides

The pinned Apache-2.0 `Xenova/all-MiniLM-L6-v2` ONNX model converts text into 384-dimensional vectors. Transformers.js 4.3.1 runs q8 inference, mean pooling and normalization. Source candidates are ranked by cosine similarity. A suggestion requires score ≥ 0.50 and a ≥ 0.06 margin over the next card; otherwise it abstains. These are example defaults, not calibrated probabilities or production accuracy guarantees.

Grouping uses a 0.73 complete-link threshold: every pair in a group must pass. This avoids merging unrelated questions through a chain of intermediate matches. Results depend on stable ID order. The sample has 10 authored questions: 6 get the expected handbook source, 4 get no source, and the batch becomes 6 groups. The dark-mode pair remains split: a visible false negative. This tiny authored fixture is a reproducibility example, not an independent benchmark or measured customer time saving.

Limits: English-focused model; long inputs may be truncated by the tokenizer; negation, subtle permission differences and stale or misleading titles can produce wrong matches. A verbatim quote can still be wrong for a customer. Review all suggestions. Batches are capped at 250 questions, 100 cards, and 2,000 characters per question/body. No deployments or customer integrations have been claimed.

## Verify

```sh
npm test
npm run test:offline
npm run build
npm audit
```

Core tests cover source preservation, low-score abstention, high-score ambiguity, transitive grouping, stable input order and malformed input. The model integration check is separate so a normal unit-test run needs no model download.

## Origin and licences

Created October 20, 2026, for the DEV Hacktoberfest Week 3 **Slow and Steady** challenge. Original application and authored fixtures were prepared with Codex on the owner's behalf; no human-user trial is claimed. App code is MIT. The project credits and uses [Transformers.js](https://github.com/huggingface/transformers.js), the [Xenova ONNX conversion](https://huggingface.co/Xenova/all-MiniLM-L6-v2), and the [Sentence Transformers original](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), all under their respective Apache-2.0 licences. Model revision: `751bff37182d3f1213fa05d7196b954e230abad9`. Weights are downloaded rather than redistributed in this repository.
