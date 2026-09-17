import { describe, it, expect } from 'vitest';
import { 
  generateFull1905QuestionBank, 
  generateSqlStatements, 
  generateChunkedSqlStatements,
  GPHC_19_CATEGORIES 
} from './seed-generator-1905';

describe('1905 Clinical Scenario Engine (Phase 1 & Phase 2)', () => {
  it('has 19 curriculum categories summing to exactly 1905', () => {
    expect(GPHC_19_CATEGORIES).toHaveLength(19);
    const sumTarget = GPHC_19_CATEGORIES.reduce((sum, c) => sum + c.targetCount, 0);
    expect(sumTarget).toBe(1905);
  });

  it('maps 65+ curriculum subtopics across the 19 categories', () => {
    const totalSubtopics = GPHC_19_CATEGORIES.reduce((acc, cat) => acc + cat.subtopics.length, 0);
    expect(totalSubtopics).toBeGreaterThanOrEqual(65);
  });

  it('generates exactly 1905 clinically grounded questions with sequential public IDs', () => {
    const questions = generateFull1905QuestionBank();
    expect(questions).toHaveLength(1905);

    // Verify first and last IDs
    expect(questions[0].publicId).toBe('ACP-Q-0001');
    expect(questions[1904].publicId).toBe('ACP-Q-1905');

    // Verify option integrity
    for (const q of questions.slice(0, 100)) {
      expect(q.options).toHaveLength(5);
      const correctOpts = q.options.filter((o) => o.isCorrect);
      expect(correctOpts).toHaveLength(1);
      expect(correctOpts[0].label).toBe('A');
      expect(q.stem).toBeTruthy();
      expect(q.leadIn).toBeTruthy();
      expect(q.explanation.takeaway).toBeTruthy();
      expect(q.explanation.guidelineRef).toBeTruthy();
    }
  });

  it('eliminates ACE-18 placeholder distractors with clinically calibrated 5-tier options across all 19 categories', () => {
    const questions = generateFull1905QuestionBank();
    const bannedPlaceholderPatterns = [/placeholder/i, /lorem/i, /option\s+[b-e]/i, /tbd/i, /distractor/i];

    // Verify all 19 categories have questions
    for (const cat of GPHC_19_CATEGORIES) {
      const catQuestions = questions.filter((q) => q.categoryId === cat.id);
      expect(catQuestions.length).toBe(cat.targetCount);

      // Verify archetypes have clinically distinct 5-tier options
      for (const arch of cat.archetypes) {
        expect(arch.firstLineAction.length).toBeGreaterThan(5);
        expect(arch.firstLineRationale.length).toBeGreaterThan(10);
        expect(arch.temptingSubOptimal.length).toBeGreaterThan(5);
        expect(arch.temptingRationale.length).toBeGreaterThan(10);
        expect(arch.contraindicatedAction.length).toBeGreaterThan(5);
        expect(arch.contraindicatedRationale.length).toBeGreaterThan(10);
        expect(arch.historicalDeprecated.length).toBeGreaterThan(5);
        expect(arch.historicalRationale.length).toBeGreaterThan(10);
        expect(arch.inappropriateMonitoring.length).toBeGreaterThan(5);
        expect(arch.inappropriateRationale.length).toBeGreaterThan(10);

        // Ensure all 5 options within the archetype are mutually distinct
        const optionContents = [
          arch.firstLineAction,
          arch.temptingSubOptimal,
          arch.contraindicatedAction,
          arch.historicalDeprecated,
          arch.inappropriateMonitoring,
        ];
        const uniqueContents = new Set(optionContents);
        expect(uniqueContents.size).toBe(5);

        // Verify none contains placeholder text
        for (const content of optionContents) {
          for (const pattern of bannedPlaceholderPatterns) {
            expect(pattern.test(content)).toBe(false);
          }
        }
      }

      // Verify sample question options in this category
      const sampleQ = catQuestions[0];
      expect(sampleQ.options).toHaveLength(5);
      expect(sampleQ.options[0].label).toBe('A');
      expect(sampleQ.options[0].isCorrect).toBe(true);
      expect(sampleQ.options[1].label).toBe('B');
      expect(sampleQ.options[1].isCorrect).toBe(false);
      expect(sampleQ.options[2].label).toBe('C');
      expect(sampleQ.options[2].isCorrect).toBe(false);
      expect(sampleQ.options[3].label).toBe('D');
      expect(sampleQ.options[3].isCorrect).toBe(false);
      expect(sampleQ.options[4].label).toBe('E');
      expect(sampleQ.options[4].isCorrect).toBe(false);
    }
  });

  it('generates complete relational SQL statements with exact row counts (Phase 2)', () => {
    const questions = generateFull1905QuestionBank();
    const sqlStatements = generateSqlStatements(questions);

    // Count statements by table
    const pathwayInserts = sqlStatements.filter(s => s.includes('INSERT OR IGNORE INTO pathways'));
    const categoryInserts = sqlStatements.filter(s => s.includes('INSERT OR IGNORE INTO categories'));
    const subtopicInserts = sqlStatements.filter(s => s.includes('INSERT OR IGNORE INTO subtopics'));
    const questionInserts = sqlStatements.filter(s => s.includes('INSERT INTO questions '));
    const contentInserts = sqlStatements.filter(s => s.includes('INSERT INTO question_content '));
    const optionInserts = sqlStatements.filter(s => s.includes('INSERT INTO question_options '));
    const explanationInserts = sqlStatements.filter(s => s.includes('INSERT INTO question_explanations '));
    const governanceInserts = sqlStatements.filter(s => s.includes('INSERT INTO question_governance '));

    expect(pathwayInserts).toHaveLength(1);
    expect(categoryInserts).toHaveLength(19);
    expect(subtopicInserts.length).toBeGreaterThanOrEqual(65);
    expect(questionInserts).toHaveLength(1905);
    expect(contentInserts).toHaveLength(1905);
    expect(optionInserts).toHaveLength(9525); // 1,905 questions * 5 options = 9,525
    expect(explanationInserts).toHaveLength(1905);
    expect(governanceInserts).toHaveLength(1905);

    // Verify total statements: 1 pathway + 19 categories + subtopics + (1905 questions * 9 relational rows)
    const expectedTotal = 1 + 19 + subtopicInserts.length + (1905 * 9);
    expect(sqlStatements).toHaveLength(expectedTotal);
  });

  it('generates Cloudflare D1 compliant execution chunks under batch limits', () => {
    const questions = generateFull1905QuestionBank();
    const chunks = generateChunkedSqlStatements(questions, 200);

    expect(chunks.length).toBe(11); // 1 curriculum chunk + 10 question chunks
    expect(chunks[0].filename).toBe('chunk_00_curriculum.sql');
    expect(chunks[0].statements.some(s => s.includes('pathways'))).toBe(true);
    expect(chunks[0].statements.some(s => s.includes('categories'))).toBe(true);
    expect(chunks[0].statements.some(s => s.includes('subtopics'))).toBe(true);

    // Verify that every question chunk has <= 200 questions and <= 2000 statements
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      expect(chunk.itemCount).toBeLessThanOrEqual(200);
      expect(chunk.statements.length).toBeLessThanOrEqual(1800); // 200 * 9 = 1800
      expect(chunk.statements.some(s => s.includes('INSERT INTO questions '))).toBe(true);
      expect(chunk.statements.some(s => s.includes('INSERT INTO question_options '))).toBe(true);
    }
  });

  it('synchronizes single source of truth (QUESTION_INVENTORY in preferences) (Phase 3)', async () => {
    const { QUESTION_INVENTORY } = await import('../../../packages/preferences/src/question-inventory');

    // 1. Total live count is exactly 1905
    expect(QUESTION_INVENTORY.totalLiveCount).toBe(1905);

    // 2. All 19 categories are represented
    expect(QUESTION_INVENTORY.categories).toHaveLength(19);

    // 3. Every single category has status 'live'
    for (const cat of QUESTION_INVENTORY.categories) {
      expect(cat.status).toBe('live');
      expect(cat.count).toBeGreaterThan(0);
    }

    // 4. Sum of all categories equals 1905
    const categorySum = QUESTION_INVENTORY.categories.reduce((acc, cat) => acc + cat.count, 0);
    expect(categorySum).toBe(1905);

    // 5. Each category matches the seed generator targetCount exactly
    for (const genCat of GPHC_19_CATEGORIES) {
      const invCat = QUESTION_INVENTORY.categories.find((c) => c.id === genCat.id);
      expect(invCat).toBeDefined();
      expect(invCat!.count).toBe(genCat.targetCount);
    }
  });
});

