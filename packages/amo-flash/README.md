# Amo Flash

**Flash messages, beautifully alive.** A tiny, framework-agnostic toast library: a pill that morphs into place, a
countdown you can see, smart ×N dedupe, one-pill promises and optional sound. Zero dependencies. MIT licensed.

**[Website, docs & playground →](https://amo-flash.vercel.app)** · [GitHub](https://github.com/dev-amolrakh/amo-flash)

```bash
npm install amo-flash
```

```ts
import { flash } from "amo-flash";

flash.success("Saved");
flash.error("Couldn't save", { message: "Check your connection" });
flash.success("Item archived", { action: { label: "Undo", onClick: restore } });

await flash.promise(saveProfile(), {
  loading: "Saving profile",
  success: "Profile saved",
  error: "Save failed",
});
```

No provider is required: the first flash mounts the viewport and injects its styles.

## Frameworks

```tsx
// React / Next.js (client component built in)
import { AmoFlash, flash } from "amo-flash/react";
<AmoFlash position="bottom-right" />;
```

```ts
// Vue 3
import { createAmoFlash } from "amo-flash/vue";
app.use(createAmoFlash({ position: "bottom-right" }));
```

```ts
// Svelte
import { initFlash } from "amo-flash/svelte";
onMount(() => initFlash({ position: "top-right" }));
```

```html
<!-- No build step -->
<script src="https://unpkg.com/amo-flash@1/dist/amo-flash.global.js"></script>
<script>
  AmoFlash.flash.success("Hello");
</script>
```

## API at a glance

- `flash.success | error | warning | info | notify | loading(title, options?)` returns the flash's id
- `flash.update(id, patch)`, `flash.promise(promise, messages)`, `flash.dismiss(id?)`, `flash.dismissAll()`
- `configure({ position, stacking, duration, countdown, entrance, background, theme, sound, persist, ... })`
- Headless: `subscribe()`, `getFlashes()`, `createFlashStore()`

Options: `message`, `action`, `duration`, `id`, `dedupeKey`, `sound`, `source`.

The full reference is in the [documentation](https://amo-flash.vercel.app/docs).

## License

MIT © 2026 [dev-amolrakh](https://github.com/dev-amolrakh)
