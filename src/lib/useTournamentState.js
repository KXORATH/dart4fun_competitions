import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export const PHASES = {
  LOBBY: -1,
  SETUP_PLAYERS: 0,
  SETUP_SETTINGS: 0.5,
  SETUP_GROUPS: 1,
  GROUP_STAGE: 2,
  KNOCKOUT_STAGE: 3,
  MATCH_VIEW: 4,
  STATS_VIEW: 5,
};

const INITIAL_STATE = {
  phase: PHASES.LOBBY,
  players: [],
  groups: [],
  groupMatches: {},
  knockouts: [],
  winner: null,
  settings: { startingScore: 501, checkoutType: 'double', bestOf: 3, knockoutBestOf: 3 },
  globalHistory: [],
  activeMatch: null
};

export function useTournamentState() {
  const [state, setState] = useState(INITIAL_STATE);
  const [peerId, setPeerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);

  const peerRef = useRef(null);
  const hostConnRef = useRef(null);
  const connectionsRef = useRef([]);
  const isHostRef = useRef(false);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // updateState is stable (no deps) — always reads fresh values from refs
  const updateState = useCallback((updater) => {
  setState(prev => {
    const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

    // TYMCZASOWE LOGI - usuń po naprawieniu
    console.log('[updateState] isHost:', isHostRef.current, '| connections:', connectionsRef.current.length, '| hostConn open:', hostConnRef.current?.open);

    if (isHostRef.current) {
      connectionsRef.current.forEach(conn => {
        if (conn.open) conn.send({ type: 'STATE_UPDATE', payload: next });
      });
    } else if (hostConnRef.current && hostConnRef.current.open) {
      console.log('[updateState] Sending to host...');
      hostConnRef.current.send({ type: 'STATE_UPDATE', payload: next });
    } else {
      console.warn('[updateState] NICZEGO NIE WYSŁANO!');
    }

    return next;
  });
}, []);

  const initHost = useCallback(() => {
    const code = 'DART-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const peer = new Peer(code);

    peer.on('open', (id) => {
      setPeerId(id);
      setIsHost(true);
      isHostRef.current = true;
      updateState({ phase: PHASES.SETUP_PLAYERS });
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        connectionsRef.current = [...connectionsRef.current, conn];
        setConnectionsCount(connectionsRef.current.length);

        setState(current => {
          conn.send({ type: 'STATE_UPDATE', payload: current });
          return current;
        });
      });

      conn.on('data', (data) => {
        if (data.type === 'STATE_UPDATE') {
          setState(data.payload);
          connectionsRef.current
            .filter(c => c.peer !== conn.peer && c.open)
            .forEach(c => c.send({ type: 'STATE_UPDATE', payload: data.payload }));
        }
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
        setConnectionsCount(connectionsRef.current.length);
      });
    });

    peerRef.current = peer;
  }, [updateState]);

  const joinHost = useCallback((code) => {
    const peer = new Peer();

    peer.on('error', (err) => {
      console.error(err);
      alert('Connection Error. Please check the code and try again.');
    });

    peer.on('open', () => {
      const conn = peer.connect(code, { reliable: true });

      conn.on('open', () => {
        hostConnRef.current = conn;
        setIsHost(false);
        isHostRef.current = false;
        setPeerId(code);
      });

      conn.on('data', (data) => {
        if (data.type === 'STATE_UPDATE') {
          setState(data.payload);
        }
      });

      conn.on('close', () => {
        alert('Lost connection to Host.');
        hostConnRef.current = null;
        setPeerId(null);
        setState(prev => ({ ...prev, phase: PHASES.LOBBY }));
      });
    });

    peerRef.current = peer;
  }, []);

  return {
    state,
    updateState,
    peerId,
    isHost,
    initHost,
    joinHost,
    connectionsCount,
  };
}
