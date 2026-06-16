#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readDockerignore() {
  const dockerignorePath = path.join(__dirname, '.', '.dockerignore');
  if (!fs.existsSync(dockerignorePath)) {
    console.log('⚠️  .dockerignore non trovato');
    return [];
  }
  
  return fs.readFileSync(dockerignorePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function checkIfDirectory(pattern) {
  const cleanPattern = pattern.replace(/\/$/, '');
  
  // Controlla se esiste nel filesystem
  const fullPath = path.join(__dirname, '..', cleanPattern);
  
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    return stats.isDirectory();
  }
  
  // Non esiste - usa euristiche migliorate
  
  // Se finisce esplicitamente con /, è directory
  if (pattern.endsWith('/')) return true;
  
  // Se contiene wildcards, tratta come directory
  if (pattern.includes('*')) return true;
  
  // Prendi l'ultima parte del path
  const lastPart = cleanPattern.split('/').pop();
  
  // File comuni conosciuti
  const knownFiles = ['.env', '.npmrc', '.gitignore', '.eslintrc', '.prettierrc'];
  if (knownFiles.some(f => lastPart === f || lastPart.startsWith(f + '.'))) {
    return false;
  }
  
  // Se ha un'estensione riconoscibile (almeno 2-4 caratteri dopo il punto)
  const parts = lastPart.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1];
    // Se l'estensione è ragionevole (2-4 caratteri), è un file
    if (ext.length >= 2 && ext.length <= 5 && /^[a-z0-9]+$/i.test(ext)) {
      return false;
    }
  }
  
  // Directory che iniziano con punto ma sono directory
  const knownDirs = ['.git', '.vscode', '.serverless', '.cache'];
  if (knownDirs.includes(lastPart)) {
    return true;
  }
  
  // Default: se inizia con . e non ha estensione chiara, probabilmente è directory
  return lastPart.startsWith('.') && !lastPart.includes('.', 1);
}

function main() {
  console.log('🔧 Generazione docker-compose.yml...');
  
  // Crea file vuoto per i mount
  const emptyFilePath = path.join(__dirname, '.empty');
  if (!fs.existsSync(emptyFilePath)) {
    fs.writeFileSync(emptyFilePath, '');
    console.log('📄 Creato .devcontainer/.empty');
  }
  
  // Leggi .dockerignore
  const ignorePatterns = readDockerignore();
  console.log(`📋 Pattern da oscurare: ${ignorePatterns.length}`);
  
  const volumes = ['      - ..:/workspace:cached', ''];
  volumes.push('      # Oscuramento file e directory sensibili');
  
  for (const pattern of ignorePatterns) {
    const cleanPattern = pattern.replace(/\/$/, '');
    const fullPath = path.join(__dirname, '..', cleanPattern);

    if (checkIfDirectory(pattern)) {
      // Directory → volume anonimo
      volumes.push(`      - /workspace/${cleanPattern}/`);
      console.log(`📁 ${cleanPattern}/ → volume anonimo`);
    } else {
      // File → crea placeholder vuoto se non esiste, poi mount al file vuoto.
      // Necessario: se il file non esiste, Docker crea una directory al suo posto
      // e il mount file-su-directory fallisce avviando il container.
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, '');
        console.log(`📄 ${cleanPattern} → creato placeholder vuoto`);
      }
      volumes.push(`      - ./.empty:/workspace/${cleanPattern}:ro`);
      console.log(`📄 ${cleanPattern} → .empty`);
    }
  }
  
  const volumesText = volumes.join('\n');
  
  // Leggi template
  const templatePath = path.join(__dirname, 'docker-compose.yml.template');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ docker-compose.yml.template non trovato!');
    process.exit(1);
  }
  
  const template = fs.readFileSync(templatePath, 'utf8');
  const result = template.replace('{{VOLUMES}}', volumesText);
  
  // Scrivi
  const outputPath = path.join(__dirname, 'docker-compose.yml');
  fs.writeFileSync(outputPath, result);
  
  console.log(`✅ docker-compose.yml generato!`);
}

main();