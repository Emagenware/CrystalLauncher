import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Account } from '../types';

export async function refreshLogin(refreshToken: string): Promise<Account> {
	return await invoke<Account>('refresh_login', { refreshToken });
}

export async function startLogin(): Promise<void> {
	await invoke('start_login');
}

export function setupAuthListeners(
	onLoginSuccess: (account: Account) => void,
	onLoginError: (error: string) => void
) {
	const unlistenSuccess = listen("login-success", (event) => {
		const account = event.payload as Account;
		localStorage.setItem("mc_account", JSON.stringify(account));
		onLoginSuccess(account);
	});

	const unlistenError = listen("login-error", (event) => {
		onLoginError(event.payload as string);
	});

	return async () => {
		(await unlistenSuccess)();
		(await unlistenError)();
	};
}

// refresh a bit early so we dont get caught right at expiry
const REFRESH_BUFFER_SECONDS = 5 * 60;

function isAccountStillValid(account: Account): boolean {
	const nowSeconds = Math.floor(Date.now() / 1000);
	return account.expires_at - nowSeconds > REFRESH_BUFFER_SECONDS;
}

export async function tryAutoLogin(): Promise<Account | null> {
	const savedJson = localStorage.getItem("mc_account");
	if (!savedJson) return null;

	let savedAccount: Account;
	try {
		savedAccount = JSON.parse(savedJson);
	} catch (error) {
		console.error("Saved account was corrupted, clearing it:", error);
		localStorage.removeItem("mc_account");
		return null;
	}

	if (isAccountStillValid(savedAccount)) {
		return savedAccount;
	}

	try {
		const account = await refreshLogin(savedAccount.refresh_token);
		localStorage.setItem("mc_account", JSON.stringify(account));
		return account;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("Auto-login refresh failed:", message);

		// only nuke the session if MS actually rejected the refresh token,
		// not on a random network error
		if (message.toLowerCase().includes("invalid_grant")) {
			localStorage.removeItem("mc_account");
			return null;
		}

		return savedAccount;
	}
}

export function scheduleTokenRefresh(
	account: Account,
	onRefreshed: (account: Account) => void,
): () => void {
	const nowSeconds = Math.floor(Date.now() / 1000);
	const secondsUntilRefresh = Math.max(
		account.expires_at - nowSeconds - REFRESH_BUFFER_SECONDS,
		30,
	);

	const timer = setTimeout(async () => {
		try {
			const refreshed = await refreshLogin(account.refresh_token);
			localStorage.setItem("mc_account", JSON.stringify(refreshed));
			onRefreshed(refreshed);
		} catch (error) {
			console.error("Background token refresh failed, will retry later:", error);
		}
	}, secondsUntilRefresh * 1000);

	return () => clearTimeout(timer);
}

export function logout(): void {
	localStorage.removeItem("mc_account");
}
