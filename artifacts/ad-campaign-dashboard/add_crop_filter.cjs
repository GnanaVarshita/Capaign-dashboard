const fs = require("fs");
const path = "src/pages/tabs/BudgetRequestTab.tsx";
let content = fs.readFileSync(path, "utf8");

// Check if crop filter UI already exists
if (!content.includes("Crop Filter")) {
  // Find the Activity Filter block end
  const insertMarker = `            </div>

            {/* Region Filter (for ZM, RM) */}`;
  
  const cropFilterUI = `            </div>

            {/* Crop Filter */}
            <div>
              <Label className="text-xs font-bold">Crop</Label>
              <Select value={viewFilters.crop} onChange={e => setViewFilters({...viewFilters, crop: e.target.value})}>
                <option value="">All Crops</option>
                {[...new Set(visibleRequests.map(r => r.crop).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            {/* Region Filter (for ZM, RM) */}`;
  
  if (content.includes(insertMarker)) {
    content = content.replace(insertMarker, cropFilterUI);
    fs.writeFileSync(path, content, "utf8");
    console.log("✅ Crop filter UI added successfully");
  } else {
    console.log("❌ Could not find insertion marker");
  }
} else {
  console.log("✅ Crop filter UI already exists");
}
