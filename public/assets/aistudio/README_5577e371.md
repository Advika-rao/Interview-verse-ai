# AI / ML Engineer Interview Questions

> **Total Questions: 522**
> Serial numbers run continuously across all sections.

---

## Table of Contents

- [Machine Learning Interview Questions](#machine-learning-interview-questions) - 36
- [Deep Neural Networks](#deep-neural-networks) - 22
- [Natural Language Processing](#natural-language-processing) - 12
- [Computer Vision](#computer-vision) - 10
- [Technical Questions](#technical-questions) - 208 questions
  - [LLM Fundamentals](#llm-fundamentals) - 37
  - [RAG Systems](#rag-systems) - 28
  - [Agents and Tool Use](#agents-and-tool-use) - 38
  - [Fine-tuning and Training](#fine-tuning-and-training) - 12
  - [Evaluation and Metrics](#evaluation-and-metrics) - 24
  - [ML Fundamentals](#ml-fundamentals) - 18
  - [Python and Software Engineering](#python-and-software-engineering) - 18
  - [Infrastructure and MLOps](#infrastructure-and-mlops) - 6
  - [Cost and Latency Optimization](#cost-and-latency-optimization) - 17
  - [Safety and Guardrails](#safety-and-guardrails) - 10
- [System Design Questions](#system-design-questions) - 81 questions
  - [AI System Design](#ai-system-design) - 54
  - [Traditional System Design](#traditional-system-design) - 24
  - [System Troubleshooting](#system-troubleshooting) - 3
- [Coding Problems](#coding-problems) - 40 questions
  - [LeetCode / Algorithm Style](#leetcode--algorithm-style) - 16
  - [OpenAI-Specific Coding](#openai-specific-coding) - 5
  - [Anthropic-Specific Coding](#anthropic-specific-coding) - 1
  - [ML / AI Coding](#ml--ai-coding) - 16
  - [Practical / Data Processing](#practical--data-processing) - 2
- [Behavioral Questions](#behavioral-questions) - 80 questions
  - [Project Deep Dives](#project-deep-dives) - 13
  - [Conflict and Collaboration](#conflict-and-collaboration) - 12
  - [Leadership and Ownership](#leadership-and-ownership) - 13
  - [Technical Decision-Making](#technical-decision-making) - 13
  - [Failure and Learning](#failure-and-learning) - 8
  - [AI-Specific Behavioral](#ai-specific-behavioral) - 10
  - [Culture and Motivation](#culture-and-motivation) - 7
  - [AI-Conducted Interview Follow-ups](#ai-conducted-interview-follow-ups) - 4
- [Project Deep Dive](#project-deep-dive) - 16 questions
  - [Opening Questions](#opening-questions) - 4
  - [Follow-up Probes](#follow-up-probes) - 12
- [Take-Home Assignments](#take-home-assignments) - 17 questions
  - [RAG / Chatbot Systems](#rag--chatbot-systems) - 3
  - [Agent Systems](#agent-systems) - 6
  - [Full-Stack AI Applications](#full-stack-ai-applications) - 2
  - [Evaluation](#evaluation) - 1
  - [Performance / Optimization](#performance--optimization) - 1
  - [OpenAI-Specific](#openai-specific) - 1
  - [Red Flags (Unreasonable Assignments)](#red-flags-unreasonable-assignments) - 3

---

## Machine Learning Interview Questions
*(36 questions)*

1. Mention three ways to make your model robust to outliers?
2. Describe the motivation behind random forests and mention two reasons why they are better than individual decision trees?
3. What are the differences and similarities between gradient boosting and random forest? What are the advantages and disadvantages of each when compared to each other?
4. What are L1 and L2 regularization? What are the differences between the two?
5. What are the Bias and Variance in a Machine Learning Model and explain the bias-variance trade-off?
6. Mention three ways to handle missing or corrupted data in a dataset?
7. Explain briefly the logistic regression model and state an example of when you have used it recently?
8. Explain briefly batch gradient descent, stochastic gradient descent, and mini-batch gradient descent. What are the pros and cons for each of them?
9. Explain what is information gain and entropy in the context of decision trees?
10. Explain the linear regression model and discuss its assumptions?
11. Explain briefly the K-Means clustering and how can we find the best value of K?
12. Define Precision, Recall, and F1 and discuss the trade-off between them?
13. What are the differences between a model that minimizes squared error and the one that minimizes the absolute error? In which cases would each error metric be more appropriate?
14. Define and compare parametric and non-parametric models and give two examples for each of them?
15. Explain the kernel trick in SVM and why we use it, and how to choose what kernel to use?
16. Define the cross-validation process and the motivation behind using it?
17. You are building a binary classifier and you found that the data is imbalanced. What should you do to handle this situation?
18. You are working on a clustering problem. What are different evaluation metrics that can be used, and how to choose between them?
19. What is the ROC curve and when should you use it?
20. What is the difference between hard and soft voting classifiers in the context of ensemble learners?
21. What is boosting in the context of ensemble learners? Discuss two famous boosting methods.
22. How can you evaluate the performance of a dimensionality reduction algorithm on your dataset?
23. Define the curse of dimensionality and how to solve it.
24. In what cases would you use vanilla PCA, Incremental PCA, Randomized PCA, or Kernel PCA?
25. Discuss two clustering algorithms that can scale to large datasets.
26. Do you need to scale your data if you will be using the SVM classifier? Discuss your answer.
27. What are Loss Functions and Cost Functions? Explain the key difference between them.
28. What is the importance of batch in machine learning and explain some batch-dependent gradient descent algorithms?
29. What are the different methods to split a tree in a decision tree algorithm?
30. Why is boosting a more stable algorithm as compared to other ensemble algorithms?
31. What is active learning and discuss one strategy of it?
32. What are the different approaches to implementing recommendation systems?
33. What are the evaluation metrics that can be used for multi-label classification?
34. What is the difference between concept drift and data drift and how to overcome each of them?
35. Can you explain the ARIMA model and its components?
36. What are the assumptions made by the ARIMA model?

---

## Deep Neural Networks
*(22 questions)*

37. What are autoencoders? Explain the different layers of autoencoders and mention three practical usages of them?
38. What is an activation function and discuss the use of an activation function? Explain three different types of activation functions?
39. You are using a deep neural network for a prediction task. After training your model, you notice that it is strongly overfitting the training set and that the performance on the test isn't good. What can you do to reduce overfitting?
40. Why should we use Batch Normalization?
41. How to know whether your model is suffering from the problem of Exploding Gradients?
42. Can you name and explain a few hyperparameters used for training a neural network?
43. Can you explain the parameter sharing concept in deep learning?
44. Describe the architecture of a typical Convolutional Neural Network (CNN)?
45. What is the Vanishing Gradient Problem in Artificial Neural Networks and how to fix it?
46. When it comes to training an artificial neural network, what could be the reason why the loss doesn't decrease in a few epochs?
47. Why are Sigmoid or Tanh not preferred to be used as the activation function in the hidden layer of the neural network?
48. Discuss in what context it is recommended to use transfer learning and when it is not.
49. Discuss the vanishing gradient in RNN and how it can be solved.
50. What are the main gates in LSTM and what are their tasks?
51. Is it a good idea to use CNN to classify 1D signals?
52. How does L1/L2 regularization affect a neural network?
53. How would you change a pre-trained neural network from classification to regression?
54. What might happen if you set the momentum hyperparameter too close to 1 (e.g., 0.9999) when using an SGD optimizer?
55. What are the hyperparameters that can be optimized for the batch normalization layer?
56. What is the effect of dropout on the training and prediction speed of your deep learning model?
57. What is the advantage of deep learning over traditional machine learning?
58. What is a depthwise separable layer and what are its advantages?

---

## Natural Language Processing
*(12 questions)*

59. What is a transformer architecture, and why is it widely used in natural language processing tasks?
60. Explain the key components of a transformer model.
61. What is self-attention, and how does it work in transformers?
62. What are the advantages of transformers over traditional sequence-to-sequence models?
63. How does the attention mechanism help transformers capture long-range dependencies in sequences?
64. What are the limitations of transformers, and what are some potential solutions?
65. How are transformers trained, and what is the role of pre-training and fine-tuning?
66. What is BERT (Bidirectional Encoder Representations from Transformers), and how does it improve language understanding tasks?
67. Describe the process of generating text using a transformer-based language model.
68. What are some challenges or ethical considerations associated with large language models?
69. Explain the concept of transfer learning and how it can be applied to transformers.
70. How can transformers be used for tasks other than natural language processing, such as computer vision?

---

## Computer Vision
*(10 questions)*

71. What is computer vision, and why is it important?
72. Explain the concept of image segmentation and its applications.
73. What is object detection, and how does it differ from image classification?
74. Describe the steps involved in building an image recognition system.
75. What are the challenges in implementing real-time object tracking?
76. Can you explain the concept of feature extraction in computer vision?
77. What is optical character recognition (OCR), and what are its main applications?
78. How does a convolutional neural network (CNN) differ from a traditional neural network in the context of computer vision?
79. What is the purpose of data augmentation in computer vision, and what techniques can be used?
80. Discuss some popular deep learning frameworks or libraries used for computer vision tasks.

---

## Technical Questions

### LLM Fundamentals
*(37 questions)*

81. How do LLMs work?
82. How do transformers work?
83. What is tokenization and how does it affect LLM performance?
84. What is the difference between pre-training and fine-tuning?
85. Explain context windows and their limitations.
86. What are scaling laws and why do they matter?
87. What is temperature and top-p sampling? How do they affect outputs?
88. Explain few-shot learning and chain-of-thought prompting.
89. What is KV cache? How does it help in LLM inference?
90. Can you describe the difference between GenAI and traditional programming in the context of solving a real-world problem?
91. How do you ensure the outputs from large language models are consistent and accurate, especially when dealing with complex multi-step workflows?
92. What's an RAG model? Explain the complete process.
93. What are embeddings?
94. How does chunking happen?
95. What is the difference between discriminative and generative models?
96. What is graph RAG? How does it differ from standard RAG?
97. What is reflection in the context of LLM agents?
98. Explain KL divergence.
99. What is the difference between symbolic and connectionist AI?
100. Describe the types of text summarization techniques and when you'd use each.
101. How do you do memory management and context management with LLMs?
102. What is the self-attention mechanism? How does it differ from multi-head attention?
103. What is grouped query attention and how does it differ from standard multi-head attention?
104. What are the differences between BPE, WordPiece, and character-level tokenization? What are the trade-offs?
105. Explain the difference between encoder-only, decoder-only, and encoder-decoder Transformer architectures. When would you use each?
106. Why are decoder-only models dominant even for non-generation tasks?
107. What is positional encoding and why is it needed in Transformers?
108. What are the key MMLU, BigBench, and HumanEval benchmarks? What does each measure and what are its limitations?
109. What is the difference between RLHF and DPO? When would you prefer one over the other?
110. What is Mixture of Experts (MoE)? How does it improve efficiency?
111. How do LLMs actually generate text? Explain the autoregressive decoding process.
112. What are decoding strategies like beam search, top-k, and top-p? When do you use each?
113. What is FlashAttention and how does it work?
114. Why is LLM inference memory-bounded?
115. How do stop sequences work in LLMs?
116. What is the context window and what happens when you exceed it? How do you handle long documents?
117. What risks arise from applying a general-purpose tokenizer to specialized domains like legal or medical text?

---

### RAG Systems
*(28 questions)*

118. Design a RAG system for a customer support chatbot. How do you evaluate it?
119. How would you design an LLM-powered enterprise search system?
120. Design a generative AI document-processing pipeline for unstructured data (emails, PDFs, images) to automate workflows like claims processing.
121. How would you use GPT-4 to generate accurate answers based on proprietary documents?
122. Design a generative QA assistant for your company's knowledge base.
123. You're making a system that processes huge PDF reports. How would you handle the problem of not keeping an entire report's context when splitting a document for a chatbot?
124. How would you efficiently generate and store embeddings for products and queries in a chatbot application?
125. How would you handle the problem of a model hallucinating when no information is found in the given context?
126. What retrieval-augmented generation (RAG) projects have you worked on?
127. Design a question-answering system over internal documentation.
128. How do you ensure the quality of data that an LLM interacts with?
129. Compare sparse vs. dense retrieval. When would you use each?
130. What are common RAG failure points and how do you debug them?
131. How do you protect sensitive/confidential data in a RAG pipeline?
132. What vector databases have you used? Which ones and why?
133. You have a financial report where page 1 says "all amounts in thousands." How do you handle document-wide context when chunking page by page?
134. What is hybrid search? When would you combine vector search with keyword search (BM25)?
135. What is re-ranking and why is it needed on top of vector retrieval? Explain cross-encoder vs. bi-encoder.
136. How do you scale a RAG system to 10M+ articles? Discuss sharding, caching, and retrieval optimization.
137. Your RAG system returns relevant documents but users still can't find the answer. How do you transform it from a search engine into an answer engine?
138. How do you evaluate a RAG pipeline? What metrics would you use? (NDCG, MRR, precision@k, recall)
139. How do you handle citations and source attribution in a RAG system?
140. How does Approximate Nearest Neighbor (ANN) search work? Explain HNSW indexing.
141. Where do embeddings fail? Discuss negation, temporal reasoning, and precision requirements.
142. What is semantic caching and how can it reduce cost and latency in a RAG system?
143. Design a RAG system that maintains context across multi-turn conversations.
144. What are the key tradeoffs when designing a RAG system (latency vs accuracy, chunk size vs context, cost vs quality)?
145. How do you optimize RAG latency in production?

---

### Agents and Tool Use
*(38 questions)*

146. What is an AI agent and what is its role in a broader system?
147. What's the difference between an agent and a simple LLM chain?
148. What makes an AI system truly agentic and what does not qualify?
149. When is an agentic architecture the wrong solution?
150. How do you define and enforce agent autonomy boundaries?
151. What are the essential components of an agent beyond an LLM?
152. How do you prevent agents from over-reasoning or over-planning?
153. Walk through a production-ready agent architecture.
154. What logic belongs in the orchestrator vs the LLM?
155. How do you design a safe and debuggable agent loop?
156. How do you implement termination conditions in long-running agents?
157. How do agents decompose high-level goals into executable steps?
158. Chain-of-thought vs tree-of-thought vs graph planning - when would you use each?
159. How do you detect and stop infinite planning loops?
160. How do you handle partial observability or missing information?
161. How do agents decide a task is "done"?
162. What planning failures are hardest to detect in production?
163. How do agents decide which tool to use?
164. How do you design tool schemas that reduce hallucinated actions?
165. How do you sandbox tool execution safely?
166. How do you handle tool failures, retries, and idempotency?
167. What are the biggest security risks with tool-using agents?
168. How do you control cost explosions from tool calls?
169. Stateless vs stateful agents - tradeoffs and use cases?
170. How do you version and roll back agent behavior?
171. Describe how you would architect an AI agent system, including the agent loop, tool interfaces, memory design, orchestration technologies, and safety considerations.
172. Design an agent analyzing customer support tickets, drafting responses, and escalating complex issues.
173. Create a system where agents collaborate on research reports with citations.
174. Build an agent reviewing code and suggesting improvements.
175. How do you explain agentic systems to non-technical stakeholders?
176. What types of memory do agentic systems need? Describe working, episodic, semantic, and procedural memory.
177. How do you design long-term memory without polluting it?
178. How do you implement human-in-the-loop (HIL) patterns and decide when to trigger human review?
179. How do you monitor and observe autonomous agent behavior in production?
180. How do you architect agents for regulated or compliance-heavy domains (e.g., financial, healthcare)?
181. When do you use orchestration vs choreography patterns for multi-agent systems?
182. How do you filter PII in agent pipelines before data reaches the LLM?
183. How do you evaluate agent performance? What metrics matter (tool selection quality, action advancement, context adherence)?

---

### Fine-tuning and Training
*(12 questions)*

184. When would you fine-tune vs use prompt engineering?
185. What is PEFT/LoRA and when would you use it?
186. What is QLoRA and how does it differ from LoRA? When would you choose one over the other?
187. What is RLHF and why is it important?
188. Fine-tune or use prompt-engineered RAG?
189. How would you design a model that can solve math problems? Walk through data collection, supervised fine-tuning, post-training, and evaluation.
190. How would you design a scalable and efficient system for training a large language model, considering both computational and data constraints?
191. Explain the RLHF pipeline: supervised fine-tuning, reward model training, and PPO. How does DPO simplify this?
192. What is instruction tuning and how does it differ from pre-training?
193. What is speculative decoding and how does it speed up inference?
194. How do you convert implicit user behavior (edits, acceptance, rejection) into training signals for model improvement?
195. Explain quantization. What are the trade-offs between model size, speed, and accuracy?

---

### Evaluation and Metrics
*(24 questions)*

196. What metrics do you consider when benchmarking and evaluating LLM performance?
197. How do you evaluate a chatbot?
198. How do you detect and mitigate hallucinations in production?
199. How would you prevent factual errors in a summarization system?
200. How would you reduce hallucinations in a medical chatbot?
201. What happens when the LLM is confidently wrong? How do you debug a RAG chatbot giving confident but wrong answers?
202. Explain SHAP, LIME, and model interpretability.
203. How do you detect and mitigate hallucinations?
204. Explain evaluation metrics: perplexity, ROUGE, BLEU. What are the pitfalls of n-gram-based metrics?
205. What are your testing strategies for non-deterministic outputs?
206. How do you measure accuracy in generative systems where traditional metrics don't apply?
207. What operational/business metrics matter for AI systems beyond accuracy? (win rate, deflection rate, p95 latency)
```
1. User Satisfaction - ( likes/ dislikes )
2. TTFT ( time to first token )
3. Latency, P95, P99
4. Cost per query
5. How often does the system failed
6. 
```

208. How would you evaluate and monitor a model in production, not just offline?

```
Monitoring Models in production:
1. Latency
2. Error rates
3. Failure model logging to debug the issue
4. Data Drift: are the responses are shifting away from what the model was trained on.
5. user's satisfaction: ( likes/dislikes, copy-paste)

Build an evaluation pipeline that samples production traffic runs LLM-as-judge scoring and detect the model's performance becomes worse than before.
```
209. How have you addressed bias/fairness in your models? Can you provide an example of a trade-off you've faced?
210. What is time to first token and why does it matter for user experience?
211. How do you measure hallucination rate in production?
212. What is "vibes-based" evaluation vs. a formal eval framework? How do you build proper evals?
213. How do you build a golden dataset for evaluation? How do you use it for regression testing?
214. How does the system get better over time? Describe feedback and reinforcement loops.
215. How do you decide success metrics for an ML model?
216. How would you implement A/B testing for different prompt variations?
217. How would you test a new model before full deployment? Describe A/B testing, canary, interleaved, and shadow testing strategies.
218. Two models have identical accuracy but different confidence levels. Which do you choose? Explain model calibration.
219. A production chatbot's accuracy dropped from 95% to 80% in six weeks. How do you diagnose the root cause before retraining?

---

### ML Fundamentals
*(18 questions)*

220. How do you approach data pre-processing and feature engineering?
221. Explain SQL versus NoSQL databases for AI workloads.
222. What steps would you take to diagnose performance bugs in a model?
223. Should you optimize for latency or throughput? (for a personal assistant with one request)
224. Should you use data parallelism for a single-request personal assistant? Why or why not?
225. Explain how Transformers work. Why are they foundational?
226. How would you handle real-time versus batch processing for data updates? When is one preferred over the other?
227. How do you ingest and process different types of data (structured, unstructured, event data)?
228. Explain the bias-variance tradeoff in simple terms.
229. Why are neural networks usually not the first choice for tabular data?
230. How do you handle imbalanced datasets in real projects?
231. Explain the difference between RNN and LSTM.
232. Debug a model that runs but doesn't learn. Identify broadcasting errors and dimension mismatches.
233. Statistics questions: probability, distributions, regression, Bayesian analysis, hypothesis testing.
234. Explain supervised vs. unsupervised learning. When would you use each?
235. What is regularization? Compare L1, L2, and dropout.
236. What is feature scaling and when is it necessary? Compare normalization vs standardization.
237. Implement cosine similarity in NumPy.

---

### Python and Software Engineering
*(18 questions)*

238. How do you handle race conditions in your code?
239. What is the Global Interpreter Lock (GIL) in Python?
240. What is something unique about Python when it comes to concurrency?
241. What are some problems you can run into when using asynchronous programming in Python?
242. What is Docker?
243. Why do we use Selenium?
244. Have you heard about Redis?
245. Explain the JavaScript event loop.
246. How do you call models via API/SDK? How do you handle retries, timeouts, and logging?
247. Which AI development platforms or tools do you regularly use, and why?
248. Explain memory leaks and garbage collection in Python.
249. What is the difference between class methods and static methods?
250. Explain super() and Method Resolution Order in multiple inheritance.
251. How do you debug Python code in production? "In production, there will be no VS Code."
252. How do you use asyncio for concurrent I/O in Python? When would you use threading vs. multiprocessing instead?
253. How do you optimize SQL queries? Explain the order of execution in SQL.
254. What are Git branching strategies for deployment? How do you perform a rebase? How do you handle merge conflicts?
255. Have you worked with real-time communication technologies like WebRTC?

---

### Infrastructure and MLOps
*(6 questions)*

256. How would you design a large-scale AI model deployment system?
257. How would you design a distributed training system for deep learning?
258. How would you design a scalable data pipeline for ML applications?
259. How would you design a GenAI system to handle traffic spikes without overwhelming the model provider?
260. How would you monitor production AI systems?
261. What are major scaling challenges for LLM-powered applications?

---

### Cost and Latency Optimization
*(17 questions)*

262. Your app gets 1M queries/day - how do you optimize cost?
263. How do you reduce token costs at scale?
264. How would you think about cost and capacity planning for an LLM-powered application at scale?
265. How would you make GPT-based API calls cost-efficient under heavy load?
266. How would you reduce token costs?
267. Explain quantization and model distillation for inference optimization.
268. Describe the latency/cost/relevancy tradeoff triangle in GenAI systems. How do you manage all three?
269. How do you reduce latency in GenAI applications?
270. Cost vs. quality trade-offs: when is a small open-source model "good enough" vs. GPT-4-class?
271. By trimming prompts and caching embeddings, how would you reduce API spend? Walk through a before-and-after cost breakdown.
272. Explain multi-layer caching strategies: retrieval cache, prompt cache, and response cache.
273. What is model tiering? When do you route to a small distilled model vs. a large LLM?
274. What is prompt compression and how does it reduce cost?
275. Latency vs. throughput optimization for LLM serving - what are the trade-offs?
276. How would you benchmark each LLM call in a multi-step pipeline to identify latency bottlenecks?
277. Estimate the budget for a RAG pipeline at enterprise scale (e.g., 300,000 legal contracts).
278. What's the real bottleneck in LLM serving throughput? How does PagedAttention address it?

---

### Safety and Guardrails
*(10 questions)*

279. When and how would you implement LLM guardrails?
280. How would you design a language model that minimizes harmful outputs while still being useful and expressive?
281. How would you build a system that detects whether content violates policy or contains offensive material?
282. How do you protect against prompt injection and jailbreaking?
283. What steps would you take to handle exceptions in a GenAI application?
284. Explain Constitutional AI and alignment considerations.
285. How do you handle data privacy and PII in prompts and logs?
286. How do you address bias in training data and generated content?
287. How do you red-team an LLM system?
288. Your application generates code that gets executed. How do you prevent malicious code generation and execution?

---

## System Design Questions

### AI System Design
*(54 questions)*

289. Design ChatGPT.
290. Design our Claude chat service.
291. Design a small language learning model that could run on a phone while making sure it's polite.
292. Here's a junior developer's design for an inference batching system. Can you review it and explain what you'd change or improve?
293. Design the OpenAI Playground - specifically the feature that lets developers simulate full conversations and threads.
294. Design a real-time chatbot API (low-latency handling, session management, concurrency, safety filters).
295. Design a Document Q&A Assistant.
296. Design a Hallucination-Free Banking Chatbot.
297. Design a Hospital Voice Assistant (handle noise, privacy, latency, domain vocabulary).
298. Design a Feedback Loop for Writing Tools.
299. Design a Legal Contract Generation system with compliance requirements.
300. Design an AI Search system scaling to 10M+ articles.
301. Design a Resume Classifier for Team Routing.
302. Design an AI-powered Candidate Sourcing System with 750M profiles, semantic search, and <500ms latency.
303. Scale an AI chat feature to 1M daily users - discuss trade-offs.
304. Design for 1M users (scale beyond prototype).
305. Design a system to process 10k user uploads per month (bank payslips, IDs, references). How would you extract data, detect inconsistencies, reject invalid files, and handle LLM provider downtime?
306. Design a system that lets doctors automatically send billing info to insurers based on patient notes.
307. Design a conversational recommender system that suggests products based on user preferences, combining chat, retrieval, and database layers.
308. Design a fast autocomplete system using LLMs.
309. Design an AI-powered legal assistant.
310. Build a generative resume builder with memory.
311. Create an internal Slack bot answering HR questions.
312. Design a GitHub Copilot-style JavaScript development tool.
313. Design an AI co-pilot like GitHub Copilot (real-time streaming completions).
314. Design a Midjourney/Stable Diffusion image generation service (queueing, GPU scheduling).
315. Design a Perplexity.ai / real-time LLM-powered search engine.
316. Design a Ghibli Image Generator (text prompt ingestion, model selection, GPU inference, cost throttling, safety filters).
317. Design a Dynamic Questionnaire Engine for an Insurance Platform (JSON-driven, frontend decision tree without backend calls).
318. Design a user profile system addressing storage, multi-device tracking, and preference flexibility. Optimize for 100 million users with batch migration.
319. Design a distributed search system capable of handling a billion documents and a million QPS, while also managing LLM inference for over 10,000 requests per second.
320. Design hybrid search combining traditional text retrieval with semantic similarity - top-k similar documents from a corpus of over 10M documents with a response time under 50ms.
321. Design a workflow to remove all dead links for hundreds of client websites assuming you have API access to overwrite their HTML.
322. How would you design the UX for an AI assistant that is often slow?
323. How would you surface model limitations or errors to users without breaking trust?
324. Design a scalable image-generation pipeline for millions of users.
325. How would you scale a generative content platform for millions of users?
326. Design an In-Memory Database with SET, GET, BEGIN, ROLLBACK, COMMIT, and nested transaction support.
327. Design an AI recommendation system.
328. Design a fraud detection system.
329. Design a chatbot architecture end-to-end (LLM + backend + data flow).
330. Design a distributed job queue for 100k+ GPU training jobs with preemption and checkpointing.
331. Design a temperature prediction system handling inconsistent global datasets (hybrid ML-LLM).
332. Design an end-to-end RAG service: data ingestion, indexing, retrieval, generation, evals, tracing, guardrails.
333. Design a rate-limiter and code the core part.
334. Scaling AI systems to millions of users: latency and cost trade-offs, batching, caching, streaming, failure modes.
335. Design ChatGPT's cross-conversation memory feature.
336. Design a multi-step agentic workflow (meeting scheduling, code review, email campaigns).
337. Design a content/policy violation detection system.
338. Design a unified query engine across dispersed data sources like email, calendar, documents, and chat.
339. How would you implement an AI application from start to finish, from kickoff meeting through deployment?
340. How would you design a scalable and reliable automation workflow? What considerations for error handling, monitoring, and debugging?
341. How would you handle real-time versus batch processing for data updates? When is one preferred over the other?
342. How do you ingest and process different types of data (structured, unstructured, event data)?

---

### Traditional System Design
*(24 questions)*

343. Design GitHub Actions.
344. Design Slack.
345. Design Online Chess.
346. Design a Payment System.
347. Design a Webhook Callback System.
348. Design TinyURL (Bitly).
349. Design Instagram / TikTok feed.
350. Design Twitter / X (timeline, posting, followers, trending topics).
351. Design YouTube / Netflix video streaming platform.
352. Design Uber (ride-sharing backend: matching, ETA, pricing surges).
353. Design WhatsApp / Messenger (1:1 + group chat at global scale).
354. Design a distributed key-value store (like DynamoDB / Cassandra).
355. Design Google Docs collaborative editing (real-time, eventually consistent).
356. Design Yelp / Google Maps nearby search.
357. Design a rate limiter (global, per-user, distributed).
358. Design Discord (voice + text chat, millions concurrent in voice channels).
359. Design Stripe payment processing system (high consistency, PCI compliance).
360. Design a distributed job scheduler (like AWS Batch at planetary scale).
361. Design a notification system that can send 1B notifications/day with <1% loss.
362. Design a strongly-consistent distributed database (Spanner / CockroachDB-like).
363. Design a high-frequency trading exchange matching engine.
364. Our p99 latency went from 50ms to 2s overnight - how would you debug and fix?
365. Design a global WebSocket service (10M+ concurrent connections).
366. Design a global feature flag / config service (multi-region, zero-downtime rollouts).

---

### System Troubleshooting
*(3 questions)*

367. A system's 95th percentile latency spiked from 100ms to 2000ms. Identify bottlenecks rapidly.
368. How would you handle a 10x traffic spike during a product launch?
369. What happens if your primary data center goes offline for six hours?

---

## Coding Problems

### LeetCode / Algorithm Style
*(16 questions)*

370. Word Search on Grid using Trie + DFS (LeetCode Medium).
371. LRU Cache with O(1) time complexity using HashMap + Doubly Linked List.
372. Prime numbers between 0 and 100.
373. Check whether two strings are anagrams of each other.
374. Serialize Binary Tree (space-optimized, discussion-based with compression techniques and backward compatibility).
375. LeetCode 2408: Design SQL.
376. LeetCode 981: Time Based Key-Value Store.
377. Unix cd command with symbolic link resolution.
378. Reverse a linked list with constraints (AI-assisted coding round - candidate must prompt LLM effectively).
379. Find the Excel column name from its column number (e.g., column 702 = "AAA").
380. Construct a tree from a list where index = node value and value = parent node (LC Medium).
381. CodeSignal GCA: 4 questions in 70 min - two medium-hard, one graph, one greedy with bit ops.
382. Union Find problem + AI question (use DistilBERT to categorize CSV text with sentiments, must pass 5 test cases checking embeddings length, output structure).
383. Write code for a banking application using HashMap/TreeMap. Design a task executor - store and pause tasks.
384. A gRPC service is timing out. Add an async boundary, handle failure modes (retries, dead letter queues, idempotency), scale with multi-threading or message queues.
385. Discuss serialization approaches, compression techniques, streaming formats, backward compatibility, and corruption recovery - no code written, pure discussion.

---

### OpenAI-Specific Coding
*(5 questions)*

386. KV Store Serialize/Deserialize.
387. In-Memory Database: Implement SQL-Like Operations.
388. Versioned key-value store implementation (Time Travel Hash variant).
389. Credits management system - track credit state across issued and used credits with different expiration rules and usage requirements, with increasing complexity.
390. Refactoring round: 100-120 lines of intentionally convoluted, deeply nested code. Refactor for long-term maintainability while keeping existing tests green and extending to new ones.

---

### Anthropic-Specific Coding
*(1 question)*

391. 4-level progressive coding assessment: Level 1 (SET/GET/DELETE), Level 2 (SCAN/SCAN_BY_PREFIX), Level 3 (timestamped operations + TTL), Level 4 (file compression/decompression with storage management).

---

### ML / AI Coding
*(16 questions)*

392. 1-NN (simplest KNN case) and feedforward neural network implementation.
393. Transformer bug-fixing exercise with position embedding and KV cache issues.
394. PyTorch code completion with complexity analysis.
395. Implement Multi-Head Attention from memory.
396. Implement a full Transformer layer from memory.
397. Implement LoRA adapter from scratch.
398. Implement efficient LLM API batch processing.
399. Debug code handling embeddings.
400. Write scripts preparing text for fine-tuning.
401. Build a gRPC service for financial report generation (async conversion, thread management, error handling, batch processing).
402. Implement neural networks, LSTMs, and RNNs from scratch using NumPy or PyTorch.
403. Implement cached attention and grouped query attention variants.
404. Implement beam search, top-k, and top-p decoding strategies from scratch.
405. Implement autoregressive generation with top-p sampling.
406. Implement logistic regression with SGD, L2 regularization, and early stopping in NumPy.
407. Implement stratified K-fold splitting.

---

### Practical / Data Processing
*(2 questions)*

408. Speed coding: given a complicated JSON file, extract a specific part following some pattern, then feed that to an AI model and get the summary. 30-minute time limit, browser/ChatGPT allowed.
409. Design a concurrent web crawler handling robots.txt, rate limiting, and circular references while maintaining data integrity and freshness.

---

## Behavioral Questions

### Project Deep Dives
*(13 questions)*

410. Walk me through an AI project you built end-to-end.
411. Tell me about a project you're most proud of, and what role you played?
412. What is your most challenging work in GenAI?
413. Describe a time you reduced hallucinations/cost in production.
414. Describe a time you had to optimize an existing process or workflow for efficiency or scalability.
415. Describe a challenging prompt engineering problem that you solved.
416. Is there an actual eval framework, or is it vibes-based?
417. Present a "proud" project to a panel: design decisions, trade-offs, what broke, and what you'd change.
418. Tell me about your past projects.
419. Tell me about a recent/favorite project and some of the difficulties you had.
420. Tell me about a technical challenge that you have overcome.
421. Tell me about the greatest accomplishment of your career.
422. What level of prompts have you written? What kind of projects did you work on?

---

### Conflict and Collaboration
*(12 questions)*

423. Give a specific example of conflict with another person, how resolution took form, and the rationale behind the choices you made.
424. How do you collaborate with non-technical stakeholders?
425. How do you manage workload in a distributed team?
426. Conflict handling.
427. Describe a time you disagreed with a team member about how to approach a problem. How did you handle it?
428. Tell me about a time you struggled to work with one of your colleagues.
429. Tell me about a time you handled a difficult stakeholder.
430. Tell me about a time you had to explain a complex technical concept to someone without a technical background.
431. Tell me about a time you convinced someone to change their mind.
432. What types of team members do you find difficult to work with?
433. Describe communication to resolve ambiguity.
434. Describe a time you had trouble communicating with stakeholders and how you overcame it.

---

### Leadership and Ownership
*(13 questions)*

435. Have you mentored teammates remotely?
436. Describe a time you drove technical decisions at scale and guided teams through complex challenges.
437. Describe a time you mentored engineers who went on to senior roles.
438. Tell me about a time you showed leadership.
439. Tell me about a time you led an initiative or took ownership of a challenging task.
440. Tell me about a time you took the initiative to solve a problem.
441. Tell me about a time when you made short-term sacrifices for long-term gains.
442. How do you prioritize tasks?
443. How do you lead under risk and uncertainty?
444. As a manager, how do you handle trade-offs?
445. How do you manage your team's career growth?
446. Tell me about a time when you worked on a project with a tight deadline.
447. Explain management style, execution strategy, and culture choices.

---

### Technical Decision-Making
*(13 questions)*

448. Which model provider do you prefer for creative writing tasks?
449. How do you compare AI coding assistants like Cursor, Windsurf, or Claude Code?
450. What recent AI paper or development caught your attention?
451. What side projects have you built with AI?
452. Why a particular storage solution over alternatives?
453. How did you decide which model to use for inference?
454. What frameworks are you familiar with? What have you built before?
455. Which models have you worked with? Which cloud providers are you familiar with?
456. Tell me about a time when you solved a complex problem and how you went about it.
457. Tell me about a time when a technical misjudgment led to a project delay. What did you learn?
458. What would you do if, midway through a project, you realized it was actually unfeasible?
459. Describe a time you had to quickly learn a new technology or methodology to complete a project.
460. How would you handle real-time versus batch processing for data updates? When is one preferred over the other?

---

### Failure and Learning
*(8 questions)*

461. Most challenging project.
462. What would you do differently?
463. Tell me about a time when you received negative feedback and how you handled it.
464. What's a mistake you made, and what did you learn from it?
465. Describe a project that didn't go as planned. What did you learn?
466. Describe a project where your AI solution failed and how you addressed it.
467. Why do you think we should NOT hire you?
468. Tell me about a time when you had to think outside the box to complete a task.

---

### AI-Specific Behavioral
*(10 questions)*

469. How do you stay updated with fast-changing AI tech?
470. How do you collaborate with non-technical stakeholders on AI features?
471. Can you give an example of a time when you addressed ethical concerns in an ML project?
472. Tell me about a time you made a safety-first decision in a project.
473. Tell me about a time you identified a major risk in an AI system - what did you do?
474. Describe a time you reduced cost or latency in a production AI system.
475. How do you manage ambiguity in ML projects where requirements and data evolve over time?
476. How do you use AI coding agents in your work?
477. Did you apply GenAI techniques to solve a problem not usually solved with GenAI?
478. Do you fact-check AI outputs or just trust them? How do you validate AI-generated content?

---

### Culture and Motivation
*(7 questions)*

479. Why OpenAI? / Why Microsoft? / Why this company?
480. Why change now?
481. Tell me about yourself.
482. Walk me through your resume.
483. Describe career decisions and culture fit.
484. How do you handle AI-safety conflicts with project goals?
485. Why do you want to pursue research?

---

### AI-Conducted Interview Follow-ups
*(4 questions)*

486. How would you handle edge cases?
487. What alternative approaches did you consider?
488. Time and space complexity analysis.
489. Why did you choose this specific data structure?

---

## Project Deep Dive

### Opening Questions
*(4 questions)*

490. Walk me through your most technically challenging project.
491. Walk me through a project you owned end-to-end. What were the key technical decisions?
492. Tell me about a project you're most proud of, and what role you played.
493. Tell me about a recent/favorite project and some of the difficulties you had.

---

### Follow-up Probes
*(12 questions)*

494. Why did you choose that particular storage/model/architecture over alternatives?
495. Is there an actual eval framework here, or is it vibes-based?
496. What alternative approaches did you consider, and why did you reject them?
497. How would you handle different requirements or scale constraints?
498. What would you do differently if you started this project over?
499. What was the most challenging technical decision and how did you make it?
500. Did the solution actually work? How do you know? What metrics did you track?
501. What were the trade-offs you made, and are you still comfortable with them?
502. How did you communicate technical decisions to stakeholders?
503. What would you explore next if you had more time?
504. How do you monitor the model post-deployment for drift or degradation?
505. What trade-offs did you make between retrieval speed vs. context length, fine-tuning vs. prompt engineering, GPU cost vs. latency?

---

## Take-Home Assignments

### RAG / Chatbot Systems
*(3 questions)*

506. Blood test report AI: Create a project that takes a blood test report in PDF format, understands medical issues, and provides suggestions by fetching them from online blog articles. Submit in a few hours.
507. Customer support RAG chatbot: Design a production-ready chatbot using open-source tools. Requirements: 100+ concurrent users, <2 second latency, grounded in company docs, cost-effective, analytics tracking.
508. Document Q&A system: Build a document Q&A system with citation tracking for multi-hop questions.

---

### Agent Systems
*(6 questions)*

509. Build an AI agent demonstrating natural interaction, agentic behavior, clear reasoning steps, and strong technical decision-making. 3-day window.
510. Customer email campaign agent: Build an agent reading customer CSV data and generating personalized email campaigns with evaluation metrics.
511. Code review agent: Implement a code review agent for Python files with actionable feedback.
512. Conversational Calendar Booking Agent: LangGraph/LangChain orchestration, Streamlit chat interface, FastAPI backend, Google Calendar integration via Service Accounts, function calling for booking logic.
513. Create a customer support agent relevant to the company's product within 1.5 hours. Red flag if candidate doesn't start with evals.
514. Build a simple autonomous agent using an open-source LLM with a task-specific goal and an observability/eval layer.

---

### Full-Stack AI Applications
*(2 questions)*

515. AI-First CRM: HCP Module - React/Redux frontend, FastAPI backend, LangGraph with 5+ tools (summarization, entity extraction). Models: gemma2-9b-it or llama-3.3-70b via Groq API. Deliverable: GitHub repo + 10-15 minute demo video. Expected time: ~60 hours.
516. Login page with validations: Create a login page accepting email and password with basic validations. Estimated 2-3 hours within a 2-3 day window.

---

### Evaluation
*(1 question)*

517. Build an evaluation tool for LLM hallucination detection.

---

### Performance / Optimization
*(1 question)*

518. Anthropic performance take-home: Code optimization for speed. 4-hour limit. Python workload simulating TPU-like operations. Tests low-level optimization skills.

---

### OpenAI-Specific
*(1 question)*

519. 48-hour technical project: Take-home assignment delivered day after recruiter call, 48-hour completion window. Practical coding, not puzzle-based.

---

### Red Flags (Unreasonable Assignments)
*(3 questions)*

520. 72-hour "Round 1" demanding full RAG + agents + UI.
521. Build an LLM agent to ingest years of financial reports with stock price analysis and chart generation using only freemium APIs. (Candidate withdrew, calling it "an unpaid mini-consulting project.")
522. 45 minutes for 3 complex tasks.

---

*Total: 522 questions*