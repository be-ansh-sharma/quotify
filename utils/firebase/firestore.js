import { db } from './firebaseconfig';
import {
  collection,
  query,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  setDoc,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  deleteDoc,
  getDoc,
  deleteField,
} from 'firebase/firestore';
import quotes from 'assets/quotes.json';
import * as Localization from 'expo-localization';
import { convertToUTCTimeBucket } from 'utils/helpers';

export const uploadQuotes = async () => {
  const quotesRef = collection(db, 'quotes');
  const tagsRef = collection(db, 'tags');
  const authorsRef = collection(db, 'authors'); // New authors collection

  let added = 0;
  let skipped = 0;

  try {
    // Fetch all existing quotes using fetchAllQuotes
    const existingQuotes = await fetchAllQuotes();
    console.log(
      `Fetched ${existingQuotes.size} existing quotes for duplicate check.`
    );

    // Use Firestore batch for efficient writes
    let batch = writeBatch(db);
    let batchCount = 0;

    // Track authors and their quote counts
    const authorQuoteCounts = {};

    for (const quote of quotes) {
      if (existingQuotes.has(quote.text)) {
        skipped++;
        continue;
      }

      // Generate a new document ref (auto-ID)
      const newDocRef = doc(quotesRef); // Firebase will auto-generate a unique ID
      const id = newDocRef.id;

      // Prepare quote data
      const newQuote = {
        ...quote,
        id,
        createdAt: serverTimestamp(),
      };

      // Add quote to batch
      batch.set(newDocRef, newQuote);
      added++;
      batchCount++;

      // Update tags collection
      for (const tag of quote.tags) {
        const tagRef = doc(tagsRef, tag);
        batch.set(
          tagRef,
          { name: tag, quotes: 1 },
          { merge: true } // Increment quotes count if tag exists
        );
      }

      // Track author and increment their quote count
      const author = quote.author;
      if (author) {
        if (!authorQuoteCounts[author]) {
          authorQuoteCounts[author] = 0;
        }
        authorQuoteCounts[author]++;
      }

      // Commit batch if it reaches Firestore's limit of 500 writes
      if (batchCount >= 500) {
        await batch.commit();
        console.log('Batch committed.');
        batch = writeBatch(db); // Start a new batch
        batchCount = 0;
      }
    }

    // Commit any remaining writes in the batch
    if (batchCount > 0) {
      await batch.commit();
      console.log('Final batch committed.');
    }

    // Update authors collection with quote counts
    batch = writeBatch(db); // Start a new batch for authors
    batchCount = 0;

    for (const [author, quoteCount] of Object.entries(authorQuoteCounts)) {
      const authorRef = doc(authorsRef, author);
      batch.set(
        authorRef,
        { name: author, quotes: quoteCount },
        { merge: true } // Merge to update quote count if the author already exists
      );
      batchCount++;

      // Commit batch if it reaches Firestore's limit of 500 writes
      if (batchCount >= 500) {
        await batch.commit();
        console.log('Author batch committed.');
        batch = writeBatch(db); // Start a new batch
        batchCount = 0;
      }
    }

    // Commit any remaining writes in the batch for authors
    if (batchCount > 0) {
      await batch.commit();
      console.log('Final author batch committed.');
    }

    console.log(`✅ Added: ${added}, Skipped (duplicate): ${skipped}`);
  } catch (error) {
    console.error('Error uploading quotes:', error);
  }
};

