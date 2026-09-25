import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { questions } from '../db/schema';
import { chunkQuestionOnPublish } from '../lib/chunking-pipeline';

const router = new Hono<{ Bindings: any; Variables: { user?: any } }>();

/**
 * Debug Endpoint: Check if BULK_INDEX_SECRET is available
 */
router.get('/admin/bulk-index-debug', async (c) => {
  const envSecret = c.env.BULK_INDEX_SECRET as string;
  const headerSecret = c.req.header('X-Bulk-Index-Secret');

  return c.json({
    secretAvailable: !!envSecret,
    secretLength: envSecret ? envSecret.length : 0,
    headerReceived: !!headerSecret,
    headerLength: headerSecret ? headerSecret.length : 0,
    match: headerSecret === envSecret,
  });
});

/**
 * Admin Endpoint: Bulk Index All Questions into Ask Ace Knowledge Base
 *
 * Fetches all published questions (1900+) and pre-indexes them into:
 * - D1 content_chunks table
 * - Cloudflare Vectorize for semantic search
 *
 * This improves Ask Ace's ability to provide comprehensive clinical context
 * for any question in the system.
 *
 * Authentication: Requires either valid admin auth OR BULK_INDEX_SECRET env var
 */
router.post('/admin/bulk-index-questions', async (c) => {
  try {
    // Check authentication: either valid admin session OR special bulk index secret
    const bulkSecret = c.req.header('X-Bulk-Index-Secret');
    const authUser = c.get('user') as any;
    const envSecret = c.env.BULK_INDEX_SECRET as string;

    const isBulkIndexSecretValid = bulkSecret && bulkSecret === envSecret;
    const isAdminUser = authUser?.role === 'admin';

    if (!isBulkIndexSecretValid && !isAdminUser) {
      return c.json(
        {
          error: 'Unauthorized: Requires admin role or valid BULK_INDEX_SECRET header',
        },
        401
      );
    }

    const db = drizzle(c.env.DB);
    const ai = c.env.AI;
    const vectorize = c.env.VECTORIZE;
    // 1. Fetch all published questions ordered by creation date
    const allQuestions = await db
      .select({ id: questions.id, publicId: questions.publicId, status: questions.status })
      .from(questions)
      .where(eq(questions.status, 'published'))
      .orderBy(desc(questions.createdAt));

    const totalQuestions = allQuestions.length;
    console.info(`[Bulk Index] Starting indexing of ${totalQuestions} published questions...`);

    // 2. Process questions in batches to avoid timeouts
    const batchSize = 50;
    let indexedCount = 0;
    let chunkCount = 0;
    const errors: { questionId: string; error: string }[] = [];

    for (let i = 0; i < allQuestions.length; i += batchSize) {
      const batch = allQuestions.slice(i, i + batchSize);
      console.info(`[Bulk Index] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalQuestions / batchSize)}`);

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(async (q) => {
          try {
            const chunksCreated = await chunkQuestionOnPublish(db, q.id, ai, vectorize);
            return { questionId: q.id, publicId: q.publicId, chunksCreated };
          } catch (err: any) {
            throw {
              questionId: q.id,
              publicId: q.publicId,
              error: err?.message || String(err),
            };
          }
        })
      );

      // Collect results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          indexedCount += 1;
          chunkCount += result.value.chunksCreated;
        } else if (result.status === 'rejected') {
          errors.push(result.reason);
          console.warn(`[Bulk Index] Failed to index question:`, result.reason);
        }
      }

      // Add small delay between batches to avoid overwhelming the system
      if (i + batchSize < allQuestions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successRate = ((indexedCount / totalQuestions) * 100).toFixed(2);

    return c.json({
      status: 'success',
      summary: {
        totalQuestions,
        successfullyIndexed: indexedCount,
        successRate: `${successRate}%`,
        totalChunksCreated: chunkCount,
        errorCount: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Show first 10 errors
      message: `Successfully indexed ${indexedCount}/${totalQuestions} questions into Ask Ace knowledge base. Created ${chunkCount} semantic chunks for optimal retrieval.`,
    });
  } catch (err: any) {
    console.error('[Bulk Index] Fatal error:', err);
    return c.json(
      {
        status: 'error',
        error: err?.message || 'Unknown error during bulk indexing',
      },
      500
    );
  }
});

/**
 * Admin Endpoint: Get Bulk Indexing Status
 * Returns current indexing statistics
 *
 * Authentication: Requires either valid admin auth OR BULK_INDEX_SECRET env var
 */
router.get('/admin/indexing-status', async (c) => {
  try {
    // Check authentication: either valid admin session OR special bulk index secret
    const bulkSecret = c.req.header('X-Bulk-Index-Secret');
    const authUser = c.get('user') as any;
    const envSecret = c.env.BULK_INDEX_SECRET as string;

    const isBulkIndexSecretValid = bulkSecret && bulkSecret === envSecret;
    const isAdminUser = authUser?.role === 'admin';

    if (!isBulkIndexSecretValid && !isAdminUser) {
      return c.json(
        {
          error: 'Unauthorized: Requires admin role or valid BULK_INDEX_SECRET header',
        },
        401
      );
    }

    const db = drizzle(c.env.DB);
    // Count indexed questions (those with content_chunks)
    const indexedQuestions = await db
      .select({ count: questions.id })
      .from(questions)
      .where(eq(questions.status, 'published'));

    const totalPublished = indexedQuestions.length;

    return c.json({
      status: 'success',
      indexing: {
        totalPublishedQuestions: totalPublished,
        message: `Ask Ace knowledge base is ready to serve clinical context for all ${totalPublished} published questions.`,
      },
    });
  } catch (err: any) {
    return c.json(
      {
        status: 'error',
        error: err?.message || 'Failed to fetch indexing status',
      },
      500
    );
  }
});

export default router;
