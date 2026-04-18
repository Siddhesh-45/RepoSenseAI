# Design System Strategy: The Synthetic Synapse

## 1. Overview & Creative North Star
The visual identity of this platform is defined by the **"Synthetic Synapse"**—a design philosophy where high-density technical data meets a vast, atmospheric void. This is not a standard SaaS dashboard; it is a high-fidelity instrument for the modern developer. 

We reject the "boxed-in" nature of traditional web apps. Instead, we embrace **Neural Cartography**: a layout style that uses intentional asymmetry, expansive negative space, and surgical precision to map complex data. By utilizing a pure black base (`#050505`), we eliminate the physical boundaries of the screen, allowing the UI to feel like a holographic projection. We break the grid through overlapping glass layers and "floating" data nodes that suggest depth beyond the Z-axis.

---

## 2. Colors & Surface Architecture
Our palette is rooted in the contrast between the absolute dark of the terminal and the radioactive energy of live code.

*   **The Foundation:** Use `surface_container_lowest` (#000000) for the primary background to achieve a "true black" depth.
*   **The "No-Line" Rule:** Standard 1px borders are strictly prohibited for defining sections. Structure is created through **Tonal Shifting**. A side-panel should be distinguished from the main canvas by moving from `surface_dim` (#0e0e0e) to `surface_container_low` (#131313).
*   **Surface Hierarchy:** 
    *   **Base:** `surface` (#0e0e0e)
    *   **Nested Content:** `surface_container` (#1a1919)
    *   **Elevated Details:** `surface_container_highest` (#262626)
*   **The Glass & Gradient Rule:** For floating modals or "neural nodes," use Glassmorphism. Apply `backdrop-filter: blur(20px)`, a background of `rgba(0, 255, 70, 0.04)`, and a "Ghost Border" of `rgba(0, 255, 70, 0.15)`. 
*   **Signature Textures:** Use a subtle linear gradient on primary CTAs transitioning from `primary` (#acffa3) to `primary_container` (#0dff47) at a 135-degree angle to provide a "charged" energy state.

---

## 3. Typography: The Editorial Tech-Stack
We use typography to signal the shift between "UI Management" and "Data Analysis."

*   **Inter (The Interface):** Used for all `display`, `headline`, and `body` scales. It provides an authoritative, clean, editorial feel. 
    *   *Strategy:* Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) for hero moments to mimic high-end tech journalism.
*   **JetBrains Mono (The Function):** Used for `label-md`, code blocks, and CLI paths. 
    *   *Strategy:* Whenever data is "live" or "plotted," switch to Monospace. This creates a psychological distinction between the tool and the output.
*   **Contrast Hierarchy:** Maintain high contrast by using `on_surface` (#ffffff) for primary text and `on_surface_variant` (#adaaaa) for secondary metadata. Avoid middle-greys; stay either bright or dark.

---

## 4. Elevation & Depth
In this system, depth is biological. We don't use grey shadows; we use **Neural Glows**.

*   **The Layering Principle:** Stack `surface_container` tiers to create hierarchy. An inner card should be `surface_container_high` sitting on a `surface_container_low` background.
*   **Ambient Glows:** For floating elements, use a diffused shadow tinted with green.
    *   *Shadow Spec:* `box-shadow: 0 20px 40px rgba(0, 255, 70, 0.08);`
*   **The Top-Accent Rule:** To define panels without using full borders, use a 1px top border of `primary_container` (#0dff47). This draws the eye to the start of a container while letting the sides bleed into the background.
*   **Animations:** All movement must use the `cubic-bezier(0.16, 1, 0.3, 1)` curve. This "out-quint" motion feels surgical—fast to start and smooth to settle—mimicking the speed of thought.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` background with `on_primary` text. No border. High-glow on hover.
*   **Secondary:** Ghost style. `outline` color for text, no background. On hover, apply the Glassmorphism spec.
*   **Tertiary:** JetBrains Mono text with a `primary` underline that expands from center on hover.

### Cards & Containers
*   **Strict Rule:** No dividers. Use `surface_container_low` and `surface_container_high` to separate content blocks. 
*   **Visual Element:** All cards must feature a 1px top-border in `primary` at 40% opacity to denote active data regions.

### Inputs & Fields
*   **Styling:** Rectangular with `sm` (0.125rem) corner radius. Use `surface_container_highest` for the field background.
*   **Focus State:** The border doesn't just change color; it should emit a soft `primary_dim` glow.

### Neural Chips
*   Used for tagging repositories or branches. 
*   **Style:** `surface_variant` background with `secondary` text. Use `label-sm` (0.6875rem) in JetBrains Mono.

### Additional Atmospheric Components
*   **The Particle Canvas:** A background layer of floating `primary` particles (opacity 0.05) to provide a sense of life.
*   **The Streamer:** Subtle, vertical matrix-style streams that appear behind the primary content container, moving at a slow, hypnotic pace.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use JetBrains Mono for anything that represents a file path, hex code, or terminal command.
*   **DO** use asymmetric layouts. For example, a heavy left-aligned header with a right-aligned, high-density data grid.
*   **DO** embrace the "Pure Black" (`#050505`). It makes the electric green accents feel intentional and high-energy.

### Don’t
*   **DON’T** use standard grey drop shadows. If it needs depth, it needs a green-tinted glow or a surface shift.
*   **DON’T** use `lg` or `xl` corner radii. This system is precise and architectural; stay within `sm` (0.125rem) and `md` (0.375rem).
*   **DON’T** use dividers or lines to separate list items. Use vertical rhythm and white space.
*   **DON’T** use standard "blue" for links. Every interaction is an emerald/electric green event.