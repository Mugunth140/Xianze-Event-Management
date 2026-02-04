import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BuzzerService } from './buzzer.service';

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
  pressedAt: number; // Server timestamp
}

/**
 * Buzzer state managed by coordinator
 */
interface BuzzerState {
  isActive: boolean; // Is buzzer session active
  isBuzzerEnabled: boolean; // Can participants press buzzer
  currentWinner: BuzzPress | null;
  buzzQueue: BuzzPress[]; // Queue of all buzzes for this round
  eventSlug: string; // Current event identifier
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
  { slug: 'custom', name: 'Custom Event' },
];

const DEFAULT_EVENT_SLUG = 'think-link';
const getEventRoom = (eventSlug: string) => `event:${eventSlug}`;

/**
 * WebSocket Gateway for Buzzer System
 *
 * Handles real-time buzzer functionality for any event.
 * Uses server-side timestamps to determine first press accurately.
 * Scores persist in database across sessions.
 */
@WebSocketGateway({
  namespace: '/buzzer',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BuzzerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BuzzerGateway.name);

  constructor(private readonly buzzerService: BuzzerService) {}

  // Connected teams (participants)
  private teamsByEvent: Map<string, Map<string, Team>> = new Map();

  // Participant socket -> event mapping
  private participantEvent: Map<string, string> = new Map();

  // Connected coordinators
  private coordinators: Set<string> = new Set();

  // Coordinator socket -> event mapping
  private coordinatorEvent: Map<string, string> = new Map();

  // Coordinators per event
  private coordinatorsByEvent: Map<string, Set<string>> = new Map();

  // Current buzzer state per event
  private statesByEvent: Map<string, BuzzerState> = new Map();

  afterInit() {
    this.logger.log('Buzzer Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from teams if participant
    const participantEvent = this.participantEvent.get(client.id);
    if (participantEvent) {
      const teams = this.getEventTeams(participantEvent);
      if (teams.has(client.id)) {
        teams.delete(client.id);
        this.broadcastTeamCount(participantEvent);
      }
      this.participantEvent.delete(client.id);
    }

    // Remove from coordinators if coordinator
    if (this.coordinators.has(client.id)) {
      this.coordinators.delete(client.id);
      const coordinatorEvent = this.coordinatorEvent.get(client.id);
      if (coordinatorEvent) {
        this.getEventCoordinators(coordinatorEvent).delete(client.id);
        this.coordinatorEvent.delete(client.id);
      }
    }
  }

  /**
   * Participant checks session status (called on connect)
   */
  @SubscribeMessage('participant:check-session')
  handleCheckSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { eventSlug?: string },
  ) {
    const eventSlug = data?.eventSlug || DEFAULT_EVENT_SLUG;
    const state = this.getEventState(eventSlug);

    client.join(getEventRoom(eventSlug));
    this.participantEvent.set(client.id, eventSlug);

    return {
      success: true,
      isActive: state.isActive,
      isBuzzerEnabled: state.isBuzzerEnabled,
    };
  }

  /**
   * Coordinator joins the session
   */
  @SubscribeMessage('coordinator:join')
  async handleCoordinatorJoin(@ConnectedSocket() client: Socket) {
    this.coordinators.add(client.id);
    this.logger.log(`Coordinator joined: ${client.id}`);

    this.setCoordinatorEvent(client, this.getCoordinatorEvent(client.id));

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);
    const teams = this.getEventTeams(eventSlug);

    // Send current state to coordinator
    client.emit('state:update', {
      isActive: state.isActive,
      isBuzzerEnabled: state.isBuzzerEnabled,
      teamCount: teams.size,
      teams: Array.from(teams.values()),
      currentWinner: state.currentWinner,
      eventSlug: eventSlug,
      availableEvents: BUZZER_EVENTS,
    });

    return { success: true };
  }

  /**
   * Participant team joins the buzzer session
   */
  @SubscribeMessage('team:join')
  handleTeamJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { name1: string; name2: string; eventSlug?: string },
  ) {
    const { name1, name2 } = data;
    const eventSlug = data?.eventSlug || DEFAULT_EVENT_SLUG;
    const state = this.getEventState(eventSlug);

    if (!name1?.trim() || !name2?.trim()) {
      return { success: false, error: 'Both team member names are required' };
    }

    // Only allow joining when session is active
    if (!state.isActive) {
      return { success: false, error: 'No active session. Please wait for coordinator to start.' };
    }

    const team: Team = {
      socketId: client.id,
      name1: name1.trim(),
      name2: name2.trim(),
      joinedAt: Date.now(),
    };

    this.getEventTeams(eventSlug).set(client.id, team);
    this.participantEvent.set(client.id, eventSlug);
    client.join(getEventRoom(eventSlug));
    this.logger.log(`Team joined (${eventSlug}): ${name1} & ${name2}`);

    // Notify coordinators about new team
    this.broadcastTeamCount(eventSlug);

    // Send current state to participant
    client.emit('buzzer:state', {
      isActive: state.isActive,
      isBuzzerEnabled: state.isBuzzerEnabled,
      canPress: state.isBuzzerEnabled && !state.currentWinner,
    });

    return { success: true, team };
  }

  /**
   * Coordinator starts the buzzer session
   */
  @SubscribeMessage('coordinator:start-session')
  handleStartSession(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);

    state.isActive = true;
    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Buzzer session started (${eventSlug})`);

    // Notify all participants
    this.server.to(getEventRoom(eventSlug)).emit('session:started');
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Coordinator stops the buzzer session
   */
  @SubscribeMessage('coordinator:end-session')
  handleEndSession(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);

    state.isActive = false;
    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Buzzer session ended (${eventSlug})`);

    // Notify all participants
    this.server.to(getEventRoom(eventSlug)).emit('session:ended');
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Coordinator enables buzzer for a new question
   */
  @SubscribeMessage('coordinator:enable-buzzer')
  handleEnableBuzzer(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);

    // Reset for new question
    state.isBuzzerEnabled = true;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Buzzer enabled for new question (${eventSlug})`);

    // Notify all participants
    this.server.to(getEventRoom(eventSlug)).emit('buzzer:enabled');
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Coordinator disables buzzer (e.g., after wrong answer continues)
   */
  @SubscribeMessage('coordinator:disable-buzzer')
  handleDisableBuzzer(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);

    state.isBuzzerEnabled = false;

    this.logger.log(`Buzzer disabled (${eventSlug})`);

    // Notify all participants
    this.server.to(getEventRoom(eventSlug)).emit('buzzer:disabled');
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Participant presses the buzzer
   */
  @SubscribeMessage('buzzer:press')
  handleBuzzerPress(@ConnectedSocket() client: Socket) {
    const eventSlug = this.getParticipantEvent(client.id);
    if (!eventSlug) {
      return { success: false, error: 'Team not registered' };
    }

    const teams = this.getEventTeams(eventSlug);
    const team = teams.get(client.id);

    if (!team) {
      return { success: false, error: 'Team not registered' };
    }

    const state = this.getEventState(eventSlug);

    if (!state.isActive || !state.isBuzzerEnabled) {
      return { success: false, error: 'Buzzer not active' };
    }

    // Record buzz with server timestamp
    const pressedAt = Date.now();
    const buzzPress: BuzzPress = { team, pressedAt };

    state.buzzQueue.push(buzzPress);
    this.logger.log(`Buzz (${eventSlug}) from ${team.name1} & ${team.name2} at ${pressedAt}`);

    // If this is the first buzz, set as winner and notify coordinator
    if (!state.currentWinner) {
      state.currentWinner = buzzPress;
      state.isBuzzerEnabled = false; // Disable further buzzes

      // Notify coordinator of winner
      this.getEventCoordinators(eventSlug).forEach((coordId) => {
        this.server.to(coordId).emit('buzzer:winner', {
          team: team,
          pressedAt: pressedAt,
        });
      });

      // Notify all participants buzzer is locked
      this.server.to(getEventRoom(eventSlug)).emit('buzzer:locked', {
        winnerNames: `${team.name1} & ${team.name2}`,
      });

      return { success: true, first: true };
    }

    return { success: true, first: false };
  }

  /**
   * Coordinator marks answer as correct - move to next question
   */
  @SubscribeMessage('coordinator:answer-correct')
  async handleAnswerCorrect(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);

    // Award point to winning team
    const winningTeam = state.currentWinner?.team;
    if (winningTeam) {
      await this.buzzerService.addScore(eventSlug, winningTeam.name1, winningTeam.name2, 1);
      this.logger.log(`Point awarded to ${winningTeam.name1} & ${winningTeam.name2}`);
    }

    this.logger.log(`Answer marked correct (${eventSlug}) - waiting for next question`);

    // Reset state for next question
    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    // Notify all participants
    this.server.to(getEventRoom(eventSlug)).emit('answer:correct');
    this.broadcastBuzzerState(eventSlug);
    await this.broadcastLeaderboard(eventSlug);

    return { success: true };
  }

  /**
   * Coordinator marks answer as wrong - continue buzzer with remaining teams
   */
  @SubscribeMessage('coordinator:answer-wrong')
  handleAnswerWrong(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);

    // Get the team that gave wrong answer
    const wrongTeam = state.currentWinner?.team;

    this.logger.log(
      `Answer marked wrong (${eventSlug}) by ${wrongTeam?.name1} & ${wrongTeam?.name2} - continuing buzzer`,
    );

    // Re-enable buzzer for remaining teams
    state.isBuzzerEnabled = true;
    state.currentWinner = null;

    // Check if there are more buzzes in queue (someone else pressed while first was answering)
    const remainingBuzzes = state.buzzQueue.filter(
      (buzz) => buzz.team.socketId !== wrongTeam?.socketId,
    );

    if (remainingBuzzes.length > 0) {
      // Sort by timestamp and get next winner
      remainingBuzzes.sort((a, b) => a.pressedAt - b.pressedAt);
      state.currentWinner = remainingBuzzes[0];
      state.isBuzzerEnabled = false;

      // Notify coordinator of new winner
      this.getEventCoordinators(eventSlug).forEach((coordId) => {
        this.server.to(coordId).emit('buzzer:winner', {
          team: state.currentWinner!.team,
          pressedAt: state.currentWinner!.pressedAt,
        });
      });

      // Notify all participants
      this.server.to(getEventRoom(eventSlug)).emit('buzzer:locked', {
        winnerNames: `${state.currentWinner.team.name1} & ${state.currentWinner.team.name2}`,
      });
    } else {
      // No one else pressed, re-enable buzzer for everyone except wrong team
      this.server.to(getEventRoom(eventSlug)).emit('buzzer:enabled');
      this.broadcastBuzzerState(eventSlug);
    }

    // Notify participants about wrong answer
    this.server.to(getEventRoom(eventSlug)).emit('answer:wrong', {
      wrongTeam: wrongTeam ? `${wrongTeam.name1} & ${wrongTeam.name2}` : null,
    });

    return { success: true };
  }

  /**
   * Coordinator resets for a completely new round
   */
  @SubscribeMessage('coordinator:reset')
  handleReset(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const state = this.getEventState(eventSlug);

    state.isBuzzerEnabled = false;
    state.currentWinner = null;
    state.buzzQueue = [];

    this.logger.log(`Buzzer reset (${eventSlug})`);

    this.server.to(getEventRoom(eventSlug)).emit('buzzer:reset');
    this.broadcastBuzzerState(eventSlug);

    return { success: true };
  }

  /**
   * Get current team list (for coordinator)
   */
  @SubscribeMessage('coordinator:get-teams')
  handleGetTeams(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = this.getCoordinatorEvent(client.id);
    const teams = this.getEventTeams(eventSlug);

    return {
      success: true,
      teams: Array.from(teams.values()),
      count: teams.size,
    };
  }

  /**
   * Broadcast updated buzzer state to all participants
   */
  private broadcastBuzzerState(eventSlug: string) {
    const state = this.getEventState(eventSlug);
    this.server.to(getEventRoom(eventSlug)).emit('buzzer:state', {
      isActive: state.isActive,
      isBuzzerEnabled: state.isBuzzerEnabled,
      canPress: state.isBuzzerEnabled && !state.currentWinner,
    });
  }

  /**
   * Broadcast team count to coordinators
   */
  private broadcastTeamCount(eventSlug: string) {
    const teamData = {
      teamCount: this.getEventTeams(eventSlug).size,
      teams: Array.from(this.getEventTeams(eventSlug).values()),
    };

    this.getEventCoordinators(eventSlug).forEach((coordId) => {
      this.server.to(coordId).emit('teams:update', teamData);
    });
  }

  /**
   * Broadcast leaderboard to coordinators
   */
  private async broadcastLeaderboard(eventSlug: string) {
    const leaderboard = await this.buzzerService.getLeaderboard(eventSlug);
    this.getEventCoordinators(eventSlug).forEach((coordId) => {
      this.server.to(coordId).emit('leaderboard:update', { leaderboard, eventSlug });
    });
  }

  /**
   * Coordinator requests current leaderboard
   */
  @SubscribeMessage('coordinator:get-leaderboard')
  async handleGetLeaderboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { eventSlug?: string },
  ) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = data?.eventSlug || this.getCoordinatorEvent(client.id);
    const leaderboard = await this.buzzerService.getLeaderboard(eventSlug);

    return {
      success: true,
      leaderboard,
      eventSlug,
    };
  }

  /**
   * Coordinator resets leaderboard
   */
  @SubscribeMessage('coordinator:reset-leaderboard')
  async handleResetLeaderboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { eventSlug?: string },
  ) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    const eventSlug = data?.eventSlug || this.getCoordinatorEvent(client.id);
    await this.buzzerService.resetLeaderboard(eventSlug);
    this.logger.log(`Leaderboard reset for ${eventSlug}`);
    await this.broadcastLeaderboard(eventSlug);

    return { success: true };
  }

  /**
   * Coordinator selects event for buzzer session
   */
  @SubscribeMessage('coordinator:select-event')
  async handleSelectEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventSlug: string },
  ) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    if (!data?.eventSlug) {
      return { success: false, error: 'Event slug is required' };
    }

    this.setCoordinatorEvent(client, data.eventSlug);
    this.logger.log(`Event changed to: ${data.eventSlug}`);

    client.emit('event:changed', {
      eventSlug: data.eventSlug,
      availableEvents: BUZZER_EVENTS,
    });

    const state = this.getEventState(data.eventSlug);
    const teams = this.getEventTeams(data.eventSlug);
    client.emit('state:update', {
      isActive: state.isActive,
      isBuzzerEnabled: state.isBuzzerEnabled,
      teamCount: teams.size,
      teams: Array.from(teams.values()),
      currentWinner: state.currentWinner,
      eventSlug: data.eventSlug,
      availableEvents: BUZZER_EVENTS,
    });

    await this.broadcastLeaderboard(data.eventSlug);

    return { success: true, eventSlug: data.eventSlug };
  }

  /**
   * Get available events
   */
  @SubscribeMessage('coordinator:get-events')
  handleGetEvents(@ConnectedSocket() client: Socket) {
    if (!this.coordinators.has(client.id)) {
      return { success: false, error: 'Not authorized' };
    }

    return {
      success: true,
      events: BUZZER_EVENTS,
      currentEvent: this.getCoordinatorEvent(client.id),
    };
  }

  private getEventState(eventSlug: string): BuzzerState {
    const existing = this.statesByEvent.get(eventSlug);
    if (existing) return existing;

    const state: BuzzerState = {
      isActive: false,
      isBuzzerEnabled: false,
      currentWinner: null,
      buzzQueue: [],
      eventSlug,
    };

    this.statesByEvent.set(eventSlug, state);
    return state;
  }

  private getEventTeams(eventSlug: string): Map<string, Team> {
    const existing = this.teamsByEvent.get(eventSlug);
    if (existing) return existing;

    const teams = new Map<string, Team>();
    this.teamsByEvent.set(eventSlug, teams);
    return teams;
  }

  private getEventCoordinators(eventSlug: string): Set<string> {
    const existing = this.coordinatorsByEvent.get(eventSlug);
    if (existing) return existing;

    const coordinators = new Set<string>();
    this.coordinatorsByEvent.set(eventSlug, coordinators);
    return coordinators;
  }

  private getCoordinatorEvent(coordinatorId: string): string {
    return this.coordinatorEvent.get(coordinatorId) || DEFAULT_EVENT_SLUG;
  }

  private setCoordinatorEvent(client: Socket, eventSlug: string) {
    const previousEvent = this.coordinatorEvent.get(client.id);
    if (previousEvent && previousEvent !== eventSlug) {
      this.getEventCoordinators(previousEvent).delete(client.id);
      client.leave(getEventRoom(previousEvent));
    }

    this.coordinatorEvent.set(client.id, eventSlug);
    this.getEventCoordinators(eventSlug).add(client.id);
    client.join(getEventRoom(eventSlug));
  }

  private getParticipantEvent(participantId: string): string | null {
    const existing = this.participantEvent.get(participantId);
    if (existing) return existing;

    for (const [eventSlug, teams] of this.teamsByEvent.entries()) {
      if (teams.has(participantId)) {
        this.participantEvent.set(participantId, eventSlug);
        return eventSlug;
      }
    }

    return null;
  }
}
