// Re-export from main Firebase config
import app, { my_auth as auth, db as firestore, storage } from '../firebaseConfig';

export default { app, auth, firestore, storage };