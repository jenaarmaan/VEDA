// Source forensic agent – checks source credibility using domain type, and external APIs if available
import axios from 'axios';

/**
 * Checks the credibility of a given URL by analyzing its domain and optionally a reputation API.
 * @param url - URL of the source to analyze.
 */
export async function analyzeSourceForensics(url: string) {
  let credibility = 'Unknown';
  let domainType = 'Generic';
  let domain = '';

  try {
    domain = new URL(url).hostname;
    if (domain.endsWith('.gov')) domainType = 'Government';
    else if (domain.endsWith('.edu')) domainType = 'Educational';
    else if (domain.endsWith('.org')) domainType = 'Non-profit';
    else if (domain.endsWith('.news')) domainType = 'News';
    credibility = ['Government', 'Educational', 'News', 'Non-profit'].includes(domainType) ? 'High' : 'Moderate';

    // If you have an external reputation API, enable this:
    // const apiResp = await axios.get(`https://reputationapi.example.com/check?domain=${domain}`);
    // if (apiResp.data.reputationScore < 50) credibility = 'Low';
  } catch {
    return { domain: '', credibility: 'Invalid URL', domainType, notes: ['Malformed URL'] };
  }

  return {
    domain,
    credibility,
    domainType,
    notes: [`Domain is ${domain}`, `Type detected as ${domainType}`]
  };
}
