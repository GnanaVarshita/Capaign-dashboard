const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'pages/tabs/POMasterTab.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Update distData state type
content = content.replace(
  /const \[distData, setDistData\] = useState<Record<string, Record<string, number>>>/,
  'const [distData, setDistData] = useState<Record<string, Record<string, Record<string, number>>>>()'
);

// 2. Update openDistribute function
const openDistribute = \const openDistribute = (region: string) => {
    if (!selected) return;
    setDistRegion(region);
    const existing = selected.allocations[region] || {};
    const d: Record<string, Record<string, Record<string, number>>> = {};
    products.forEach(p => {
      d[p] = {};
      crops.forEach(c => {
        d[p][c] = {};
        activities.forEach(a => { 
          d[p][c][a] = ((existing[p] || {})[c] || {})[a] || 0; 
        });
      });
    });
    setDistData(d);
    setShowDistModal(true);
  };\;

content = content.replace(
  /const openDistribute = \(region: string\) => \{[\s\S]*?setShowDistModal\(true\);\s*\};/,
  openDistribute
);

// 3. Update saveDistribution function
const saveDistribution = \const saveDistribution = () => {
    if (!selected) return;
    const newAlloc = { ...selected.allocations };
    newAlloc[distRegion] = {};
    Object.entries(distData).forEach(([p, crops_obj]) => {
      newAlloc[distRegion][p] = {};
      Object.entries(crops_obj).forEach(([c, acts]) => {
        newAlloc[distRegion][p][c] = {};
        Object.entries(acts).forEach(([a, v]) => { 
          if (v > 0) newAlloc[distRegion][p][c][a] = v; 
        });
      });
    });
    updatePO(selected.id, { allocations: newAlloc });
    setShowDistModal(false);
  };\;

content = content.replace(
  /const saveDistribution = \(\) => \{[\s\S]*?setShowDistModal\(false\);\s*\};/,
  saveDistribution
);

fs.writeFileSync(file, content, 'utf8');
console.log('✓ POMasterTab.tsx - Updated functions (openDistribute, saveDistribution)');
