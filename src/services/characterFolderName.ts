// disk folder names for user-made Tomojis: "<slug>-tomoji"

function slugifyCharacterName(name: string): string {
  let slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // avoid "fluffy-tomoji" -> "fluffy-tomoji-tomoji"
  if (slug.endsWith("-tomoji")) {
    slug = slug.slice(0, -"-tomoji".length).replace(/-+$/g, "");
  }

  return slug.length > 0 ? slug : "tomoji";
}

export function buildTomojiFolderBase(name: string): string {
  return `${slugifyCharacterName(name)}-tomoji`;
}

export function isTomojiFolderId(id: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-tomoji(?:-\d+)?$/.test(id);
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

  if (isTomojiFolderId(trimmed)) {
    return trimmed;
  }

  return buildTomojiFolderBase(trimmed);
}

// turns edit-field input into a unique on-disk folder id
export function resolveTomojiFolderName(
  input: string,
  taken: Set<string>,
): string {
  const trimmed = input.trim();
  if (trimmed === "") {
    return allocateTomojiFolderName("tomoji", taken);
  }

  if (isTomojiFolderId(trimmed) && !taken.has(trimmed)) {
    return trimmed;
  }

  return allocateTomojiFolderName(trimmed, taken);
}
