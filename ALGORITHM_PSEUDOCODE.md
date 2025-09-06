# VEDA Content Analysis Agent - Algorithm Pseudocode

## Workflow Overview

```
INPUT: Free-form text content
OUTPUT: Detailed analysis report with claims, evidence, and confidence scores

1. INPUT_PROCESSING_AND_CLAIM_DETECTION
2. PARALLEL_QUERYING_OF_EXTERNAL_APIS
3. AGGREGATION_OF_SOURCE_SIGNALS
4. EXPLANATION_GENERATION_WITH_TIMELINE
```

## 1. Input Processing and Claim Detection

```pseudocode
FUNCTION extractClaims(text: string) -> List[Claim]:
    claims = []
    
    // Initialize NLP pipeline
    nlp_model = initialize_nlp_model()
    doc = nlp_model.process(text)
    
    // Extract named entities
    entities = doc.extract_entities()
    FOR each entity in entities:
        IF isSignificantEntity(entity):
            claim = createClaim(
                text: entity.text,
                type: mapEntityType(entity.type),
                confidence: calculateEntityConfidence(entity),
                context: extractContext(text, entity.position)
            )
            claims.append(claim)
    
    // Extract pattern-based claims
    patterns = [
        "(\d+)\s+(people|persons?)\s+(died|killed|injured)",
        "(in|at)\s+([A-Z][a-z]+)\s+(.*?)",
        "(fire|explosion|accident)\s+(in|at)\s+([A-Z][a-z]+)",
        "(yesterday|today|last\s+week)\s+(.*?)",
        "(\d+(?:\.\d+)?%?)\s+(of|out\s+of)\s+(.*?)"
    ]
    
    FOR each pattern in patterns:
        matches = regex.findall(pattern, text)
        FOR each match in matches:
            claim = createClaim(
                text: match.text,
                type: CLAIM,
                confidence: calculatePatternConfidence(pattern, match),
                context: extractContext(text, match.position)
            )
            claims.append(claim)
    
    // Extract dependency-based claims
    sentences = doc.extract_sentences()
    FOR each sentence in sentences:
        IF isFactualStatement(sentence):
            claim = createClaim(
                text: sentence.text,
                type: CLAIM,
                confidence: calculateDependencyConfidence(sentence),
                context: extractContext(text, sentence.position)
            )
            claims.append(claim)
    
    // Deduplicate claims
    unique_claims = deduplicateClaims(claims)
    
    RETURN unique_claims

FUNCTION isSignificantEntity(entity) -> boolean:
    insignificant_words = ["the", "a", "an", "and", "or", "but"]
    IF entity.text.lower() in insignificant_words:
        RETURN false
    
    significant_types = [PERSON, ORGANIZATION, LOCATION, EVENT, DATE, NUMBER]
    RETURN entity.type in significant_types

FUNCTION calculateEntityConfidence(entity) -> float:
    base_confidence = 0.5
    
    // Boost confidence for specific entity types
    type_boosts = {
        PERSON: 0.2,
        LOCATION: 0.15,
        ORGANIZATION: 0.1,
        DATE: 0.1,
        NUMBER: 0.2
    }
    
    confidence = base_confidence + type_boosts.get(entity.type, 0)
    
    // Boost confidence for longer entities
    IF entity.text.length > 10:
        confidence += 0.1
    
    RETURN min(confidence, 1.0)
```

## 2. Parallel Querying of External APIs

