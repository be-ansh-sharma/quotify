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
} from 'firebase/firestore';
import quotes from 'assets/quotes.json';

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
  const usersRef = collection(db, 'users');
  const userDocRef = doc(usersRef);
  const uid = userDocRef.id;

  try {
    await setDoc(userDocRef, {
      ...userData,
      uid,
      createdAt: serverTimestamp(),
    });
    console.log('User created successfully:', { ...userData, uid });
  } catch (error) {
    console.error('Error creating user:', error);
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

