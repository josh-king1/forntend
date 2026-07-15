import { Client, Databases, Query } from "appwrite";

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const isConfigured = Boolean(PROJECT_ID && DATABASE_ID && COLLECTION_ID);

let databases = null;

if (isConfigured) {
  const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject(PROJECT_ID);

  databases = new Databases(client);
} else {
  console.warn("Appwrite is not configured. Trending movies will be disabled.");
}

/**
 * Update Search Counter
 */
export const updateSearchCounter = async (searchTerm, movie) => {
  if (!searchTerm || !movie || !isConfigured || !databases) return;

  // Normalize the search term
  const normalizedTerm = searchTerm.trim().toLowerCase();

  // Use the normalized search term as the document ID
  const documentId = normalizedTerm
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  try {
    // Check if document already exists
    const existingDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId
    );

    // Increment count
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId,
      {
        count: existingDoc.count + 1,
      }
    );

    console.log(`Updated "${normalizedTerm}" → ${existingDoc.count + 1}`);
  } catch (error) {
    // Document doesn't exist → Create it
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        documentId,
        {
          searchTerm: normalizedTerm,
          count: 1,
          movie_id: movie.id,
          poster_url: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "",
        }
      );

      console.log(`Created "${normalizedTerm}"`);
    } catch (createError) {
      console.error("Error creating document:", createError);
    }
  }
};

/**
 * Get Trending Movies
 */
export const getTrendingMovies = async () => {
  if (!isConfigured || !databases) return [];

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc("count"),
        Query.limit(10),
      ]
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};