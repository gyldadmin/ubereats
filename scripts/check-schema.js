const { createClient } = require('@supabase/supabase-js');

// You'll need to set your Supabase URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('=== CHECKING DATABASE SCHEMA ===\n');
  
  // Check specific tables we're having issues with
  const tables = ['users_public', 'users_internal', 'mentors', 'mentor_status', 'mentor_approval'];
  
  for (const tableName of tables) {
    console.log(`--- ${tableName} ---`);
    
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: tableName
    });
    
    if (error) {
      console.error(`Error for ${tableName}:`, error);
    } else {
      console.log(data);
    }
    console.log('');
  }
}

// Alternative: Simple column check
async function checkColumns() {
  console.log('=== CHECKING TABLE COLUMNS ===\n');
  
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type, is_nullable')
    .in('table_name', ['users_public', 'users_internal', 'mentors'])
    .order('table_name, ordinal_position');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkColumns().catch(console.error); 