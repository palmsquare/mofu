/**
 * Script to setup analytics tables in Supabase
 * Run with: node scripts/setup-analytics.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupAnalytics() {
  console.log('🚀 Setting up analytics tables...\n');

  // Read SQL file
  const sqlPath = path.join(__dirname, '..', '..', 'supabase-analytics.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement.trim()) continue;

    try {
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // If exec_sql doesn't exist, try direct query
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        if (directError && directError.message.includes('exec_sql')) {
          console.log('⚠️  exec_sql function not available. Please run SQL manually in Supabase dashboard.');
          console.log('📄 SQL file location: supabase-analytics.sql\n');
          console.log('📋 SQL to execute:');
          console.log('='.repeat(80));
          console.log(sql);
          console.log('='.repeat(80));
          return;
        }
        // Check if it's a "already exists" error (which is OK)
        if (error.message.includes('already exists')) {
          console.log(`✅ Statement ${i + 1} already exists (skipped)`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Error executing statement ${i + 1}:`, err.message);
    }
  }

  console.log('\n✨ Analytics setup complete!');
  console.log('📊 You can now track page views and conversions.');
  console.log('\n⚠️  Note: If you see errors above, please run the SQL manually in Supabase dashboard.');
  console.log('📄 SQL file location: supabase-analytics.sql');
}

setupAnalytics().catch(console.error);

