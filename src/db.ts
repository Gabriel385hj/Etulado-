import { openDB, DBSchema } from 'idb';

interface Game {
  id: string;
  name: string;
  size: string;
  dateAdded: string;
  type: 'GBA' | 'NES' | 'GBC';
  data: Uint8Array;
}

interface RetroWebDB extends DBSchema {
  games: {
    key: string;
    value: Game;
  };
}

const dbPromise = openDB<RetroWebDB>('retro-web-db', 1, {
  upgrade(db) {
    db.createObjectStore('games', { keyPath: 'id' });
  },
});

export const db = {
  async getAllGames() {
    return (await dbPromise).getAll('games');
  },
  async addGame(game: Game) {
    return (await dbPromise).put('games', game);
  },
  async deleteGame(id: string) {
    return (await dbPromise).delete('games', id);
  },
};
