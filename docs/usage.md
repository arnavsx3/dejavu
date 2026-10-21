# Keeping your first moment

Start the desktop app from the repository root:

```sh
npm run desktop:dev
```

1. Choose **Keep a moment**.
2. Write something you want to remember, choose **Add photos**, or do both.
   Select up to six JPEG, PNG, or WebP photos. Captions are optional when there is
   a photo. A moment needs at least one photo or a few words.
3. Choose **Keep this moment**. Its card appears once it has been saved locally.
4. Close and reopen dejavu. The card is loaded again from its SQLite database.
5. Open a collage or paper note to read it. Choose **Edit moment** to change
   the caption, add prints, or remove individual prints, then **Save changes**.
   Removing a print in the editor takes effect only when you save.

To remove a moment, open its card, choose **Remove moment**, then **Remove for good**.
Removal is permanent. Canceling that confirmation keeps the saved moment.

Unsaved drafts stay in the editor after a failed save. Closing a dirty editor asks
whether to discard the draft. Drafts are not automatically saved across app exit;
choose **Keep this moment** or **Save changes** first.

**Refresh shelf** reloads the local collection, including changes from another
instance. A stale edit or delete is rejected rather than overwriting a newer
version. If that happens, copy any words you want to keep, close the editor, refresh
the shelf, and open the latest version.

## Photos, prints, and the whole picture

The wall shows up to three overlapping prints per moment. The print count includes
all photos; opening the moment reveals every print. Short captions sit on paper
scraps across the collage. Long captions are readable in full inside the moment.

Open any print for an uncropped view. Use **Next photo**, **Previous photo**, or the
left/right arrow keys to move through the group. **Explore full size** displays
native pixel dimensions; scroll to explore, then **Fit whole photo** to return.
Escape or **Back to moment** closes the photo viewer and returns focus to its print.

Each source photo must be at most 10 MiB (shown as 10 MB in the picker), 24 million
pixels, and 12,000 pixels on either side. dejavu decodes the image in Rust, applies
its orientation, and keeps a JPEG copy at quality 90 with the full oriented pixel
dimensions. This is a re-encoded copy, not a byte-for-byte archive of the original.
Source EXIF metadata is omitted; transparent areas become white. WebP imports are
still images. Small separate thumbnails keep the shelf lighter.

Your source files are never moved, changed, or deleted. Removing a saved print or
moment removes its copies from dejavu. A failed import or save keeps the draft
and does not partially replace the saved moment. Draft selections stay only until
you save, discard, or exit the app.

## Where your moments live

The native app resolves the operating system's application-data folder and stores
`moments.sqlite3`, including captions, photo copies, and thumbnails, inside the `com.arnavsx3.dejavu` directory. On Linux, the default is:

```text
~/.local/share/com.arnavsx3.dejavu/moments.sqlite3
```

`XDG_DATA_HOME` can change the Linux base directory. Storage is separate from the
Git checkout. Moments are not sent to GitHub or to a server by the app. Database
files are restricted to their owner on Unix. SQLite may maintain companion `-wal`
and `-shm` files while a connection is active.

## Browser preview and shutdown

`npm run dev` is an interface preview. Open the desktop app to save real moments.
Do not run browser preview and desktop development simultaneously: both use port 1420. Stop the active development command with Ctrl+C before starting another.

A built desktop executable uses its bundled frontend and does not need Vite or a
development port. Voice notes and phone capture are not available yet.
