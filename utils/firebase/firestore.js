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
  increment,
  documentId,
} from 'firebase/firestore';
import quotes from 'assets/dev/quotes.json';
import * as Localization from 'expo-localization';
import {
  areQuotesSimilar,
  calculateTimeSlots,
  deepEqual,
  determineMood,
  getSlotInfo,
} from 'utils/helpers';

// A simple Set to track recent updates (can be kept minimal)
const recentUpdates = new Set();

export const uploadQuotes = async () => {
  console.log('🚀 Starting upload process for quotes.json');
  console.time('Total upload time');

  const quotesRef = collection(db, 'quotes');
  const tagsRef = collection(db, 'tags');
  const authorsRef = collection(db, 'authors'); // Authors collection

  console.log(`📊 Found ${quotes.length} quotes to process`);

  let added = 0;
  let skipped = 0;
  let similarSkipped = 0;
  let batchNumber = 1;
  let currentProgress = 0;

  try {
    // Fetch all existing quotes using fetchAllQuotes
    console.time('Fetching existing quotes');
    const existingQuotes = await fetchAllQuotes();
    console.timeEnd('Fetching existing quotes');
    console.log(
      `🔍 Fetched ${existingQuotes.size} existing quotes for duplicate check.`
    );

    // Use Firestore batch for efficient writes
    let batch = writeBatch(db);
    let batchCount = 0;

    // Track authors and their quote counts
    const authorQuoteCounts = {};

    console.log('⏳ Processing quotes...');
    for (const [index, quote] of quotes.entries()) {
      // Progress tracking
      const progress = Math.floor((index / quotes.length) * 100);
      if (progress >= currentProgress + 10) {
        // Log every 10%
        currentProgress = progress;
        console.log(
          `📈 Progress: ${progress}% (${index}/${quotes.length} quotes processed)`
        );
      }

      // Check for exact duplicates first (for efficiency)
      if (existingQuotes.has(quote.text)) {
        skipped++;
        continue;
      }

      // Check for similar quotes (80% similarity)
      let isSimilar = false;
      for (const existingQuote of existingQuotes) {
        if (areQuotesSimilar(quote.text, existingQuote, 0.8)) {
          isSimilar = true;
          break;
        }
      }

      if (isSimilar) {
        similarSkipped++;
        continue;
      }

      // Generate a new document ref (auto-ID)
      const newDocRef = doc(quotesRef); // Firebase will auto-generate a unique ID
      const id = newDocRef.id;

      // Generate a random value for the `random` field
      const randomValue = Math.random();

      // Determine mood for the quote
      const mood = determineMood(quote);

      // Prepare quote data
      const newQuote = {
        ...quote,
        id,
        visibility: 'public', // Add visibility field
        createdAt: serverTimestamp(),
        random: randomValue, // Add random field for quotes
        mood, // Add the mood attribute using determineMood helper
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
          {
            name: tag,
            quotes: increment(1), // Increment the quotes count by 1
            random: Math.random(), // Add random field for tags
          },
          { merge: true } // Merge to ensure the document is updated if it exists
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
        console.log(
          `🔄 Committing batch ${batchNumber} (${batchCount} operations)...`
        );
        console.time(`Batch ${batchNumber} commit time`);
        await batch.commit();
        console.timeEnd(`Batch ${batchNumber} commit time`);
        console.log(`✅ Batch ${batchNumber} committed successfully.`);

        batch = writeBatch(db); // Start a new batch
        batchCount = 0;
        batchNumber++;
      }
    }

    // Commit any remaining writes in the batch
    if (batchCount > 0) {
      console.log(
        `🔄 Committing final quote batch (${batchCount} operations)...`
      );
      console.time('Final batch commit time');
      await batch.commit();
      console.timeEnd('Final batch commit time');
      console.log('✅ Final quote batch committed successfully.');
    }

    // Update authors collection with quote counts
    console.log(
      `📚 Processing ${Object.keys(authorQuoteCounts).length} authors...`
    );
    batch = writeBatch(db); // Start a new batch for authors
    batchCount = 0;
    batchNumber = 1;

    for (const [author, quoteCount] of Object.entries(authorQuoteCounts)) {
      const authorRef = doc(authorsRef, author);
      batch.set(
        authorRef,
        {
          name: author,
          quotes: increment(quoteCount), // Increment the quotes count by the total for this author
          random: Math.random(), // Add random field for authors
        },
        { merge: true } // Merge to update quote count if the author already exists
      );
      batchCount++;

      // Commit batch if it reaches Firestore's limit of 500 writes
      if (batchCount >= 500) {
        console.log(
          `🔄 Committing author batch ${batchNumber} (${batchCount} operations)...`
        );
        console.time(`Author batch ${batchNumber} commit time`);
        await batch.commit();
        console.timeEnd(`Author batch ${batchNumber} commit time`);

        batch = writeBatch(db); // Start a new batch
        batchCount = 0;
        batchNumber++;
      }
    }

    // Commit any remaining writes in the batch for authors
    if (batchCount > 0) {
      console.log(
        `🔄 Committing final author batch (${batchCount} operations)...`
      );
      console.time('Final author batch commit time');
      await batch.commit();
      console.timeEnd('Final author batch commit time');
      console.log('✅ Final author batch committed successfully.');
    }

    console.timeEnd('Total upload time');
    console.log('\n📊 UPLOAD SUMMARY:');
    console.log(`✅ Added: ${added} quotes`);
    console.log(`⏭️ Skipped (exact duplicate): ${skipped} quotes`);
    console.log(`⏭️ Skipped (similar): ${similarSkipped} quotes`);
    console.log(`📚 Authors updated: ${Object.keys(authorQuoteCounts).length}`);
    console.log(
      `🏷️ Tags processed: ${[...new Set(quotes.flatMap((q) => q.tags))].length}`
    );
  } catch (error) {
    console.error('❌ Error uploading quotes:', error);
    throw error;
  }
};

