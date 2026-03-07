import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")
const RECIPIENT_PHONE = Deno.env.get("RECIPIENT_PHONE_NUMBER") // The admin phone receiving notifications

serve(async (req) => {
    try {
        const { record } = await req.json()

        if (!record) {
            return new Response(JSON.stringify({ error: "No record found" }), { status: 400 })
        }

        const { customer_name, phone, city, pack_type, selected_perfumes, price_mad, gift_perfume } = record

        const message = `🚀 *Nouvelle Commande ELIE!*

👤 Client: ${customer_name}
📞 Tél: ${phone}
📍 Ville: ${city}
📦 Pack: ${pack_type}
✨ Parfums: ${selected_perfumes.join(', ')}
🎁 Cadeau: ${gift_perfume || 'Aucun'}
💰 Total: ${price_mad} MAD

_ELIE AI Commerce OS_`

        const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: RECIPIENT_PHONE,
                type: "text",
                text: { body: message },
            }),
        })

        const result = await response.json()
        console.log("WhatsApp API response:", result)

        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
