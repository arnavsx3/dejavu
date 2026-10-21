# Keeping your first moment

Start the desktop app from the repository root:

```sh
npm run desktop:dev
```

1. Choose **Keep a moment**.
2. Write something you want to remember. Line breaks and Unicode text are welcome.
3. Choose **Keep this moment**. Its card appears once it has been saved locally.
4. Close and reopen dejavu. The card is loaded again from its SQLite database.
5. Open a card to read it. Choose **Edit moment** to change its words, then
   **Save changes**.

To remove a moment, open its card, choose **Remove moment**, then **Remove for good**.
Removal is permanent. Canceling that confirmation keeps the saved moment.

Unsaved drafts stay in the editor after a failed save. Closing a dirty editor asks
whether to discard the draft. Drafts are not automatically saved across app exit;
choose **Keep this moment** or **Save changes** first.

**Refresh shelf** reloads the local collection, including changes from another
instance. A stale edit or delete is rejected rather than overwriting a newer
version. If that happens, copy any words you want to keep, close the editor, refresh
the shelf, and open the latest version.

## Where your moments live

The native app resolves the operating system's application-data folder and stores
`moments.sqlite3` inside the `com.arnavsx3.dejavu` directory. On Linux, the default is:

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
development port. Photos, voice notes, and phone capture are not available yet.
