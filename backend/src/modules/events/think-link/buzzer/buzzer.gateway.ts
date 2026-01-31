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
  { slug: 'tech-quiz', name: 'Tech Quiz' },
  { slug: 'general-quiz', name: 'General Quiz' },
  { slug: 'rapid-fire', name: 'Rapid Fire' },
  { slug: 'custom', name: 'Custom Event' },
];

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
  private teams: Map<string, Team> = new Map();

  // Connected coordinators
  private coordinators: Set<string> = new Set();

  // Current buzzer state
  private state: BuzzerState = {
    isActive: false,
    isBuzzerEnabled: false,
    currentWinner: null,
    buzzQueue: [],
    eventSlug: 'think-link', // Default event
  };

  afterInit() {
    this.logger.log('Buzzer Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from teams if participant
    if (this.teams.has(client.id)) {
      this.teams.delete(client.id);
      this.broadcastTeamCount();
    }

    // Remove from coordinators if coordinator
    if (this.coordinators.has(client.id)) {
      this.coordinators.delete(client.id);
    }
  }

  /**
   * Participant checks session status (called on connect)
   */
  @SubscribeMessage('participant:check-session')
  handleCheckSession(@ConnectedSocket() _client: Socket) {
    return {
      success: true,
      isActive: this.state.isActive,
      isBuzzerEnabled: this.state.isBuzzerEnabled,
    };
  }

  /**
   * Coordinator joins the session
   */
  @SubscribeMessage('coordinator:join')
  async handleCoordinatorJoin(@ConnectedSocket() client: Socket) {
    this.coordinators.add(client.id);
    this.logger.log(`Coordinator joined: ${client.id}`);

    // Send current state to coordinator
    client.emit('state:update', {
      isActive: this.state.isActive,
      isBuzzerEnabled: this.state.isBuzzerEnabled,
      teamCount: this.teams.size,
      teams: Array.from(this.teams.values()),
      currentWinner: this.state.currentWinner,
      eventSlug: this.state.eventSlug,
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
    @MessageBody() data: { name1: string; name2: string },
  ) {
    const { name1, name2 } = data;

    if (!name1?.trim() || !name2?.trim()) {
      return { success: false, error: 'Both team member names are required' };
    }

    // Only allow joining when session is active
    if (!this.state.isActive) {
      return { success: false, error: 'No active session. Please wait for coordinator to start.' };
    }

    const team: Team = {
      socketId: client.id,
      name1: name1.trim(),
      name2: name2.trim(),
      joinedAt: Date.now(),
    };

    this.teams.set(client.id, team);
    this.logger.log(`Team joined: ${name1} & ${name2}`);

    // Notify coordinators about new team
    this.broadcastTeamCount();

    // Send current state to participant
    client.emit('buzzer:state', {
      isActive: this.state.isActive,
      isBuzzerEnabled: this.state.isBuzzerEnabled,
      canPress: this.state.isBuzzerEnabled && !this.state.currentWinner,
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

    this.state.isActive = true;
    this.state.isBuzzerEnabled = false;
    this.state.currentWinner = null;
    this.state.buzzQueue = [];

    this.logger.log('Buzzer session started');

    // Notify all participants
    this.server.emit('session:started');
    this.broadcastBuzzerState();

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

    this.state.isActive = false;
    this.state.isBuzzerEnabled = false;
    this.state.currentWinner = null;
    this.state.buzzQueue = [];

    this.logger.log('Buzzer session ended');

    // Notify all participants
    this.server.emit('session:ended');
    this.broadcastBuzzerState();

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

    // Reset for new question
    this.state.isBuzzerEnabled = true;
    this.state.currentWinner = null;
    this.state.buzzQueue = [];

    this.logger.log('Buzzer enabled for new question');

    // Notify all participants
    this.server.emit('buzzer:enabled');
    this.broadcastBuzzerState();

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

    this.state.isBuzzerEnabled = false;

    this.logger.log('Buzzer disabled');

    // Notify all participants
    this.server.emit('buzzer:disabled');
    this.broadcastBuzzerState();

    return { success: true };
  }

  /**
   * Participant presses the buzzer
   */
  @SubscribeMessage('buzzer:press')
  handleBuzzerPress(@ConnectedSocket() client: Socket) {
    const team = this.teams.get(client.id);

    if (!team) {
      return { success: false, error: 'Team not registered' };
    }

    if (!this.state.isActive || !this.state.isBuzzerEnabled) {
      return { success: false, error: 'Buzzer not active' };
    }

    // Record buzz with server timestamp
    const pressedAt = Date.now();
    const buzzPress: BuzzPress = { team, pressedAt };

    this.state.buzzQueue.push(buzzPress);
    this.logger.log(`Buzz from ${team.name1} & ${team.name2} at ${pressedAt}`);

    // If this is the first buzz, set as winner and notify coordinator
    if (!this.state.currentWinner) {
      this.state.currentWinner = buzzPress;
      this.state.isBuzzerEnabled = false; // Disable further buzzes

      // Notify coordinator of winner
      this.coordinators.forEach((coordId) => {
        this.server.to(coordId).emit('buzzer:winner', {
          team: team,
          pressedAt: pressedAt,
        });
      });

      // Notify all participants buzzer is locked
      this.server.emit('buzzer:locked', {
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

    // Award point to winning team
    const winningTeam = this.state.currentWinner?.team;
    if (winningTeam) {
      await this.buzzerService.addScore(
        this.state.eventSlug,
        winningTeam.name1,
        winningTeam.name2,
        1,
      );
      this.logger.log(`Point awarded to ${winningTeam.name1} & ${winningTeam.name2}`);
    }

    this.logger.log('Answer marked correct - waiting for next question');

    // Reset state for next question
    this.state.isBuzzerEnabled = false;
    this.state.currentWinner = null;
    this.state.buzzQueue = [];

    // Notify all participants
    this.server.emit('answer:correct');
    this.broadcastBuzzerState();
    await this.broadcastLeaderboard();

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

    // Get the team that gave wrong answer
    const wrongTeam = this.state.currentWinner?.team;

    this.logger.log(
      `Answer marked wrong by ${wrongTeam?.name1} & ${wrongTeam?.name2} - continuing buzzer`,
    );

    // Re-enable buzzer for remaining teams
    this.state.isBuzzerEnabled = true;
    this.state.currentWinner = null;

    // Check if there are more buzzes in queue (someone else pressed while first was answering)
    const remainingBuzzes = this.state.buzzQueue.filter(
      (buzz) => buzz.team.socketId !== wrongTeam?.socketId,
    );

    if (remainingBuzzes.length > 0) {
      // Sort by timestamp and get next winner
      remainingBuzzes.sort((a, b) => a.pressedAt - b.pressedAt);
      this.state.currentWinner = remainingBuzzes[0];
      this.state.isBuzzerEnabled = false;

      // Notify coordinator of new winner
      this.coordinators.forEach((coordId) => {
        this.server.to(coordId).emit('buzzer:winner', {
          team: this.state.currentWinner!.team,
          pressedAt: this.state.currentWinner!.pressedAt,
        });
      });

      // Notify all participants
      this.server.emit('buzzer:locked', {
        winnerNames: `${this.state.currentWinner.team.name1} & ${this.state.currentWinner.team.name2}`,
      });
    } else {
      // No one else pressed, re-enable buzzer for everyone except wrong team
      this.server.emit('buzzer:enabled');
      this.broadcastBuzzerState();
    }

    // Notify participants about wrong answer
    this.server.emit('answer:wrong', {
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

    this.state.isBuzzerEnabled = false;
    this.state.currentWinner = null;
    this.state.buzzQueue = [];

    this.logger.log('Buzzer reset');

    this.server.emit('buzzer:reset');
    this.broadcastBuzzerState();

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

    return {
      success: true,
      teams: Array.from(this.teams.values()),
      count: this.teams.size,
    };
  }

  /**
   * Broadcast updated buzzer state to all participants
   */
  private broadcastBuzzerState() {
    this.server.emit('buzzer:state', {
      isActive: this.state.isActive,
      isBuzzerEnabled: this.state.isBuzzerEnabled,
      canPress: this.state.isBuzzerEnabled && !this.state.currentWinner,
    });
  }

  /**
   * Broadcast team count to coordinators
   */
  private broadcastTeamCount() {
    const teamData = {
      teamCount: this.teams.size,
      teams: Array.from(this.teams.values()),
    };

    this.coordinators.forEach((coordId) => {
      this.server.to(coordId).emit('teams:update', teamData);
    });
  }

  /**
   * Broadcast leaderboard to coordinators
   */
  private async broadcastLeaderboard() {
    const leaderboard = await this.buzzerService.getLeaderboard(this.state.eventSlug);
    this.coordinators.forEach((coordId) => {
      this.server
        .to(coordId)
        .emit('leaderboard:update', { leaderboard, eventSlug: this.state.eventSlug });
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

    const eventSlug = data?.eventSlug || this.state.eventSlug;
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

    const eventSlug = data?.eventSlug || this.state.eventSlug;
    await this.buzzerService.resetLeaderboard(eventSlug);
    this.logger.log(`Leaderboard reset for ${eventSlug}`);
    await this.broadcastLeaderboard();

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

    this.state.eventSlug = data.eventSlug;
    this.logger.log(`Event changed to: ${data.eventSlug}`);

    // Notify all coordinators about event change
    this.coordinators.forEach((coordId) => {
      this.server.to(coordId).emit('event:changed', {
        eventSlug: data.eventSlug,
        availableEvents: BUZZER_EVENTS,
      });
    });

    // Broadcast updated leaderboard for new event
    await this.broadcastLeaderboard();

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
      currentEvent: this.state.eventSlug,
    };
  }
}
