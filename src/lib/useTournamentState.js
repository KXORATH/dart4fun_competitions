import { useState, useEffect, useRef } from 'react';
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
  activeMatch: null // { type: 'group' | 'knockout', roundId?, matchId }
};

export function useTournamentState() {
  const [state, setState] = useState(INITIAL_STATE);
  const [peerId, setPeerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);

  const peerRef = useRef(null);
  const hostConnRef = useRef(null);   // client -> host connection
  const connectionsRef = useRef([]);  // host -> all client connections (always up-to-date)
  const isHostRef = useRef(false);    // mirror of isHost, always up-to-date inside callbacks

  // Keep isHostRef in sync whenever isHost changes
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const broadcastToClients = (payload) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send({ type: 'STATE_UPDATE', payload });
    });
  };

  const updateState = (updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

      if (isHostRef.current) {
        // We are the host — broadcast to all clients
        broadcastToClients(next);
      } else if (hostConnRef.current && hostConnRef.current.open) {
        // We are a client — send our new state to the host; host will re-broadcast
        hostConnRef.current.send({ type: 'STATE_UPDATE', payload: next });
      }

      return next;
    });
  };

  const initHost = () => {
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
        // Add to ref immediately so future broadcasts include this client
        connectionsRef.current = [...connectionsRef.current, conn];
        setConnectionsCount(connectionsRef.current.length);

        // Send current state to the newly connected client
        setState(current => {
          conn.send({ type: 'STATE_UPDATE', payload: current });
          return current;
        });
      });

      conn.on('data', (data) => {
        if (data.type === 'STATE_UPDATE') {
          // Adopt client state and rebroadcast to everyone else
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
  };

  const joinHost = (code) => {
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
  };

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
