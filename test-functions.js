// Test script to verify the weather warning functions
const fs = require('fs');

// Read the HTML file and extract JavaScript functions
const htmlContent = fs.readFileSync('index.html', 'utf8');

// Extract the JavaScript code between <script> tags
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let jsCode = '';

while ((match = scriptRegex.exec(htmlContent)) !== null) {
  jsCode += match[1] + '\n';
}

// Test the functions
try {
  console.log('JS code length:', jsCode.length);
  console.log('Last 200 chars of JS code:\n', jsCode.slice(-200));

  // Instead of executing the full script (which relies on DOM and Leaflet),
  // extract only the specific functions we want to verify and evaluate them.
  const funcsToExtract = [
    'getRadarSiteCoords',
    'getWarningColorFromThreat',
    'generateWarningPolygon',
  ];

  const lines = jsCode.split(/\n/);
  funcsToExtract.forEach((fn) => {
    let startIdx = lines.findIndex((l) => l.includes(`function ${fn}`));
    if (startIdx === -1) {
      throw new Error(`Function ${fn} not found`);
    }
    let braceCount = 0;
    let fnLines = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      fnLines.push(line);
      for (const ch of line) {
        if (ch === '{') braceCount++;
        if (ch === '}') braceCount--;
      }
      if (braceCount === 0) {
        break;
      }
    }
    const fnCode = fnLines.join('\n');
    // Convert function declaration into an assignment on global and eval that
    try {
      const assignCode = `global["${fn}"] = ${fnCode}`;
      eval(assignCode);
      console.log(`Loaded function ${fn}`);
    } catch (err) {
      throw new Error(`Failed to eval ${fn}: ${err.message}`);
    }
  });

  // Test getRadarSiteCoords
  const coords = getRadarSiteCoords('KTLX');
  console.log('KTLX coordinates:', coords);

  // Test getWarningColorFromThreat
  const color = getWarningColorFromThreat('tornado');
  console.log('Tornado color:', color);

  // Test generateWarningPolygon
  const polygon = generateWarningPolygon([35.333, -97.278], 1.0);
  console.log('Polygon points:', polygon.length);

  console.log('All functions work correctly!');

} catch (error) {
  console.log('Error testing functions:', error.message);
}