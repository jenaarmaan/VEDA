<h1 align="center">🚀 VEDA – Verification & Evidence-Driven Agentic AI System</h1>
<p align="center">A real-time, explainable, multi-agent AI platform for misinformation detection.</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Agentic%20System-blue" />
  <img src="https://img.shields.io/badge/Tech-Firebase%20%7C%20Vercel%20%7C%20Genkit-orange" />
  <img src="https://img.shields.io/badge/LLM-Gemini%20%2F%20GPT-green" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
</p>

---

## 📌 Overview

VEDA is an AI-powered, real-time verification system designed to detect misinformation, generate evidence-backed explanations, and streamline reporting to civic authorities.  
It unifies multi-agent AI, semantic search, OCR, credibility scoring, and explainable decisioning into a single transparent ecosystem.

Users can verify **text, URLs, and images** from the dashboard or via a **one-click Chrome Extension**.  
Authorities receive structured case reports, evidence chains, and escalation-ready insights.

---

## 🧨 Problem Statement

Misinformation — especially in **finance, health, and public safety** — is spreading rapidly across digital platforms.

Existing verification systems are:

- ❌ Slow  
- ❌ Manual  
- ❌ Fragmented  
- ❌ Non-explainable  

There is *no unified mechanism* to detect misleading content, validate claims in real time, or escalate cases to authorities.

**VEDA solves this using a transparent, AI-driven verification framework that protects citizens and strengthens institutional trust.**

---

## 🎯 Objectives

- Detect and analyze misinformation in real time  
- Provide explainable, evidence-backed verdicts  
- Empower users with trustworthy insights  
- Support agencies with structured case management  
- Build a scalable national verification ecosystem  

---

## ⭐ Key Features

### 🔹 1. One-Click Browser Verification  
Right-click → verify any text or URL instantly.

### 🔹 2. Civic User Dashboard  
Submit content, view results, and track verification history.

### 🔹 3. Real-Time AI Analysis  
Uses **Gemini/GPT** for reasoning, validation, and classification.

### 🔹 4. Explainable Outputs  
Each verdict includes:  
- Confidence score  
- Evidence trace  
- Source mapping  
- Reasoning  

### 🔹 5. Multi-Modal Input  
Text • URLs • Images (OCR)  
(Video coming soon)

### 🔹 6. Reporting & Escalation  
Automatic case reports for authorities.

### 🔹 7. Multi-Agent AI Architecture  
- Verification Agent  
- Forensic Agent  
- Education Agent  
- Escalation Agent  

### 🔹 8. Evidence Graphs  
Visual chain → *claim → evidence → source → verdict*

---

## 🏗️ System Architecture

### **Input Layer**
- Text / URL input  
- Image upload (OCR)  
- Chrome Extension input  

### **Processing Layer**
- API Gateway  
- Firebase Authentication  
- Genkit Orchestrator  
- Verification Engine  
- Semantic Search (FAISS / Pinecone)  
- Trusted Sources Database  
- LLM Reasoning  
- OCR Engine  

### **Action Layer**
- Explainable verdicts  
- Case reports  
- Email notifications  
- Authority dashboards  
- Investigation workflow  

---

## 🧠 Process Flow Diagram (SQL ASCII)

<details>
<summary>📂 Click to Expand</summary>

```sql
+----------------------+
|      INPUT LAYER     |
+----------------------+
        |    |    |
        |    |    +-----------------------------+
        |    |                                  |
        |    +----------+                       |
        |               |                       |
+---------------+ +-------------+ +------------------------+
| Text / URL In | | Image (OCR) | | Chrome Extension Input |
+---------------+ +-------------+ +------------------------+
        \             |                   /
         \            |                  /
          \           |                 /
           \          |                /
            \         |               /
             \        |              /
              \       |             /
               \      |            /
                +----------------------+
                |   API GATEWAY       |
                +----------------------+
                          |
                          v
              +------------------------+
              | AUTHENTICATION         |
              |      (Firebase)        |
              +------------------------+
                          |
                          v
+----------------------------------------------------+
|                PROCESSING LAYER                    |
+----------------------------------------------------+
                          |
                          v
                +--------------------+
                | GENKIT ORCHESTRATOR|
                +--------------------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
+----------------+ +----------------+ +----------------+
| Verification   | | Semantic Search| | OCR/Text       |
| Engine         | | (FAISS/Pinecone)| | Normalization |
+----------------+ +----------------+ +----------------+
          |               |               |
          +---------------+---------------+
                          |
                          v
               +-----------------------+
               | LLM Reasoning (Gemini)|
               +-----------------------+
                          |
                          v
+--------------------------------------------------+
|                ACTION LAYER                      |
+--------------------------------------------------+
                          |
                          v
        +------------------------+------------------------+
        |                        |                        |
        v                        v                        v
+----------------+     +---------------------+   +-----------------------+
| User Verdict & |     | Case Report Gen     |   | Authority Escalation |
| Explanation    |     | (Email/Notification)|   | Workflow             |
+----------------+     +---------------------+   +-----------------------+
        |                        |                        |
        +------------+-----------+-----------+-----------+
                     |                       |
                     v                       v
         +----------------------+   +----------------------+
         | User Dashboard       |   | Agency Dashboard     |
         | (History/Evidence)   |   | (Monitoring, Actions)|
         +----------------------+   +----------------------+
