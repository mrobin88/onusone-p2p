#!/usr/bin/env node

/**
 * Debug Supabase Connection and Tables
 */

const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  console.log('🧪 Testing Supabase Connection...');
  
  try {
    // Create Supabase client
    const supabase = createClient(
      'https://vzkdahthvksbcaqymuyz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2RhaHRodmtzYmNhcXltdXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTk0NjksImV4cCI6MjA3MDUzNTQ2OX0.n8uTn2WWbtlvO08mNYcGQs7gcAWXRnEKVpLBaILxl0Y'
    );
    
    console.log('✅ Supabase client created');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error reading messages table:', error);
    } else {
      console.log('✅ Successfully read messages table');
      console.log('📊 Data:', data);
    }
    
    // Test table structure
    console.log('\n🔍 Testing table structure...');
    
    // Try to get table info
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'messages' });
    
    if (tableError) {
      console.log('⚠️  Could not get table info (normal):', tableError.message);
    } else {
      console.log('📋 Table info:', tableInfo);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testSupabase().catch(console.error);
