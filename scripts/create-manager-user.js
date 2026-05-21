const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const envPath = path.resolve(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.local not found')
  process.exit(1)
}
const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
  const [key, value] = trimmed.split(/=(.*)/s).map(part => part.trim())
  env[key] = value
}
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('ERROR: Supabase environment variables are missing')
  process.exit(1)
}
const supabase = createClient(url, key)
const email = 'manager@restaurant.com'
const password = 'Manager1234!'
const full_name = 'Admin Manager'
const phone = '0123456789'
const role = 'manager'

async function run() {
  console.log('Creating manager account:', email)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role, phone, is_active: true },
    },
  })

  if (error) {
    if (error.message && error.message.includes('already registered')) {
      console.log('Account already exists. No changes made.')
      return
    }
    console.error('SignUp error:', error.message)
    process.exit(1)
  }

  if (!data?.user?.id) {
    console.error('Created user but no user ID returned.')
    process.exit(1)
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    full_name,
    role,
    phone,
    is_active: true,
  })

  if (profileError) {
    console.warn('Profile insert warning:', profileError.message)
  } else {
    console.log('Manager profile created successfully.')
  }
  console.log('Manager account created successfully. Email:', email)
  console.log('Password:', password)
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
