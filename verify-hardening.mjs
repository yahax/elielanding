import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rhjmhnztolzvvxgehzrs.supabase.co'
const supabaseAnonKey = 'sb_publishable_i0HUGa9FJ3zQgE7GM8MERw_QVaQccYD'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verify() {
    console.log('🔍 ELIE OS V2.2 HARDENING VERIFICATION\n')

    // 1. Check Tables
    const { data: products, error: pError } = await supabase.from('products').select('name, stock').limit(5)
    if (pError) {
        console.warn('⚠️  Products table check failed:', pError.message)
        console.log('👉 Make sure you executed the SQL in supabase/schema.sql and supabase/hardening.sql.')
        return
    }
    console.log(`✅ Products: ${products.length} found.`)

    // 2. Test RPC: create_order_secure
    const perfumes = products.slice(0, 6).map(p => p.name)
    if (perfumes.length < 6) {
        console.error('❌ Not enough products (need 6) to test order creation.')
        return
    }

    console.log('📦 Testing create_order_secure RPC...')
    const { data: orderId, error: oError } = await supabase.rpc('create_order_secure', {
        p_customer_name: 'QA Test Machine',
        p_phone: '0699009900',
        p_city: 'Casablanca',
        p_address: 'QA Lab 42',
        p_pack_type: 'homme',
        p_total_price: 199,
        p_source: 'direct',
        p_perfumes: perfumes
    })

    if (oError) {
        console.error('❌ RPC Error:', oError.message)
        if (oError.message.includes('function') && oError.message.includes('does not exist')) {
            console.log('👉 ACTION REQUIRED: Run the SQL in supabase/hardening.sql in your Supabase dashboard.')
        }
        return
    }
    console.log(`✅ Order Created Successfully! ID: ${orderId}`)

    // 3. Test Business Logic (Transitions)
    console.log('🔄 Verifying Status Transition (new -> confirmed)...')
    const { error: t1Error } = await supabase.rpc('update_order_status_secure', {
        p_order_id: orderId,
        p_new_status: 'confirmed'
    })
    if (t1Error) console.error('❌ Transition failed:', t1Error.message)
    else console.log('✅ Transition Success.')

    console.log('🚫 Verifying Transition Guard (canceled -> confirmed)...')
    await supabase.rpc('update_order_status_secure', { p_order_id: orderId, p_new_status: 'canceled' })
    const { error: t2Error } = await supabase.rpc('update_order_status_secure', {
        p_order_id: orderId,
        p_new_status: 'confirmed'
    })
    if (t2Error) console.log(`✅ Guard Working: ${t2Error.message}`)
    else console.error('❌ Guard Failed: Order was restored from canceled state!')

    console.log('\n✨ VERIFICATION COMPLETE.')
}

verify();
