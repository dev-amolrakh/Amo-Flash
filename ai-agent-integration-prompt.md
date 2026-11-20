# Integrate Amo Flash Message Service Globally

Inspect the existing codebase and integrate **Amo Flash** as the application's centralized flash message system.

**Official documentation:** https://amo-flash.vercel.app/docs

### 1. Installation

```bash
npm i amo-flash
```

### 2. Global Integration

Use the following React integration:

```tsx
import { AmoFlash } from "amo-flash/react";

<AmoFlash
  position="top-right"
  maxVisible={7}
  background="#ffffff"
  offset={80}
  sound={{
    volume: 0.9,
  }}
/>
```

Verify the latest API against the official documentation. Mount the component only once at the application root and make it accessible throughout the application.

### 3. Implementation Requirements

- Replace the existing flash message system completely with Amo Flash. Remove obsolete dependencies and code without breaking existing functionality.
- Create a centralized, reusable approach for success, error, warning, and informational flash messages.
- Add an **App Personalization** tab inside Settings, containing a **Flash Personalization** page.
- Allow users to customize supported settings such as position, background, maximum visible messages, offset, sound, and appearance. Persist preferences.
- Match flash message colors and styling with the existing dashboard design system, including light and dark themes.
- Keep App Personalization extensible for future settings tabs.
- Update `AGENTS.md`, `CLAUDE.md`, or the existing agent instructions with permanent rules requiring all future development to use centralized Amo Flash. Prohibit alternative flash message libraries and duplicate global components.

### 4. Final Validation

Test global integration, existing functionality, personalization, theme compatibility, and responsive layouts. Run available build, lint, type-check, and test commands. Fix implementation-related errors.

**Important:** Follow the existing project architecture. Do not invent undocumented APIs or replace unrelated UI elements such as inline validation and confirmation dialogs.

**Execute the complete implementation directly in the current codebase. Do not just provide a plan.** Finish integration, migration, personalization, documentation, and testing. Provide a brief summary of changed files and test results.
