import { Logger } from '@nestjs/common';
import type { ServerWebSocket } from 'bun';
import { DataSource } from 'typeorm';
import { CtrlQuizParticipant } from '../../ctrl-quiz/ctrl-quiz.entity';
import { BuzzerScore } from './entities/buzzer-score.entity';

/**
 * Team information for buzzer participants
 */
interface Team {
  socketId: string;
  name1: string;
  name2: string;
  joinedAt: number;
}

/**
 * Buzz press event with server timestamp
 */
interface BuzzPress {
  team: Team;
  pressedAt: number;
}

/**
 * Buzzer state managed by coordinator
 */
interface BuzzerState {
  isActive: boolean;
  isBuzzerEnabled: boolean;
  currentWinner: BuzzPress | null;
  buzzQueue: BuzzPress[];
  eventSlug: string;
}

/**
 * WebSocket data attached to each connection
 */
interface WSData {
  id: string;
  type: 'participant' | 'coordinator' | 'unknown';
  eventSlug: string;
  team?: Team;
}

/**
 * Message types for WebSocket communication
 */
interface WSMessage {
  type: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

/**
 * Available events for buzzer
 */
const BUZZER_EVENTS = [
  { slug: 'think-link', name: 'Think & Link' },
  { slug: 'code-hunt', name: 'Code Hunt' },
  { slug: 'tech-quiz', name: 'Tech Quiz' },
  { slug: 'general-quiz', name: 'General Quiz' },
  { slug: 'rapid-fire', name: 'Rapid Fire' },
  { slug: 'ctrl-quiz', name: 'Ctrl + Quiz' },
  { slug: 'custom', name: 'Custom Event' },
];

const DEFAULT_EVENT_SLUG = 'think-link';

/**
 * Bun Native WebSocket Server for Buzzer System
 *
 * This is a standalone WebSocket server that handles real-time buzzer functionality.
 * It uses Bun's native WebSocket support for maximum performance.
 */
export class BuzzerWebSocketServer {
  private readonly logger = new Logger(BuzzerWebSocketServer.name);

  // All connected sockets
  private sockets: Map<string, ServerWebSocket<WSData>> = new Map();

  // Teams by event
  private teamsByEvent: Map<string, Map<string, Team>> = new Map();

  // Coordinators by event
  private coordinatorsByEvent: Map<string, Set<string>> = new Map();

  // Buzzer state by event
  private statesByEvent: Map<string, BuzzerState> = new Map();

  // Database connection for score persistence
  private dataSource: DataSource | null = null;

  constructor() {
    this.logger.log('BuzzerWebSocketServer instance created');
  }

  /**
   * Set the TypeORM DataSource for database operations
   */
  setDataSource(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.logger.log('DataSource connected to BuzzerWebSocketServer');
  }

  /**
   * Broadcast leaderboard update to all coordinators for an event
   * Can be called from external services (e.g., ctrl-quiz)
   */
  async notifyLeaderboardUpdate(eventSlug: string) {
    await this.broadcastLeaderboard(eventSlug);
  }

  /**
   * Get WebSocket server handler for Bun.serve()
   */
  getWebSocketHandler() {
    return {
      message: (ws: ServerWebSocket<WSData>, message: string | Buffer) => {
        this.handleMessage(ws, message);
      },
      open: (ws: ServerWebSocket<WSData>) => {
        this.handleOpen(ws);
      },
      close: (ws: ServerWebSocket<WSData>) => {
        this.handleClose(ws);
      },
      drain: () => {},
    };
  }

