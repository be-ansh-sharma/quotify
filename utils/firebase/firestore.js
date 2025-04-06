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
} from 'firebase/firestore';
import quotes from 'assets/quotes.json';

export const uploadQuotes = async () => {
  const quotesRef = collection(db, 'quotes');
  const tagsRef = collection(db, 'tags');

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

export const fetchQuotes = async (lastDoc = null, selectedSort) => {
  console.log('selectedSort', selectedSort);
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

