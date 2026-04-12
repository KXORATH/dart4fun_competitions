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
  activeMatch: null, // { type: 'group' | 'knockout', roundId?, matchId }
  liveMatchStates: {} // { [matchId]: { p1Score, p2Score, ... } }
};

export function useTournamentState() {
  const [state, setState] = useState(INITIAL_STATE);
  const [peerId, setPeerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [connections, setConnections] = useState([]);
  
  const peerRef = useRef(null);
  const hostConnRef = useRef(null); // If we are a client, this is our connection to the host

  const updateState = (updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // Broadcast state change across network
      if (isHost) {
        // Send to all connected clients
        connections.forEach(conn => {
          if (conn.open) conn.send({ type: 'STATE_UPDATE', payload: next });
        });
      } else if (hostConnRef.current && hostConnRef.current.open) {
        // We are a client, send our new state to the host.
        // The host will then adopt it and rebroadcast it.
        hostConnRef.current.send({ type: 'STATE_UPDATE', payload: next });
      }
      
      return next;
    });
  };

  const initHost = () => {
    // Generate a random 5 char code for Room Code
    const code = 'DART-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const peer = new Peer(code);
    
    peer.on('open', (id) => {
      setPeerId(id);
      setIsHost(true);
      updateState({ phase: PHASES.SETUP_PLAYERS });
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        setConnections(prev => [...prev, conn]);
        // Send current state to new client immediately
        setState(current => {
          conn.send({ type: 'STATE_UPDATE', payload: current });
          return current;
        });
      });

      conn.on('data', (data) => {
        if (data.type === 'STATE_UPDATE') {
          setState(data.payload); // adopt client state
          // Re-broadcast to other clients
          setConnections(prev => {
            prev.filter(c => c.peer !== conn.peer && c.open).forEach(c => {
               c.send({ type: 'STATE_UPDATE', payload: data.payload });
            });
            return prev;
          });
        }
      });
      
      conn.on('close', () => {
        setConnections(prev => prev.filter(c => c.peer !== conn.peer));
      });
    });

    peerRef.current = peer;
  };

  const joinHost = (code) => {
    const peer = new Peer();
    
    peer.on('error', (err) => {
        console.error(err);
        alert("Connection Error. Please check the code and try again.");
    });

    peer.on('open', () => {
      const conn = peer.connect(code, { reliable: true });
      
      conn.on('open', () => {
        hostConnRef.current = conn;
        setIsHost(false);
        setPeerId(code);
      });

      conn.on('data', (data) => {
        if (data.type === 'STATE_UPDATE') {
          setState(data.payload);
        }
      });
      
      conn.on('close', () => {
        alert("Lost connection to Host.");
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
    connectionsCount: connections.length
  };
}
