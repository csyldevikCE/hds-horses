// Test Share Link Access Directly in Browser Console
//
// Instructions:
// 1. Open http://localhost:8080 in your browser
// 2. Open browser console (F12)
// 3. Copy and paste this entire script
// 4. Check the output

(async () => {
  console.log('🧪 Starting Share Link Test...')
  console.log('====================================')

  // Get Supabase client from window (should be available in the app)
  const token = '3759uod4e08z4e9gqixiz8'

  // Import Supabase if not available globally
  const { createClient } = window.supabase || await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')

  const SUPABASE_URL = 'https://wvfmjynmnexktfchllso.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Zm1qeW5tbmV4a3RmY2hsbHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNTAyOTcsImV4cCI6MjA2OTYyNjI5N30.mxn8cv71P0ErePDJL7r5AO-gxWV9gt5n05FZSnYRlwo'

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log('📡 Test 1: Fetch share link by token')
  const { data: shareLink, error: shareError } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single()

  if (shareError) {
    console.error('❌ Error:', shareError)
    console.error('Details:', {
      message: shareError.message,
      details: shareError.details,
      hint: shareError.hint,
      code: shareError.code
    })
  } else if (shareLink) {
    console.log('✅ Share link found:', shareLink)
  } else {
    console.warn('⚠️ No data returned (no error, but no data)')
  }

  console.log('====================================')
  console.log('📡 Test 2: Try to list all share_links (should work due to public policy)')
  const { data: allLinks, error: allError, count } = await supabase
    .from('share_links')
    .select('*', { count: 'exact' })
    .limit(5)

  if (allError) {
    console.error('❌ Error:', allError)
  } else {
    console.log(`✅ Query succeeded. Count: ${count}`)
    console.log('Data:', allLinks)
  }

  console.log('====================================')
  console.log('🏁 Test Complete')
})()
