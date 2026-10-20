# Third-party notices

Answer Once's original application code is MIT. That licence does not replace the licences of the components below. Keep this file and `licenses/` with redistributed browser builds, including the JavaScript worker and ONNX Runtime WASM file.

The following versions were read from the installed packages and lockfile used for the 20 October 2026 build. A no-write Vite build confirmed that the browser output consumes `transformers.web.js`, ONNX Runtime Web's prebuilt WebGPU/WASM bundle, and ONNX Runtime Common modules. Transformers.js itself prebundles its Jinja/tokenizer helpers.

| Component | Installed version | Licence and retained text |
| --- | --- | --- |
| [Transformers.js](https://github.com/huggingface/transformers.js) | 4.3.1 | Apache-2.0; [full licence](licenses/transformers.js-LICENSE.txt) |
| [Hugging Face Tokenizers.js](https://github.com/huggingface/tokenizers.js) | 0.2.0 | Apache-2.0; [full licence](licenses/tokenizers-LICENSE.txt) |
| [Hugging Face Jinja](https://github.com/huggingface/huggingface.js/tree/main/packages/jinja) | 0.5.10 | MIT, copyright 2023 Hugging Face; [full licence](licenses/jinja-LICENSE.txt) |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) and its WASM runtime | 1.31.0-dev.20260914-8d85527a0 | MIT, copyright Microsoft Corporation; [full licence](licenses/onnxruntime-LICENSE.txt), [unmodified upstream third-party notices](licenses/onnxruntime-ThirdPartyNotices.txt) |
| ONNX Runtime Common | 1.30.0 (resolved modules) and 1.31.0-dev.20260911-2a43ec07e (inside the prebuilt Web runtime) | MIT, copyright Microsoft Corporation; [full licence](licenses/onnxruntime-common-LICENSE.txt) |
| [Vite](https://github.com/vitejs/vite) build-generated browser helpers | 8.3.4 | MIT; [unmodified vendor licence and dependency notices](licenses/vite-LICENSE.md) |

ONNX Runtime's upstream notice file was retrieved from the exact `8d85527a0` source revision named in the installed Web package. It contains a broad upstream inventory, including Eigen, FlatBuffers, LLVM and Emscripten-related notices. Retaining that file does not assert that every upstream optional component is enabled in this particular WASM build. The generated worker preserves Microsoft's ONNX Runtime version/copyright/MIT comment; other licence texts are retained separately here.

Transformers.js source also credits adaptations from [fft.js](https://github.com/indutny/fft.js), [audiobuffer-to-wav](https://github.com/Jam3/audiobuffer-to-wav), [librosa](https://github.com/librosa/librosa) and [torchaudio](https://github.com/pytorch/audio). Their upstream notices are retained as [fft.js README with its complete MIT licence](licenses/fft.js-README.md), [audiobuffer-to-wav licence](licenses/audiobuffer-to-wav-LICENSE.md), [librosa licence](licenses/librosa-LICENSE.md) and [torchaudio licence](licenses/torchaudio-LICENSE.txt). These are upstream adaptation credits, not extra direct npm dependencies.

The full Node dependency tree also contains packages used only by Node inference or build tooling. Their binaries and `node_modules` directories are not redistributed in this release. `package-lock.json` preserves the exact dependency graph; their vendor licences accompany an installation from npm. For the browser distribution, the ORT prebuilt bundle's source map contains ORT/Common sources and generated WASM glue, rather than the unrelated WebGL npm dependency tree.

## Model attribution

The browser and CLI download [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2), an ONNX conversion of [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). Both model cards declare Apache-2.0. Model revision: `751bff37182d3f1213fa05d7196b954e230abad9`. The model files are not included in this repository or static build; its original model cards and notices remain available at those sources. The Apache-2.0 text is retained above.

## Provenance of copied notices

Hugging Face and Vite texts were copied byte-for-byte from the installed packages. ONNX Runtime licence/notice texts came from `https://raw.githubusercontent.com/microsoft/onnxruntime/8d85527a0/`; the Common licence was also checked at commit `2a43ec07e67df9263c7c56c15da76cc7f74d7b32`. Adaptation licences came from the linked projects' public upstream licence files (fft.js publishes its licence in its README). Application, fixture, source and deployed assets were not changed as part of this notice preparation.
