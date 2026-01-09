import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export interface PlaylistMelody {
  id: string;
  name: string;
  notes: string[];
  solvedAt: string;
  category: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  melodies: PlaylistMelody[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  collaborators: string[];
  remixUrl?: string;
}

interface PlaylistState {
  playlists: Playlist[];
  solvedMelodies: PlaylistMelody[];
}

const STORAGE_KEY = 'melodyx_playlist_state';

const DEFAULT_PLAYLIST_STATE: PlaylistState = {
  playlists: [],
  solvedMelodies: [],
};

export const [PlaylistProvider, usePlaylist] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const playlistQuery = useQuery({
    queryKey: ['playlistState'],
    queryFn: async (): Promise<PlaylistState> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_PLAYLIST_STATE;
    },
  });

  const { mutate: savePlaylistState } = useMutation({
    mutationFn: async (state: PlaylistState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlistState'] });
    },
  });

  const playlistState = playlistQuery.data ?? DEFAULT_PLAYLIST_STATE;

  const addSolvedMelody = useCallback((melody: Omit<PlaylistMelody, 'id' | 'solvedAt'>) => {
    const exists = playlistState.solvedMelodies.some(m => m.name === melody.name);
    if (exists) return;

    const newMelody: PlaylistMelody = {
      ...melody,
      id: `melody_${Date.now()}`,
      solvedAt: new Date().toISOString(),
    };

    const newState: PlaylistState = {
      ...playlistState,
      solvedMelodies: [...playlistState.solvedMelodies, newMelody],
    };
    savePlaylistState(newState);
  }, [playlistState, savePlaylistState]);

  const createPlaylist = useCallback((name: string, description: string = '') => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      melodies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      collaborators: [],
    };

    const newState: PlaylistState = {
      ...playlistState,
      playlists: [...playlistState.playlists, newPlaylist],
    };
    savePlaylistState(newState);
    return newPlaylist;
  }, [playlistState, savePlaylistState]);

  const addMelodyToPlaylist = useCallback((playlistId: string, melodyId: string) => {
    const melody = playlistState.solvedMelodies.find(m => m.id === melodyId);
    if (!melody) return false;

    const newPlaylists = playlistState.playlists.map(p => {
      if (p.id !== playlistId) return p;
      if (p.melodies.some(m => m.id === melodyId)) return p;
      return {
        ...p,
        melodies: [...p.melodies, melody],
        updatedAt: new Date().toISOString(),
      };
    });

    const newState: PlaylistState = {
      ...playlistState,
      playlists: newPlaylists,
    };
    savePlaylistState(newState);
    return true;
  }, [playlistState, savePlaylistState]);

  const removeMelodyFromPlaylist = useCallback((playlistId: string, melodyId: string) => {
    const newPlaylists = playlistState.playlists.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        melodies: p.melodies.filter(m => m.id !== melodyId),
        updatedAt: new Date().toISOString(),
      };
    });

    const newState: PlaylistState = {
      ...playlistState,
      playlists: newPlaylists,
    };
    savePlaylistState(newState);
  }, [playlistState, savePlaylistState]);

  const deletePlaylist = useCallback((playlistId: string) => {
    const newState: PlaylistState = {
      ...playlistState,
      playlists: playlistState.playlists.filter(p => p.id !== playlistId),
    };
    savePlaylistState(newState);
  }, [playlistState, savePlaylistState]);

  const updatePlaylist = useCallback((playlistId: string, updates: Partial<Playlist>) => {
    const newPlaylists = playlistState.playlists.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });

    const newState: PlaylistState = {
      ...playlistState,
      playlists: newPlaylists,
    };
    savePlaylistState(newState);
  }, [playlistState, savePlaylistState]);

  const reorderMelodies = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    const newPlaylists = playlistState.playlists.map(p => {
      if (p.id !== playlistId) return p;
      const melodies = [...p.melodies];
      const [removed] = melodies.splice(fromIndex, 1);
      melodies.splice(toIndex, 0, removed);
      return {
        ...p,
        melodies,
        updatedAt: new Date().toISOString(),
      };
    });

    const newState: PlaylistState = {
      ...playlistState,
      playlists: newPlaylists,
    };
    savePlaylistState(newState);
  }, [playlistState, savePlaylistState]);

  const generateRemix = useCallback(async (playlistId: string): Promise<string | null> => {
    const playlist = playlistState.playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.melodies.length === 0) return null;

    const remixUrl = `melodyx://remix/${playlistId}`;
    
    const newPlaylists = playlistState.playlists.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        remixUrl,
        updatedAt: new Date().toISOString(),
      };
    });

    const newState: PlaylistState = {
      ...playlistState,
      playlists: newPlaylists,
    };
    savePlaylistState(newState);
    return remixUrl;
  }, [playlistState, savePlaylistState]);

  return {
    playlists: playlistState.playlists,
    solvedMelodies: playlistState.solvedMelodies,
    selectedPlaylist,
    isLoading: playlistQuery.isLoading,
    setSelectedPlaylist,
    addSolvedMelody,
    createPlaylist,
    addMelodyToPlaylist,
    removeMelodyFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    reorderMelodies,
    generateRemix,
  };
});