```pseudocode
FUNCTION checkClaim(claim: string) -> List[Evidence]:
    evidence = []
    
    // Create parallel API calls
    api_promises = [
        checkWithGemini(claim),
        checkWithIndiaFactCheck(claim)
    ]
    
    // Execute all API calls in parallel
    results = await Promise.allSettled(api_promises)
    
    FOR each result in results:
        IF result.status == "fulfilled":
            evidence.extend(result.value)
        ELSE:
            // Add fallback evidence for failed API calls
            fallback_evidence = createFallbackEvidence(claim, result.error)
            evidence.append(fallback_evidence)
    
    RETURN evidence

FUNCTION checkWithGemini(claim: string) -> List[Evidence]:
    prompt = buildGeminiPrompt(claim)
    
    response = await gemini_client.post("/v1/models/gemini-pro:generateContent", {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 1024
        }
    })
    
    evidence = parseGeminiResponse(response.data, claim)
    RETURN evidence

FUNCTION checkWithIndiaFactCheck(claim: string) -> List[Evidence]:
    response = await india_fact_check_client.post("/api/v1/fact-check", {
        query: claim,
        language: "en",
        limit: 5
    })
    
    evidence = parseIndiaFactCheckResponse(response.data, claim)
    RETURN evidence

FUNCTION buildGeminiPrompt(claim: string) -> string:
    RETURN """
    Please fact-check the following claim and provide a detailed analysis:
    
    Claim: "{claim}"
    
    Please provide:
    1. Verdict: TRUE, FALSE, UNCERTAIN, PARTIALLY_TRUE, or MISLEADING
    2. Confidence score (0.0 to 1.0)
    3. Brief explanation of your reasoning
    4. Any relevant context or additional information
    
    Format your response as JSON with the following structure:
    {
        "verdict": "VERDICT_TYPE",
        "confidence": 0.0-1.0,
        "explanation": "Your explanation here",
        "context": "Additional context if available"
    }
    """

FUNCTION parseGeminiResponse(response, original_claim) -> List[Evidence]:
    content = response.candidates[0].content.parts[0].text
    json_match = regex.search(r'\{[\s\S]*\}', content)
    
    IF json_match:
        parsed = json.loads(json_match.group())
        evidence = [{
            source: "Gemini AI",
            sourceType: MAJOR_NEWS,
            timestamp: current_time(),
            verdict: mapVerdict(parsed.verdict),
            confidenceScore: parsed.confidence,
            title: f"Gemini Analysis: {original_claim}",
            summary: parsed.explanation,
            rawResponse: response
        }]
        RETURN evidence
    ELSE:
        RETURN [createFallbackEvidence(original_claim, "Gemini AI")]
```

## 3. Aggregation of Source Signals

```pseudocode
FUNCTION aggregateConfidence(evidence: List[Evidence]) -> AggregatedConfidence:
    IF evidence.length == 0:
        RETURN createEmptyConfidence()
    
    // Group evidence by source type
    evidence_by_source = groupEvidenceBySource(evidence)
    
    breakdown = []
    total_weighted_score = 0
    total_weight = 0
    
    FOR each (source_type, source_evidence) in evidence_by_source.items():
        source_weight = getSourceWeight(source_type)
        source_score = calculateSourceScore(source_evidence)
        weighted_score = source_weight * source_score
        
        breakdown.append({
            sourceType: source_type,
            weight: source_weight,
            score: source_score,
            contribution: weighted_score
        })
        
        total_weighted_score += weighted_score
        total_weight += source_weight
    
    // Calculate final confidence score
    final_score = total_weighted_score / total_weight IF total_weight > 0 ELSE 0
    final_score = clamp(final_score, 0, 1)
    
    // Generate reasoning
    reasoning = generateReasoning(breakdown, final_score, evidence)
    
    RETURN {
        finalScore: final_score,
        breakdown: breakdown,
        reasoning: reasoning
    }

FUNCTION calculateSourceScore(source_evidence: List[Evidence]) -> float:
    IF source_evidence.length == 0:
        RETURN 0
    
    // Convert verdicts to numerical scores
    verdict_scores = {
        TRUE: 1.0,
        PARTIALLY_TRUE: 0.6,
        UNCERTAIN: 0.5,
        MISLEADING: 0.3,
        FALSE: 0.0
    }
    
    // Calculate weighted average based on confidence scores
    total_confidence = sum(ev.confidenceScore for ev in source_evidence)
    weighted_sum = sum(
        verdict_scores[ev.verdict] * ev.confidenceScore 
        for ev in source_evidence
    )
    
    RETURN weighted_sum / total_confidence IF total_confidence > 0 ELSE 0

FUNCTION getSourceWeight(source_type: SourceType) -> float:
    weights = {
        OFFICIAL: 1.0,
        MAJOR_NEWS: 0.8,
        BLOG: 0.6,
        SOCIAL_MEDIA: 0.5,
        UNKNOWN: 0.3
    }
    RETURN weights[source_type]

FUNCTION generateReasoning(breakdown, final_score, evidence) -> string:
    reasoning_parts = []
    
    // Add overall assessment
    IF final_score >= 0.8:
        reasoning_parts.append("High confidence in the claim based on multiple reliable sources.")
    ELIF final_score >= 0.6:
        reasoning_parts.append("Moderate confidence in the claim with some supporting evidence.")
    ELIF final_score >= 0.4:
        reasoning_parts.append("Low confidence due to limited or conflicting evidence.")
    ELSE:
        reasoning_parts.append("Very low confidence due to insufficient or contradictory evidence.")
    
    // Add source-specific reasoning
    source_counts = countSourcesByType(evidence)
    source_descriptions = []
    
    FOR each (source_type, count) in source_counts.items():
        weight = getSourceWeight(source_type)
        source_name = getSourceTypeName(source_type)
        
        IF weight >= 0.8:
            credibility = "high credibility"
        ELIF weight >= 0.6:
            credibility = "moderate credibility"
        ELSE:
            credibility = "lower credibility"
        
        source_descriptions.append(f"{count} {source_name} source{'s' if count > 1 else ''} ({credibility})")
    
    IF source_descriptions:
        reasoning_parts.append(f"Evidence gathered from: {', '.join(source_descriptions)}.")
    
    // Add temporal analysis
    temporal_analysis = analyzeTemporalPatterns(evidence)
    IF temporal_analysis:
        reasoning_parts.append(temporal_analysis)
    
    // Add conflict analysis
    conflict_analysis = analyzeConflicts(evidence)
    IF conflict_analysis:
        reasoning_parts.append(conflict_analysis)
    
    RETURN ' '.join(reasoning_parts)
```

