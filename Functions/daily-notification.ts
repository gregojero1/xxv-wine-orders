// supabase/functions/daily-notification/index.ts
// Envoi quotidien à 17h00 des nouvelles commandes à gregojero1@gmail.com
// Déployer : supabase functions deploy daily-notification
// Cron    : supabase functions schedule --cron "0 17 * * *" daily-notification

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!; // ou SENDGRID_API_KEY
const NOTIFY_EMAIL = "gregojero1@gmail.com";
const DOMAIN_NAME = "XXV – Domaine Vins des Cinq";

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Récupérer les commandes non encore notifiées
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, first_name, last_name, email, company,
      total_amount, created_at, status,
      order_items (quantity, wine_name, unit_price)
    `)
    .is("notified_at", null)
    .eq("status", "received")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur Supabase:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return new Response(JSON.stringify({ message: "Aucune nouvelle commande." }), { status: 200 });
  }

  // Construire le corps HTML de l'email
  const orderRows = orders.map((o) => {
    const detail = o.order_items
      .map((item: any) => `${item.quantity} × ${item.wine_name} (${item.unit_price.toFixed(2)} €)`)
      .join("<br>");
    const date = new Date(o.created_at).toLocaleDateString("fr-BE", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    return `
      <tr style="border-bottom:1px solid #e8e0d0;">
        <td style="padding:12px 8px;color:#4b3d2a;">${date}</td>
        <td style="padding:12px 8px;font-weight:600;color:#2c1a0e;">${o.first_name} ${o.last_name}${o.company ? `<br><small style="color:#7a6550;">${o.company}</small>` : ""}</td>
        <td style="padding:12px 8px;color:#4b3d2a;font-size:13px;">${detail}</td>
        <td style="padding:12px 8px;text-align:right;font-weight:700;color:#7a1c1c;">${o.total_amount.toFixed(2)} €</td>
      </tr>
    `;
  }).join("");

  const totalRevenue = orders.reduce((s: number, o: any) => s + parseFloat(o.total_amount), 0);
  const totalBottles = orders.reduce((s: number, o: any) =>
    s + o.order_items.reduce((ss: number, i: any) => ss + i.quantity, 0), 0);

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Georgia',serif;background:#faf7f2;margin:0;padding:20px;">
  <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#2c1a0e;padding:28px 36px;">
      <h1 style="color:#e8d5a3;margin:0;font-size:22px;letter-spacing:1px;">XXV – Domaine Vins des Cinq</h1>
      <p style="color:#a0825a;margin:4px 0 0;font-size:14px;">Récapitulatif des nouvelles commandes</p>
    </div>
    <div style="padding:28px 36px;">
      <p style="color:#4b3d2a;margin:0 0 20px;">
        <strong>${orders.length} nouvelle${orders.length > 1 ? "s" : ""} commande${orders.length > 1 ? "s" : ""}</strong> 
        reçue${orders.length > 1 ? "s" : ""} depuis le dernier rapport :
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5ede0;">
            <th style="padding:10px 8px;text-align:left;color:#7a6550;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Date</th>
            <th style="padding:10px 8px;text-align:left;color:#7a6550;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Client</th>
            <th style="padding:10px 8px;text-align:left;color:#7a6550;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Détail</th>
            <th style="padding:10px 8px;text-align:right;color:#7a6550;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Total</th>
          </tr>
        </thead>
        <tbody>${orderRows}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#f5ede0;border-radius:3px;display:flex;justify-content:space-between;">
        <span style="color:#4b3d2a;font-size:15px;"><strong>${totalBottles}</strong> bouteilles commandées</span>
        <span style="color:#2c1a0e;font-size:15px;font-weight:700;">${totalRevenue.toFixed(2)} € total</span>
      </div>
    </div>
    <div style="padding:16px 36px;background:#f5ede0;font-size:12px;color:#9a8a78;border-top:1px solid #e8d5b0;">
      ${DOMAIN_NAME} · Couthuin, Belgique · EA BE1L008042999
    </div>
  </div>
</body>
</html>`;

  // Envoyer via Resend (remplacer par SendGrid si préféré)
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "commandes@xxv.be",
      to: NOTIFY_EMAIL,
      subject: `[XXV] ${orders.length} nouvelle${orders.length > 1 ? "s" : ""} commande${orders.length > 1 ? "s" : ""} – ${new Date().toLocaleDateString("fr-BE")}`,
      html,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error("Erreur email:", err);
    return new Response(JSON.stringify({ error: "Email non envoyé", detail: err }), { status: 500 });
  }

  // Marquer les commandes comme notifiées
  const ids = orders.map((o: any) => o.id);
  await supabase.from("orders").update({ notified_at: new Date().toISOString() }).in("id", ids);

  return new Response(JSON.stringify({
    message: `${orders.length} commande(s) notifiée(s)`,
    total: totalRevenue,
    bottles: totalBottles
  }), { status: 200 });
});