export const fetchAllQuotes = async () => {
  const quotesRef = collection(db, 'quotes');
  const pageSize = 500; // Number of documents to fetch per page
  const existingQuotes = new Set();
  let lastDoc = null;
  let totalFetched = 0;

  try {
    while (true) {
      const quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('text'),
            startAfter(lastDoc),
            limit(pageSize)
          )
        : query(quotesRef, orderBy('text'), limit(pageSize));

      const snapshot = await getDocs(quotesQuery);

      // Add fetched quotes to the Set
      snapshot.forEach((doc) => {
        existingQuotes.add(doc.data().text);
      });

      totalFetched += snapshot.size;

      console.log(
        `Fetched ${snapshot.size} quotes. Total fetched: ${totalFetched}`
      );

      // Break the loop if there are no more documents to fetch
      if (snapshot.size < pageSize) {
        break;
      }

      // Set the last document for the next query
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    console.log(`Total quotes fetched: ${totalFetched}`);
    return existingQuotes;
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return existingQuotes;
  }
};

export const createUser = async (userData) => {
  try {
    if (!userData.uid || !userData.email) {
      throw new Error('UID and email are required to create a user.');
    }

    const userDocRef = doc(db, 'users', userData.uid); // Use UID as the document ID
    await setDoc(userDocRef, {
      email: userData.email,
      firstName: userData.firstName || '', // Optional fields
      lastName: userData.lastName || '',
      createdAt: new Date().toISOString(),
      uid: userData.uid,
    });

    console.log('User created successfully in Firestore:', userData);
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
};

export const fetchQuotes = async (
  lastDoc = null,
  selectedSort,
  author = null,
  tag = null
) => {
  const quotesRef = collection(db, 'quotes');
  let quotesQuery;

  // Determine the sorting logic based on selectedSort
  switch (selectedSort) {
    case 'newest':
      quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(20)
          )
        : query(quotesRef, orderBy('createdAt', 'desc'), limit(20));
      break;
    case 'oldest':
      quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('createdAt', 'asc'),
            startAfter(lastDoc),
            limit(20)
          )
        : query(quotesRef, orderBy('createdAt', 'asc'), limit(20));
      break;
    case 'mostPopular':
      quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('likes', 'desc'),
            startAfter(lastDoc),
            limit(20)
          )
        : query(quotesRef, orderBy('likes', 'desc'), limit(20));
      break;
    case 'a_z_author':
      quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('author', 'asc'),
            startAfter(lastDoc),
            limit(20)
          )
        : query(quotesRef, orderBy('author', 'asc'), limit(20));
      break;
    case 'z_a_author':
      quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('author', 'desc'),
            startAfter(lastDoc),
            limit(20)
          )
        : query(quotesRef, orderBy('author', 'desc'), limit(20));
      break;
    default:
      quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('likes', 'desc'),
            startAfter(lastDoc),
            limit(20)
          )
        : query(quotesRef, orderBy('likes', 'desc'), limit(20));
  }

  // Add a filter for the author if provided
  if (author) {
    quotesQuery = query(quotesQuery, where('author', '==', author));
  }

  // Add a filter for the tag if provided
  if (tag) {
    quotesQuery = query(quotesQuery, where('tags', 'array-contains', tag));
  }

  try {
    const snapshot = await getDocs(quotesQuery);

    if (!snapshot.empty) {
      const newQuotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1]; // Get the last document
      return {
        newQuotes,
        lastVisibleDoc,
        hasMoreQuotes: true,
      };
    } else {
      return {
        newQuotes: [],
        lastVisibleDoc: null,
        hasMoreQuotes: false, // No more quotes to fetch
      };
    }
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
};

export const fetchUserProfile = async (email) => {
  try {
    if (!email) {
      console.error('Invalid email parameter:', email);
      return null;
    }

    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', email));

    try {
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userProfile = userSnapshot.docs[0].data();
        return userProfile;
      } else {
        console.log('User not found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
      throw error;
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * Add a quote to the user's likes in Firestore.
 * @param {string} userId - The user's UID.
 * @param {string} quoteId - The quote's UID.
 */
export const likeQuote = async (userId, quoteId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      likes: arrayUnion(quoteId), // Add the quote UID to the likes array
    });
    console.log(`Quote ${quoteId} liked by user ${userId}`);
  } catch (error) {
    console.error('Error liking quote:', error);
    throw error;
  }
};

/**
 * Remove a quote from the user's likes in Firestore.
 * @param {string} userId - The user's UID.
 * @param {string} quoteId - The quote's UID.
 */
export const unlikeQuote = async (userId, quoteId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      likes: arrayRemove(quoteId), // Remove the quote UID from the likes array
    });
    console.log(`Quote ${quoteId} unliked by user ${userId}`);
  } catch (error) {
    console.error('Error unliking quote:', error);
    throw error;
  }
};