## 4. Explanation Generation with Timeline

```pseudocode
FUNCTION generateClaimReport(claim, evidence, confidence_breakdown, processing_time) -> AnalysisReport:
    final_verdict = determineFinalVerdict(evidence, confidence_breakdown)
    timeline = createEvidenceTimeline(evidence)
    explanation = generateExplanation(claim, evidence, confidence_breakdown, final_verdict)
    
    RETURN {
        claimId: claim.id,
        claimText: claim.text,
        finalVerdict: final_verdict,
        confidenceScore: confidence_breakdown.finalScore,
        evidence: evidence,
        confidenceBreakdown: confidence_breakdown,
        timeline: timeline,
        explanation: explanation,
        processingTime: processing_time,
        timestamp: current_time()
    }

FUNCTION determineFinalVerdict(evidence, confidence_breakdown) -> Verdict:
    IF evidence.length == 0:
        RETURN UNCERTAIN
    
    // Group evidence by verdict
    verdict_counts = countVerdicts(evidence)
    
    // If confidence is very low, return uncertain
    IF confidence_breakdown.finalScore < 0.3:
        RETURN UNCERTAIN
    
    // Find the most common verdict
    most_common_verdict = max(verdict_counts.items(), key=lambda x: x[1])[0]
    unique_verdicts = len(verdict_counts)
    
    // If there's a tie or mixed evidence, consider confidence
    IF unique_verdicts > 1:
        // Check for conflicting evidence
        IF TRUE in verdict_counts AND FALSE in verdict_counts:
            RETURN most_common_verdict IF confidence_breakdown.finalScore > 0.6 ELSE UNCERTAIN
        
        // Check for partial truth
        IF PARTIALLY_TRUE in verdict_counts:
            RETURN PARTIALLY_TRUE
    
    RETURN most_common_verdict

FUNCTION createEvidenceTimeline(evidence) -> List[Evidence]:
    // Sort evidence by timestamp (newest first)
    sorted_evidence = sorted(evidence, key=lambda ev: ev.timestamp, reverse=True)
    
    // Limit timeline items
    max_timeline_items = 20
    RETURN sorted_evidence[:max_timeline_items]

FUNCTION generateExplanation(claim, evidence, confidence_breakdown, final_verdict) -> string:
    explanation_parts = []
    
    // Add claim context
    explanation_parts.append(f'Analysis of claim: "{claim.text}"')
    
    // Add verdict explanation
    verdict_explanation = getVerdictExplanation(final_verdict, confidence_breakdown.finalScore)
    explanation_parts.append(verdict_explanation)
    
    // Add evidence summary
    IF evidence.length > 0:
        evidence_summary = getEvidenceSummary(evidence)
        explanation_parts.append(evidence_summary)
    ELSE:
        explanation_parts.append("No evidence was found to verify this claim.")
    
    // Add confidence reasoning
    explanation_parts.append(confidence_breakdown.reasoning)
    
    // Add source analysis
    source_analysis = getSourceAnalysis(evidence)
    IF source_analysis:
        explanation_parts.append(source_analysis)
    
    // Add temporal analysis
    temporal_analysis = getTemporalAnalysis(evidence)
    IF temporal_analysis:
        explanation_parts.append(temporal_analysis)
    
    RETURN ' '.join(explanation_parts)

FUNCTION getVerdictExplanation(verdict, confidence) -> string:
    confidence_level = "high" IF confidence >= 0.8 ELSE "moderate" IF confidence >= 0.6 ELSE "low" IF confidence >= 0.4 ELSE "very low"
    
    verdict_explanations = {
        TRUE: f"The claim appears to be TRUE with {confidence_level} confidence.",
        FALSE: f"The claim appears to be FALSE with {confidence_level} confidence.",
        PARTIALLY_TRUE: f"The claim is PARTIALLY TRUE with {confidence_level} confidence. Some aspects are accurate while others may be misleading.",
        MISLEADING: f"The claim is MISLEADING with {confidence_level} confidence. While it may contain some truth, it presents information in a deceptive manner.",
        UNCERTAIN: f"The claim is UNCERTAIN with {confidence_level} confidence. Insufficient or conflicting evidence makes it difficult to determine accuracy."
    }
    
    RETURN verdict_explanations[verdict]

FUNCTION analyzeTemporalPatterns(evidence) -> string:
    IF evidence.length < 2:
        RETURN null
    
    timestamps = [ev.timestamp for ev in evidence]
    oldest = min(timestamps)
    newest = max(timestamps)
    time_span = newest - oldest
    days_span = time_span.total_seconds() / (24 * 3600)
    
    IF days_span > 30:
        RETURN "Evidence spans over a month, indicating this is an evolving story with multiple updates."
    ELIF days_span > 7:
        RETURN "Evidence spans over a week, showing recent developments in the story."
    ELIF days_span > 1:
        RETURN "Evidence spans multiple days, suggesting ongoing updates to the information."
    ELSE:
        RETURN "All evidence is from the same day, indicating immediate reporting of the event."

FUNCTION analyzeConflicts(evidence) -> string:
    verdict_counts = countVerdicts(evidence)
    unique_verdicts = len(verdict_counts)
    
    IF unique_verdicts > 2:
        RETURN "Conflicting evidence from multiple sources with different verdicts."
    ELIF unique_verdicts == 2:
        verdicts = list(verdict_counts.keys())
        IF TRUE in verdicts AND FALSE in verdicts:
            RETURN "Directly conflicting evidence between true and false verdicts."
        ELIF UNCERTAIN in verdicts:
            RETURN "Mixed evidence with some sources uncertain."
    
    RETURN null
```

