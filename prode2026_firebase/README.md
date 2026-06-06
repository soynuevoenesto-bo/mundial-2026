# Prode Mundial 2026

## Pasos para publicar en Vercel

1. Subí esta carpeta a un repositorio de GitHub
2. Entrá a vercel.com → "Add New Project" → seleccioná el repo
3. Vercel detecta Vite automáticamente → click en "Deploy"
4. ¡Listo! Compartí el link con tus amigos.

## Permisos de Firebase (IMPORTANTE)

Entrá a Firebase Console → Firestore Database → Reglas, y pegá esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Hacé click en "Publicar".

## PIN de administrador
`12041925`
