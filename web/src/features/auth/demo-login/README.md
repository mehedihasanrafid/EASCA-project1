# Demo login module

This folder owns only the optional Customer/Admin buttons shown below the normal
login form. Credentials and demo account identifiers are intentionally not kept
in React.

## Turn the feature on or off

Change one backend variable:

```env
DEMO_LOGIN_ENABLED=true
```

After enabling it for the first time, run
`npm run seed --workspace dokanbd-backend` from the project root and restart the
backend. Use `false` and restart the backend to hide the panel and block
demo-session creation.

The demo Admin currently has the project's normal `ADMIN` permissions. Enable it
only against demo data that can be reset; a read-only demo policy can be added
before public deployment.

## File responsibilities

- `DemoLoginPanel.tsx` fetches availability and renders the two choices.
- `DemoLoginPanel.module.css` contains styles only for this panel.
- `index.ts` is the module's public import.

The regular form remains in `pages/auth/Login.tsx`. Session state remains in
`features/auth/AuthContext.tsx`, and HTTP calls remain in `api/auth.ts`.
