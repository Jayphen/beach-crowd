/**
 * R2 helper functions for image storage
 */

/**
 * Upload an image to R2
 * @param {R2Bucket} bucket - R2 bucket binding
 * @param {string} key - Object key (path/filename)
 * @param {Buffer|ArrayBuffer|ReadableStream} data - Image data
 * @param {Object} options - Upload options
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadImage(bucket, key, data, options = {}) {
  const {
    contentType = 'image/png',
    metadata = {}
  } = options;

  await bucket.put(key, data, {
    httpMetadata: {
      contentType
    },
    customMetadata: metadata
  });

  // Return the key - will be used to construct public URL
  return key;
}

/**
 * Generate a key for an image
 * Format: {beachId}/{year}/{month}/{timestamp}_{webcamId}.png
 */
export function generateImageKey(beachId, webcamId, timestamp = null) {
  const date = timestamp ? new Date(timestamp) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestampStr = date.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');

  return `${beachId}/${year}/${month}/${timestampStr}_${webcamId}.png`;
}

/**
 * Get an image from R2
 */
export async function getImage(bucket, key) {
  const object = await bucket.get(key);

  if (!object) {
    return null;
  }

  return {
    data: object.body,
    metadata: object.customMetadata,
    httpMetadata: object.httpMetadata,
    uploaded: object.uploaded,
    size: object.size
  };
}

/**
 * Delete an image from R2
 */
export async function deleteImage(bucket, key) {
  await bucket.delete(key);
}

/**
 * List images for a beach
 */
export async function listBeachImages(bucket, beachId, options = {}) {
  const {
    limit = 1000,
    cursor = null
  } = options;

  const prefix = `${beachId}/`;

  const result = await bucket.list({
    prefix,
    limit,
    cursor
  });

  return {
    objects: result.objects,
    truncated: result.truncated,
    cursor: result.cursor
  };
}

/**
 * Delete old images (for cleanup tasks)
 */
export async function deleteOldImages(bucket, beachId, cutoffDate) {
  const cutoffTimestamp = cutoffDate.getTime();
  const prefix = `${beachId}/`;

  let cursor = null;
  let deletedCount = 0;

  do {
    const result = await bucket.list({
      prefix,
      limit: 1000,
      cursor
    });

    // Filter objects older than cutoff
    const toDelete = result.objects.filter(obj => {
      return obj.uploaded.getTime() < cutoffTimestamp;
    });

    // Delete in batch
    for (const obj of toDelete) {
      await bucket.delete(obj.key);
      deletedCount++;
    }

    cursor = result.truncated ? result.cursor : null;
  } while (cursor);

  return deletedCount;
}

/**
 * Get public URL for an image
 * Note: This assumes R2 public access is enabled via custom domain or R2.dev subdomain
 */
export function getImageUrl(key, publicDomain = null) {
  if (publicDomain) {
    return `https://${publicDomain}/${key}`;
  }
  // Return relative path if no public domain is configured
  return `/images/${key}`;
}

/**
 * Serve an image directly through the Worker
 * Use this if you don't have a custom domain for R2
 */
export async function serveImage(bucket, key) {
  const object = await bucket.get(key);

  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata.contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': object.httpEtag
    }
  });
}
