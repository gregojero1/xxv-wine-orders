# XXV – Domaine Vins des Cinq
## Application de gestion des commandes

---

## Structure du projet

```
wine-orders-app/
├── frontend/               ← React + Vite
│   ├── src/
│   │   ├── App.tsx         ← Application complète (formulaire + admin)
│   │   └── main.tsx        ← Point d'entrée
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   ← Schéma complet + données vins
│   │   └── 002_admin_rpc.sql        ← Fonction vérification mot de passe
│   └── functions/
│       └── daily-notification/
│           └── index.ts             ← Email quotidien 17h00
├── .github/workflows/deploy.yml     ← CI/CD GitHub → Netlify
├── netlify.toml
└── README.md
```

---

## Déploiement étape par étape

### 1. Supabase — Base de données

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet (noter l'URL et les clés)
3. Aller dans **SQL Editor** et exécuter dans l'ordre :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_admin_rpc.sql`
4. Récupérer tes clés dans **Project Settings → API** :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (clé publique, pour le frontend)
   - `SUPABASE_SERVICE_ROLE_KEY` (clé secrète, pour les Edge Functions uniquement)

> ⚠️ Le mot de passe admin par défaut est `xxv2025`. Le changer immédiatement via :
> ```sql
> UPDATE admin_users SET password_hash = crypt('ton_nouveau_mdp', gen_salt('bf')) WHERE username = 'admin';
> ```

### 2. Supabase — Edge Function (notification email)

Installer la CLI Supabase :
```bash
npm install -g supabase
supabase login
supabase link --project-ref TON_PROJECT_REF
```

Déployer la fonction :
```bash
supabase functions deploy daily-notification
```

Configurer les secrets de la fonction :
```bash
supabase secrets set RESEND_API_KEY=re_xxxx
# ou si tu utilises un autre service email, adapter index.ts
```

Configurer le cron (17h00 chaque jour) :
```bash
# Dans le dashboard Supabase → Edge Functions → daily-notification → Schedule
# Cron expression : 0 17 * * *
```

> Pour Resend : créer un compte sur [resend.com](https://resend.com), vérifier le domaine `xxv.be`, générer une API key.

### 3. GitHub — Repository

1. Créer un repo GitHub (privé recommandé)
2. Pousser le code :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TON_USER/xxv-wine-orders.git
git push -u origin main
```

### 4. Netlify — Hébergement frontend

1. Créer un compte sur [netlify.com](https://netlify.com)
2. **New site → Import from Git → GitHub** → sélectionner ton repo
3. Configuration build (déjà dans `netlify.toml`, mais vérifier) :
   - Base directory : `frontend`
   - Build command : `npm run build`
   - Publish directory : `../dist`
4. **Site settings → Environment variables** → ajouter :
   - `VITE_SUPABASE_URL` = ton URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = ta clé publique Supabase
5. Récupérer le **Site ID** et générer un **Auth Token** dans Netlify

### 5. GitHub — Secrets CI/CD

Dans ton repo GitHub → **Settings → Secrets and variables → Actions** :

| Secret | Valeur |
|--------|--------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `NETLIFY_AUTH_TOKEN` | Token Netlify |
| `NETLIFY_SITE_ID` | ID du site Netlify |

---

## Utilisation

### Formulaire client
- URL : `https://ton-site.netlify.app/`
- Accessible sans authentification
- Retrait au chai sur rendez-vous

### Dashboard admin
- URL : `https://ton-site.netlify.app/admin`
- Mot de passe unique (à définir dans la DB)
- Actions : voir, filtrer, changer le statut, exporter CSV

### Notifications email
- Envoi automatique à 17h00 chaque jour
- Uniquement si des commandes non-notifiées existent
- Destinataire : gregojero1@gmail.com

---

## Modifier la gamme de vins et les prix

Directement dans Supabase → Table `wines` :
- Modifier un prix : `UPDATE wines SET price_per_bottle = 18.50 WHERE name = 'La Lisière';`
- Désactiver un vin (ne plus afficher) : `UPDATE wines SET active = false WHERE name = 'xxx';`
- Ajouter un vin : insérer une ligne dans la table `wines`

---

## Variables d'environnement récapitulatif

| Variable | Où | Description |
|----------|-----|-------------|
| `VITE_SUPABASE_URL` | Netlify + GitHub Secrets | URL projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Netlify + GitHub Secrets | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Function Secrets | Clé secrète (Edge Functions) |
| `RESEND_API_KEY` | Supabase Function Secrets | Clé API Resend pour emails |
