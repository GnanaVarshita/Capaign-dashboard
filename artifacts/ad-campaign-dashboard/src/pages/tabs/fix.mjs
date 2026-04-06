import fs from 'fs';const p='TransactionMasterTab.tsx';const c=fs.readFileSync(p,'utf8');const fixed=c.replace(/\\\\x27/g,String.fromCharCode(39));fs.writeFileSync(p,fixed);console.log('Done');
