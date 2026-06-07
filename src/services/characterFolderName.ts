// disk folder names use the character name as a filesystem-safe slug.

function slugifyCharacterName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "tomoji";
}

export function buildTomojiFolderBase(name: string): string {
  return slugifyCharacterName(name);
}

export function isTomojiFolderId(id: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
}

export function legacyTomojiFolderName(id: string): string | null {
  const match = id.match(/^(.+)-tomoji(?:-(\d+))?$/);
  if (!match) {
    return null;
  }

  return `${match[1]}${match[2] ? `-${match[2]}` : ""}`;
}

export function allocateTomojiFolderName(
  name: string,
  taken: Set<string>,
): string {
  const base = buildTomojiFolderBase(name);
  if (!taken.has(base)) {
    return base;
  }

  let index = 2;
  while (taken.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
}

export function normalizeToTomojiFolderId(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "") {
    return buildTomojiFolderBase("tomoji");
  }

  const normalized = slugifyCharacterName(trimmed);
  return legacyTomojiFolderName(normalized) ?? normalized;
}

// turns edit-field input into a unique on-disk folder id
export function resolveTomojiFolderName(
  input: string,
  taken: Set<string>,
): string {
  return allocateTomojiFolderName(input.trim() || "tomoji", taken);
}