/**
 * Add a quote to the user's bookmarks in Firestore.
 * @param {string} userId - The user's UID.
 * @param {string} quoteId - The quote's UID.
 */
export const bookmarkQuote = async (userId, quoteId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      bookmarked: arrayUnion(quoteId), // Add the quote UID to the bookmarks array
    });
    console.log(`Quote ${quoteId} bookmarked by user ${userId}`);
  } catch (error) {
    console.error('Error bookmarking quote:', error);
    throw error;
  }
};

/**
 * Remove a quote from the user's bookmarks in Firestore.
 * @param {string} userId - The user's UID.
 * @param {string} quoteId - The quote's UID.
 */
export const unbookmarkQuote = async (userId, quoteId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      bookmarked: arrayRemove(quoteId), // Remove the quote UID from the bookmarks array
    });
    console.log(`Quote ${quoteId} unbookmarked by user ${userId}`);
  } catch (error) {
    console.error('Error unbookmarking quote:', error);
    throw error;
  }
};

export const fetchAuthors = async (lastDoc = null) => {
  try {
    const authorsRef = collection(db, 'authors'); // Replace 'authors' with your Firestore collection name
    let authorsQuery = query(authorsRef, orderBy('name', 'asc'), limit(10)); // Fetch 10 authors at a time

    if (lastDoc) {
      authorsQuery = query(authorsQuery, startAfter(lastDoc)); // Start after the last document for pagination
    }

    const snapshot = await getDocs(authorsQuery);

    const newAuthors = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1]; // Get the last document
    const hasMoreAuthors = snapshot.docs.length === 10; // Check if there are more authors to load

    return { newAuthors, lastVisibleDoc, hasMoreAuthors };
  } catch (error) {
    console.error('Error fetching authors:', error);
    throw error;
  }
};

export const fetchTags = async (lastDoc = null) => {
  try {
    const tagsRef = collection(db, 'tags'); // Replace 'tags' with your Firestore collection name
    let tagsQuery = query(tagsRef, orderBy('name', 'asc'), limit(10)); // Fetch 10 tags at a time

    if (lastDoc) {
      tagsQuery = query(tagsQuery, startAfter(lastDoc)); // Start after the last document for pagination
    }

    const snapshot = await getDocs(tagsQuery);

    const newTags = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1]; // Get the last document
    const hasMoreTags = snapshot.docs.length === 10; // Check if there are more tags to load

    return { newTags, lastVisibleDoc, hasMoreTags };
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

export const followAuthor = async (userId, author) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      followedAuthors: arrayUnion(author), // Add the author to the followedAuthors array
    });
    console.log(`User ${userId} is now following ${author}`);
  } catch (error) {
    console.error('Error following author:', error);
    throw error;
  }
};

export const unfollowAuthor = async (userId, author) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      followedAuthors: arrayRemove(author), // Remove the author from the followedAuthors array
    });
    console.log(`User ${userId} has unfollowed ${author}`);
  } catch (error) {
    console.error('Error unfollowing author:', error);
    throw error;
  }
};

