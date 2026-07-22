import { listen } from '@tauri-apps/api/event';
import type { GameExitEvent, GameLogEvent } from '../types';

export async function setupInstallListeners(
	onInstallStatus: (status: string) => void,
	onInstallError: (error: string) => void
) {
	const unlistenStatus = listen('install-status', (event) => {
		onInstallStatus(event.payload as string);
	});

	const unlistenError = listen('install-error', (event) => {
		onInstallError(event.payload as string);
	});

	return async () => {
		(await unlistenStatus)();
		(await unlistenError)();
	};
}

export async function setupGameListeners(
	onLog: (event: GameLogEvent) => void,
	onExit: (event: GameExitEvent) => void,
) {
	const unlistenLog = listen<GameLogEvent>('game-log', (event) => {
		onLog(event.payload);
	});

	const unlistenExit = listen<GameExitEvent>('game-exit', (event) => {
		onExit(event.payload);
	});

	return async () => {
		(await unlistenLog)();
		(await unlistenExit)();
	};
}