## Main Orchestration Algorithm

```pseudocode
FUNCTION analyzeContent(input_text: string) -> ContentAnalysisResult:
    start_time = current_time()
    
    TRY:
        // Step 1: Extract claims from input text
        claims = await extractClaims(input_text)
        
        IF claims.length == 0:
            RETURN createEmptyResult(input_text, current_time() - start_time)
        
        // Step 2: Fact-check each claim in parallel
        evidence_arrays = await factCheckClaims(claims)
        
        // Step 3: Generate analysis reports for each claim
        reports = await generateReports(claims, evidence_arrays)
        
        // Step 4: Create final result
        result = generateContentAnalysisResult(
            input_text, claims, reports, current_time() - start_time
        )
        
        RETURN result
        
    CATCH error:
        RETURN createErrorResult(input_text, error, current_time() - start_time)

FUNCTION factCheckClaims(claims) -> List[List[Evidence]]:
    claim_texts = [claim.text for claim in claims]
    RETURN await factChecker.checkClaims(claim_texts)

FUNCTION generateReports(claims, evidence_arrays) -> List[AnalysisReport]:
    reports = []
    
    FOR i in range(len(claims)):
        claim = claims[i]
        evidence = evidence_arrays[i] IF i < len(evidence_arrays) ELSE []
        
        TRY:
            // Aggregate confidence from evidence
            confidence_breakdown = confidenceAggregator.aggregateConfidence(evidence)
            
            // Generate report
            report = reportGenerator.generateClaimReport(
                claim, evidence, confidence_breakdown, 0
            )
            reports.append(report)
            
        CATCH error:
            // Create fallback report
            fallback_report = createFallbackReport(claim, evidence)
            reports.append(fallback_report)
    
    RETURN reports
```

## Key Algorithm Features

1. **Parallel Processing**: API calls are executed concurrently for better performance
2. **Weighted Scoring**: Source credibility is factored into confidence calculations
3. **Temporal Analysis**: Evidence is analyzed chronologically to detect evolving information
4. **Conflict Detection**: Conflicting evidence is identified and handled appropriately
5. **Fallback Mechanisms**: Failed API calls result in fallback evidence rather than complete failure
6. **Explainable AI**: All decisions include detailed reasoning and explanations
7. **Deduplication**: Similar claims are merged to avoid redundancy
8. **Confidence Clamping**: All confidence scores are bounded between 0 and 1