export const fetchQuotesByAuthors = async (
  authors,
  lastDoc = null,
  sort = 'newest',
  processedChunks = 0 // Track how many chunks have already been processed
) => {
  try {
    const quotesRef = collection(db, 'quotes');
    const chunkSize = 10; // Firestore allows a maximum of 10 values in the `in` clause
    const authorChunks = [];

    // Split authors into chunks of 10
    for (let i = 0; i < authors.length; i += chunkSize) {
      authorChunks.push(authors.slice(i, i + chunkSize));
    }

    let allQuotes = [];
    let lastVisibleDoc = lastDoc;
    let hasMoreQuotes = false;

    // Start processing from the current chunk
    for (
      let chunkIndex = processedChunks;
      chunkIndex < authorChunks.length;
      chunkIndex++
    ) {
      const chunk = authorChunks[chunkIndex];

      let quotesQuery = query(
        quotesRef,
        where('author', 'in', chunk),
        orderBy('createdAt', sort === 'newest' ? 'desc' : 'asc'),
        limit(20) // Fetch 20 quotes at a time
      );

      if (lastVisibleDoc) {
        quotesQuery = query(quotesQuery, startAfter(lastVisibleDoc));
      }

      const snapshot = await getDocs(quotesQuery);

      const newQuotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allQuotes = [...allQuotes, ...newQuotes];
      lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMoreQuotes = snapshot.docs.length === 20;

      // If we fetched a full batch, stop and return the results
      if (hasMoreQuotes) {
        return {
          newQuotes: allQuotes,
          lastVisibleDoc,
          hasMoreQuotes,
          processedChunks: chunkIndex, // Return the current chunk index
        };
      }

      // Reset lastDoc for the next chunk
      lastVisibleDoc = null;
    }

    // If we processed all chunks and didn't fetch a full batch, return the results
    return {
      newQuotes: allQuotes,
      lastVisibleDoc: null,
      hasMoreQuotes: false,
      processedChunks: authorChunks.length, // All chunks have been processed
    };
  } catch (error) {
    console.error('Error fetching quotes by authors:', error);
    throw error;
  }
};

export const fetchQuotesByIds = async (
  ids,
  startIndex = 0,
  limit = 10,
  processedChunks = 0 // Track processed chunks
) => {
  if (!ids || startIndex >= ids.length) return { quotes: [], hasMore: false };

  const chunkSize = 10; // Firestore allows a maximum of 10 IDs in an `in` query
  const idChunks = [];

  // Split IDs into chunks of 10
  for (let i = 0; i < ids.length; i += chunkSize) {
    idChunks.push(ids.slice(i, i + chunkSize));
  }

  let allQuotes = [];
  let hasMore = false;

  // Start processing from the current chunk
  for (
    let chunkIndex = processedChunks;
    chunkIndex < idChunks.length;
    chunkIndex++
  ) {
    const chunk = idChunks[chunkIndex];

    // Fetch quotes for the current chunk
    const q = query(collection(db, 'quotes'), where('__name__', 'in', chunk));
    const snapshot = await getDocs(q);

    const newQuotes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    allQuotes = [...allQuotes, ...newQuotes];

    // Check if we've reached the limit
    if (allQuotes.length >= limit) {
      hasMore = true;
      return {
        quotes: allQuotes.slice(0, limit), // Return only the requested number of quotes
        hasMore,
        nextIndex: startIndex + limit, // Update the next start index
        processedChunks: chunkIndex, // Return the current chunk index
      };
    }
  }

  // If all chunks are processed and we haven't reached the limit
  return {
    quotes: allQuotes,
    hasMore: false,
    nextIndex: ids.length, // All IDs have been processed
    processedChunks: idChunks.length, // All chunks have been processed
  };
};

/**
 * Updates the user's profile in Firestore.
 * @param {string} uid - The user's UID (used as the document ID).
 * @param {object} updatedProfile - The updated profile data (e.g., firstName, lastName).
 */
export const updateUserProfile = async (uid, updatedProfile) => {
  try {
    console.log('ssss', uid);
    if (!uid) {
      throw new Error('UID is required to update the user profile.');
    }

    const userDocRef = doc(db, 'users', uid); // Use UID as the document ID
    await updateDoc(userDocRef, updatedProfile);
    console.log(
      'User profile updated successfully in Firestore:',
      updatedProfile
    );
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
    throw error;
  }
};

