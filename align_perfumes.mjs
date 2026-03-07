import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\s]*)/)?.[1]
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\s]*)/)?.[1]

const supabase = createClient(url, key)

async function alignNames() {
    // Current mapping (mismatch -> target)
    const mapping = {
        'YSL Libre': 'Yves Saint Laurent Libre Intense',
        'Kayali Vanilla 28': 'Kayali 28',
        'Maison Marly Delina': 'Maison Marly Delina', // Already matches
        'Baccarat Rouge 540': 'Francis Kurkdjian Baccarat Rouge 540',
        'Carolina Herrera Good Girl': 'Carolina Herrera Good Girl' // Matches
    }

    console.log('--- ALIGNING PERFUME NAMES ---')

    for (const [oldName, newName] of Object.entries(mapping)) {
        if (oldName === newName) continue;

        console.log(`Updating "${oldName}" to "${newName}"...`)
        const { error } = await supabase
            .from('perfumes')
            .update({ name: newName })
            .eq('name', oldName)

        if (error) console.error(`Error updating ${oldName}:`, error.message)
        else console.log(`✅ Updated ${oldName}`)
    }
}

alignNames()
