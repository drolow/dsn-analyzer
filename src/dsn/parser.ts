// Parser DSN : texte plat -> arborescence de noeuds.

import { BLOCK_PARENT } from './hierarchy';
import type { DsnLine, DsnNode, ParsedFile } from './model';

/**
 * Decoupe une ligne DSN "S21.G00.30.001,'valeur'" en { code, value }.
 * Retourne null pour les lignes vides. La valeur peut contenir des virgules,
 * on ne coupe donc que sur la premiere virgule.
 */
export function parseLine(raw: string, lineNumber: number): DsnLine | null {
  const line = raw.replace(/\r$/, '').trim();
  if (line === '') return null;

  const comma = line.indexOf(',');
  if (comma === -1) return null;

  const code = line.slice(0, comma).trim();
  let value = line.slice(comma + 1).trim();
  // Retire les quotes simples encadrantes (format standard DSN).
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    value = value.slice(1, -1);
  }
  return { code, value, lineNumber };
}

/** "S21.G00.30.001" -> { block: "S21.G00.30", rubrique: "001" }. */
function splitCode(code: string): { block: string; rubrique: string } | null {
  const parts = code.split('.');
  if (parts.length < 4) return null;
  return { block: parts.slice(0, 3).join('.'), rubrique: parts[3] };
}

let nodeCounter = 0;
function makeNode(block: string): DsnNode {
  return { block, fields: {}, children: [], id: `n${nodeCounter++}` };
}

/**
 * Construit l'arborescence d'un fichier DSN a partir de son texte brut.
 *
 * Algorithme a base de pile : pour chaque bloc, on retrouve son parent declare
 * en depilant les noeuds ouverts. Un bloc inconnu est rattache au noeud courant
 * pour ne perdre aucune donnee.
 */
export function parseDsn(text: string, fileName: string): ParsedFile {
  const roots: DsnNode[] = [];
  // Pile des noeuds actuellement ouverts, du plus externe au plus interne.
  const stack: DsnNode[] = [];
  const warnings: string[] = [];
  let lineCount = 0;

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i + 1);
    if (!parsed) continue;
    const split = splitCode(parsed.code);
    if (!split) {
      warnings.push(`Ligne ${i + 1} ignoree (format inattendu) : ${lines[i].slice(0, 40)}`);
      continue;
    }
    lineCount++;
    const { block, rubrique } = split;

    const top = stack.length > 0 ? stack[stack.length - 1] : null;
    // Une rubrique appartient au bloc courant tant qu'on reste sur le meme
    // bloc et qu'aucune rubrique de ce bloc n'a deja ete vue (sinon c'est une
    // nouvelle occurrence du meme bloc -> nouveau noeud frere).
    if (top && top.block === block && !(rubrique in top.fields)) {
      top.fields[rubrique] = parsed.value;
      continue;
    }

    // Nouvelle occurrence de bloc : on cree un noeud et on le positionne.
    const node = makeNode(block);
    node.fields[rubrique] = parsed.value;
    attach(node, stack, roots);
  }

  return { fileName, roots, lineCount, warnings };
}

/** Positionne `node` dans l'arbre en depilant jusqu'a son parent declare. */
function attach(node: DsnNode, stack: DsnNode[], roots: DsnNode[]): void {
  const parentBlock = BLOCK_PARENT[node.block];

  if (parentBlock === null) {
    // Bloc racine declare (Envoi, Declaration).
    stack.length = 0;
    roots.push(node);
    stack.push(node);
    return;
  }

  if (parentBlock !== undefined) {
    // Bloc connu : on depile jusqu'a exposer son parent au sommet.
    while (stack.length > 0 && stack[stack.length - 1].block !== parentBlock) {
      stack.pop();
    }
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
      stack.push(node);
      return;
    }
    // Parent introuvable : on traite le noeud comme une racine (defensif).
    roots.push(node);
    stack.push(node);
    return;
  }

  // Bloc inconnu : rattache au noeud courant pour ne rien perdre. Si le sommet
  // est une occurrence du meme bloc, on le traite comme un frere (depile)
  // pour eviter un auto-emboitement.
  while (stack.length > 0 && stack[stack.length - 1].block === node.block) {
    stack.pop();
  }
  if (stack.length > 0) {
    stack[stack.length - 1].children.push(node);
  } else {
    roots.push(node);
  }
  stack.push(node);
}

/** Parse plusieurs fichiers. */
export function parseFiles(files: { name: string; text: string }[]): ParsedFile[] {
  return files.map((f) => parseDsn(f.text, f.name));
}
