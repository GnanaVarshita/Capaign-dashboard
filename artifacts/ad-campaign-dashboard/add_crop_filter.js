const fs = require("fs");
const path = "src/pages/tabs/BudgetRequestTab.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Add crop filter logic to visibleRequests useMemo
if (!content.includes("if (viewFilters.crop)")) {
  const needle = '    if (viewFilters.activity) {\n      filtered = filtered.filter(br => br.activity === viewFilters.activity);\n    }';
  const replacement = needle + '\n    if (viewFilters.crop) {\n      filtered = filtered.filter(br => br.crop === viewFilters.crop);\n    }';
  content = content.replace(needle, replacement);
  console.log("? Crop filter logic added");
}

fs.writeFileSync(path, content, "utf8");
