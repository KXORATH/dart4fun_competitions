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
  settings: { mode: '1v1', startingScore: 501, checkoutType: 'double', bestOf: 3, knockoutBestOf: 3, showGroupDrawAnimation: true },
  globalHistory: [],
  activeMatch: null
};

const processIncomingState = (prev, payload, isHost) => {
  if (payload.settings && payload.settings.mode === 'multi_judge') {
    let newPhase = prev.phase;
    let newActiveMatch = prev.activeMatch;

    if (!isHost) {
        if (prev.phase <= PHASES.SETUP_GROUPS && payload.phase >= PHASES.GROUP_STAGE) {
            newPhase = payload.phase;
        } else if (prev.phase === PHASES.GROUP_STAGE && payload.phase === PHASES.KNOCKOUT_STAGE) {
            newPhase = payload.phase;
            newActiveMatch = null;
        } else if (prev.phase >= PHASES.GROUP_STAGE && payload.phase === PHASES.SETUP_GROUPS) {
            newPhase = payload.phase;
            newActiveMatch = null;
        }
    }

    const mergedGroupMatches = { ...payload.groupMatches };
    if (prev.activeMatch && prev.activeMatch.type === 'group') {
        const gId = prev.activeMatch.groupId;
        const mId = prev.activeMatch.matchId;
        const myMatch = (prev.groupMatches[gId] && prev.groupMatches[gId].find(m => m.id === mId));
        const theirMatch = (mergedGroupMatches[gId] && mergedGroupMatches[gId].find(m => m.id === mId));
        if (myMatch && theirMatch && !theirMatch.isFinished) {
            mergedGroupMatches[gId] = mergedGroupMatches[gId].map(m => m.id === mId ? myMatch : m);
        }
    }
    
    const mergedKnockouts = [ ...payload.knockouts ];
    if (prev.activeMatch && prev.activeMatch.type === 'knockout') {
        const rId = prev.activeMatch.roundId;
        const mId = prev.activeMatch.matchId;
        const rIdx = prev.knockouts.findIndex(r => r.id === rId);
        const myMatch = (prev.knockouts[rIdx] && prev.knockouts[rIdx].matches && prev.knockouts[rIdx].matches.find(m => m.id === mId));
        
        const theirRoundIdx = mergedKnockouts.findIndex(r => r.id === rId);
        if (theirRoundIdx >= 0) {
            const theirMatch = mergedKnockouts[theirRoundIdx].matches.find(m => m.id === mId);
            if (myMatch && theirMatch && !theirMatch.isFinished) {
                mergedKnockouts[theirRoundIdx] = {
                   ...mergedKnockouts[theirRoundIdx],
                   matches: mergedKnockouts[theirRoundIdx].matches.map(m => m.id === mId ? myMatch : m)
                };
            }
        }
    }

    return {
      ...payload,
      groupMatches: mergedGroupMatches,
      knockouts: mergedKnockouts,
      phase: newPhase,
      activeMatch: newActiveMatch
    };
  }
  return payload;
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
    console.log('[updateState] isHost:', isHostRef.current, '| connections:', connectionsRef.current.length, '| hostConn open:', (hostConnRef.current && hostConnRef.current.open));

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

  const initHost = useCallback((mode = '1v1') => {
    const code = 'DART-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const peer = new Peer(code, {
      debug: 3,
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      setPeerId(id);
      setIsHost(true);
      isHostRef.current = true;
      updateState(prev => ({ ...prev, phase: PHASES.SETUP_PLAYERS, settings: { ...prev.settings, mode } }));
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
          setState(prev => {
            const newState = processIncomingState(prev, data.payload, true);
            connectionsRef.current
              .filter(c => c.peer !== conn.peer && c.open)
              .forEach(c => c.send({ type: 'STATE_UPDATE', payload: newState }));
            return newState;
          });
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
    const peer = new Peer({
      debug: 3,
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('error', (err) => {
      console.error(err);
      alert('Connection Error. Please check the code and try again.');
    });

    peer.on('open', () => {
      const conn = peer.connect(code);

      conn.on('open', () => {
        hostConnRef.current = conn;
        setIsHost(false);
        isHostRef.current = false;
        setPeerId(code);
      });

      conn.on('data', (data) => {
        if (data.type === 'STATE_UPDATE') {
          setState(prev => processIncomingState(prev, data.payload, false));
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