/**
 * Add a new quote to the Firestore database.
 * @param {object} quote - The quote object to add.
 * @returns {Promise<void>} - A promise that resolves when the quote is added.
 */
export const addQuote = async (quote) => {
  try {
    const quotesRef = collection(db, 'pendingquotes');
    await addDoc(quotesRef, quote); // Add the quote to Firestore
    console.log('Quote added successfully:', quote);
  } catch (error) {
    console.error('Error adding quote:', error);
    throw error; // Rethrow the error to handle it in the calling function
  }
};

/**
 * Fetch pending quotes from Firestore.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of pending quotes.
 */
export const fetchPendingQuotes = async () => {
  try {
    const pendingQuotesRef = collection(db, 'pendingquotes');
    const pendingQuotesQuery = query(
      pendingQuotesRef,
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(pendingQuotesQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching pending quotes:', error);
    throw error;
  }
};

/**
 * Approve a pending quote and move it to the main quotes collection.
 * @param {object} quote - The quote object to approve.
 */
export const approveQuote = async (quote) => {
  try {
    const quotesRef = doc(db, 'quotes', quote.id); // Reference to the main quotes collection
    const pendingQuoteRef = doc(db, 'pendingquotes', quote.id); // Reference to the pending quote

    // Add the quote to the main quotes collection
    await setDoc(quotesRef, {
      ...quote,
      approved: true,
      userQuote: true,
      createdAt: quote.createdAt || new Date().toISOString(),
    });

    // Remove the quote from the pendingquotes collection
    await deleteDoc(pendingQuoteRef);

    console.log(`Quote approved and moved to main collection: ${quote.id}`);
  } catch (error) {
    console.error('Error approving quote:', error);
    throw error;
  }
};

/**
 * Reject a pending quote and delete it from Firestore.
 * @param {string} quoteId - The ID of the quote to reject.
 */
export const rejectQuote = async (quoteId) => {
  try {
    const pendingQuoteRef = doc(db, 'pendingquotes', quoteId);
    await deleteDoc(pendingQuoteRef);

    console.log(`Quote rejected and deleted: ${quoteId}`);
  } catch (error) {
    console.error('Error rejecting quote:', error);
    throw error;
  }
};

/**
 * Fetch quotes created by a specific user.
 * @param {string} userId - The user's UID.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of quotes created by the user.
 */
export const fetchQuotesByUser = async (userId) => {
  try {
    const quotesRef = collection(db, 'quotes');
    const userQuotesQuery = query(
      quotesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(userQuotesQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching user quotes:', error);
    throw error;
  }
};

/**
 * Fetch paginated user quotes where userQuote is true.
 * @param {number} pageSize - Number of quotes to fetch per page.
 * @param {object} lastVisible - The last document from the previous query.
 * @returns {Promise<{ quotes: Array<object>, lastDoc: object }>} - A promise that resolves to an array of quotes and the last document.
 */
export const fetchUserQuotesPaginated = async (pageSize, lastVisible) => {
  try {
    const quotesRef = collection(db, 'quotes');
    let userQuotesQuery = query(
      quotesRef,
      where('userQuote', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastVisible) {
      userQuotesQuery = query(
        quotesRef,
        where('userQuote', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(userQuotesQuery);

    const quotes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1]; // Get the last document

    return { quotes, lastDoc };
  } catch (error) {
    console.error('Error fetching paginated user quotes:', error);
    throw error;
  }
};

/**
 * Add a quote to a specific list in the user's bookmarklist.
 * @param {string} userId - The user's UID.
 * @param {string} listName - The name of the list.
 * @param {object} quote - The quote object to add.
 * @returns {Promise<void>} - A promise that resolves when the quote is added.
 */
export const addQuoteToList = async (userId, listName, quoteId) => {
  try {
    const userDocRef = doc(db, 'users', userId);

    // Update the specific list in the user's bookmarklist
    await updateDoc(userDocRef, {
      [`bookmarklist.${listName}`]: arrayUnion(quoteId), // Add the quote to the specified list
    });

    console.log(`Quote added to list "${listName}" for user ${userId}`);
  } catch (error) {
    console.error(`Error adding quote to list "${listName}":`, error);
    throw error;
  }
};

export const removeQuoteFromList = async (userId, listName, quoteId) => {
  try {
    const userDocRef = doc(db, 'users', userId);

    // Remove the quote from the specified list
    await updateDoc(userDocRef, {
      [`bookmarklist.${listName}`]: arrayRemove(quoteId),
    });

    console.log(`Quote removed from list "${listName}" for user ${userId}`);
  } catch (error) {
    console.error(`Error removing quote from list "${listName}":`, error);
    throw error;
  }
};

/**
 * Fetch quotes in batches from Firestore.
 * @param {Array<string>} quoteIds - Array of quote IDs to fetch.
 * @param {number} startIndex - The starting index for the batch.
 * @returns {Promise<Array>} - Array of fetched quote objects.
 */
export const fetchQuotesInBatches = async (quoteIds, startIndex) => {
  try {
    const BATCH_SIZE = 10;
    const batch = quoteIds.slice(startIndex, startIndex + BATCH_SIZE); // Get the next batch of IDs
    if (batch.length === 0) return []; // No more quotes to fetch

    const q = query(
      collection(db, 'quotes'),
      where('id', 'in', batch) // Use Firestore's `in` operator
    );

    const querySnapshot = await getDocs(q);
    const fetchedQuotes = [];
    querySnapshot.forEach((doc) => {
      fetchedQuotes.push({ id: doc.id, ...doc.data() });
    });

    return fetchedQuotes;
  } catch (error) {
    console.error('Error fetching quotes in batches:', error);
    throw error;
  }
};

/**
 * Delete a list from the user's bookmarklist in Firestore.
 * @param {string} userId - The user's ID.
 * @param {string} listName - The name of the list to delete.
 */
export const deleteListFromUser = async (userId, listName) => {
  try {
    // Remove the list from the user's bookmarklist
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      [`bookmarklist.${listName}`]: deleteField(), // Correctly delete the list from the bookmarklist
    });

    console.log(`List "${listName}" deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting list "${listName}":`, error);
    throw error;
  }
};

/**
 * Add a user or guest to a time bucket.
 * @param {string} timeBucket - The time bucket (e.g., "09-00").
 * @param {string} id - The user ID or guest token.
 * @param {boolean} isGuest - Whether the ID belongs to a guest.
 */
const addToTimeBucket = async (timeBucket, id, isGuest) => {
  try {
    const bucketRef = doc(db, 'timeBuckets', timeBucket);

    await setDoc(
      bucketRef,
      {
        [isGuest ? 'guests' : 'users']: arrayUnion(id),
      },
      { merge: true }
    );

    console.log(`Added ${id} to time bucket ${timeBucket}.`);
  } catch (error) {
    console.error(`Error adding ${id} to time bucket ${timeBucket}:`, error);
    throw error;
  }
};

/**
 * Store the FCM token in Firestore for a user.
 * @param {string|null} userId - The ID of the user (null for guests).
 * @param {string} fcmToken - The FCM token to store.
 * @param {boolean} isGuest - Whether the user is a guest.
 */
export const storeFCMToken = async (userId, fcmToken, isGuest) => {
  try {
    const defaultPreferences = {
      tags: ['Motivational'],
      frequency: 'daily',
      time: '09:00 AM',
      randomQuoteEnabled: false,
      dndEnabled: true,
      dndStartTime: '10:00 PM',
      dndEndTime: '07:00 AM',
    };

    const timeZone = Localization.timezone;

    if (isGuest) {
      // Store the token and default preferences in the guest_tokens collection
      const guestTokenRef = collection(db, 'guest_tokens');
      const guestDoc = await addDoc(guestTokenRef, {
        fcmToken,
        preferences: defaultPreferences,
        timeZone, // Store the user's time zone
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('FCM Token and default preferences stored for guest user.');

      // Convert the time to UTC and add the guest to the time bucket
      const timeBucket = convertToUTCTimeBucket(
        defaultPreferences.time,
        timeZone
      );
      await addToTimeBucket(timeBucket, guestDoc.id, true);
    } else if (userId) {
      // Store the token and default preferences in the users collection
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Update the FCM token and retain existing preferences or set defaults
        await updateDoc(userRef, {
          fcmToken,
          preferences: userData.preferences || defaultPreferences,
          timeZone: userData.timeZone || timeZone, // Retain existing time zone or set default
          createdAt: userData.createdAt || new Date(),
          updatedAt: new Date(),
        });

        console.log('FCM Token and preferences updated for logged-in user.');
      } else {
        // If the user document doesn't exist, create it with the FCM token and default preferences
        await setDoc(userRef, {
          fcmToken,
          preferences: defaultPreferences,
          timeZone, // Store the user's time zone
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(
          'FCM Token and default preferences stored for new logged-in user.'
        );
      }
      return defaultPreferences;
    }
  } catch (error) {
    console.error('Error storing FCM token and preferences:', error);
    throw error;
  }
};

/**
 * Handle FCM token refresh for guest users.
 * @param {string} oldToken - The old FCM token.
 * @param {string} newToken - The new FCM token.
 */
export const handleGuestTokenRefresh = async (oldToken, newToken) => {
  try {
    const oldRef = doc(db, 'guest_tokens', oldToken);
    const oldSnap = await getDoc(oldRef);

    const defaultPreferences = {
      tags: ['Motivational'], // Default tags
      frequency: 'daily', // Default notification frequency
      time: '09:00 AM', // Default notification time
      randomQuoteEnabled: false, // Default: Random quote notifications disabled
      dndEnabled: true, // Default: Do Not Disturb disabled
      dndStartTime: '10:00 PM', // Default Do Not Disturb start time
      dndEndTime: '07:00 AM', // Default Do Not Disturb end time
    };

    if (oldSnap.exists()) {
      const data = oldSnap.data();

      // Copy preferences and retain the original createdAt timestamp
      const newRef = doc(db, 'guest_tokens', newToken);
      await setDoc(newRef, {
        ...data,
        fcmToken: newToken,
        preferences: data.preferences || defaultPreferences, // Retain existing preferences or set defaults
        createdAt: data.createdAt || new Date(), // Retain old createdAt or fallback to now
        updatedAt: new Date(), // Update the updatedAt timestamp
      });

      // Delete the old token
      await deleteDoc(oldRef);
      console.log('Guest token refreshed and preferences migrated.');
    } else {
      // If the old token doesn't exist, create a new document with default preferences
      const newRef = doc(db, 'guest_tokens', newToken);
      await setDoc(newRef, {
        fcmToken: newToken,
        preferences: defaultPreferences,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Default preferences set for new guest token.');
    }
  } catch (error) {
    console.error('Error handling guest token refresh:', error);
  }
};

/**
 * Fetch the FCM token for a guest user from the database.
 * @param {string} fcmToken - The FCM token to fetch.
 * @returns {Promise<object|null>} - The guest user data or null if not found.
 */
export const fetchGuestFCMToken = async (fcmToken) => {
  try {
    const guestTokenRef = doc(db, 'guest_tokens', fcmToken);
    const guestTokenSnap = await getDoc(guestTokenRef);

    if (guestTokenSnap.exists()) {
      console.log('Guest FCM token found:', guestTokenSnap.data());
      return guestTokenSnap.data();
    } else {
      console.log('Guest FCM token not found in the database.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching guest FCM token:', error);
    throw error;
  }
};

