const fs = require('fs');
const path = require('path');

const fixes = [
  // Fix search keyword route Money to string issue
  {
    file: 'src/app/api/search/keyword/route.ts',
    search: /formatPrice\(product\.price\)/g,
    replace: 'formatPrice(product.price || 0)'
  },
  
  // Fix test files undefined issues
  {
    file: 'src/context/__tests__/CartContext.php-currency.test.tsx',
    search: /expect\(result\)\./g,
    replace: 'expect(result!).'
  },
  
  // Fix JWT string to number issue
  {
    file: 'src/lib/auth/jwt.ts',
    search: /expiresIn: '24h'/g,
    replace: 'expiresIn: 24 * 60 * 60' // 24 hours in seconds
  },
  
  // Fix blog database string to number
  {
    file: 'src/lib/blog-database.ts',
    search: /'vector'/g,
    replace: 'vector'
  }
];

fixes.forEach(fix => {
  const fullPath = path.join(process.cwd(), fix.file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.match(fix.search)) {
      content = content.replace(fix.search, fix.replace);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed ${fix.file}`);
    }
  }
});

// Fix WCProduct price undefined issue in test
const testPath = path.join(process.cwd(), 'src/context/__tests__/CartContext.php-currency.test.tsx');
if (fs.existsSync(testPath)) {
  let content = fs.readFileSync(testPath, 'utf8');
  
  // Fix price: undefined to price: 0 as Core.Money
  content = content.replace(
    /price: undefined/g,
    'price: 0 as Core.Money'
  );
  
  fs.writeFileSync(testPath, content, 'utf8');
  console.log('Fixed test price undefined issue');
}

console.log('Bulk fixes completed');
