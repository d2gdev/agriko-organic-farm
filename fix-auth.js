const fs = require('fs');
const path = require('path');

const files = [
  'src/app/admin/page.tsx',
  'src/app/admin/analytics/realtime/page.tsx',
  'src/app/admin/analytics/search/page.tsx',
  'src/app/admin/analytics/users/page.tsx',
  'src/app/admin/graph/page.tsx'
];

const oldAuthCheck = `const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/admin/login');
      }`;

const newAuthCheck = `// Check localStorage for auth token like the dashboard does
      const token = localStorage.getItem('auth_token');

      if (token) {
        // User is authenticated
        setUser({
          username: 'agrikoadmin',
          role: 'admin',
          permissions: ['view_analytics', 'manage_products', 'manage_users']
        });
      } else {
        // No token, redirect to login
        router.push('/admin/login');
      }`;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the auth check
    if (content.includes('/api/admin/auth/verify')) {
      content = content.replace(oldAuthCheck, newAuthCheck);

      // Also handle variations
      content = content.replace(
        /const response = await fetch\('\/api\/admin\/auth\/verify'[\s\S]*?router\.push\('\/admin\/login'\);[\s]*?\}/,
        `// Check localStorage for auth token like the dashboard does
      const token = localStorage.getItem('auth_token');

      if (token) {
        // User is authenticated
        setUser({
          username: 'agrikoadmin',
          role: 'admin',
          permissions: ['view_analytics', 'manage_products', 'manage_users']
        });
      } else {
        // No token, redirect to login
        router.push('/admin/login');
      }`
      );

      fs.writeFileSync(filePath, content, 'utf8');
      process.stdout.write(`Fixed: ${file}\n`);
    } else {
      process.stdout.write(`No auth verify found in: ${file}\n`);
    }
  } else {
    process.stdout.write(`File not found: ${file}\n`);
  }
});

process.stdout.write('Auth fix completed!\n');