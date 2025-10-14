const fs = require('fs');
const path = require('path');

const routes = [
  'src/app/api/chat/stream/route.ts',
  'src/app/api/topics/route.ts',
  'src/app/api/session/start/route.ts',
  'src/app/api/sessions/[sessionId]/images/route.ts',
  'src/app/api/sessions/[sessionId]/messages/route.ts',
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/sessions/[sessionId]/info/route.ts',
  'src/app/api/user/route.ts',
  'src/app/api/sessions/create/route.ts'
];

routes.forEach(route => {
  const filePath = path.join(__dirname, route);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${route}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`⏭️  Skipped (already has dynamic): ${route}`);
    return;
  }

  // Find the first export or import line
  const lines = content.split('\n');
  let insertIndex = 0;

  // Find last import or first export
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim().startsWith('export ') && insertIndex === 0) {
      insertIndex = i;
      break;
    }
  }

  // Insert the dynamic export
  lines.splice(insertIndex, 0, '', 'export const dynamic = \'force-dynamic\'');

  fs.writeFileSync(filePath, lines.join('\n'));
  console.log(`✅ Fixed: ${route}`);
});

console.log('\n✨ All routes fixed!');
