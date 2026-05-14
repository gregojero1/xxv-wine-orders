import { useState } from "react";

// ── Types
type Wine = { id: string; name: string; category: string; price_per_bottle: number; description: string };
type Order = {
  id: string; first_name: string; last_name: string; email: string;
  company: string | null; vat_number: string | null; company_address: string | null;
  total_amount: number; status: string; created_at: string; notes: string | null;
  order_items: { wine_name: string; quantity: number; unit_price: number; subtotal: number }[];
};

const WINES: Wine[] = [
  { id: "1", name: "La Lisière",              category: "blanc",        price_per_bottle: 16.00, description: "Assemblage Chardonnay, Müller-Thurgau et Pinot Gris" },
  { id: "2", name: "Müller-Thurgau",          category: "blanc",        price_per_bottle: 16.00, description: "Cépage aromatique, frais et fruité" },
  { id: "3", name: "Pinot Gris",              category: "blanc",        price_per_bottle: 16.00, description: "Blanc élégant aux notes dorées" },
  { id: "4", name: "Chardonnay",              category: "blanc",        price_per_bottle: 18.00, description: "Élevé en fût de chêne, complexe et minéral" },
  { id: "5", name: "Primesautier",            category: "rose",         price_per_bottle: 16.00, description: "Rosé de Pinot Noir et Pinot Meunier, frais et gourmand" },
  { id: "6", name: "Esprit de Famille blanc", category: "effervescent", price_per_bottle: 22.00, description: "Méthode traditionnelle, blanc de blancs" },
  { id: "7", name: "Esprit de Famille rosé",  category: "effervescent", price_per_bottle: 22.00, description: "Méthode traditionnelle, rosé festif" },
];

const MOCK_ORDERS: Order[] = [
  {
    id: "a1b2c3d4", first_name: "Marie", last_name: "Dupont", email: "marie@example.com",
    company: null, vat_number: null, company_address: null,
    total_amount: 96.00, status: "received", created_at: "2025-05-10T14:32:00Z", notes: null,
    order_items: [
      { wine_name: "La Lisière", quantity: 3, unit_price: 16.00, subtotal: 48.00 },
      { wine_name: "Esprit de Famille blanc", quantity: 2, unit_price: 22.00, subtotal: 44.00 },
    ]
  },
  {
    id: "e5f6g7h8", first_name: "Jean", last_name: "Martin", email: "jean@example.com",
    company: "Martin SPRL", vat_number: "BE0123456789", company_address: "Rue de Namur 12, 5000 Namur",
    total_amount: 80.00, status: "processed", created_at: "2025-05-08T09:15:00Z", notes: "Livraison souhaitée avant le 15",
    order_items: [
      { wine_name: "Chardonnay", quantity: 2, unit_price: 18.00, subtotal: 36.00 },
      { wine_name: "Primesautier", quantity: 2, unit_price: 16.00, subtotal: 32.00 },
      { wine_name: "Müller-Thurgau", quantity: 1, unit_price: 16.00, subtotal: 16.00 },
    ]
  },
  {
    id: "i9j0k1l2", first_name: "Sophie", last_name: "Bernard", email: "sophie@example.com",
    company: null, vat_number: null, company_address: null,
    total_amount: 44.00, status: "delivered", created_at: "2025-05-02T16:00:00Z", notes: null,
    order_items: [
      { wine_name: "Esprit de Famille rosé", quantity: 2, unit_price: 22.00, subtotal: 44.00 },
    ]
  },
];

const statusLabel: Record<string, string> = { received: "Reçue", processed: "Traitée", delivered: "Livrée" };
const statusColor: Record<string, string> = { received: "#b45309", processed: "#1d4ed8", delivered: "#15803d" };
const catLabel: Record<string, string> = { blanc: "Vins blancs", rose: "Vins rosés", effervescent: "Vins effervescents" };

