# Guide de Déploiement ELIE OS (Hostinger)

Ce guide explique comment déployer l'application ELIE OS sur un hébergement Hostinger (Plan Premium ou Business avec support Node.js).

## 1. Prérequis Supabase
Avant de déployer, assurez-vous d'avoir configuré votre projet Supabase :
1. Créez un projet sur [supabase.com](https://supabase.com).
2. Allez dans **SQL Editor** et exécutez le contenu du fichier `supabase/schema.sql`.
3. Allez dans **Project Settings > API** et récupérez :
   - `Project URL`
   - `anon public` key
   - `service_role` key (si nécessaire pour certaines opérations backend)

## 2. Configuration Hostinger
1. Connectez-vous à votre panel Hostinger (hPanel).
2. Allez dans **Node.js** (sous la section "Avancé" ou "Hébergement").
3. Activez Node.js si ce n'est pas déjà fait.

## 3. Variables d'Environnement
Sur Hostinger, configurez les variables suivantes dans la section **Environment Variables** ou dans un fichier `.env.production` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

## 4. Build et Déploiement
1. **Localement** : Générez le build de production :
   ```bash
   npm run build
   ```
2. **Transfert** : Compressez le contenu de votre projet (incluant `.next`, `public`, `package.json`, `next.config.js`) et téléchargez-le via le **Gestionnaire de fichiers** de Hostinger ou via FTP.
3. **Installation** : Dans le terminal SSH de Hostinger :
   ```bash
   npm install --production
   ```
4. **Lancement** : 
   - Configurez le point d'entrée sur `node_modules/next/dist/bin/next` avec l'argument `start`.
   - Ou utilisez un gestionnaire de processus comme **PM2** si autorisé :
     ```bash
     pm2 start npm --name "elie-os" -- start
     ```

## 5. Cas du déploiement Statique (Export)
Si votre plan Hostinger ne supporte pas Node.js (Hébergement web simple) :
1. Modifiez `next.config.js` pour ajouter `output: 'export'`.
2. Lancez `npm run build`.
3. Transférez le contenu du dossier `/out` dans le dossier `public_html` via FTP.
**Note** : Dans ce mode, les API routes (`/api/*`) ne fonctionneront pas. Vous devrez utiliser le **Mode Démo** ou configurer les appels Supabase directement côté client (mais attention à la sécurité).

---
© 2026 ELIE Parfum · Système d'Exploitation
