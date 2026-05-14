import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Config Supabase (remplacer par tes vraies valeurs)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Types
type Wine = { id: string; name: string; category: string; price_per_bottle: number; description: string };
type CartItem = Wine & { qty: number };
type Order = {
  id: string; first_name: string; last_name: string; email: string;
  company: string | null; vat_number: string | null; company_address: string | null;
  total_amount: number; status: string; created_at: string; notes: string | null;
  order_items: { wine_name: string; quantity: number; unit_price: number; subtotal: number }[];
};

// ── Helpers
const statusLabel: Record<string, string> = {
  received: "Reçue", processed: "Traitée", delivered: "Livrée"
};
const statusColor: Record<string, string> = {
  received: "#b45309", processed: "#1d4ed8", delivered: "#15803d"
};
const catLabel: Record<string, string> = {
  blanc: "Vins blancs", rose: "Vins rosés", effervescent: "Vins effervescents"
};

// ════════════════════════════════════════════════════════════
// COMPOSANT FORMULAIRE CLIENT
// ════════════════════════════════════════════════════════════
function OrderForm() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", companyAddress: "", vatNumber: "", notes: "" });
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("wines").select("*").eq("active", true).order("category").then(({ data }) => {
      if (data) setWines(data);
    });
  }, []);

  const categories = ["blanc", "rose", "effervescent"];
  const total = wines.reduce((s, w) => s + (cart[w.id] || 0) * w.price_per_bottle, 0);
  const totalBottles = Object.values(cart).reduce((s, v) => s + v, 0);

  const setQty = (id: string, val: number) =>
    setCart(c => ({ ...c, [id]: Math.max(0, val) }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email) { setError("Nom, prénom et email sont obligatoires."); return; }
    if (totalBottles === 0) { setError("Sélectionne au moins une bouteille."); return; }
    setError(""); setLoading(true);

    const { data: order, error: oErr } = await supabase.from("orders").insert({
      first_name: form.firstName, last_name: form.lastName,
      email: form.email, phone: form.phone || null,
      company: form.company || null, company_address: form.companyAddress || null,
      vat_number: form.vatNumber || null, notes: form.notes || null,
      total_amount: total, status: "received"
    }).select().single();

    if (oErr || !order) { setError("Erreur lors de l'envoi. Réessaie."); setLoading(false); return; }

    const items = wines.filter(w => (cart[w.id] || 0) > 0).map(w => ({
      order_id: order.id, wine_id: w.id, wine_name: w.name,
      quantity: cart[w.id], unit_price: w.price_per_bottle
    }));

    const { error: iErr } = await supabase.from("order_items").insert(items);
    if (iErr) { setError("Erreur lors de l'enregistrement des produits."); setLoading(false); return; }

    setLoading(false); setStep("done");
  };

  if (step === "done") return (
    <div style={styles.successBox}>
      <div style={styles.successIcon}>🍷</div>
      <h2 style={styles.successTitle}>Commande confirmée !</h2>
      <p style={styles.successText}>
        Nous avons bien reçu ta commande de <strong>{totalBottles} bouteille{totalBottles > 1 ? "s" : ""}</strong> pour un total de <strong>{total.toFixed(2)} €</strong>.<br /><br />
        Tu peux récupérer tes vins directement au chai, à Couthuin. On te recontacte par email pour convenir d'un passage.
      </p>
      <button style={styles.btnPrimary} onClick={() => { setStep("form"); setCart({}); setForm({ firstName: "", lastName: "", email: "", phone: "", company: "", companyAddress: "", vatNumber: "", notes: "" }); }}>
        Nouvelle commande
      </button>
    </div>
  );

  return (
    <div style={styles.formContainer}>
      {/* Header */}
      <div style={styles.formHeader}>
        <div style={styles.logoArea}>
          <span style={styles.logoXXV}>XXV</span>
          <div>
            <div style={styles.logoDomain}>Domaine Vins des Cinq</div>
            <div style={styles.logoSub}>Couthuin · Belgique · Viticulture biologique</div>
          </div>
        </div>
        <h1 style={styles.formTitle}>Commander nos vins</h1>
        <p style={styles.formSubtitle}>Retrait au chai sur rendez-vous — <a href="https://xxv.be" style={styles.link} target="_blank" rel="noreferrer">xxv.be</a></p>
      </div>

      {/* Sélection vins */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Nos vins</h2>
        {categories.map(cat => {
          const catWines = wines.filter(w => w.category === cat);
          if (!catWines.length) return null;
          return (
            <div key={cat} style={styles.catBlock}>
              <div style={styles.catLabel}>{catLabel[cat]}</div>
              {catWines.map(wine => (
                <div key={wine.id} style={styles.wineRow}>
                  <div style={styles.wineInfo}>
                    <span style={styles.wineName}>{wine.name}</span>
                    <span style={styles.wineDesc}>{wine.description}</span>
                  </div>
                  <div style={styles.winePrice}>{wine.price_per_bottle.toFixed(2)} €</div>
                  <div style={styles.qtyControl}>
                    <button style={styles.qtyBtn} onClick={() => setQty(wine.id, (cart[wine.id] || 0) - 1)}>−</button>
                    <input
                      type="number" min="0" value={cart[wine.id] || 0}
                      onChange={e => setQty(wine.id, parseInt(e.target.value) || 0)}
                      style={styles.qtyInput}
                    />
                    <button style={styles.qtyBtn} onClick={() => setQty(wine.id, (cart[wine.id] || 0) + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Total flottant */}
      {totalBottles > 0 && (
        <div style={styles.totalBar}>
          <span>{totalBottles} bouteille{totalBottles > 1 ? "s" : ""}</span>
          <span style={styles.totalAmount}>{total.toFixed(2)} €</span>
        </div>
      )}

      {/* Coordonnées */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Coordonnées</h2>
        <div style={styles.fieldGrid}>
          <Field label="Prénom *" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
          <Field label="Nom *" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
          <Field label="Email *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} span={2} />
          <Field label="Téléphone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
          <Field label="Société" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
          <Field label="Adresse société" value={form.companyAddress} onChange={v => setForm(f => ({ ...f, companyAddress: v }))} span={2} />
          <Field label="N° TVA" value={form.vatNumber} onChange={v => setForm(f => ({ ...f, vatNumber: v }))} span={2} />
          <div style={{ gridColumn: "1/-1" }}>
            <label style={styles.fieldLabel}>Remarques</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ ...styles.fieldInput, height: 80, resize: "vertical" }}
              placeholder="Questions, demandes particulières…"
            />
          </div>
        </div>
      </div>

      {error && <div style={styles.errorMsg}>{error}</div>}

      <button
        style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Envoi en cours…" : `Confirmer la commande · ${total.toFixed(2)} €`}
      </button>
      <p style={styles.legal}>Aucun paiement en ligne. Le règlement se fait à la livraison / retrait.</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", span = 1 }: { label: string; value: string; onChange: (v: string) => void; type?: string; span?: number }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={styles.fieldLabel}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={styles.fieldInput} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPOSANT LOGIN ADMIN
// ════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.rpc("check_admin_password", { input_password: pw });
    if (err || !data) {
      setError("Mot de passe incorrect."); setLoading(false); return;
    }
    sessionStorage.setItem("xxv_admin", "1");
    onLogin(); setLoading(false);
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginBox}>
        <div style={styles.logoXXV}>XXV</div>
        <h2 style={{ color: "#2c1a0e", margin: "8px 0 4px", fontSize: 20 }}>Administration</h2>
        <p style={{ color: "#7a6550", margin: "0 0 28px", fontSize: 14 }}>Domaine Vins des Cinq</p>
        <input
          type="password" placeholder="Mot de passe" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ ...styles.fieldInput, marginBottom: 12 }}
        />
        {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button style={{ ...styles.btnPrimary, width: "100%", opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPOSANT DASHBOARD ADMIN
// ════════════════════════════════════════════════════════════
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"orders" | "stats">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statPeriod, setStatPeriod] = useState<"day" | "week" | "month" | "year">("month");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("orders").select(`*, order_items(*)`).order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    if (data) setOrders(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (tab !== "stats") return;
    fetchStats();
  }, [tab, statPeriod]);

  const fetchStats = async () => {
    const now = new Date();
    let from: Date;
    if (statPeriod === "day") { from = new Date(now); from.setHours(0, 0, 0, 0); }
    else if (statPeriod === "week") { from = new Date(now); from.setDate(now.getDate() - 7); }
    else if (statPeriod === "month") { from = new Date(now.getFullYear(), now.getMonth(), 1); }
    else { from = new Date(now.getFullYear(), 0, 1); }

    const { data: ordersData } = await supabase.from("orders")
      .select("*, order_items(*)")
      .gte("created_at", from.toISOString());

    if (!ordersData) return;
    const totalRevenue = ordersData.reduce((s, o) => s + parseFloat(o.total_amount), 0);
    const totalBottles = ordersData.reduce((s, o) => s + o.order_items.reduce((ss: number, i: any) => ss + i.quantity, 0), 0);

    // Par vin
    const byWine: Record<string, { name: string; qty: number; revenue: number }> = {};
    ordersData.forEach(o => o.order_items.forEach((i: any) => {
      if (!byWine[i.wine_name]) byWine[i.wine_name] = { name: i.wine_name, qty: 0, revenue: 0 };
      byWine[i.wine_name].qty += i.quantity;
      byWine[i.wine_name].revenue += i.subtotal;
    }));
    const wineStats = Object.values(byWine).sort((a, b) => b.qty - a.qty);
    const top = wineStats[0]?.name || "—";

    setStats({ count: ordersData.length, revenue: totalRevenue, bottles: totalBottles, wineStats, top });
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchOrders();
    if (selected?.id === id) setSelected(o => o ? { ...o, status } : o);
  };

  const exportCSV = () => {
    const header = "Date,Nom,Prénom,Email,Société,TVA,Total,Statut,Détail";
    const rows = orders.map(o => {
      const detail = o.order_items.map(i => `${i.quantity}x ${i.wine_name}`).join(" | ");
      const d = new Date(o.created_at).toLocaleDateString("fr-BE");
      return `${d},"${o.last_name}","${o.first_name}","${o.email}","${o.company || ""}","${o.vat_number || ""}",${o.total_amount},${statusLabel[o.status]},"${detail}"`;
    });
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `xxv-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.adminWrap}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoXXV}>XXV</div>
          <div style={{ fontSize: 12, color: "#a0825a", marginTop: 4 }}>Administration</div>
        </div>
        <nav style={styles.nav}>
          <button style={{ ...styles.navBtn, ...(tab === "orders" ? styles.navBtnActive : {}) }} onClick={() => setTab("orders")}>
            📋 Commandes
          </button>
          <button style={{ ...styles.navBtn, ...(tab === "stats" ? styles.navBtnActive : {}) }} onClick={() => setTab("stats")}>
            📊 Statistiques
          </button>
        </nav>
        <button style={styles.logoutBtn} onClick={onLogout}>Déconnexion</button>
      </div>

      {/* Main */}
      <div style={styles.adminMain}>
        {tab === "orders" && (
          <>
            <div style={styles.adminHeader}>
              <h1 style={styles.adminTitle}>Commandes</h1>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={filter} onChange={e => setFilter(e.target.value)} style={styles.select}>
                  <option value="all">Tous les statuts</option>
                  <option value="received">Reçues</option>
                  <option value="processed">Traitées</option>
                  <option value="delivered">Livrées</option>
                </select>
                <button style={styles.btnSecondary} onClick={exportCSV}>↓ CSV</button>
              </div>
            </div>

            {loading ? <div style={styles.loading}>Chargement…</div> : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Bouteilles</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>Statut</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      const bottles = o.order_items.reduce((s, i) => s + i.quantity, 0);
                      return (
                        <tr key={o.id} style={styles.tr} onClick={() => setSelected(o)}>
                          <td style={styles.td}>{new Date(o.created_at).toLocaleDateString("fr-BE")}</td>
                          <td style={{ ...styles.td, fontWeight: 600 }}>{o.first_name} {o.last_name}</td>
                          <td style={{ ...styles.td, color: "#7a6550", fontSize: 13 }}>{o.email}</td>
                          <td style={styles.td}>{bottles}</td>
                          <td style={{ ...styles.td, fontWeight: 700 }}>{parseFloat(o.total_amount as any).toFixed(2)} €</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, background: statusColor[o.status] + "20", color: statusColor[o.status] }}>
                              {statusLabel[o.status]}
                            </span>
                          </td>
                          <td style={styles.td} onClick={e => e.stopPropagation()}>
                            <select
                              value={o.status}
                              onChange={e => updateStatus(o.id, e.target.value)}
                              style={{ ...styles.select, fontSize: 12, padding: "4px 6px" }}
                            >
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
                {orders.length === 0 && <div style={styles.empty}>Aucune commande.</div>}
              </div>
            )}
          </>
        )}

        {tab === "stats" && (
          <>
            <div style={styles.adminHeader}>
              <h1 style={styles.adminTitle}>Statistiques</h1>
              <div style={{ display: "flex", gap: 6 }}>
                {(["day", "week", "month", "year"] as const).map(p => (
                  <button key={p} style={{ ...styles.btnSecondary, ...(statPeriod === p ? { background: "#2c1a0e", color: "#e8d5a3" } : {}) }}
                    onClick={() => setStatPeriod(p)}>
                    {{ day: "Jour", week: "Semaine", month: "Mois", year: "Année" }[p]}
                  </button>
                ))}
              </div>
            </div>
            {stats && (
              <div>
                <div style={styles.statCards}>
                  <StatCard label="Commandes" value={stats.count} />
                  <StatCard label="Bouteilles" value={stats.bottles} />
                  <StatCard label="Chiffre d'affaires" value={`${stats.revenue.toFixed(2)} €`} />
                  <StatCard label="Vin phare" value={stats.top} small />
                </div>
                <h3 style={{ color: "#2c1a0e", marginTop: 32, marginBottom: 16 }}>Détail par vin</h3>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>Vin</th>
                        <th style={styles.th}>Bouteilles</th>
                        <th style={styles.th}>CA (€)</th>
                        <th style={styles.th}>Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.wineStats.map((w: any) => (
                        <tr key={w.name} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: 600 }}>{w.name}</td>
                          <td style={styles.td}>{w.qty}</td>
                          <td style={styles.td}>{w.revenue.toFixed(2)} €</td>
                          <td style={styles.td}>
                            <div style={{ background: "#f0e8d8", borderRadius: 3, overflow: "hidden", height: 8 }}>
                              <div style={{ background: "#7a1c1c", height: "100%", width: `${Math.round((w.qty / stats.bottles) * 100)}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#7a6550" }}>{Math.round((w.qty / stats.bottles) * 100)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal détail commande */}
      {selected && (
        <div style={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelected(null)}>✕</button>
            <h2 style={{ color: "#2c1a0e", margin: "0 0 4px" }}>Commande du {new Date(selected.created_at).toLocaleDateString("fr-BE", { day: "2-digit", month: "long", year: "numeric" })}</h2>
            <p style={{ color: "#7a6550", margin: "0 0 20px", fontSize: 13 }}>Réf. {selected.id.slice(0, 8).toUpperCase()}</p>
            <div style={styles.modalGrid}>
              <div><strong>Client</strong><br />{selected.first_name} {selected.last_name}</div>
              <div><strong>Email</strong><br />{selected.email}</div>
              {selected.company && <div><strong>Société</strong><br />{selected.company}</div>}
              {selected.vat_number && <div><strong>TVA</strong><br />{selected.vat_number}</div>}
              {selected.company_address && <div style={{ gridColumn: "1/-1" }}><strong>Adresse</strong><br />{selected.company_address}</div>}
            </div>
            <h3 style={{ color: "#2c1a0e", margin: "20px 0 10px" }}>Détail</h3>
            {selected.order_items.map((i, idx) => (
              <div key={idx} style={styles.orderItemRow}>
                <span>{i.quantity}× {i.wine_name}</span>
                <span>{parseFloat(i.subtotal as any).toFixed(2)} €</span>
              </div>
            ))}
            <div style={styles.orderTotal}>
              Total : <strong>{parseFloat(selected.total_amount as any).toFixed(2)} €</strong>
            </div>
            {selected.notes && <div style={{ marginTop: 12, color: "#4b3d2a", fontSize: 14 }}><strong>Remarques :</strong> {selected.notes}</div>}
            <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {["received", "processed", "delivered"].map(s => (
                <button key={s}
                  style={{ ...styles.btnSecondary, ...(selected.status === s ? { background: "#2c1a0e", color: "#e8d5a3" } : {}) }}
                  onClick={() => updateStatus(selected.id, s)}>
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, small = false }: { label: string; value: any; small?: boolean }) {
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: 12, color: "#7a6550", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: small ? 18 : 28, fontWeight: 700, color: "#2c1a0e" }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════
export default function App() {
  const isAdmin = window.location.pathname === "/admin";
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem("xxv_admin") === "1");

  if (isAdmin) {
    if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;
    return <AdminDashboard onLogout={() => { sessionStorage.removeItem("xxv_admin"); setLoggedIn(false); }} />;
  }
  return <OrderForm />;
}

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════
const styles: Record<string, React.CSSProperties> = {
  formContainer: { maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px", fontFamily: "'Cormorant Garamond', Georgia, serif" },
  formHeader: { textAlign: "center", marginBottom: 48, borderBottom: "1px solid #e8d5b0", paddingBottom: 32 },
  logoArea: { display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginBottom: 24 },
  logoXXV: { fontSize: 32, fontWeight: 900, color: "#2c1a0e", letterSpacing: 4, fontFamily: "'Cormorant Garamond', Georgia, serif" },
  logoDomain: { fontSize: 16, color: "#4b3d2a", fontWeight: 600 },
  logoSub: { fontSize: 12, color: "#9a8a78" },
  formTitle: { fontSize: 28, color: "#2c1a0e", margin: "0 0 8px", fontWeight: 400, letterSpacing: 1 },
  formSubtitle: { fontSize: 14, color: "#7a6550", margin: 0 },
  link: { color: "#7a1c1c" },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 18, color: "#2c1a0e", marginBottom: 20, fontWeight: 600, letterSpacing: .5, borderBottom: "1px solid #f0e8d8", paddingBottom: 10 },
  catBlock: { marginBottom: 28 },
  catLabel: { fontSize: 11, color: "#9a8a78", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, paddingLeft: 4 },
  wineRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#faf7f2", borderRadius: 6, marginBottom: 6, border: "1px solid #f0e8d8" },
  wineInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  wineName: { fontSize: 16, color: "#2c1a0e", fontWeight: 600 },
  wineDesc: { fontSize: 12, color: "#9a8a78" },
  winePrice: { fontSize: 16, color: "#4b3d2a", fontWeight: 700, minWidth: 70, textAlign: "right" },
  qtyControl: { display: "flex", alignItems: "center", gap: 4 },
  qtyBtn: { width: 32, height: 32, background: "#2c1a0e", color: "#e8d5a3", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 16, fontWeight: 700 },
  qtyInput: { width: 44, height: 32, textAlign: "center", border: "1px solid #d0c4b0", borderRadius: 4, fontSize: 15, fontFamily: "inherit" },
  totalBar: { position: "sticky", top: 12, background: "#2c1a0e", color: "#e8d5a3", padding: "14px 20px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, zIndex: 10, boxShadow: "0 4px 20px rgba(44,26,14,.25)" },
  totalAmount: { fontSize: 20, fontWeight: 700 },
  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fieldLabel: { display: "block", fontSize: 13, color: "#7a6550", marginBottom: 5, fontWeight: 500 },
  fieldInput: { width: "100%", padding: "10px 12px", border: "1px solid #d0c4b0", borderRadius: 5, fontSize: 15, fontFamily: "inherit", background: "#faf7f2", boxSizing: "border-box" },
  btnPrimary: { display: "block", width: "100%", padding: "16px 24px", background: "#2c1a0e", color: "#e8d5a3", border: "none", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: .5, marginTop: 20 },
  btnSecondary: { padding: "8px 16px", background: "#f5ede0", color: "#4b3d2a", border: "1px solid #d0c4b0", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontSize: 13 },
  errorMsg: { background: "#fdf0f0", color: "#c0392b", padding: "12px 16px", borderRadius: 5, marginBottom: 12, fontSize: 14, border: "1px solid #f8d0d0" },
  legal: { textAlign: "center", fontSize: 12, color: "#9a8a78", marginTop: 12 },
  successBox: { maxWidth: 480, margin: "80px auto", padding: 48, textAlign: "center", background: "#faf7f2", borderRadius: 8, border: "1px solid #e8d5b0" },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 26, color: "#2c1a0e", margin: "0 0 16px" },
  successText: { color: "#4b3d2a", lineHeight: 1.7, marginBottom: 28 },
  // Admin
  loginWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#faf7f2" },
  loginBox: { width: 360, padding: 40, background: "#fff", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,.08)", textAlign: "center", fontFamily: "'Cormorant Garamond', Georgia, serif" },
  adminWrap: { display: "flex", minHeight: "100vh", fontFamily: "'Cormorant Garamond', Georgia, serif" },
  sidebar: { width: 220, background: "#2c1a0e", display: "flex", flexDirection: "column", padding: "32px 20px" },
  sidebarLogo: { textAlign: "center", marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid #4a2e18" },
  nav: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  navBtn: { padding: "11px 14px", background: "transparent", color: "#c4a67a", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left", fontSize: 15, fontFamily: "inherit" },
  navBtnActive: { background: "#4a2e18", color: "#e8d5a3" },
  logoutBtn: { padding: "10px 14px", background: "transparent", color: "#7a5a3a", border: "1px solid #4a2e18", borderRadius: 5, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  adminMain: { flex: 1, padding: "40px 48px", background: "#faf7f2", overflowY: "auto" },
  adminHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  adminTitle: { fontSize: 26, color: "#2c1a0e", margin: 0, fontWeight: 600 },
  tableWrap: { background: "#fff", borderRadius: 8, border: "1px solid #e8d5b0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f5ede0" },
  th: { padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#7a6550", textTransform: "uppercase", letterSpacing: .5, fontWeight: 600 },
  tr: { borderBottom: "1px solid #f0e8d8", cursor: "pointer" },
  td: { padding: "13px 14px", color: "#2c1a0e", fontSize: 14 },
  badge: { padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  select: { padding: "8px 12px", border: "1px solid #d0c4b0", borderRadius: 5, background: "#faf7f2", fontFamily: "inherit", fontSize: 14, color: "#2c1a0e" },
  loading: { padding: 40, textAlign: "center", color: "#7a6550" },
  empty: { padding: 40, textAlign: "center", color: "#9a8a78" },
  statCards: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  statCard: { background: "#fff", border: "1px solid #e8d5b0", borderRadius: 8, padding: "20px 24px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(44,26,14,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: 10, padding: 36, maxWidth: 560, width: "90%", maxHeight: "85vh", overflowY: "auto", position: "relative", fontFamily: "'Cormorant Garamond', Georgia, serif" },
  modalClose: { position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#7a6550" },
  modalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#faf7f2", padding: 16, borderRadius: 6, fontSize: 14, color: "#4b3d2a" },
  orderItemRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0e8d8", fontSize: 15, color: "#2c1a0e" },
  orderTotal: { textAlign: "right", fontSize: 18, color: "#2c1a0e", paddingTop: 12 },
};