// You may need to modify fetchAllQuotes() to return actual quote texts instead of a Set:
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

      // Update this to store the actual quote text:
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
      displayName: userData.displayName || '',
      createdAt: serverTimestamp(), // Use Firestore timestamp
      updatedAt: serverTimestamp(), // Use Firestore timestamp
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
  selectedSort = 'newest',
  author = null,
  tag = null,
  mood = null
) => {
  try {
    console.log(
      'Fetching quotes with parameters:',
      mood,
      author,
      tag,
      selectedSort
    );
    const quotesRef = collection(db, 'quotes');

    // Build basic constraints - visibility filter will always apply
    const constraints = [where('visibility', 'in', ['public', null])];

    // Add mood filter if specified
    if (mood && mood !== 'all') {
      constraints.push(where('mood', '==', mood));
    }

    // Add author filter if specified
    if (author) {
      constraints.push(where('author', '==', author));
    }

    // Add tag filter if specified
    if (tag) {
      constraints.push(where('tags', 'array-contains', tag));
    }

    // Apply sorting based on context
    if (author) {
      // When filtering by author, use simplified sorting to avoid index issues
      console.log(
        `Using simplified query for author filter with ${selectedSort} sort`
      );

      // For author pages, we only support limited sort types
      if (selectedSort === 'mostPopular' && false) {
        constraints.push(orderBy('totalReactions', 'desc'));
      } else {
        // Default to creation date
        constraints.push(orderBy('createdAt', 'desc'));
      }
    } else {
      // When not filtering by author, we can use any sort option
      switch (selectedSort) {
        case 'newest':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'oldest':
          constraints.push(orderBy('createdAt', 'asc'));
          break;
        case 'mostPopular':
          constraints.push(orderBy('totalReactions', 'desc'));
          break;
        case 'a_z_author':
          constraints.push(orderBy('author', 'asc'));
          break;
        case 'z_a_author':
          constraints.push(orderBy('author', 'desc'));
          break;
        default:
          constraints.push(orderBy('createdAt', 'desc'));
      }
    }

    // Add pagination constraint if there's a lastDoc
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // Fetch one more document than needed to determine if there are more
    const fetchLimit = 31; // Fetch 31 instead of 21
    constraints.push(limit(fetchLimit));

    // Create a single query with all constraints
    const quotesQuery = query(quotesRef, ...constraints);
    const snapshot = await getDocs(quotesQuery);

    if (!snapshot.empty) {
      // If we got more than 30 docs, we know there are more to fetch
      const hasMoreQuotes = snapshot.docs.length > 30;

      // Only return the requested 30 docs to the client
      const newQuotes = snapshot.docs.slice(0, 30).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get the last doc of the ones we're returning (not the extra one)
      const lastVisibleDoc =
        snapshot.docs[29] || snapshot.docs[snapshot.docs.length - 1];

      console.log(
        `Found ${newQuotes.length} quotes${
          author ? ` for author: ${author}` : ''
        }, hasMore: ${hasMoreQuotes}`
      );

      return {
        newQuotes,
        lastVisibleDoc,
        hasMoreQuotes,
      };
    } else {
      console.log(`No quotes found${author ? ` for author: ${author}` : ''}`);
      return {
        newQuotes: [],
        lastVisibleDoc: null,
        hasMoreQuotes: false,
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
    const authorsRef = collection(db, 'authors');
    let authorsQuery = query(authorsRef, orderBy('name', 'asc'), limit(30)); // Fetch 10 authors at a time

    if (lastDoc) {
      authorsQuery = query(authorsQuery, startAfter(lastDoc)); // Start after the last document for pagination
    }

    const snapshot = await getDocs(authorsQuery);

    const newAuthors = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
    const hasMoreAuthors = snapshot.docs.length === 30;

    return { newAuthors, lastVisibleDoc, hasMoreAuthors };
  } catch (error) {
    console.error('Error fetching authors:', error);
    throw error;
  }
};

export const fetchTags = async (lastDoc = null) => {
  try {
    const tagsRef = collection(db, 'tags'); // Replace 'tags' with your Firestore collection name
    let tagsQuery = query(tagsRef, orderBy('name', 'asc'), limit(30)); // Fetch 10 tags at a time

    if (lastDoc) {
      tagsQuery = query(tagsQuery, startAfter(lastDoc)); // Start after the last document for pagination
    }

    const snapshot = await getDocs(tagsQuery);

    const newTags = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1]; // Get the last document
    const hasMoreTags = snapshot.docs.length === 30; // Check if there are more tags to load

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
        where('visibility', '!=', 'private'), // Exclude private quotes
        orderBy('createdAt', sort === 'newest' ? 'desc' : 'asc'),
        limit(20)
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

/**
 * Fetch quotes by their IDs
 * @param {string[]} quoteIds - Array of quote IDs to fetch
 * @returns {Promise<Array>} Array of quote documents
 */
export const fetchQuotesByIds = async (
  quoteIds,
  nextIndex = 0,
  pageSize = 10,
  processedChunks = 0
) => {
  try {
    if (!quoteIds || quoteIds.length === 0) {
      return {
        quotes: [],
        hasMore: false,
        nextIndex: 0,
        processedChunks: 0,
      };
    }

    // Calculate end index for this page
    const endIndex = Math.min(nextIndex + pageSize, quoteIds.length);

    // Get IDs for this page
    const pageIds = quoteIds.slice(nextIndex, endIndex);

    // Firestore has limits on how many IDs we can query at once
    const chunkSize = 10;
    let allQuotes = [];

    // Process in chunks to avoid Firestore limitations
    for (let i = 0; i < pageIds.length; i += chunkSize) {
      const chunk = pageIds.slice(i, i + chunkSize);

      try {
        // Query this chunk of IDs
        const quotesRef = collection(db, 'quotes');
        const q = query(quotesRef, where(documentId(), 'in', chunk));
        const querySnapshot = await getDocs(q);

        // Map to our quote objects with IDs
        const chunkQuotes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        allQuotes = [...allQuotes, ...chunkQuotes];
      } catch (chunkError) {
        console.error(`Error fetching chunk ${i / chunkSize + 1}:`, chunkError);
      }
    }

    return {
      quotes: allQuotes,
      hasMore: endIndex < quoteIds.length,
      nextIndex: endIndex,
      processedChunks: processedChunks + 1,
    };
  } catch (error) {
    console.error('Error fetching quotes by IDs:', error);
    return {
      quotes: [],
      hasMore: false,
      nextIndex: nextIndex,
      processedChunks: processedChunks,
    };
  }
};

/**
 * Updates the user's profile in Firestore.
 * @param {string} uid - The user's UID (used as the document ID).
 * @param {object} updatedProfile - The updated profile data (e.g., firstName, lastName).
 */
export const updateUserProfile = async (uid, updatedProfile) => {
  try {
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
export const addQuoteToPendingList = async (quote) => {
  try {
    const pendingQuotesRef = collection(db, 'pendingquotes');
    await addDoc(pendingQuotesRef, quote);
    console.log('Quote added to pendingquotes collection:', quote);
  } catch (error) {
    console.error('Error adding quote to pendingquotes collection:', error);
    throw error;
  }
};

/**
 * Add a quote to the main quotes collection.
 * @param {object} quote - The quote object to add.
 * @returns {Promise<void>} - A promise that resolves when the quote is added.
 * */
export const addQuote = async (quoteData) => {
  try {
    const quotesRef = collection(db, 'quotes');
    const docRef = await addDoc(quotesRef, {
      ...quoteData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Return the quote ID
    return docRef.id;
  } catch (error) {
    console.error('Error adding quote:', error);
    throw error;
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
 * Also track in user's public quotes list.
 * @param {object} quote - The quote object to approve.
 */
export const approveQuote = async (quote) => {
  try {
    const quotesRef = doc(db, 'quotes', quote.id); // Reference to the main quotes collection
    const pendingQuoteRef = doc(db, 'pendingquotes', quote.id); // Reference to the pending quote

    // Add the quote to the main quotes collection
    await setDoc(quotesRef, {
      ...quote,
      visibility: 'public',
      approved: true,
      userQuote: true,
      createdAt: quote.createdAt || new Date().toISOString(),
    });

    // If the quote has a userId, add it to the user's publicQuotes array
    // If the quote has a userId, add it to the user's publicQuotes array
    if (quote.userId) {
      const userRef = doc(db, 'users', quote.userId);
      await updateDoc(userRef, {
        publicQuotes: arrayUnion(quote.id), // Just add the ID to the array, no updatedAt needed
      });
      console.log(
        `Added quote ${quote.id} to user ${quote.userId}'s public quotes`
      );
    }

    // Remove the quote from the pendingquotes collection
    await deleteDoc(pendingQuoteRef);

    console.log(`Quote approved and moved to main collection: ${quote.id}`);
  } catch (error) {
    console.error('Error approving quote:', error);
    throw error;
  }
};

/**
 * Reject a pending quote, convert it to private, and move it to the quotes collection.
 * Also track in user's private quotes list.
 * @param {object} quote - The quote object to reject.
 */
export const rejectQuote = async (quote) => {
  try {
    console.log('Rejecting quote:', quote);
    const pendingQuoteRef = doc(db, 'pendingquotes', quote.id); // Reference to the pending quote
    const quotesRef = doc(db, 'quotes', quote.id);

    // Convert the quote to private and move it to the quotes collection
    const privateQuote = {
      ...quote,
      visibility: 'private',
      approved: false,
      createdAt: quote.createdAt || new Date().toISOString(), // Retain or set createdAt
    };

    // Add the private quote to the quotes collection
    await setDoc(quotesRef, privateQuote);

    // If the quote has a userId, add it to the user's privateQuotes array
    if (quote.userId) {
      // Use the existing updateUserPrivateQuotes function
      await updateUserPrivateQuotes(quote.userId, quote.id);
      console.log(
        `Added quote ${quote.id} to user ${quote.userId}'s private quotes`
      );
    }

    // Remove the quote from the pendingquotes collection
    await deleteDoc(pendingQuoteRef);

    console.log(`Quote rejected and moved to private: ${quote.id}`);
  } catch (error) {
    console.error('Error rejecting quote:', error);
    throw error;
  }
};

/**
 * Fetch quotes created by a specific user with support for lazy loading and filtering.
 * @param {string} userId - The user's UID.
 * @param {object|null} lastDoc - The last document from the previous query (for lazy loading).
 * @param {boolean} isPrivate - Whether to fetch private quotes (true) or public quotes (false).
 * @returns {Promise<{ quotes: Array<object>, lastVisibleDoc: object }>} - A promise that resolves to an array of quotes and the last document.
 */
export const fetchQuotesByUser = async (
  userId,
  lastDoc = null,
  isPrivate = false
) => {
  try {
    const quotesRef = collection(db, 'quotes');
    let queryConstraints = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20), // Fetch 10 quotes at a time
    ];

    if (isPrivate) {
      // Fetch only private quotes
      queryConstraints.push(where('visibility', '==', 'private'));
    } else {
      // Fetch public quotes (or quotes without the visibility field)
      queryConstraints.push(where('visibility', 'in', ['public', null]));
    }

    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc)); // Start after the last document for pagination
    }

    const quotesQuery = query(quotesRef, ...queryConstraints);
    const snapshot = await getDocs(quotesQuery);

    const quotes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1]; // Track the last document for pagination

    return { quotes, lastVisibleDoc };
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
      where('visibility', 'in', ['public', null]), // Fetch only public quotes
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastVisible) {
      userQuotesQuery = query(
        quotesRef,
        where('userQuote', '==', true),
        where('visibility', 'in', ['public', null]), // Fetch only public quotes
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
 * Store the FCM token in Firestore for a user and calculate notification slots.
 * @param {string|null} userId - The ID of the user.
 * @param {string} fcmToken - The FCM token to store.
 * @param {object|null} userData - Optional user data to avoid redundant queries.
 */
export const storeFCMToken = async (userId, fcmToken, userData = null) => {
  try {
    if (!userId || !fcmToken) {
      console.error('Missing userId or FCM token');
      return null;
    }

    const defaultPreferences = {
      tags: ['motivational'],
      frequency: 'daily',
      time: '09:00',
      randomQuoteEnabled: false,
      dndEnabled: true,
      dndStartTime: '22:00',
      dndEndTime: '07:00',
      scheduledQuoteEnabled: true,
    };

    const timeZone = Localization.timezone;

    // Prevent duplicate updates
    const updateKey = `${userId}-${fcmToken.substring(0, 10)}`;
    if (recentUpdates.has(updateKey)) {
      console.log('Duplicate token update detected. Skipping.');
      return userData?.preferences || defaultPreferences;
    }

    recentUpdates.add(updateKey);
    setTimeout(() => recentUpdates.delete(updateKey), 3000);

    // Clean up other users with the same token
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('fcmToken', '==', fcmToken));
    const userSnapshot = await getDocs(userQuery);

    for (const userDoc of userSnapshot.docs) {
      const foundUserId = userDoc.id;
      if (foundUserId !== userId) {
        console.log(
          `Found user ${foundUserId} with same FCM token. Cleaning up.`
        );
        await removeUserFromAllNotificationSlots(foundUserId);
      }
    }

    // Update or create user record
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    let preferencesToUse;

    if (userSnap.exists()) {
      const existingDbUserData = userSnap.data();
      preferencesToUse = existingDbUserData.preferences || defaultPreferences;

      const updatePayload = {
        fcmToken,
        timeZone: existingDbUserData.timeZone || timeZone,
        updatedAt: serverTimestamp(),
      };

      if (!existingDbUserData.preferences) {
        updatePayload.preferences = defaultPreferences;
      }
      await updateDoc(userRef, updatePayload);
    } else {
      preferencesToUse = defaultPreferences;
      await setDoc(userRef, {
        fcmToken,
        preferences: defaultPreferences,
        timeZone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        uid: userId,
      });
    }

    await updateNotificationSlots(userId, preferencesToUse, null, timeZone);
    return preferencesToUse;
  } catch (error) {
    console.error('Error storing FCM token and preferences:', error);
    return null;
  }
};

/**
 * Save user preferences to Firestore and update notification slots.
 * @param {string} userId - The user's unique ID.
 * @param {object} preferences - The preferences object to save.
 * @param {object} previousPreferences - The user's previous preferences.
 * @param {string} timeZone - The user's time zone.
 * @returns {Promise<void>}
 */
export const saveUserPreferences = async (
  userId,
  preferences,
  previousPreferences,
  timeZone
) => {
  try {
    // Input validation
    if (!userId) {
      console.error('No userId provided for saving preferences');
      return false;
    }

    // Sanitize preferences
    const sanitizedPreferences = {
      tags: Array.isArray(preferences.tags)
        ? preferences.tags
        : ['motivational'],
      frequency: preferences.frequency || 'daily',
      time: preferences.time || '09:00',
      interval: preferences.interval || 1,
      randomQuoteEnabled: preferences.randomQuoteEnabled ?? false,
      dndEnabled: preferences.dndEnabled ?? true,
      dndStartTime: preferences.dndStartTime || '22:00',
      dndEndTime: preferences.dndEndTime || '07:00',
      scheduledQuoteEnabled: preferences.scheduledQuoteEnabled ?? true,
    };

    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      { preferences: sanitizedPreferences },
      { merge: true }
    );

    // Update notification slots
    await updateNotificationSlots(
      userId,
      sanitizedPreferences,
      previousPreferences,
      timeZone || 'UTC'
    );

    return true;
  } catch (error) {
    console.error('Error saving preferences to Firestore:', error);
    return false;
  }
};

/**
 * Updates the user's notification slots in Firestore.
 * @param {string} userId - The user's unique ID.
 * @param {object} preferences - The user's updated preferences.
 * @param {object} previousPreferences - The user's previous preferences.
 * @param {string} timeZone - The user's time zone.
 * @returns {Promise<void>}
 */
export const updateNotificationSlots = async (
  userId,
  preferences,
  previousPreferences,
  timeZone
) => {
  try {
    // Validate timeZone
    if (!timeZone || typeof timeZone !== 'string') {
      console.warn('Invalid time zone. Falling back to UTC.');
      timeZone = 'UTC';
    }

    // Check if the old preferences are the same as the new preferences
    if (previousPreferences && deepEqual(previousPreferences, preferences)) {
      console.log('Preferences unchanged. No update needed.');
      return;
    }

    // IMPORTANT: Always remove from ALL slots first
    await removeUserFromAllNotificationSlots(userId);

    // Calculate new slots and add user to them
    const newSlots = calculateTimeSlots(preferences, timeZone);
    console.log('Adding user to new slots:', newSlots);

    // Create a batch for better performance
    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 490; // Firestore limit is 500 operations per batch

    // Process slots in batches
    for (const slot of newSlots) {
      try {
        const { docId, fieldName } = getSlotInfo(slot);
        const slotDocRef = doc(db, 'notificationSlots', docId);
        const slotDoc = await getDoc(slotDocRef);

        if (slotDoc.exists()) {
          const slotData = slotDoc.data();

          if (slotData[fieldName] && Array.isArray(slotData[fieldName])) {
            // Only add if not already in the array
            if (!slotData[fieldName].includes(userId)) {
              batch.update(slotDocRef, {
                [fieldName]: arrayUnion(userId), // Use arrayUnion for atomic operations
              });
              batchCount++;
            }
          } else {
            // Field doesn't exist or isn't an array - initialize it
            batch.set(
              slotDocRef,
              {
                [fieldName]: [userId],
              },
              { merge: true }
            );
            batchCount++;
          }
        } else {
          // Document doesn't exist - create it
          batch.set(slotDocRef, {
            [fieldName]: [userId],
          });
          batchCount++;
        }

        // If batch is getting large, commit it and start a new one
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} slot operations`);
          batchCount = 0;
        }
      } catch (error) {
        console.warn(`Error processing slot ${slot}:`, error);
      }
    }

    // Commit any remaining operations in the batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} slot operations`);
    }

    console.log(`Updated notification slots for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating notification slots:', error);
    throw error;
  }
};

export const updateQuoteReactions = async (
  quoteId,
  reactions,
  userId,
  reactionType
) => {
  const quoteRef = doc(db, 'quotes', quoteId);
  const userRef = doc(db, 'users', userId);

  try {
    // Get the current user data to check if they already reacted
    const userSnap = await getDoc(userRef);
    let isNewReaction = true;

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Check if user already has this reaction to this quote
      if (
        userData.reactions &&
        userData.reactions[reactionType] &&
        Array.isArray(userData.reactions[reactionType]) &&
        userData.reactions[reactionType].includes(quoteId)
      ) {
        isNewReaction = false;
      }
    }

    // Convert reaction counts to numbers before saving
    const numericReactions = {};
    for (const [key, value] of Object.entries(reactions)) {
      numericReactions[key] = Number(value);
    }

    // Update quote with reactions and totalReactions counter
    if (isNewReaction) {
      await updateDoc(quoteRef, {
        reactions: numericReactions, // Use the converted numeric values
        totalReactions: increment(1), // Increment total reactions
      });
    } else {
      // Just update reactions if user already reacted
      await updateDoc(quoteRef, { reactions: numericReactions });
    }

    // Update the user's profile with the reaction
    await updateDoc(userRef, {
      [`reactions.${reactionType}`]: arrayUnion(quoteId), // Add quote to user's reaction list
    });

    console.log(`Reactions updated for quote ${quoteId} and user ${userId}`);
  } catch (error) {
    console.error('Error updating reactions:', error);
    throw error;
  }
};

export const removeUserReaction = async (quoteId, userId, reactionType) => {
  const quoteRef = doc(db, 'quotes', quoteId);
  const userRef = doc(db, 'users', userId);

  try {
    // Check if user actually had this reaction by checking user document
    const userSnap = await getDoc(userRef);
    let hadReaction = false;

    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (
        userData.reactions &&
        userData.reactions[reactionType] &&
        Array.isArray(userData.reactions[reactionType]) &&
        userData.reactions[reactionType].includes(quoteId)
      ) {
        hadReaction = true;
      }
    }

    // Update the quote by decrementing counts
    if (hadReaction) {
      // Get current reaction counts
      const quoteSnap = await getDoc(quoteRef);
      if (quoteSnap.exists()) {
        const quoteData = quoteSnap.data();
        const reactions = { ...quoteData.reactions };
        const currentTotal = quoteData.totalReactions || 0;

        // Decrement the specific reaction count
        if (reactions[reactionType] && reactions[reactionType] > 0) {
          reactions[reactionType]--;
        }

        // Prevent totalReactions from going negative
        if (currentTotal > 0) {
          // Use decrement for atomic operation
          await updateDoc(quoteRef, {
            reactions,
            totalReactions: increment(-1), // Decrement total reactions
          });
        } else {
          // Set explicitly to 0 if it would become negative
          await updateDoc(quoteRef, {
            reactions,
            totalReactions: 0,
          });
        }
      }
    }

    // Remove the reaction from the user's profile
    await updateDoc(userRef, {
      [`reactions.${reactionType}`]: arrayRemove(quoteId), // Remove from user's reactions
    });

    console.log(`Reaction removed for quote ${quoteId} by user ${userId}`);
  } catch (error) {
    console.error('Error removing user reaction:', error);
    throw error;
  }
};

export const countUserPrivateQuotes = async (userId) => {
  try {
    const quotesRef = collection(db, 'quotes');
    const privateQuotesQuery = query(
      quotesRef,
      where('userId', '==', userId),
      where('visibility', '==', 'private')
    );
    const snapshot = await getDocs(privateQuotesQuery);
    return snapshot.size; // Returns the count of private quotes
  } catch (error) {
    console.error('Error counting private quotes:', error);
    throw error;
  }
};

/**
 * Delete a private quote from the Firestore database and remove it from the user's privateQuotes list.
 * @param {string} quoteId - The ID of the quote to delete.
 * @returns {Promise<void>}
 */
export const deletePrivateQuote = async (quoteId) => {
  try {
    // First get the quote to find the associated user
    const quoteRef = doc(db, 'quotes', quoteId);
    const quoteSnap = await getDoc(quoteRef);

    if (!quoteSnap.exists()) {
      console.log(`Quote with ID ${quoteId} not found.`);
      return;
    }

    const quoteData = quoteSnap.data();
    const userId = quoteData.userId;

    // Delete the quote document
    await deleteDoc(quoteRef);
    console.log(`Private quote with ID ${quoteId} deleted successfully.`);

    // Remove the quote reference from the user's privateQuotes array
    if (userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        privateQuotes: arrayRemove(quoteId),
      });
      console.log(
        `Removed quote ${quoteId} from user ${userId}'s privateQuotes list`
      );
    }
  } catch (error) {
    console.error('Error deleting private quote:', error);
    throw error;
  }
};

export const getQuoteOfTheDay = async () => {
  const metaRef = doc(db, 'meta', 'quoteOfTheDay');
  const metaSnap = await getDoc(metaRef);

  if (!metaSnap.exists()) throw new Error('Quote of the Day not found');
  const quoteId = metaSnap.data().currentQuote?.quoteId;
  if (!quoteId) throw new Error('No quoteId found in meta');

  const quoteRef = doc(db, 'quotes', quoteId);
  const quoteSnap = await getDoc(quoteRef);

  if (!quoteSnap.exists()) throw new Error('Quote not found');
  return quoteSnap.data();
};

/**
 * Fetches the quote with the highest total reactions count from Firestore.
 * @returns {Promise<Object>} The top quote document
 */
export const getTopQuote = async () => {
  try {
    const quotesRef = collection(db, 'quotes');
    const topQuoteQuery = query(
      quotesRef,
      where('visibility', 'in', ['public', null]),
      orderBy('totalReactions', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(topQuoteQuery);

    if (snapshot.empty) {
      return null;
    }

    // Get the first (and only) document
    const topQuoteDoc = snapshot.docs[0];

    // Return the quote data with id
    return {
      id: topQuoteDoc.id,
      ...topQuoteDoc.data(),
    };
  } catch (error) {
    console.error('Error fetching top quote:', error);
    throw error;
  }
};

/**
 * Fetches a random quote from Firestore using the random field for efficiency.
 * @returns {Promise<Object>} A random quote document
 */
export const getRandomQuote = async () => {
  try {
    const quotesRef = collection(db, 'quotes');
    const randomValue = Math.random(); // Generate random value between 0 and 1

    // First try: query for docs where random >= randomValue
    let querySnapshot = await getDocs(
      query(
        quotesRef,
        where('visibility', 'in', ['public', null]),
        where('random', '>=', randomValue),
        orderBy('random', 'asc'),
        limit(1)
      )
    );

    // If no results, try the other side of the range
    if (querySnapshot.empty) {
      querySnapshot = await getDocs(
        query(
          quotesRef,
          where('visibility', 'in', ['public', null]),
          where('random', '<', randomValue),
          orderBy('random', 'desc'),
          limit(1)
        )
      );
    }

    // If still no results (unlikely), fallback to old method
    if (querySnapshot.empty) {
      throw new Error('No quotes found');
    }

    // Get the first document
    const quoteDoc = querySnapshot.docs[0];

    return {
      id: quoteDoc.id,
      ...quoteDoc.data(),
    };
  } catch (error) {
    console.error('Error fetching random quote:', error);
    throw error;
  }
};
/**
 * Updates all quotes in Firebase with the mood attribute
 * @returns {Promise<{updated: number, skipped: number, errors: number}>} Stats about the operation
 */
export const addMoodToAllQuotes = async () => {
  try {
    console.log('Starting mood attribute update for all quotes...');
    const quotesRef = collection(db, 'quotes');
    const pageSize = 500; // Process quotes in batches
    let lastDoc = null;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process quotes in batches
    while (true) {
      // Create query for the next batch
      const quotesQuery = lastDoc
        ? query(
            quotesRef,
            orderBy('createdAt'),
            startAfter(lastDoc),
            limit(pageSize)
          )
        : query(quotesRef, orderBy('createdAt'), limit(pageSize));

      const snapshot = await getDocs(quotesQuery);
      if (snapshot.empty) {
        console.log('No more quotes to process.');
        break;
      }

      console.log(`Processing batch of ${snapshot.size} quotes...`);

      // Create a batch for updates (max 500 operations per batch)
      let batch = writeBatch(db);
      let batchItemCount = 0;
      let currentBatch = 1;

      // Process each quote in the batch
      for (const quoteDoc of snapshot.docs) {
        try {
          const quoteData = quoteDoc.data();

          // Skip quotes that already have a mood
          if (quoteData.mood) {
            totalSkipped++;
            continue;
          }

          // Determine mood for the quote
          const mood = determineMood(quoteData);

          // Add to batch update
          const quoteRef = doc(db, 'quotes', quoteDoc.id);
          batch.update(quoteRef, { mood });

          batchItemCount++;

          // Commit batch when it reaches limit
          if (batchItemCount === 500) {
            await batch.commit();
            totalUpdated += batchItemCount;
            console.log(
              `Committed batch ${currentBatch}: ${batchItemCount} quotes updated`
            );

            // Reset batch
            batch = writeBatch(db);
            batchItemCount = 0;
            currentBatch++;
          }
        } catch (error) {
          console.error(`Error processing quote ${quoteDoc.id}:`, error);
          totalErrors++;
        }
      }

      // Commit any remaining operations
      if (batchItemCount > 0) {
        await batch.commit();
        totalUpdated += batchItemCount;
        console.log(
          `Committed final batch ${currentBatch}: ${batchItemCount} quotes updated`
        );
      }

      // Get the last document for pagination
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      console.log(
        `Progress: ${totalUpdated} updated, ${totalSkipped} skipped, ${totalErrors} errors`
      );

      // Break if we've reached the end
      if (snapshot.size < pageSize) {
        break;
      }
    }

    console.log(
      `✅ Mood update complete: ${totalUpdated} quotes updated, ${totalSkipped} skipped, ${totalErrors} errors`
    );
    return {
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: totalErrors,
    };
  } catch (error) {
    console.error('Error updating quote moods:', error);
    throw error;
  }
};

/**
 * Fetches quotes filtered by mood
 * @param {string} mood The mood to filter by, or 'all' for unfiltered
 * @param {DocumentSnapshot} lastDoc Last document for pagination
 * @param {string} selectedSort Sort option for the quotes
 * @returns {Promise<{newQuotes: Array, lastVisibleDoc: DocumentSnapshot, hasMoreQuotes: boolean}>}
 */
/**
 * Fetch quotes with modified pagination for oldest sort
 */
export const fetchQuotesByMood = async (
  mood = 'all',
  lastDoc = null,
  selectedSort = 'newest'
) => {
  try {
    console.log(`Fetching quotes by mood: '${mood}', sort: '${selectedSort}'`);
    const quotesRef = collection(db, 'quotes');
    const fetchLimit = 31; // Fetch 31 instead of 21 (30 + 1 to check for more)

    // Build constraints - UNIFIED approach for ALL sort types
    let constraints = [where('visibility', 'in', ['public', null])];

    // Add mood filter if specified
    if (mood && mood !== 'all') {
      constraints.push(where('mood', '==', mood));
    }

    // Apply sorting based on selected option
    switch (selectedSort) {
      case 'newest':
        constraints.push(orderBy('createdAt', 'desc'));
        break;
      case 'oldest':
        constraints.push(orderBy('createdAt', 'asc'));
        break;
      case 'mostPopular':
        constraints.push(orderBy('totalReactions', 'desc'));
        break;
      case 'a_z_author':
        constraints.push(orderBy('author', 'asc'));
        break;
      case 'z_a_author':
        constraints.push(orderBy('author', 'desc'));
        break;
      default:
        constraints.push(orderBy('createdAt', 'desc'));
    }

    // Add pagination constraint if there's a lastDoc
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // Add limit constraint - increased to 31
    constraints.push(limit(fetchLimit));

    // Create the query with all constraints
    const quotesQuery = query(quotesRef, ...constraints);

    const snapshot = await getDocs(quotesQuery);
    console.log(`Query returned ${snapshot.docs.length} documents`);

    if (!snapshot.empty) {
      // Check if we have more than 30 quotes
      const hasMoreQuotes = snapshot.docs.length > 30;

      // Return only 30 quotes
      const newQuotes = snapshot.docs.slice(0, 30).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get the last visible doc (30th or last one)
      const lastVisibleDoc =
        snapshot.docs[Math.min(29, snapshot.docs.length - 1)];

      return {
        newQuotes,
        lastVisibleDoc,
        hasMoreQuotes,
      };
    } else {
      console.log(
        `No quotes found for mood: '${mood || 'all'}', sort: ${selectedSort}`
      );
      return {
        newQuotes: [],
        lastVisibleDoc: null,
        hasMoreQuotes: false,
      };
    }
  } catch (error) {
    console.error('Error fetching quotes by mood:', error);
    throw error;
  }
};

/**
 * Helper function to remove a user from all notification slots
 * @param {string} userId - The user's ID to remove
 */
export const removeUserFromAllNotificationSlots = async (userId) => {
  try {
    // Get all notification slot documents
    const slotsRef = collection(db, 'notificationSlots');
    const slotsSnapshot = await getDocs(slotsRef);

    // Check each document and remove the user from relevant arrays
    const batch = writeBatch(db);
    let updateCount = 0;

    slotsSnapshot.forEach((slotDoc) => {
      const slotData = slotDoc.data();
      let needsUpdate = false;

      // Fields to check: users, randomQuotes
      const fieldsToCheck = ['users', 'randomQuotes'];

      for (const fieldName of fieldsToCheck) {
        // Check if field exists and contains the userId
        if (
          slotData[fieldName] &&
          Array.isArray(slotData[fieldName]) &&
          slotData[fieldName].includes(userId)
        ) {
          // Filter out the userId
          slotData[fieldName] = slotData[fieldName].filter(
            (id) => id !== userId
          );
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        batch.update(doc(db, 'notificationSlots', slotDoc.id), slotData);
        updateCount++;

        // Commit batch if it's getting large to avoid hitting limits
        if (updateCount >= 450) {
          batch.commit();
          console.log(`Committed batch of ${updateCount} slot updates`);
          updateCount = 0;
        }
      }
    });

    // Commit any remaining updates
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Committed remaining ${updateCount} slot updates`);
    }

    console.log(`User ${userId} removed from all notification slots`);
  } catch (error) {
    console.error('Error removing user from notification slots:', error);
    throw error;
  }
};

/**
 * Update a user's document to track a private quote
 * @param {string} userId - The user's ID
 * @param {string} quoteId - The ID of the private quote
 */
export const updateUserPrivateQuotes = async (userId, quoteId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      privateQuotes: arrayUnion(quoteId),
      // Removed updatedAt for consistency
    });
    return true;
  } catch (error) {
    console.error('Error updating user private quotes:', error);
    throw error;
  }
};

// Add this function to update share count
export const updateShareCount = async (quoteId) => {
  if (!quoteId) return;

  try {
    const quoteRef = doc(db, 'quotes', quoteId);

    await updateDoc(quoteRef, {
      shareCount: increment(1),
    });

    console.log('Share count updated successfully for quote:', quoteId);
  } catch (error) {
    console.error('Error updating share count:', error);
  }
};

/**
 * Fetch trending quotes, sorted by trendingScore
 * @param {number} limitCount - Maximum number of quotes to fetch
 * @returns {Promise<Array>} Array of quote documents
 */
export const fetchTrendingQuotes = async (limitCount = 30) => {
  try {
    const q = query(
      collection(db, 'quotes'),
      orderBy('trendingScore', 'desc'),
      limit(limitCount) // Use a different parameter name to avoid conflicts
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching trending quotes:', error);
    throw error;
  }
};

/**
 * Removes the FCM token for a user
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const removeFCMToken = async (userId) => {
  try {
    if (!userId) {
      console.error('No userId provided for removing FCM token');
      return;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: deleteField(), // Use deleteField() function instead of FieldValue.delete()
    });
    console.log(`FCM token removed for user ${userId}`);
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
};

// Search for tags that match query
// Search for tags using the existing 'name' field
export async function searchTags(term) {
  try {
    if (!term || term.trim() === '') {
      return [];
    }

    // Convert to lowercase for case-insensitive comparison
    const searchQuery = term.toLowerCase();

    // Create a query that only fetches tags that start with the search term
    const tagsRef = collection(db, 'tags');
    const tagsQuery = query(
      tagsRef,
      // Use range query to find tags that start with the search term
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff'), // '\uf8ff' is a high Unicode char
      orderBy('name'),
      limit(10) // Get only what we need
    );

    const snapshot = await getDocs(tagsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error searching tags:', error);
    throw error;
  }
}

// Search for authors that match query
// Update the existing searchAuthors function to use name_lower field
export async function searchAuthors(term) {
  try {
    if (!term || term.trim() === '') {
      return [];
    }

    // Convert to lowercase for case-insensitive search
    const searchQuery = term.toLowerCase();

    // Create a query using the name_lower field
    const authorsRef = collection(db, 'authors');
    const authorsQuery = query(
      authorsRef,
      // Use name_lower instead of name for case-insensitive search
      where('name_lower', '>=', searchQuery),
      where('name_lower', '<=', searchQuery + '\uf8ff'),
      orderBy('name_lower'),
      limit(10)
    );

    const snapshot = await getDocs(authorsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error searching authors:', error);
    throw error;
  }
}

