import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface ManifestChunk {
  filename: string;
  description: string;
  statementsCount: number;
  itemCount: number;
}

interface Manifest {
  totalQuestions: number;
  totalStatements: number;
  generatedAt: string;
  chunks: ManifestChunk[];
}

export async function runD1BatchSeed(isRemote = false) {
  const chunkDir = path.resolve(process.cwd(), 'seed_1905_chunks');
  const manifestPath = path.join(chunkDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('Error: Chunk manifest not found at:', manifestPath);
    console.log('Run "npm run seed:generate-1905" first to generate chunk files.');
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const targetEnv = isRemote ? '--remote' : '--local';
  console.log(`=======================================================`);
  console.log(` AcePharm D1 Batch Seed Pipeline (1,905 Scenarios)     `);
  console.log(` Target: acepharm-db (${isRemote ? 'REMOTE' : 'LOCAL'}) `);
  console.log(` Total statements: ${manifest.totalStatements} in ${manifest.chunks.length} chunks `);
  console.log(`=======================================================\n`);

  let completedStatements = 0;

  for (let i = 0; i < manifest.chunks.length; i++) {
    const chunk = manifest.chunks[i];
    const chunkPath = path.join(chunkDir, chunk.filename);
    const progressLabel = `[${i + 1}/${manifest.chunks.length}]`;

    console.log(`${progressLabel} Executing ${chunk.filename}...`);
    console.log(`       Description: ${chunk.description}`);
    console.log(`       Statements:  ${chunk.statementsCount}`);

    try {
      const cmd = `npx wrangler d1 execute acepharm-db --file="${chunkPath}" ${targetEnv} -y`;
      execSync(cmd, { stdio: 'pipe' });
      completedStatements += chunk.statementsCount;
      console.log(`       Status:      SUCCESS (${completedStatements}/${manifest.totalStatements} statements loaded)\n`);
    } catch (err: any) {
      console.error(`\n[ERROR] Failed on ${chunk.filename}:`, err.stderr?.toString() || err.message);
      console.error(`You can resume from this chunk by inspecting ${chunkPath}`);
      process.exit(1);
    }
  }

  console.log('=======================================================');
  console.log(' All 1,905 clinical scenarios successfully seeded to D1!');
  console.log('=======================================================');
}

// CLI direct run
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('seed-d1-runner')) {
  const isRemote = process.argv.includes('--remote');
  runD1BatchSeed(isRemote).catch((err) => {
    console.error('D1 Batch Seed Error:', err);
    process.exit(1);
  });
}
