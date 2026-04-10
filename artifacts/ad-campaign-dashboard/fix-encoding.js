// // fix-encoding.js
// import fs from "fs";

// const files = [
//   "artifacts/ad-campaign-dashboard/src/pages/tabs/POMasterTab.tsx",
//   "artifacts/ad-campaign-dashboard/src/pages/tabs/Pom asterTab.tsx",
// ];

// const replacements = [
//   ['ðŸ"…', "📅"],
//   ["â†’", "→"],
//   ["Â·", "·"],
//   ['ðŸ"', "📝"],
//   ["âœï¸", "✏️"],
//   ['â€"', "–"],
//   ["ðŸ—ºï¸", "🗺️"],
//   ['ðŸ"¦', "📦"],
//   ['ðŸ"‹', "📋"],
//   ["ðŸ§©", "🧩"],
// ];

// files.forEach((file) => {
//   if (fs.existsSync(file)) {
//     let content = fs.readFileSync(file, "utf8");
//     replacements.forEach(([bad, good]) => {
//       content = content.split(bad).join(good);
//     });
//     fs.writeFileSync(file, content, "utf8");
//     console.log(`Fixed: ${file}`);
//   }
// });

// fix-encoding.js
import fs from "fs";

const files = [
  "artifacts/ad-campaign-dashboard/src/pages/tabs/POMasterTab.tsx",
  "artifacts/ad-campaign-dashboard/src/pages/tabs/Pom asterTab.tsx",
];

const replacements = [
  ['ðŸ"…', "📅"],
  ["â†’", "→"],
  ["Â·", "·"],
  ['ðŸ"', "📝"],
  ["âœï¸", "✏️"],
  ['â€"', "–"],
  ["ðŸ—ºï¸", "🗺️"],
  ['ðŸ"¦', "📦"],
  ['ðŸ"‹', "📋"],
  ["ðŸ§©", "🧩"],

  // New fixes from your UI dump
  ["ðŸ“Š", "📊"], // bar chart
  ["ðŸ“‹", "📋"], // clipboard
  ["â‚¹", "₹"], // Indian Rupee symbol
  ["âœ“", "✔"], // check mark
  ["â€¢", "•"], // bullet
  ["ï¸âƒ£", "🔘"], // radio button / numbered circle (approx)
];

files.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    replacements.forEach(([bad, good]) => {
      content = content.split(bad).join(good);
    });
    fs.writeFileSync(file, content, "utf8");
    console.log(`Fixed: ${file}`);
  }
});
