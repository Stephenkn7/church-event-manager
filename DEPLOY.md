# 🚀 Guide de Déploiement sur Render

## ✅ Préparation Terminée

Votre code est prêt pour le déploiement ! Les modifications suivantes ont été apportées :

- ✅ Serveur configuré pour utiliser le port de Render (`process.env.PORT`)
- ✅ Express.js ajouté pour servir les fichiers statiques
- ✅ Script `start` ajouté pour la production
- ✅ Code poussé sur GitHub

---

## 📋 Étapes de Déploiement

### 1️⃣ Créer un Compte Render

1. Allez sur **https://render.com**
2. Cliquez sur **"Get Started for Free"**
3. Connectez-vous avec votre compte **GitHub** (recommandé)
4. Autorisez Render à accéder à vos dépôts

### 2️⃣ Créer un Nouveau Web Service

1. Sur le tableau de bord Render, cliquez sur **"New +"** (en haut à droite)
2. Sélectionnez **"Web Service"**
3. Connectez votre dépôt GitHub :
   - Si c'est la première fois, cliquez sur **"Configure account"**
   - Autorisez l'accès au dépôt `church-event-manager`
   - Sélectionnez le dépôt **`Stephenkn7/church-event-manager`**

### 3️⃣ Configurer le Service

Remplissez les champs suivants :

| Champ | Valeur |
|-------|--------|
| **Name** | `church-event-manager` (ou votre choix) |
| **Region** | `Frankfurt (EU Central)` (le plus proche de vous) |
| **Branch** | `main` |
| **Root Directory** | *(laisser vide)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### 4️⃣ Choisir le Plan Gratuit

1. Descendez jusqu'à la section **"Instance Type"**
2. Sélectionnez **"Free"** (0$/mois)
3. Lisez les limitations :
   - ⚠️ L'application s'endort après 15 min d'inactivité
   - ⏱️ Redémarre en ~30 secondes au prochain accès
   - 💾 750 heures/mois gratuites

### 5️⃣ Créer le Service

1. Cliquez sur **"Create Web Service"** (en bas de la page)
2. Attendez le déploiement (environ **5-10 minutes**)
3. Vous verrez les logs de build en temps réel

---

## 📊 Suivi du Déploiement

Pendant le déploiement, vous verrez :

```
==> Installing dependencies...
==> Building application...
==> Starting server...
✅ Server running on port 10000
```

Une fois terminé, vous verrez :
- ✅ **"Live"** en vert en haut de la page
- 🔗 Votre URL de déploiement : `https://church-event-manager.onrender.com`

---

## 🧪 Vérification Post-Déploiement

### Tests à Effectuer

1. **Accès à l'application**
   - Cliquez sur l'URL fournie par Render
   - Vérifiez que la page d'accueil s'affiche

2. **Navigation**
   - Testez tous les liens : Home, Builder, Templates, Members, Activities, Stats
   - Vérifiez qu'il n'y a pas d'erreurs 404

3. **WebSocket (Console)**
   - Ouvrez la console du navigateur (F12)
   - Cherchez : `"Client connected"` ou messages de connexion Socket.io
   - Vérifiez qu'il n'y a pas d'erreurs de connexion

4. **Fonctionnalités**
   - Créez un membre
   - Créez un modèle de service
   - Rafraîchissez la page → les données doivent persister (localStorage)

---

## ⚠️ Problèmes Courants

### Erreur : "Build failed"

**Solution** : Vérifiez les logs de build. Souvent causé par :
- Dépendances manquantes
- Erreurs de syntaxe

### Erreur : "Application failed to start"

**Solution** : Vérifiez que :
- Le script `start` est bien `node server.js`
- Le fichier `dist/` existe après le build

### WebSocket ne se connecte pas

**Solution** : Vérifiez dans `SocketContext.jsx` que l'URL du serveur est correcte :
```javascript
const socket = io(); // Utilise automatiquement l'URL actuelle
```

---

## 🎉 Prochaines Étapes

Une fois déployé avec succès :

1. **Testez l'application** avec plusieurs appareils
2. **Partagez l'URL** avec votre équipe
3. **Configurez un nom de domaine personnalisé** (optionnel, gratuit sur Render)

---

## 📝 Informations Importantes

- **URL de votre application** : Sera fournie après le déploiement
- **Redémarrage automatique** : À chaque push sur GitHub, Render redéploie automatiquement
- **Logs** : Accessibles depuis le tableau de bord Render
- **Mise en veille** : Après 15 min d'inactivité (plan gratuit)

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Consultez les logs dans Render
2. Vérifiez que le code est bien poussé sur GitHub
3. Assurez-vous que les commandes de build fonctionnent localement
