import { emit } from "@tauri-apps/api/event";
import type { CompanionInstance } from "../types/companionInstance";
import type { CharacterManifest } from "../types/character";
import { getDesktopBounds } from "./companionApi";
import {
  createCompanionInstanceWindow,
  createCompanionSpeechInstanceWindow,
  destroyCompanionInstanceWindow,
} from "./companionApi";
import {
  BUILTIN_CHARACTER_ENTRY,
  BUILTIN_CHARACTER_ID,
  getCharacter,
} from "./characterLibrary";
import { instancesFilePath } from "./fs/appPaths";
import { pathExists, readJson, writeJson } from "./fs/fileSystemAdapter";

// broadcast whenever the instance registry changes so every window can reload.
export const COMPANION_REGISTRY_EVENT = "companion-registry-changed";

const INSTANCES_VERSION = 1;
// horizontal gap between freshly spawned companions so they don't fully overlap
const SPAWN_STAGGER_PX = 160;

interface InstancesFile {
  version: number;
  instances: CompanionInstance[];
}

async function readStoredInstances(): Promise<CompanionInstance[]> {
  const path = await instancesFilePath();
  if (!(await pathExists(path))) {
    return [];
  }

  try {
    const file = await readJson<InstancesFile>(path);
    return file.instances ?? [];
  } catch (error) {
    console.error("failed to read companion instances", error);
    return [];
  }
}

async function writeStoredInstances(
  instances: CompanionInstance[],
): Promise<void> {
  const file: InstancesFile = { version: INSTANCES_VERSION, instances };
  await writeJson(await instancesFilePath(), file);
  await emit(COMPANION_REGISTRY_EVENT);
}

export async function listInstances(): Promise<CompanionInstance[]> {
  return readStoredInstances();
}

export async function getInstance(
  id: string,
): Promise<CompanionInstance | null> {
  const instances = await readStoredInstances();
  return instances.find((instance) => instance.id === id) ?? null;
}

function instanceFromCharacter(
  id: string,
  name: string,
  manifest: CharacterManifest,
  position: { x: number; y: number },
): CompanionInstance {
  return {
    id,
    name,
    characterId: manifest.id,
    position,
    velocity: { x: 0, y: 0 },
    scale: manifest.defaultScale,
    enabled: true,
    currentAnimation: "idle",
    behaviorState: "idle",
    behaviorSettings: { ...manifest.behaviorSettings },
    dialogueSettings: { ...manifest.dialogueSettings },
  };
}

// bottom-right floor of the rightmost monitor, staggered by how many
// companions already exist so new ones land beside the old ones.
async function defaultSpawnAnchor(index: number): Promise<{ x: number; y: number }> {
  try {
    const bounds = await getDesktopBounds();
    const rightmost = bounds.monitors.reduce((furthest, monitor) =>
      monitor.x + monitor.width > furthest.x + furthest.width ? monitor : furthest,
    );
    return {
      x: rightmost.x + rightmost.width - 64 - index * SPAWN_STAGGER_PX,
      y: rightmost.y + rightmost.height,
    };
  } catch {
    return { x: 200 + index * SPAWN_STAGGER_PX, y: 600 };
  }
}

async function spawnInstanceWindow(instance: CompanionInstance): Promise<void> {
  const character = (await getCharacter(instance.characterId)) ?? BUILTIN_CHARACTER_ENTRY;
  const { manifest } = character;
  const width = manifest.frameWidth * instance.scale;
  const height = manifest.frameHeight * instance.scale;
  const windowX = instance.position.x - width / 2;
  const windowY = instance.position.y - height;
  await createCompanionInstanceWindow(instance.id, windowX, windowY, width, height);
  // speech window is its own invoke so we don't nest two webview builds
  await createCompanionSpeechInstanceWindow(instance.id);
}

export async function addInstance(
  characterId: string,
  name?: string,
): Promise<CompanionInstance> {
  const instances = await readStoredInstances();
  const character = (await getCharacter(characterId)) ?? BUILTIN_CHARACTER_ENTRY;
  const position = await defaultSpawnAnchor(instances.length);
  const instance = instanceFromCharacter(
    crypto.randomUUID(),
    name ?? `${character.manifest.name} ${instances.length + 1}`,
    character.manifest,
    position,
  );

  await writeStoredInstances([...instances, instance]);
  await spawnInstanceWindow(instance);
  return instance;
}

export async function removeInstance(id: string): Promise<void> {
  const instances = await readStoredInstances();
  await writeStoredInstances(instances.filter((instance) => instance.id !== id));
  await destroyCompanionInstanceWindow(id);
}

export async function setInstanceEnabled(
  id: string,
  enabled: boolean,
): Promise<void> {
  const instances = await readStoredInstances();
  const next = instances.map((instance) =>
    instance.id === id ? { ...instance, enabled } : instance,
  );
  await writeStoredInstances(next);

  const target = next.find((instance) => instance.id === id);
  if (!target) {
    return;
  }

  if (enabled) {
    await spawnInstanceWindow(target);
  } else {
    await destroyCompanionInstanceWindow(id);
  }
}

export async function updateInstance(
  id: string,
  patch: Partial<Omit<CompanionInstance, "id">>,
): Promise<void> {
  const instances = await readStoredInstances();
  const next = instances.map((instance) =>
    instance.id === id ? { ...instance, ...patch } : instance,
  );
  await writeStoredInstances(next);
}

let bootstrapInFlight: Promise<CompanionInstance[]> | null = null;

async function bootstrapCompanionsInternal(): Promise<CompanionInstance[]> {
  let instances = await readStoredInstances();

  if (instances.length === 0) {
    const position = await defaultSpawnAnchor(0);
    const seed = instanceFromCharacter(
      "default",
      BUILTIN_CHARACTER_ENTRY.manifest.name,
      BUILTIN_CHARACTER_ENTRY.manifest,
      position,
    );
    instances = [seed];
    await writeStoredInstances(instances);
  }

  for (const instance of instances) {
    if (instance.enabled) {
      await spawnInstanceWindow(instance);
    }
  }

  return instances;
}

// ensures a first companion exists, then opens windows for enabled instances.
// called once when the dashboard mounts. deduped because react strict mode
// can fire the dashboard effect twice before the first spawn finishes.
export async function bootstrapCompanions(): Promise<CompanionInstance[]> {
  if (!bootstrapInFlight) {
    bootstrapInFlight = bootstrapCompanionsInternal().finally(() => {
      bootstrapInFlight = null;
    });
  }

  return bootstrapInFlight;
}

export { BUILTIN_CHARACTER_ID };
