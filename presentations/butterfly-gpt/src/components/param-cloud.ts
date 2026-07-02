// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-param-cloud> — nuage 3D des paramètres (Three.js), encapsulé.
// ═══════════════════════════════════════════════════════════════════════════
// Le state_dict et les familles viennent de param-cloud.logic.ts (testé). Le
// composant gère la scène Three.js (cycle de vie + glisser pour tourner). En
// mode interactif, la slide pilote `seed`/`grouped` par signaux Datastar reliés
// aux attributs (data-attr) → le composant reconstruit les points. En mode
// `decor`, aucune interaction : le nuage tourne seul.
import * as THREE from "three";
import { collect, type Fam, FAM_CENTER, FAM_COLOR, SCALE } from "./param-cloud.logic.ts";
import { injectStyleOnce } from "./style.ts";

export const TAG = "bgpt-param-cloud";

const CSS = `
.cloud { display: flex; flex-direction: column; gap: 0.5rem; }
.cloud-canvas { width: 100%; height: 340px; border: 3px solid var(--ink); border-radius: 3px;
  box-shadow: 6px 6px 0 var(--ink);
  background: radial-gradient(var(--ink) 1.1px, transparent 1.2px) 0 0 / 13px 13px,
    linear-gradient(180deg, #fdf6e6 0%, #f3e7cf 100%);
  cursor: grab; touch-action: none; overflow: hidden; }
.cloud-canvas:active { cursor: grabbing; }
.cloud-canvas.decor { height: 100%; border: none; border-radius: 0; box-shadow: none; cursor: default; }
.cloud .ctrl { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.cloud .legend { display: flex; gap: 0.9rem; font-size: 0.8rem; opacity: 0.85; }
.cloud .legend span { display: inline-flex; align-items: center; gap: 0.3rem; }
.cloud .legend i { width: 0.8rem; height: 0.8rem; border: 1.5px solid var(--ink); border-radius: 2px; display: inline-block; }
`;

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;
  injectStyleOnce("bgpt-param-cloud-style", CSS);

  class BgptParamCloud extends HTMLElement {
    static readonly observedAttributes = ["seed", "grouped"];

    #host: HTMLDivElement | null = null;
    #renderer: THREE.WebGLRenderer | null = null;
    #scene: THREE.Scene | null = null;
    #camera: THREE.PerspectiveCamera | null = null;
    #points: THREE.Points | null = null;
    #geometry: THREE.BufferGeometry | null = null;
    #raf = 0;
    #ro: ResizeObserver | null = null;
    #rotX = -0.3;
    #rotY = 0;
    #dragging = false;
    #lastX = 0;
    #lastY = 0;

    get #decor(): boolean {
      return this.hasAttribute("decor");
    }
    get #grouped(): boolean {
      const g = this.getAttribute("grouped");
      return g === "" || g === "true";
    }
    get #seed(): number {
      const s = Number(this.getAttribute("seed") ?? "1");
      return Number.isFinite(s) ? s : 1;
    }

    // positions/couleurs : un point par triplet de valeurs (x, y, z)
    #buildBuffers(): { positions: Float32Array; colors: Float32Array } {
      const { byFam } = collect(this.#seed);
      const positions: number[] = [];
      const colors: number[] = [];
      (Object.keys(byFam) as Fam[]).forEach((fam) => {
        const vals = byFam[fam];
        const c = new THREE.Color(FAM_COLOR[fam]);
        const [cx, cy, cz] = this.#grouped ? FAM_CENTER[fam] : [0, 0, 0];
        for (let i = 0; i + 2 < vals.length; i += 3) {
          positions.push(
            cx + vals[i]! * SCALE,
            cy + vals[i + 1]! * SCALE,
            cz + vals[i + 2]! * SCALE,
          );
          colors.push(c.r, c.g, c.b);
        }
      });
      return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
    }

    #refresh(): void {
      if (!this.#geometry) return;
      const { positions, colors } = this.#buildBuffers();
      this.#geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      this.#geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      this.#geometry.computeBoundingSphere();
    }

    connectedCallback(): void {
      this.style.display = "contents";
      const el = document.createElement("div");
      el.className = this.#decor ? "cloud-canvas decor" : "cloud-canvas";
      el.style.height = this.getAttribute("height") ?? "340px";
      this.#host = el;
      this.append(el);

      const w = el.clientWidth || 600;
      const hgt = el.clientHeight || 360;

      this.#scene = new THREE.Scene();
      this.#camera = new THREE.PerspectiveCamera(55, w / hgt, 0.1, 1000);
      this.#camera.position.set(0, 0, this.#decor ? 14 : 20);

      this.#renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.#renderer.setSize(w, hgt, false);
      this.#renderer.domElement.style.display = "block";
      this.#renderer.domElement.style.width = "100%";
      this.#renderer.domElement.style.height = "100%";
      el.append(this.#renderer.domElement);

      this.#geometry = new THREE.BufferGeometry();
      const material = new THREE.PointsMaterial({
        size: 0.32,
        vertexColors: true,
        sizeAttenuation: true,
      });
      this.#points = new THREE.Points(this.#geometry, material);
      this.#scene.add(this.#points);
      this.#refresh();

      const loop = (): void => {
        this.#raf = requestAnimationFrame(loop);
        if (!this.#dragging) this.#rotY += 0.0035; // rotation douce automatique
        if (this.#points) {
          this.#points.rotation.y = this.#rotY;
          this.#points.rotation.x = this.#rotX;
        }
        this.#renderer!.render(this.#scene!, this.#camera!);
      };
      loop();

      if (!this.#decor) {
        el.addEventListener("pointerdown", this.#onDown);
        el.addEventListener("pointermove", this.#onMove);
        el.addEventListener("pointerup", this.#onUp);
        el.addEventListener("pointerleave", this.#onUp);
      }

      this.#ro = new ResizeObserver(() => {
        if (!this.#renderer || !this.#camera || !this.#host) return;
        const cw = this.#host.clientWidth || 600;
        const ch = this.#host.clientHeight || 360;
        this.#camera.aspect = cw / ch;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(cw, ch, false);
      });
      this.#ro.observe(el);
    }

    attributeChangedCallback(): void {
      this.#refresh(); // seed/grouped ont changé → reconstruire les points
    }

    disconnectedCallback(): void {
      cancelAnimationFrame(this.#raf);
      this.#ro?.disconnect();
      this.#geometry?.dispose();
      (this.#points?.material as THREE.Material | undefined)?.dispose();
      this.#renderer?.dispose();
      this.#renderer?.domElement.remove();
    }

    // glisser pour tourner (arrow fns → `this` lié, retirables au disconnect)
    #onDown = (e: PointerEvent): void => {
      this.#dragging = true;
      this.#lastX = e.clientX;
      this.#lastY = e.clientY;
    };
    #onUp = (): void => {
      this.#dragging = false;
    };
    #onMove = (e: PointerEvent): void => {
      if (!this.#dragging) return;
      this.#rotY += (e.clientX - this.#lastX) * 0.01;
      this.#rotX += (e.clientY - this.#lastY) * 0.01;
      this.#lastX = e.clientX;
      this.#lastY = e.clientY;
    };
  }

  customElements.define(TAG, BgptParamCloud);
};
