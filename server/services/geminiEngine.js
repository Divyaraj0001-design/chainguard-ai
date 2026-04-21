const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DISRUPTION_SYSTEM_PROMPT = `You are ChainGuard AI, an advanced supply chain risk intelligence engine built on Google Gemini.

Your role is to analyze real-time supply chain data and:
1. SCORE disruption risk on a scale of 0-100 (0=no risk, 100=critical disruption)
2. IDENTIFY specific risk factors with severity (low/medium/high/critical)
3. RECOMMEND optimal rerouting actions when risk > 40
4. PREDICT cascade effects on connected shipments
5. PROVIDE ETA adjustments based on current conditions

Risk scoring guidelines:
- 0-25: Normal operations
- 26-50: Monitor closely, minor delays possible
- 51-75: High risk, proactive rerouting recommended
- 76-100: Critical, immediate rerouting required

Always respond in valid JSON format only. No markdown, no explanation outside JSON.`;

// Helper: safe JSON parse — strips markdown fences if present
function safeParseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

// Helper: retry with exponential backoff for 503/429 errors
async function withRetry(fn, retries = 3, delayMs = 6000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err.message?.includes('503') || err.message?.includes('429') || err.message?.includes('overloaded');
      if (isRetryable && attempt < retries) {
        logger.warn(`Gemini attempt ${attempt} failed — retrying in ${(delayMs * attempt) / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs * attempt));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Analyzes a shipment for disruption risk using Gemini 2.5 Flash
 * @param {Object} shipmentData - Complete shipment context
 * @returns {Object} Analysis result with risk score, factors, and recommendations
 */
async function analyzeDisruptionRisk(shipmentData) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    });

    // Compact data to reduce token usage and prevent truncation
    const compactData = {
      id: shipmentData.id, name: shipmentData.name,
      origin: shipmentData.origin, destination: shipmentData.destination,
      status: shipmentData.status, priority: shipmentData.priority,
      category: shipmentData.category, eta: shipmentData.eta,
      weather: shipmentData.realTimeData?.weather?.condition,
      trafficCongestion: Math.round(shipmentData.realTimeData?.traffic?.congestionLevel || 0),
      portStatus: shipmentData.realTimeData?.portStatus?.status
    };

    const prompt = `${DISRUPTION_SYSTEM_PROMPT}

Analyze this shipment and return ONLY a compact JSON object (no markdown, no extra text):
${JSON.stringify(compactData)}

JSON structure: {"shipmentId":"str","riskScore":0,"riskLevel":"low|medium|high|critical","riskFactors":[{"type":"weather|traffic|port|customs|geopolitical|mechanical","severity":"low|medium|high|critical","description":"str","affectedSegment":"str","estimatedDelayHours":0}],"recommendations":[{"action":"reroute|hold|expedite|notify|monitor","priority":"immediate|high|medium|low","description":"str","alternateRoute":null,"estimatedTimeSaving":0}],"etaAdjustment":{"originalETA":"ISO","predictedETA":"ISO","delayHours":0,"confidence":0.8},"cascadeRisk":{"affectedShipments":0,"estimatedImpact":"str"},"aiInsight":"str","analyzedAt":"ISO"}`;

    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text();
    const parsed = safeParseJSON(text);
    parsed.analyzedAt = new Date().toISOString();
    logger.info(`Gemini analysis complete for shipment ${shipmentData.id} — Risk: ${parsed.riskScore}`);
    return parsed;
  } catch (err) {
    logger.error('Gemini disruption analysis error:', err.message);
    // Return a safe fallback
    return {
      shipmentId: shipmentData.id,
      riskScore: 50,
      riskLevel: 'medium',
      riskFactors: [{ type: 'mechanical', severity: 'medium', description: 'AI analysis unavailable — manual review recommended', affectedSegment: 'unknown', estimatedDelayHours: 0 }],
      recommendations: [{ action: 'monitor', priority: 'medium', description: 'Manual review required — AI engine temporarily unavailable', alternateRoute: null, estimatedTimeSaving: 0 }],
      etaAdjustment: { originalETA: shipmentData.eta, predictedETA: shipmentData.eta, delayHours: 0, confidence: 0 },
      cascadeRisk: { affectedShipments: 0, estimatedImpact: 'Unknown' },
      aiInsight: 'AI analysis temporarily unavailable. Please perform manual review.',
      analyzedAt: new Date().toISOString()
    };
  }
}

/**
 * Batch analyze multiple shipments concurrently
 */
async function batchAnalyzeShipments(shipments) {
  const batchSize = 5; // Respect Gemini rate limits
  const results = [];

  for (let i = 0; i < shipments.length; i += batchSize) {
    const batch = shipments.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(s => analyzeDisruptionRisk(s))
    );
    results.push(...batchResults.map((r, idx) =>
      r.status === 'fulfilled' ? r.value : { shipmentId: batch[idx].id, error: r.reason?.message }
    ));
    // Rate limit: wait 1s between batches
    if (i + batchSize < shipments.length) await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

/**
 * Generate an optimal alternate route recommendation
 */
async function generateRerouteRecommendation(shipmentData, disruptionContext, availableRoutes) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: 'application/json' }
    });

    const prompt = `You are ChainGuard AI rerouting engine. Select the optimal alternate route.

DISRUPTED SHIPMENT: ${JSON.stringify(shipmentData, null, 2)}
DISRUPTION CONTEXT: ${JSON.stringify(disruptionContext, null, 2)}
AVAILABLE ROUTES: ${JSON.stringify(availableRoutes, null, 2)}

Return JSON:
{
  "selectedRoute": { "id": "string", "name": "string", "reason": "string" },
  "timeSavingHours": number,
  "costImpact": "savings|neutral|additional_cost",
  "costDelta": number,
  "confidence": number (0-1),
  "executionSteps": ["string"],
  "driverInstructions": "string",
  "estimatedNewETA": "ISO date string"
}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    logger.error('Reroute recommendation error:', err);
    throw err;
  }
}

/**
 * Generate global supply chain health summary
 */
async function generateSupplyChainSummary(allShipmentsData) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
    });

    const prompt = `As ChainGuard AI, provide a comprehensive supply chain health report for ${allShipmentsData.length} active shipments.

DATA SUMMARY: ${JSON.stringify({
  totalShipments: allShipmentsData.length,
  criticalRisk: allShipmentsData.filter(s => s.riskScore > 75).length,
  highRisk: allShipmentsData.filter(s => s.riskScore > 50 && s.riskScore <= 75).length,
  mediumRisk: allShipmentsData.filter(s => s.riskScore > 25 && s.riskScore <= 50).length,
  lowRisk: allShipmentsData.filter(s => s.riskScore <= 25).length,
  averageRisk: allShipmentsData.reduce((a, s) => a + (s.riskScore || 0), 0) / allShipmentsData.length,
  topRisks: allShipmentsData.sort((a, b) => b.riskScore - a.riskScore).slice(0, 3)
}, null, 2)}

Write a 3-paragraph executive summary in clear English covering: overall health, key threats, and recommended actions.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error('Summary generation error:', err);
    return 'Supply chain health summary temporarily unavailable.';
  }
}

module.exports = { analyzeDisruptionRisk, batchAnalyzeShipments, generateRerouteRecommendation, generateSupplyChainSummary };