function OrderForm() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", companyAddress: "", vatNumber: "", notes: "" });
  const [step, setStep] = useState<"form" | "done">("form");
  const [error, setError] = useState("");
  const categories = ["blanc", "rose", "effervescent"];
  const total = WINES.reduce((s, w) => s + (cart[w.id] || 0) * w.price_per_bottle, 0);
  const totalBottles = Object.values(cart).reduce((s, v) => s + v, 0);
  const setQty = (id: string, val: number) => setCart(c => ({ ...c, [id]: Math.max(0, val) }));
  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.email) { setError("Nom, prénom et email sont obligatoires."); return; }
    if (totalBottles === 0) { setError("Sélectionne au moins une bouteille."); return; }
    setError(""); setStep("done");
  };
  if (step === "done") return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 48, textAlign: "center" as const, background: "#faf7f2", borderRadius: 8, border: "1px solid #e8d5b0", fontFamily: "Georgia, serif" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🍷</div>
      <h2 style={{ fontSize: 26, color: "#2c1a0e", margin: "0 0 16px" }}>Commande confirmée !</h2>
      <p style={{ color: "#4b3d2a", lineHeight: 1.7, marginBottom: 28 }}>
        Nous avons bien reçu ta commande de <strong>{totalBottles} bouteille{totalBottles > 1 ? "s" : ""}</strong> pour un total de <strong>{total.toFixed(2)} €</strong>.<br /><br />
        Tu peux récupérer tes vins directement au chai, à Couthuin. On te recontacte par email pour convenir d'un passage.
      </p>
      <button style={s.btnPrimary} onClick={() => { setStep("form"); setCart({}); setForm({ firstName: "", lastName: "", email: "", phone: "", company: "", companyAddress: "", vatNumber: "", notes: "" }); }}>Nouvelle commande</button>
    </div>
  );
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px", fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center" as const, marginBottom: 48, borderBottom: "1px solid #e8d5b0", paddingBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: "#2c1a0e", letterSpacing: 4 }}>XXV</span>
          <div>
            <div style={{ fontSize: 16, color: "#4b3d2a", fontWeight: 600 }}>Domaine Vins des Cinq</div>
            <div style={{ fontSize: 12, color: "#9a8a78" }}>Couthuin · Belgique · Viticulture biologique</div>
          </div>
        </div>
        <h1 style={{ fontSize: 28, color: "#2c1a0e", margin: "0 0 8px", fontWeight: 400, letterSpacing: 1 }}>Commander nos vins</h1>
        <p style={{ fontSize: 14, color: "#7a6550", margin: 0 }}>Retrait au chai sur rendez-vous — <a href="https://xxv.be" style={{ color: "#7a1c1c" }} target="_blank" rel="noreferrer">xxv.be</a></p>
      </div>
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, color: "#2c1a0e", marginBottom: 20, fontWeight: 600, borderBottom: "1px solid #f0e8d8", paddingBottom: 10 }}>Nos vins</h2>
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: "#9a8a78", textTransform: "uppercase" as const, letterSpacing: 2, marginBottom: 12, paddingLeft: 4 }}>{catLabel[cat]}</div>
            {WINES.filter(w => w.category === cat).map(wine => (
              <div key={wine.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#faf7f2", borderRadius: 6, marginBottom: 6, border: "1px solid #f0e8d8" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, color: "#2c1a0e", fontWeight: 600 }}>{wine.name}</div>
                  <div style={{ fontSize: 12, color: "#9a8a78" }}>{wine.description}</div>
                </div>
                <div style={{ fontSize: 16, color: "#4b3d2a", fontWeight: 700, minWidth: 70, textAlign: "right" as const }}>{wine.price_per_bottle.toFixed(2)} €</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button style={s.qtyBtn} onClick={() => setQty(wine.id, (cart[wine.id] || 0) - 1)}>−</button>
                  <input type="number" min="0" value={cart[wine.id] || 0} onChange={e => setQty(wine.id, parseInt(e.target.value) || 0)} style={s.qtyInput} />
                  <button style={s.qtyBtn} onClick={() => setQty(wine.id, (cart[wine.id] || 0) + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {totalBottles > 0 && (
        <div style={{ position: "sticky" as const, top: 12, background: "#2c1a0e", color: "#e8d5a3", padding: "14px 20px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, zIndex: 10, boxShadow: "0 4px 20px rgba(44,26,14,.25)" }}>
          <span>{totalBottles} bouteille{totalBottles > 1 ? "s" : ""}</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{total.toFixed(2)} €</span>
        </div>
      )}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, color: "#2c1a0e", marginBottom: 20, fontWeight: 600, borderBottom: "1px solid #f0e8d8", paddingBottom: 10 }}>Coordonnées</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <F label="Prénom *" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
          <F label="Nom *" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
          <F label="Email *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} span={2} />
          <F label="Téléphone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
          <F label="Société" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
          <F label="Adresse société" value={form.companyAddress} onChange={v => setForm(f => ({ ...f, companyAddress: v }))} span={2} />
          <F label="N° TVA" value={form.vatNumber} onChange={v => setForm(f => ({ ...f, vatNumber: v }))} span={2} />
          <div style={{ gridColumn: "1/-1" }}>
            <label style={s.fieldLabel}>Remarques</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...s.fieldInput, height: 80, resize: "vertical" as const }} placeholder="Questions, demandes particulières…" />
          </div>
        </div>
      </div>
      {error && <div style={{ background: "#fdf0f0", color: "#c0392b", padding: "12px 16px", borderRadius: 5, marginBottom: 12, fontSize: 14, border: "1px solid #f8d0d0" }}>{error}</div>}
      <button style={s.btnPrimary} onClick={handleSubmit}>Confirmer la commande · {total.toFixed(2)} €</button>
      <p style={{ textAlign: "center" as const, fontSize: 12, color: "#9a8a78", marginTop: 12 }}>Aucun paiement en ligne. Le règlement se fait à la livraison / retrait.</p>
    </div>
  );
}

function F({ label, value, onChange, type = "text", span = 1 }: { label: string; value: string; onChange: (v: string) => void; type?: string; span?: number }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={s.fieldLabel}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={s.fieldInput} />
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const handleLogin = () => {
    if (pw === "xxv2025") { sessionStorage.setItem("xxv_admin", "1"); onLogin(); }
    else setError("Mot de passe incorrect.");
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#faf7f2" }}>
      <div style={{ width: 360, padding: 40, background: "#fff", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,.08)", textAlign: "center" as const, fontFamily: "Georgia, serif" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#2c1a0e", letterSpacing: 4 }}>XXV</div>
        <h2 style={{ color: "#2c1a0e", margin: "8px 0 4px", fontSize: 20 }}>Administration</h2>
        <p style={{ color: "#7a6550", margin: "0 0 28px", fontSize: 14 }}>Domaine Vins des Cinq</p>
        <input type="password" placeholder="Mot de passe" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ ...s.fieldInput, marginBottom: 12 }} />
        {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button style={{ ...s.btnPrimary, width: "100%" }} onClick={handleLogin}>Se connecter</button>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"orders" | "stats">("orders");
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const updateStatus = (id: string, status: string) => {
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected(o => o ? { ...o, status } : o);
  };
  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const totalBottles = orders.reduce((s, o) => s + o.order_items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const byWine: Record<string, number> = {};
  orders.forEach(o => o.order_items.forEach(i => { byWine[i.wine_name] = (byWine[i.wine_name] || 0) + i.quantity; }));
  const wineStats = Object.entries(byWine).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty);
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Georgia, serif" }}>
      <div style={{ width: 220, background: "#2c1a0e", display: "flex", flexDirection: "column" as const, padding: "32px 20px" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid #4a2e18" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#2c1a0e", letterSpacing: 4, background: "#e8d5a3", padding: "4px 12px", borderRadius: 4, display: "inline-block" }}>XXV</div>
          <div style={{ fontSize: 12, color: "#a0825a", marginTop: 8 }}>Administration</div>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {(["orders", "stats"] as const).map(t => (
            <button key={t} style={{ padding: "11px 14px", background: tab === t ? "#4a2e18" : "transparent", color: tab === t ? "#e8d5a3" : "#c4a67a", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left" as const, fontSize: 15, fontFamily: "inherit" }} onClick={() => setTab(t)}>
              {t === "orders" ? "📋 Commandes" : "📊 Statistiques"}
            </button>
          ))}
        </nav>
        <button style={{ padding: "10px 14px", background: "transparent", color: "#7a5a3a", border: "1px solid #4a2e18", borderRadius: 5, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }} onClick={onLogout}>Déconnexion</button>
      </div>
      <div style={{ flex: 1, padding: "40px 48px", background: "#faf7f2", overflowY: "auto" as const }}>
        {tab === "orders" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, color: "#2c1a0e", margin: 0, fontWeight: 600 }}>Commandes</h1>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={s.select}>
                <option value="all">Tous les statuts</option>
                <option value="received">Reçues</option>
                <option value="processed">Traitées</option>
                <option value="delivered">Livrées</option>
              </select>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8d5b0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ background: "#f5ede0" }}>
                    {["Date", "Client", "Email", "Bouteilles", "Total", "Statut", ""].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left" as const, fontSize: 12, color: "#7a6550", textTransform: "uppercase" as const, letterSpacing: .5, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const bottles = o.order_items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid #f0e8d8", cursor: "pointer" }} onClick={() => setSelected(o)}>
                        <td style={s.td}>{new Date(o.created_at).toLocaleDateString("fr-BE")}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{o.first_name} {o.last_name}</td>
                        <td style={{ ...s.td, color: "#7a6550", fontSize: 13 }}>{o.email}</td>
                        <td style={s.td}>{bottles}</td>
                        <td style={{ ...s.td, fontWeight: 700 }}>{o.total_amount.toFixed(2)} €</td>
                        <td style={s.td}><span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: statusColor[o.status] + "20", color: statusColor[o.status] }}>{statusLabel[o.status]}</span></td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{ ...s.select, fontSize: 12, padding: "4px 6px" }}>
                            <option value="received">Reçue</option>
                            <option value="processed">Traitée</option>
                            <option value="delivered">Livrée</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "stats" && (
          <>
            <h1 style={{ fontSize: 26, color: "#2c1a0e", margin: "0 0 28px", fontWeight: 600 }}>Statistiques</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              {[{ label: "Commandes", value: orders.length }, { label: "Bouteilles", value: totalBottles }, { label: "Chiffre d'affaires", value: `${totalRevenue.toFixed(2)} €` }, { label: "Vin phare", value: wineStats[0]?.name || "—" }].map(c => (
                <div key={c.label} style={{ background: "#fff", border: "1px solid #e8d5b0", borderRadius: 8, padding: "20px 24px" }}>
                  <div style={{ fontSize: 12, color: "#7a6550", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#2c1a0e" }}>{c.value}</div>
                </div>
              ))}
            </div>
            <h3 style={{ color: "#2c1a0e", marginBottom: 16 }}>Détail par vin</h3>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e8d5b0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead><tr style={{ background: "#f5ede0" }}>{["Vin", "Bouteilles", "Part"].map(h => <th key={h} style={{ padding: "12px 14px", textAlign: "left" as const, fontSize: 12, color: "#7a6550", textTransform: "uppercase" as const, letterSpacing: .5 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {wineStats.map(w => (
                    <tr key={w.name} style={{ borderBottom: "1px solid #f0e8d8" }}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{w.name}</td>
                      <td style={s.td}>{w.qty}</td>
                      <td style={{ ...s.td, width: 200 }}>
                        <div style={{ background: "#f0e8d8", borderRadius: 3, height: 8, marginBottom: 3 }}><div style={{ background: "#7a1c1c", height: "100%", width: `${Math.round((w.qty / totalBottles) * 100)}%` }} /></div>
                        <span style={{ fontSize: 12, color: "#7a6550" }}>{Math.round((w.qty / totalBottles) * 100)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,26,14,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 36, maxWidth: 560, width: "90%", maxHeight: "85vh", overflowY: "auto" as const, position: "relative" as const, fontFamily: "Georgia, serif" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute" as const, top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#7a6550" }} onClick={() => setSelected(null)}>✕</button>
            <h2 style={{ color: "#2c1a0e", margin: "0 0 4px" }}>{selected.first_name} {selected.last_name}</h2>
            <p style={{ color: "#7a6550", margin: "0 0 20px", fontSize: 13 }}>{new Date(selected.created_at).toLocaleDateString("fr-BE", { day: "2-digit", month: "long", year: "numeric" })} · Réf. {selected.id.slice(0, 8).toUpperCase()}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#faf7f2", padding: 16, borderRadius: 6, fontSize: 14, color: "#4b3d2a", marginBottom: 20 }}>
              <div><strong>Email</strong><br />{selected.email}</div>
              {selected.company && <div><strong>Société</strong><br />{selected.company}</div>}
              {selected.vat_number && <div><strong>TVA</strong><br />{selected.vat_number}</div>}
            </div>
            {selected.order_items.map((i, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0e8d8", fontSize: 15 }}>
                <span>{i.quantity}× {i.wine_name}</span><span>{i.subtotal.toFixed(2)} €</span>
              </div>
            ))}
            <div style={{ textAlign: "right" as const, fontSize: 18, color: "#2c1a0e", paddingTop: 12 }}>Total : <strong>{selected.total_amount.toFixed(2)} €</strong></div>
            {selected.notes && <div style={{ marginTop: 12, color: "#4b3d2a", fontSize: 14 }}><strong>Remarques :</strong> {selected.notes}</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {["received", "processed", "delivered"].map(st => (
                <button key={st} style={{ ...s.btnSecondary, ...(selected.status === st ? { background: "#2c1a0e", color: "#e8d5a3" } : {}) }} onClick={() => updateStatus(selected.id, st)}>{statusLabel[st]}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const isAdmin = window.location.pathname === "/admin";
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem("xxv_admin") === "1");
  if (isAdmin) {
    if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;
    return <AdminDashboard onLogout={() => { sessionStorage.removeItem("xxv_admin"); setLoggedIn(false); }} />;
  }
  return <OrderForm />;
}

const s: Record<string, React.CSSProperties> = {
  btnPrimary: { display: "block", width: "100%", padding: "16px 24px", background: "#2c1a0e", color: "#e8d5a3", border: "none", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: .5, marginTop: 20 },
  btnSecondary: { padding: "8px 16px", background: "#f5ede0", color: "#4b3d2a", border: "1px solid #d0c4b0", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontSize: 13 },
  qtyBtn: { width: 32, height: 32, background: "#2c1a0e", color: "#e8d5a3", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 16, fontWeight: 700 },
  qtyInput: { width: 44, height: 32, textAlign: "center", border: "1px solid #d0c4b0", borderRadius: 4, fontSize: 15, fontFamily: "inherit" },
  fieldLabel: { display: "block", fontSize: 13, color: "#7a6550", marginBottom: 5, fontWeight: 500 },
  fieldInput: { width: "100%", padding: "10px 12px", border: "1px solid #d0c4b0", borderRadius: 5, fontSize: 15, fontFamily: "inherit", background: "#faf7f2", boxSizing: "border-box" },
  select: { padding: "8px 12px", border: "1px solid #d0c4b0", borderRadius: 5, background: "#faf7f2", fontFamily: "inherit", fontSize: 14, color: "#2c1a0e" },
  td: { padding: "13px 14px", color: "#2c1a0e", fontSize: 14 },
};