  /**
   * Handle new WebSocket connection
   */
  private handleOpen(ws: ServerWebSocket<WSData>) {
    // eslint-disable-next-line no-undef
    const id = crypto.randomUUID();
    ws.data = { id, type: 'unknown', eventSlug: DEFAULT_EVENT_SLUG };
    this.sockets.set(id, ws);
    this.logger.log(`Client connected: ${id}`);

    // Send welcome message
    this.send(ws, { type: 'connected', data: { id } });
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(ws: ServerWebSocket<WSData>) {
    const { id, type, eventSlug } = ws.data;
    this.logger.log(`Client disconnected: ${id}`);

    // Remove from sockets
    this.sockets.delete(id);

    // Remove from teams if participant
    if (type === 'participant') {
      const teams = this.getEventTeams(eventSlug);
      if (teams.has(id)) {
        teams.delete(id);
        this.broadcastTeamCount(eventSlug);
      }
    }

    // Remove from coordinators
    if (type === 'coordinator') {
      this.getEventCoordinators(eventSlug).delete(id);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(ws: ServerWebSocket<WSData>, rawMessage: string | Buffer) {
    try {
      const messageStr = typeof rawMessage === 'string' ? rawMessage : rawMessage.toString();
      const message: WSMessage = JSON.parse(messageStr);

      this.routeMessage(ws, message);
    } catch (err) {
      this.logger.error(`Failed to parse message: ${err}`);
      this.sendError(ws, 'Invalid message format');
    }
  }

  /**
   * Route message to appropriate handler
   */
  private routeMessage(ws: ServerWebSocket<WSData>, message: WSMessage) {
    const { type, requestId, data } = message;

    const respond = (response: Record<string, unknown>) => {
      this.send(ws, { type: `${type}:response`, requestId, data: response });
    };

    switch (type) {
      case 'participant:check-session':
        respond(this.handleCheckSession(ws, data));
        break;

      case 'team:join':
        respond(
          this.handleTeamJoin(ws, data as { name1: string; name2: string; eventSlug?: string }),
        );
        break;

      case 'buzzer:press':
        respond(this.handleBuzzerPress(ws));
        break;

      case 'coordinator:join':
        respond(this.handleCoordinatorJoin(ws));
        break;

      case 'coordinator:select-event':
        respond(this.handleSelectEvent(ws, data as { eventSlug: string }));
        break;

      case 'coordinator:start-session':
        respond(this.handleStartSession(ws));
        break;

      case 'coordinator:end-session':
        respond(this.handleEndSession(ws));
        break;

      case 'coordinator:enable-buzzer':
        respond(this.handleEnableBuzzer(ws));
        break;

      case 'coordinator:disable-buzzer':
        respond(this.handleDisableBuzzer(ws));
        break;

      case 'coordinator:answer-correct':
        // Send response IMMEDIATELY before broadcasts to prevent timeout with 20+ phones
        this.handleAnswerCorrect(ws)
          .then((result) => {
            respond(result);
          })
          .catch((err) => {
            this.logger.error(`Error in handleAnswerCorrect: ${err}`);
            respond({ success: false, error: 'Internal error' });
          });
        break;

      case 'coordinator:answer-wrong':
        respond(this.handleAnswerWrong(ws));
        break;

      case 'coordinator:reset':
        respond(this.handleReset(ws));
        break;

      case 'coordinator:get-teams':
        respond(this.handleGetTeams(ws));
        break;

      case 'coordinator:get-leaderboard':
        this.handleGetLeaderboard(ws, data).then(respond);
        break;

      case 'coordinator:reset-leaderboard':
        this.handleResetLeaderboard(ws, data).then(respond);
        break;

      case 'coordinator:get-events':
        respond(this.handleGetEvents(ws));
        break;

      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      default:
        this.sendError(ws, `Unknown message type: ${type}`, requestId);
    }
  }

  /**
   * Participant checks session status
   */
  private handleCheckSession(ws: ServerWebSocket<WSData>, data?: Record<string, unknown>) {
    const eventSlug = (data?.eventSlug as string) || DEFAULT_EVENT_SLUG;
    const state = this.getEventState(eventSlug);

    ws.data.eventSlug = eventSlug;
    ws.data.type = 'participant';
    ws.subscribe(`event:${eventSlug}`);

    return {
      success: true,
      isActive: state.isActive,
      isBuzzerEnabled: state.isBuzzerEnabled,
    };
  }

  /**
   * Participant joins as team
   */
  private handleTeamJoin(
    ws: ServerWebSocket<WSData>,
    data: { name1: string; name2: string; eventSlug?: string },
  ) {
    const { name1, name2 } = data;
    const eventSlug = data.eventSlug || DEFAULT_EVENT_SLUG;
    const state = this.getEventState(eventSlug);

    if (!name1?.trim() || !name2?.trim()) {
      return { success: false, error: 'Both team member names are required' };
    }

    if (!state.isActive) {
      return { success: false, error: 'No active session. Please wait for coordinator to start.' };
    }

    const team: Team = {
      socketId: ws.data.id,
      name1: name1.trim(),
      name2: name2.trim(),
      joinedAt: Date.now(),
    };

    ws.data.type = 'participant';
    ws.data.eventSlug = eventSlug;
    ws.data.team = team;

    this.getEventTeams(eventSlug).set(ws.data.id, team);
    ws.subscribe(`event:${eventSlug}`);

    this.logger.log(`Team joined (${eventSlug}): ${name1} & ${name2}`);

    // Notify coordinators
    this.broadcastTeamCount(eventSlug);

    // Send current state to participant
    this.send(ws, {
      type: 'buzzer:state',
      data: {
        isActive: state.isActive,
        isBuzzerEnabled: state.isBuzzerEnabled,
        canPress: state.isBuzzerEnabled && !state.currentWinner,
      },
    });

    return { success: true, team };
  }

  /**
   * Handle buzzer press
   */
  private handleBuzzerPress(ws: ServerWebSocket<WSData>) {
    const { id: _id, eventSlug, team } = ws.data;

    if (!team) {
      return { success: false, error: 'Team not registered' };
    }

    const state = this.getEventState(eventSlug);

    if (!state.isActive || !state.isBuzzerEnabled) {
      return { success: false, error: 'Buzzer not active' };
    }

    const pressedAt = Date.now();
    const buzzPress: BuzzPress = { team, pressedAt };

    state.buzzQueue.push(buzzPress);
    this.logger.log(`Buzz (${eventSlug}) from ${team.name1} & ${team.name2} at ${pressedAt}`);

    if (!state.currentWinner) {
      // IMMEDIATELY lock the state before any broadcasts to prevent race conditions
      state.currentWinner = buzzPress;
      state.isBuzzerEnabled = false;

      // Create response first (lowest latency for presser)
      const response = { success: true, first: true };

      // Broadcast to all participants FIRST (they need to lock their UI immediately)
      this.broadcastToEvent(eventSlug, {
        type: 'buzzer:locked',
        data: { winnerNames: `${team.name1} & ${team.name2}` },
      });

      // Notify coordinators LAST (less time-critical)
      this.broadcastToCoordinators(eventSlug, {
        type: 'buzzer:winner',
        data: { team, pressedAt },
      });

      return response;
    }

    return { success: true, first: false };
  }

  /**
   * Coordinator joins
   */
  private handleCoordinatorJoin(ws: ServerWebSocket<WSData>) {
    ws.data.type = 'coordinator';
    const eventSlug = ws.data.eventSlug;

    this.getEventCoordinators(eventSlug).add(ws.data.id);
    ws.subscribe(`event:${eventSlug}`);
    ws.subscribe(`coordinator:${eventSlug}`);

    this.logger.log(`Coordinator joined: ${ws.data.id}`);

    const state = this.getEventState(eventSlug);
    const teams = this.getEventTeams(eventSlug);

    // Send current state
    this.send(ws, {
      type: 'state:update',
      data: {
        isActive: state.isActive,
        isBuzzerEnabled: state.isBuzzerEnabled,
        teamCount: teams.size,
        teams: Array.from(teams.values()),
        currentWinner: state.currentWinner,
        eventSlug,
        availableEvents: BUZZER_EVENTS,
      },
    });

    return { success: true };
  }

  /**
   * Coordinator selects event
   */
  private handleSelectEvent(ws: ServerWebSocket<WSData>, data: { eventSlug: string }) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const previousEvent = ws.data.eventSlug;
    const newEvent = data.eventSlug;

    if (previousEvent !== newEvent) {
      // Unsubscribe from previous event
      ws.unsubscribe(`event:${previousEvent}`);
      ws.unsubscribe(`coordinator:${previousEvent}`);
      this.getEventCoordinators(previousEvent).delete(ws.data.id);

      // Subscribe to new event
      ws.data.eventSlug = newEvent;
      ws.subscribe(`event:${newEvent}`);
      ws.subscribe(`coordinator:${newEvent}`);
      this.getEventCoordinators(newEvent).add(ws.data.id);
    }

    this.logger.log(`Coordinator ${ws.data.id} switched to event: ${newEvent}`);

    const state = this.getEventState(newEvent);
    const teams = this.getEventTeams(newEvent);

    this.send(ws, {
      type: 'event:changed',
      data: { eventSlug: newEvent, availableEvents: BUZZER_EVENTS },
    });

    this.send(ws, {
      type: 'state:update',
      data: {
        isActive: state.isActive,
        isBuzzerEnabled: state.isBuzzerEnabled,
        teamCount: teams.size,
        teams: Array.from(teams.values()),
        currentWinner: state.currentWinner,
        eventSlug: newEvent,
        availableEvents: BUZZER_EVENTS,
      },
    });

    return { success: true, eventSlug: newEvent };
  }

  /**
   * Start buzzer session
   */
  private handleStartSession(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = ws.data.eventSlug;
    const state = this.getEventState(eventSlug);

    state.isActive = true;
    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Session started (${eventSlug})`);

    this.broadcastToEvent(eventSlug, { type: 'session:started' });
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * End buzzer session
   */
  private handleEndSession(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = ws.data.eventSlug;
    const state = this.getEventState(eventSlug);

    state.isActive = false;
    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Session ended (${eventSlug})`);

    this.broadcastToEvent(eventSlug, { type: 'session:ended' });
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Enable buzzer for new question
   */
  private handleEnableBuzzer(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = ws.data.eventSlug;
    const state = this.getEventState(eventSlug);

    state.isBuzzerEnabled = true;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Buzzer enabled (${eventSlug})`);

    this.broadcastToEvent(eventSlug, { type: 'buzzer:enabled' });
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Disable buzzer
   */
  private handleDisableBuzzer(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = ws.data.eventSlug;
    const state = this.getEventState(eventSlug);

    state.isBuzzerEnabled = false;

    this.logger.log(`Buzzer disabled (${eventSlug})`);

    this.broadcastToEvent(eventSlug, { type: 'buzzer:disabled' });
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Mark answer as correct - optimized for 20-40ms updates
   */
  private async handleAnswerCorrect(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = ws.data.eventSlug;
    const state = this.getEventState(eventSlug);

    // Update state FIRST
    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    // Broadcast IMMEDIATELY (synchronous for 20-40ms response)
    this.broadcastToEvent(eventSlug, { type: 'answer:correct' });
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Mark answer as wrong - optimized for 20-40ms updates
   */
  private handleAnswerWrong(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = ws.data.eventSlug;
    const state = this.getEventState(eventSlug);
    const wrongTeam = state.currentWinner?.team;

    this.logger.log(`Answer wrong (${eventSlug}) by ${wrongTeam?.name1} & ${wrongTeam?.name2}`);

    // IMMEDIATELY clear current winner
    state.currentWinner = null;

    // Check for queued buzzes from other teams
    const remainingBuzzes = state.buzzQueue.filter(
      (buzz) => buzz.team.socketId !== wrongTeam?.socketId,
    );

    // Broadcast IMMEDIATELY (synchronous for 20-40ms response)
    if (remainingBuzzes.length > 0) {
      // Someone else pressed - lock to them immediately
      remainingBuzzes.sort((a, b) => a.pressedAt - b.pressedAt);
      state.currentWinner = remainingBuzzes[0];
      state.isBuzzerEnabled = false;

      // Broadcast wrong answer FIRST
      this.broadcastToEvent(eventSlug, {
        type: 'answer:wrong',
        data: { wrongTeam: wrongTeam ? `${wrongTeam.name1} & ${wrongTeam.name2}` : null },
      });

      // Then IMMEDIATELY lock to next team
      this.broadcastToEvent(eventSlug, {
        type: 'buzzer:locked',
        data: {
          winnerNames: `${state.currentWinner.team.name1} & ${state.currentWinner.team.name2}`,
        },
      });

      // Notify coordinators last
      this.broadcastToCoordinators(eventSlug, {
        type: 'buzzer:winner',
        data: {
          team: state.currentWinner.team,
          pressedAt: state.currentWinner.pressedAt,
        },
      });
    } else {
      // No queued buzzes - re-enable buzzer
      state.isBuzzerEnabled = true;

      // Broadcast wrong answer first
      this.broadcastToEvent(eventSlug, {
        type: 'answer:wrong',
        data: { wrongTeam: wrongTeam ? `${wrongTeam.name1} & ${wrongTeam.name2}` : null },
      });

      // Then enable buzzer for all
      this.broadcastToEvent(eventSlug, { type: 'buzzer:enabled' });
      this.broadcastBuzzerState(eventSlug);
    }

    return { success: true };
  }

  /**
   * Reset buzzer round
   */
  private handleReset(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = ws.data.eventSlug;
    const state = this.getEventState(eventSlug);

    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Buzzer reset (${eventSlug})`);

    this.broadcastToEvent(eventSlug, { type: 'buzzer:reset' });
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Get team list
   */
  private handleGetTeams(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const teams = this.getEventTeams(ws.data.eventSlug);

    return {
      success: true,
      teams: Array.from(teams.values()),
      count: teams.size,
    };
  }

  /**
   * Get leaderboard
   */
  private async handleGetLeaderboard(ws: ServerWebSocket<WSData>, data?: Record<string, unknown>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = (data?.eventSlug as string) || ws.data.eventSlug;
    const leaderboard = await this.getLeaderboard(eventSlug);

    return { success: true, leaderboard, eventSlug };
  }

  /**
   * Reset leaderboard
   */
  private async handleResetLeaderboard(
    ws: ServerWebSocket<WSData>,
    data?: Record<string, unknown>,
  ) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = (data?.eventSlug as string) || ws.data.eventSlug;
    await this.resetLeaderboard(eventSlug);

    this.logger.log(`Leaderboard reset for ${eventSlug}`);
    await this.broadcastLeaderboard(eventSlug);

    return { success: true };
  }

  /**
   * Get available events
   */
  private handleGetEvents(ws: ServerWebSocket<WSData>) {
    if (ws.data.type !== 'coordinator') {
      return { success: false, error: 'Not authorized' };
    }

    return {
      success: true,
      events: BUZZER_EVENTS,
      currentEvent: ws.data.eventSlug,
    };
  }

  // ==================== Helper Methods ====================

  private getEventState(eventSlug: string): BuzzerState {
    let state = this.statesByEvent.get(eventSlug);
    if (!state) {
      state = {
        isActive: false,
        isBuzzerEnabled: false,
        currentWinner: null,
        buzzQueue: [],
        eventSlug,
      };
      this.statesByEvent.set(eventSlug, state);
    }
    return state;
  }

  private getEventTeams(eventSlug: string): Map<string, Team> {
    let teams = this.teamsByEvent.get(eventSlug);
    if (!teams) {
      teams = new Map();
      this.teamsByEvent.set(eventSlug, teams);
    }
    return teams;
  }

  private getEventCoordinators(eventSlug: string): Set<string> {
    let coordinators = this.coordinatorsByEvent.get(eventSlug);
    if (!coordinators) {
      coordinators = new Set();
      this.coordinatorsByEvent.set(eventSlug, coordinators);
    }
    return coordinators;
  }

  private send(
    ws: ServerWebSocket<WSData>,
    message: { type: string; requestId?: string; data?: unknown },
  ) {
    try {
      ws.send(JSON.stringify(message));
    } catch (err) {
      this.logger.error(`Failed to send message: ${err}`);
    }
  }

  private sendError(ws: ServerWebSocket<WSData>, error: string, requestId?: string) {
    this.send(ws, { type: 'error', requestId, data: { error } });
  }

  private broadcastToEvent(eventSlug: string, message: { type: string; data?: unknown }) {
    const msgStr = JSON.stringify(message);
    const sockets = Array.from(this.sockets.values()).filter(
      (socket) => socket.data.eventSlug === eventSlug,
    );

    this.logger.log(`Broadcasting ${message.type} to ${sockets.length} sockets in ${eventSlug}`);

    // Batch broadcasts for better performance with 20+ phones
    let successCount = 0;
    let errorCount = 0;

    for (const socket of sockets) {
      try {
        socket.send(msgStr);
        successCount++;
      } catch (err) {
        errorCount++;
        this.logger.error(`Failed to broadcast to socket: ${err}`);
      }
    }

    if (errorCount > 0) {
      this.logger.warn(`Broadcast to ${eventSlug}: ${successCount} success, ${errorCount} failed`);
    }
  }

  private broadcastToCoordinators(eventSlug: string, message: { type: string; data?: unknown }) {
    const msgStr = JSON.stringify(message);
    const coordinators = this.getEventCoordinators(eventSlug);

    for (const coordId of coordinators) {
      const socket = this.sockets.get(coordId);
      if (socket) {
        try {
          socket.send(msgStr);
        } catch (err) {
          this.logger.error(`Failed to send to coordinator: ${err}`);
        }
      }
    }
  }

  private broadcastBuzzerState(eventSlug: string) {
    const state = this.getEventState(eventSlug);
    this.broadcastToEvent(eventSlug, {
      type: 'buzzer:state',
      data: {
        isActive: state.isActive,
        isBuzzerEnabled: state.isBuzzerEnabled,
        canPress: state.isBuzzerEnabled && !state.currentWinner,
      },
    });
  }

  private broadcastTeamCount(eventSlug: string) {
    const teams = this.getEventTeams(eventSlug);
    this.broadcastToCoordinators(eventSlug, {
      type: 'teams:update',
      data: {
        teamCount: teams.size,
        teams: Array.from(teams.values()),
      },
    });
  }

  private async broadcastLeaderboard(eventSlug: string) {
    const leaderboard = await this.getLeaderboard(eventSlug);
    this.broadcastToCoordinators(eventSlug, {
      type: 'leaderboard:update',
      data: { leaderboard, eventSlug },
    });
  }

  // ==================== Database Operations ====================

  private async addScore(eventSlug: string, name1: string, name2: string, points: number = 1) {
    if (!this.dataSource) return;

    const repo = this.dataSource.getRepository(BuzzerScore);
    const teamKey = `${name1.toLowerCase()}|${name2.toLowerCase()}`;

    let score = await repo.findOne({ where: { eventSlug, teamKey } });

    if (score) {
      score.score += points;
      score.correctAnswers += 1;
    } else {
      score = repo.create({
        eventSlug,
        teamKey,
        name1,
        name2,
        score: points,
        correctAnswers: 1,
      });
    }

    return repo.save(score);
  }

  private async getLeaderboard(eventSlug: string): Promise<BuzzerScore[] | CtrlQuizParticipant[]> {
    if (!this.dataSource) return [];

    // Handle ctrl-quiz separately since it uses its own entity
    if (eventSlug === 'ctrl-quiz') {
      const repo = this.dataSource.getRepository(CtrlQuizParticipant);
      const participants = await repo.find();
      // Sort by score DESC, then by lastSubmitTime ASC (fastest first)
      return participants.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const aTime = a.lastSubmitTime?.getTime() || Infinity;
        const bTime = b.lastSubmitTime?.getTime() || Infinity;
        return aTime - bTime;
      });
    }

    const repo = this.dataSource.getRepository(BuzzerScore);
    return repo.find({
      where: { eventSlug },
      order: { score: 'DESC', correctAnswers: 'DESC' },
    });
  }

  private async resetLeaderboard(eventSlug: string) {
    if (!this.dataSource) return;

    // Handle ctrl-quiz separately
    if (eventSlug === 'ctrl-quiz') {
      const repo = this.dataSource.getRepository(CtrlQuizParticipant);
      await repo.update({}, { score: 0, lastSubmitTime: null });
      return;
    }

    const repo = this.dataSource.getRepository(BuzzerScore);
    await repo.delete({ eventSlug });
  }
}

// Singleton instance
export const buzzerWSServer = new BuzzerWebSocketServer();
