import { expect, test } from "vite-plus/test";
import { SFX_DEFAULT_COLOR, sfxClasses } from "./sfx.logic.ts";

test("sfxClasses : toujours .sfx + la teinte demandée", () => {
  expect(sfxClasses("crimson", false)).toBe("sfx sfx-crimson");
});

test("sfxClasses : couleur vide → teinte par défaut (amber)", () => {
  expect(sfxClasses("", false)).toBe(`sfx sfx-${SFX_DEFAULT_COLOR}`);
});

test("sfxClasses : l'option verticale ajoute .sfx-vertical", () => {
  expect(sfxClasses("teal", true)).toBe("sfx sfx-teal sfx-vertical");
});
