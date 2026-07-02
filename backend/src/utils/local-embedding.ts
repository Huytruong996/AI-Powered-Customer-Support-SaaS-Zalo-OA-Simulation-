import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

class EmbeddingPipeline {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: Promise<FeatureExtractionPipeline> | null = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      // dynamically import pipeline if needed, but we already imported it
      // we use Promise to prevent race conditions during multiple concurrent calls
      this.instance = pipeline(this.task, this.model, { progress_callback }) as Promise<FeatureExtractionPipeline>;
    }
    return this.instance;
  }
}

/**
 * Generate a 384-dimensional vector embedding for a given text using a local model.
 * Does not require any external API keys.
 */
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await EmbeddingPipeline.getInstance();
    
    // pooling: 'mean' averages the token embeddings into a single sentence embedding.
    // normalize: true scales the vector to a length of 1 (useful for cosine similarity).
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
    // Output.data is a Float32Array, convert to standard JS array
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating local embedding:', error);
    throw new Error('Failed to generate local embedding');
  }
}
